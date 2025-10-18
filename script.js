// Data sample (you can fetch from backend in future)
const categories = {
    mens: [
        { id: 'm1', name: 'Cotton Casual Shirt', price: 899, originalPrice: 1299, image: 'https://via.placeholder.com/300x300/4A90E2/FFFFFF?text=Mens+Shirt', rating: 4.2, reviews: 156 },
        { id: 'm2', name: 'Polo T-Shirt', price: 649, originalPrice: 999, image: 'https://via.placeholder.com/300x300/4A90E2/FFFFFF?text=Polo+Tshirt', rating: 4.0, reviews: 89 }
    ],
    womens: [
        { id: 'w1', name: 'Silk Saree', price: 2499, originalPrice: 3999, image: 'https://via.placeholder.com/300x300/E91E63/FFFFFF?text=Silk+Saree', rating: 4.5, reviews: 198 },
        { id: 'w2', name: 'Cotton Kurti', price: 799, originalPrice: 1199, image: 'https://via.placeholder.com/300x300/E91E63/FFFFFF?text=Cotton+Kurti', rating: 4.3, reviews: 145 }
    ],
    childrens: [
        { id: 'c1', name: 'Boys School Uniform', price: 699, originalPrice: 999, image: 'https://via.placeholder.com/300x300/4CAF50/FFFFFF?text=School+Uniform', rating: 4.1, reviews: 89 },
        { id: 'c2', name: 'Girls Frock', price: 549, originalPrice: 799, image: 'https://via.placeholder.com/300x300/4CAF50/FFFFFF?text=Girls+Frock', rating: 4.4, reviews: 156 }
    ],
    bags: [
        { id: 'b1', name: 'Leather Handbag', price: 1899, originalPrice: 2799, image: 'https://via.placeholder.com/300x300/795548/FFFFFF?text=Leather+Handbag', rating: 4.5, reviews: 267 },
        { id: 'b2', name: 'Travel Backpack', price: 1299, originalPrice: 1999, image: 'https://via.placeholder.com/300x300/795548/FFFFFF?text=Travel+Backpack', rating: 4.3, reviews: 189 }
    ]
};

let currentCategory = 'mens';
let cart = JSON.parse(localStorage.getItem('cart')) || {};

function renderCategories() {
    const catList = document.getElementById('categoryList');
    catList.querySelectorAll('li').forEach(li => {
        li.classList.toggle('active', li.dataset.category === currentCategory);
    });
}

function renderProducts() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    categories[currentCategory].forEach(product => {
        const prodCard = document.createElement('div');
        prodCard.className = 'product-card';
        prodCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" />
            <div class="product-title">${product.name}</div>
            <div>
                <span class="product-price">₹${product.price}</span>
                <span class="product-original-price">₹${product.originalPrice}</span>
            </div>
            <div class="product-rating">★ ${product.rating} (${product.reviews})</div>
            <button onclick="addToCart('${product.id}')">Add to Cart</button>
        `;
        grid.appendChild(prodCard);
    });
}

function updateCartCount() {
    document.getElementById('cartCount').textContent = Object.values(cart).reduce((a,b) => a + b.quantity, 0);
}

function addToCart(productId) {
    let product = categories[currentCategory].find(p => p.id === productId);
    if (!product) {
        showToast('Product not found');
        return;
    }
    if (cart[productId]) {
        cart[productId].quantity += 1;
    } else {
        cart[productId] = { ...product, quantity: 1 };
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast(`${product.name} added to cart`);
}

function renderCart() {
    const cartItemsDiv = document.getElementById('cartItems');
    cartItemsDiv.innerHTML = '';
    let subtotal = 0;
    Object.values(cart).forEach(item => {
        subtotal += item.price * item.quantity;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <span>${item.name} x ${item.quantity}</span>
            <span>₹${item.price * item.quantity}</span>
            <button onclick="removeFromCart('${item.id}')">x</button>
        `;
        cartItemsDiv.appendChild(itemDiv);
    });
    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
}

function removeFromCart(productId) {
    delete cart[productId];
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
}

function showCart() {
    renderCart();
    document.getElementById('cartSidebar').classList.remove('hidden');
}

function hideCart() {
    document.getElementById('cartSidebar').classList.add('hidden');
}

function showCheckout() {
    document.getElementById('checkoutModal').classList.remove('hidden');
}

function hideCheckout() {
    document.getElementById('checkoutModal').classList.add('hidden');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
        toast.textContent = '';
    }, 3000);
}

function collectOrderData() {
    return {
        cartItems: Object.values(cart).map(p => ({
            productId: p.id,
            name: p.name,
            price: p.price,
            quantity: p.quantity
        })),
        customerDetails: {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim()
        },
        shippingAddress: document.getElementById('address').value.trim()
    };
}

async function createOrder(orderData) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/orders/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const data = await response.json();
        if (data.success) return data;
        throw new Error(data.message);
    } catch (error) {
        showToast('Order creation failed');
        throw error;
    }
}

async function initiatePayment(orderData) {
    try {
        const order = await createOrder(orderData);
        const options = {
            key: CONFIG.RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: CONFIG.CURRENCY,
            name: CONFIG.BUSINESS_NAME,
            description: 'Order Payment',
            order_id: order.orderId,
            handler: function(response) {
                verifyPayment(response);
            },
            prefill: {
                name: orderData.customerDetails.name,
                email: orderData.customerDetails.email,
                contact: orderData.customerDetails.phone
            },
            theme: { color: '#FF9900' }
        };
        const rzp = new Razorpay(options);
        rzp.open();
        rzp.on('payment.failed', () => showToast('Payment failed'));
    } catch (error) {
        console.error('Payment initiation error:', error);
    }
}

async function verifyPayment(response) {
    try {
        const result = await fetch(`${CONFIG.API_URL}/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response)
        });
        const data = await result.json();
        if (data.success) {
            showToast('Payment successful! Thank you for your order.');
            cart = {};
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            hideCheckout();
            hideCart();
        } else {
            showToast('Payment verification failed');
        }
    } catch (error) {
        console.error('Payment verification error:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    renderProducts();
    updateCartCount();

    document.getElementById('categoryList').addEventListener('click', e => {
        if (e.target.tagName === 'LI') {
            currentCategory = e.target.dataset.category;
            renderCategories();
            renderProducts();
        }
    });

    document.getElementById('cartIcon').addEventListener('click', showCart);
    document.getElementById('closeCart').addEventListener('click', hideCart);
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        hideCart();
        showCheckout();
    });
    document.getElementById('closeCheckout').addEventListener('click', hideCheckout);

    document.getElementById('checkoutForm').addEventListener('submit', e => {
        e.preventDefault();
        const orderData = collectOrderData();
        if (!orderData.customerDetails.name || !orderData.customerDetails.email ||
            !orderData.customerDetails.phone || !orderData.shippingAddress) {
            showToast('All fields are required');
            return;
        }
        initiatePayment(orderData);
    });

    document.getElementById('searchInput').addEventListener('input', e => {
        const searchTerm = e.target.value.toLowerCase();
        const grid = document.getElementById('productGrid');
        grid.innerHTML = '';
        const filteredProducts = categories[currentCategory].filter(product =>
            product.name.toLowerCase().includes(searchTerm)
        );
        filteredProducts.forEach(product => {
            const prodCard = document.createElement('div');
            prodCard.className = 'product-card';
            prodCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}" />
                <div class="product-title">${product.name}</div>
                <div>
                    <span class="product-price">₹${product.price}</span>
                    <span class="product-original-price">₹${product.originalPrice}</span>
                </div>
                <div class="product-rating">★ ${product.rating} (${product.reviews})</div>
                <button onclick="addToCart('${product.id}')">Add to Cart</button>
            `;
            grid.appendChild(prodCard);
        });
        if (searchTerm === '') renderProducts();
    });
});
