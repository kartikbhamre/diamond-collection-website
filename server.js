const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    customerId: { type: String, required: true },
    products: [{
        productId: String,
        name: String,
        price: Number,
        quantity: Number
    }],
    totalAmount: { type: Number, required: true },
    shippingAddress: String,
    paymentDetails: {
        razorpayOrderId: String,
        razorpayPaymentId: String,
        paymentStatus: { type: String, default: 'pending' }
    },
    orderStatus: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Backend is running' });
});

app.post('/api/orders/create', async (req, res) => {
    try {
        const { cartItems, customerDetails, shippingAddress } = req.body;

        const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const razorpayOrder = await razorpay.orders.create({
            amount: totalAmount * 100,
            currency: 'INR',
            receipt: `order_${Date.now()}`,
            notes: {
                customerName: customerDetails.name,
                customerEmail: customerDetails.email
            }
        });

        const order = new Order({
            orderId: razorpayOrder.id,
            customerId: customerDetails.email,
            products: cartItems,
            totalAmount,
            shippingAddress,
            paymentDetails: {
                razorpayOrderId: razorpayOrder.id,
                paymentStatus: 'pending'
            }
        });

        await order.save();

        res.json({
            success: true,
            orderId: razorpayOrder.id,
            amount: totalAmount * 100,
            currency: 'INR'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Order creation failed', error: error.message });
    }
});

app.post('/api/payments/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest('hex');

        if (expectedSignature === razorpay_signature) {
            await Order.findOneAndUpdate(
                { orderId: razorpay_order_id },
                { "paymentDetails.razorpayPaymentId": razorpay_payment_id, "paymentDetails.paymentStatus": "completed", orderStatus: "confirmed" }
            );
            res.json({ success: true, message: 'Payment verified successfully', orderId: razorpay_order_id });
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
