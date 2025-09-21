const businessData = {
  name: "Diamond Collection and Bags – Complete Family Showroom",
  tagline: "We offer a wide range of fashionable clothing and bags for all family members",
  address: "05, Opposite Karmaveer Bhausaheb Hire College, Beside Ganpati Mandir, Pawan Nagar, Cidco, Nashik, Maharashtra 422008",
  phone: "9552090211",
  email: "info@diamondcollection.com"
};

const products = [
  {id: 1, name: "Men's Casual Shirt", price: 1299, category: "Men's Clothing", image: "shirt1.jpg", rating: 4.2, description: "Comfortable cotton casual shirt perfect for everyday wear"},
  {id: 2, name: "Men's Formal Trousers", price: 1899, category: "Men's Clothing", image: "trouser1.jpg", rating: 4.5, description: "Premium formal trousers for office and formal occasions"},
  {id: 3, name: "Women's Floral Dress", price: 1799, category: "Women's Clothing", image: "dress1.jpg", rating: 4.3, description: "Beautiful floral print dress for special occasions"},
  {id: 4, name: "Women's Designer Top", price: 999, category: "Women's Clothing", image: "top1.jpg", rating: 4.1, description: "Trendy designer top with modern cut and style"},
  {id: 5, name: "Kids Cotton T-Shirt", price: 599, category: "Children's Clothing", image: "kids-tshirt1.jpg", rating: 4.4, description: "Soft cotton t-shirt perfect for active kids"},
  {id: 6, name: "Kids Denim Shorts", price: 799, category: "Children's Clothing", image: "kids-shorts1.jpg", rating: 4.2, description: "Comfortable denim shorts for casual wear"},
  {id: 7, name: "Designer Handbag", price: 2499, category: "Bags", image: "handbag1.jpg", rating: 4.6, description: "Elegant designer handbag for modern women"},
  {id: 8, name: "Travel Backpack", price: 3299, category: "Bags", image: "backpack1.jpg", rating: 4.4, description: "Spacious and durable backpack for travel and daily use"},
  {id: 9, name: "Leather Wallet", price: 899, category: "Bags", image: "wallet1.jpg", rating: 4.3, description: "Premium leather wallet with multiple compartments"},
  {id: 10, name: "Men's Winter Jacket", price: 3999, category: "Men's Clothing", image: "jacket1.jpg", rating: 4.7, description: "Warm and stylish winter jacket for cold weather"},
];

// Retrieve cart from localStorage or preset with test items
let cart = JSON.parse(localStorage.getItem("cart")) || [
  {id: 1, name: "Men's Casual Shirt", price: 1299, quantity: 2},
  {id: 4, name: "Women's Designer Top", price: 999, quantity: 1},
];

// Helpers to save and render cart count
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  document.getElementById("cart-count").textContent = totalItemsInCart();
}
function totalItemsInCart(){
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Navigation and sections
function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.add("active");
  }
  if(sectionId === "cart"){
    renderCart();
  } else if(sectionId === "products"){
    renderProducts(products);
  }
}
showSection("home");

// Search products
function searchProducts() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  let category = document.getElementById("searchCategory").value;
  if(category === "") category = null;
  let filtered = products.filter(p => 
    (category ? p.category === category : true) &&
    (p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query))
  );
  showSection("products");
  renderProducts(filtered);
}

// Filter products by category select in products section
function filterProducts() {
  let category = document.getElementById("filterCategory").value;
  if(category === "") {
    renderProducts(products);
  } else {
    let filtered = products.filter(p => p.category === category);
    renderProducts(filtered);
  }
}

// Render category from home page shortcut
function showCategory(categoryName) {
  showSection("products");
  document.getElementById("filterCategory").value = categoryName;
  filterProducts();
}

// Render the list of products
function renderProducts(productsList) {
  const container = document.getElementById("productsList");
  container.innerHTML = "";
  productsList.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <div class="product-name">${p.name}</div>
      <div class="product-price">₹${p.price}</div>
      <button class="add-cart-btn" onclick="addToCart(${p.id})">Add to Cart</button>
    `;
    container.appendChild(card);
  });
}

// Add to cart
function addToCart(productId) {
  const p = products.find(prod => prod.id === productId);
  if(!p) return;
  const idx = cart.findIndex(item => item.id === productId);
  if(idx !== -1) {
    cart[idx].quantity++;
  } else {
    cart.push({id: p.id, name: p.name, price: p.price, quantity: 1});
  }
  saveCart();
  alert(`Added to cart: ${p.name}`);
}

// Render cart items
function renderCart() {
  const container = document.getElementById("cartItems");
  container.innerHTML = "";
  if(cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    document.getElementById("cartSummary").innerHTML = "";
    return;
  }
  let total = 0;
  cart.forEach(item => {
    total += item.price * item.quantity;
    const prodImage = (products.find(p => p.id === item.id) || {}).image || "";
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <img src="${prodImage}" alt="${item.name}" />
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${item.price}</div>
        <div class="cart-qty-controls">
          <button class="cart-qty-btn" ${item.quantity <= 1 ? "disabled" : ""} onclick="decreaseQty(${item.id})">−</button>
          <span class="cart-qty-value">${item.quantity}</span>
          <button class="cart-qty-btn" onclick="increaseQty(${item.id})">+</button>
          <button class="cart-remove-btn" onclick="removeFromCart(${item.id})">×</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
  // Summary
  const summary = document.getElementById("cartSummary");
  summary.innerHTML = `
    <div>Total Items: ${totalItemsInCart()}</div>
    <div>Subtotal: ₹${total}</div>
    <div class="cart-note">Free shipping above ₹3,000!</div>
  `;
  saveCart();
}

// Quantity controls
function increaseQty(id) {
  const idx = cart.findIndex(i => i.id === id);
  if(idx !== -1){
    cart[idx].quantity++;
    saveCart();
    renderCart();
  }
}
function decreaseQty(id) {
  const idx = cart.findIndex(i => i.id === id);
  if(idx !== -1 && cart[idx].quantity > 1){
    cart[idx].quantity--;
    saveCart();
    renderCart();
  }
}

// Undo delete feature
let lastRemovedItem = null;
function removeFromCart(id) {
  const idx = cart.findIndex(item => item.id === id);
  if(idx !== -1){
    lastRemovedItem = {...cart[idx]};
    cart.splice(idx, 1);
    saveCart();
    renderCart();
    showUndoToast();
  }
}
function showUndoToast() {
  if(document.querySelector('.undo-toast')) return;
  const undoDiv = document.createElement('div');
  undoDiv.className = 'undo-toast';
  undoDiv.innerHTML = 'Item removed. <button onclick="undoRemove()">Undo</button>';
  document.body.appendChild(undoDiv);
  setTimeout(() => {
    if(document.body.contains(undoDiv)) undoDiv.remove();
  }, 4000);
}
function undoRemove() {
  if(lastRemovedItem){
    cart.push(lastRemovedItem);
    saveCart();
    renderCart();
    const toast = document.querySelector('.undo-toast');
    if(toast) toast.remove();
    lastRemovedItem = null;
  }
}

// Checkout process simulation
function processCheckout(e){
  e.preventDefault();
  if(cart.length === 0){
    alert("Your cart is empty.");
    showSection("cart");
    return;
  }
  alert("Order placed! Thank you for shopping with us.");
  cart = [];
  saveCart();
  renderCart();
  showSection("home");
}

// Contact form simulation
function submitContactForm(e){
  e.preventDefault();
  alert("Thank you for contacting us. We will get back to you shortly.");
  document.getElementById("contactForm").reset();
}

// Admin cart editor toggle and logic
function toggleAdminCartEditor() {
  const editor = document.getElementById("adminCartEditor");
  editor.style.display = (editor.style.display === "none" || editor.style.display === "") ? "block" : "none";
}
function adminAddToCart() {
  const pid = parseInt(document.getElementById("adminProductId").value);
  const qty = parseInt(document.getElementById("adminQuantity").value);
  if(isNaN(pid) || isNaN(qty) || qty < 0){
    alert("Please enter valid Product ID and Quantity (0 or more).");
    return;
  }
  const prod = products.find(p => p.id === pid);
  if(!prod){
    alert("Product ID not found.");
    return;
  }
  const idx = cart.findIndex(i => i.id === pid);
  if(qty === 0){
    if(idx !== -1){
      cart.splice(idx, 1);
    }
  } else {
    if(idx !== -1){
      cart[idx].quantity = qty;
    } else {
      cart.push({id: prod.id, name: prod.name, price: prod.price, quantity: qty});
    }
  }
  saveCart();
  renderCart();
  alert("Cart updated successfully.");
}
function adminClearCart() {
  if(confirm("Are you sure you want to clear the cart?")) {
    cart = [];
    saveCart();
    renderCart();
  }
}
