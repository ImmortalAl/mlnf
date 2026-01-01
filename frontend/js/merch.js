/**
 * MLNF Merchandise Store Handler
 * Client-side cart using localStorage
 * Products fulfilled externally (no backend e-commerce)
 */

const MerchStore = {
    // Static product catalog (matches merch.html)
    products: [
        { id: 'viking-shield-tshirt', name: 'Viking Shield T-Shirt', price: 29.99, category: 'Clothing', image: '../assets/images/merch-tshirt.jpg' },
        { id: 'no-fear-hoodie', name: 'No Fear Hoodie', price: 49.99, category: 'Clothing', image: '../assets/images/merch-hoodie.jpg' },
        { id: 'truth-warrior-mug', name: 'Truth Warrior Mug', price: 14.99, category: 'Accessories', image: '../assets/images/merch-mug.jpg' },
        { id: 'viking-cap', name: 'Viking Cap', price: 24.99, category: 'Accessories', image: '../assets/images/merch-cap.jpg' },
        { id: 'uncensored-truth-book', name: 'Uncensored Truth', price: 34.99, category: 'Books', image: '../assets/images/merch-book.jpg' },
        { id: 'viking-sticker-pack', name: 'Viking Sticker Pack', price: 9.99, category: 'Stickers', image: '../assets/images/merch-sticker.jpg' },
        { id: 'freedom-flag', name: 'Freedom Flag', price: 39.99, category: 'Accessories', image: '../assets/images/merch-flag.jpg' },
        { id: 'warrior-poster', name: 'Warrior Poster', price: 19.99, category: 'Accessories', image: '../assets/images/merch-poster.jpg' }
    ],

    // Cart state
    cart: [],

    // Initialize
    init() {
        this.loadCart();
        this.bindAddButtons();
        this.bindCartButton();
        this.bindCategoryFilters();
        this.updateCartBadge();
    },

    // Load cart from localStorage
    loadCart() {
        try {
            const saved = localStorage.getItem('mlnf_cart');
            this.cart = saved ? JSON.parse(saved) : [];
        } catch (e) {
            this.cart = [];
        }
    },

    // Save cart to localStorage
    saveCart() {
        localStorage.setItem('mlnf_cart', JSON.stringify(this.cart));
        this.updateCartBadge();
    },

    // Add item to cart
    addToCart(productId, quantity = 1) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = this.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({ ...product, quantity });
        }

        this.saveCart();
        this.showNotification(`Added ${product.name} to cart!`, 'success');
    },

    // Remove item from cart
    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
    },

    // Update quantity
    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(0, quantity);
            if (item.quantity === 0) {
                this.removeFromCart(productId);
            } else {
                this.saveCart();
            }
        }
    },

    // Get cart total
    getTotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    // Get cart item count
    getItemCount() {
        return this.cart.reduce((sum, item) => sum + item.quantity, 0);
    },

    // Update cart badge
    updateCartBadge() {
        const count = this.getItemCount();
        const cartBtn = document.querySelector('.fa-shopping-cart')?.parentElement;
        if (cartBtn) {
            cartBtn.innerHTML = `<i class="fas fa-shopping-cart"></i> Cart (${count})`;
        }
    },

    // Bind add to cart buttons
    bindAddButtons() {
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach((card, index) => {
            const addBtn = card.querySelector('.btn-viking, .btn.btn-sm');
            if (addBtn && addBtn.textContent.includes('Add')) {
                const product = this.products[index];
                if (product) {
                    addBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.addToCart(product.id);

                        // Visual feedback
                        addBtn.innerHTML = '<i class="fas fa-check"></i> Added!';
                        addBtn.classList.add('btn-success');
                        setTimeout(() => {
                            addBtn.innerHTML = '<i class="fas fa-cart-plus"></i> Add';
                            addBtn.classList.remove('btn-success');
                        }, 1500);
                    });
                }
            }
        });
    },

    // Bind cart button
    bindCartButton() {
        const cartBtn = document.querySelector('.fa-shopping-cart')?.parentElement;
        if (cartBtn) {
            cartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showCartModal();
            });
        }
    },

    // Bind category filter buttons
    bindCategoryFilters() {
        const categoryBtns = document.querySelectorAll('.flex.gap-md.flex-wrap button:not(:last-child)');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                categoryBtns.forEach(b => {
                    b.classList.remove('active', 'btn-outline');
                    b.classList.add('btn-viking-secondary');
                });
                btn.classList.remove('btn-viking-secondary');
                btn.classList.add('btn', 'btn-outline', 'active');

                // Filter products
                const category = btn.textContent.trim();
                this.filterProducts(category === 'All Items' ? null : category);
            });
        });
    },

    // Filter products by category
    filterProducts(category) {
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach((card, index) => {
            const product = this.products[index];
            if (!product) return;

            if (!category || product.category === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    },

    // Show cart modal
    showCartModal() {
        const existingModal = document.getElementById('cartModal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'cartModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.3s ease-out;
        `;

        const cartHtml = this.cart.length > 0 ? `
            <div style="max-height: 300px; overflow-y: auto; margin-bottom: 1rem;">
                ${this.cart.map(item => `
                    <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: var(--gray-800); border-radius: var(--radius-md); margin-bottom: 0.5rem;">
                        <div style="flex: 1;">
                            <strong>${item.name}</strong>
                            <div style="color: var(--gold);">$${item.price.toFixed(2)}</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <button onclick="MerchStore.updateQuantity('${item.id}', ${item.quantity - 1}); MerchStore.showCartModal();"
                                    style="width: 28px; height: 28px; border-radius: 50%; border: none; background: var(--gray-700); color: white; cursor: pointer;">-</button>
                            <span style="min-width: 24px; text-align: center;">${item.quantity}</span>
                            <button onclick="MerchStore.updateQuantity('${item.id}', ${item.quantity + 1}); MerchStore.showCartModal();"
                                    style="width: 28px; height: 28px; border-radius: 50%; border: none; background: var(--gray-700); color: white; cursor: pointer;">+</button>
                        </div>
                        <button onclick="MerchStore.removeFromCart('${item.id}'); MerchStore.showCartModal();"
                                style="background: none; border: none; color: var(--error); cursor: pointer; font-size: 1.25rem;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
            <div style="border-top: 2px solid var(--gold); padding-top: 1rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; font-size: 1.25rem;">
                    <strong>Total:</strong>
                    <strong style="color: var(--gold);">$${this.getTotal().toFixed(2)}</strong>
                </div>
            </div>
            <button onclick="MerchStore.checkout()" class="btn-viking-primary" style="width: 100%; padding: 1rem;">
                <i class="fas fa-credit-card"></i> Proceed to Checkout
            </button>
        ` : `
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-shopping-cart" style="font-size: 4rem; color: var(--gray-600); margin-bottom: 1rem;"></i>
                <h3>Your Cart is Empty</h3>
                <p style="color: var(--gray-400);">Add some Viking gear to get started!</p>
            </div>
        `;

        modal.innerHTML = `
            <div style="background: var(--gray-900); border: 2px solid var(--gold); border-radius: var(--radius-lg);
                        max-width: 500px; width: 90%; padding: 2rem; color: var(--cream);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="color: var(--gold); margin: 0;">
                        <i class="fas fa-shopping-cart"></i> Your Cart
                    </h2>
                    <button onclick="document.getElementById('cartModal').remove()"
                            style="background: none; border: none; color: var(--cream); font-size: 1.5rem; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                ${cartHtml}
            </div>
        `;

        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    // Checkout
    checkout() {
        if (this.cart.length === 0) return;

        const modal = document.getElementById('cartModal');
        if (modal) {
            const content = modal.querySelector('div > div');
            content.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="color: var(--gold); margin: 0;">
                        <i class="fas fa-shipping-fast"></i> Checkout
                    </h2>
                    <button onclick="document.getElementById('cartModal').remove()"
                            style="background: none; border: none; color: var(--cream); font-size: 1.5rem; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <form id="checkoutForm" onsubmit="MerchStore.submitOrder(event)">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.25rem; color: var(--gold);">Name</label>
                        <input type="text" id="customerName" required
                               style="width: 100%; padding: 0.75rem; border: 2px solid var(--gray-600); border-radius: var(--radius-md); background: var(--gray-800); color: var(--cream);"
                               placeholder="Your name">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.25rem; color: var(--gold);">Email</label>
                        <input type="email" id="customerEmail" required
                               style="width: 100%; padding: 0.75rem; border: 2px solid var(--gray-600); border-radius: var(--radius-md); background: var(--gray-800); color: var(--cream);"
                               placeholder="your@email.com">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.25rem; color: var(--gold);">Shipping Address</label>
                        <textarea id="shippingAddress" required rows="3"
                                  style="width: 100%; padding: 0.75rem; border: 2px solid var(--gray-600); border-radius: var(--radius-md); background: var(--gray-800); color: var(--cream);"
                                  placeholder="Full shipping address"></textarea>
                    </div>

                    <div style="border-top: 2px solid var(--gold); padding-top: 1rem; margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 1.25rem;">
                            <strong>Total:</strong>
                            <strong style="color: var(--gold);">$${this.getTotal().toFixed(2)}</strong>
                        </div>
                    </div>

                    <button type="submit" class="btn-viking-primary" style="width: 100%; padding: 1rem;">
                        <i class="fas fa-paper-plane"></i> Submit Order
                    </button>
                </form>
            `;
        }
    },

    // Submit order (email-based for now)
    submitOrder(e) {
        e.preventDefault();

        const name = document.getElementById('customerName').value;
        const email = document.getElementById('customerEmail').value;
        const address = document.getElementById('shippingAddress').value;

        const orderDetails = this.cart.map(item =>
            `${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
        ).join('\n');

        const orderTotal = this.getTotal().toFixed(2);

        // For now, show success and clear cart
        // In production, this would send to backend or external fulfillment
        const modal = document.getElementById('cartModal');
        if (modal) {
            const content = modal.querySelector('div > div');
            content.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-check-circle" style="font-size: 4rem; color: var(--success); margin-bottom: 1rem;"></i>
                    <h2 style="color: var(--gold);">Order Submitted!</h2>
                    <p style="margin: 1rem 0;">Thank you, ${name}!</p>
                    <p style="color: var(--gray-400); margin-bottom: 1.5rem;">
                        We'll contact you at ${email} to confirm payment and shipping details.
                    </p>
                    <div style="background: var(--gray-800); padding: 1rem; border-radius: var(--radius-md); text-align: left; margin-bottom: 1rem;">
                        <strong style="color: var(--gold);">Order Summary:</strong>
                        <pre style="white-space: pre-wrap; margin: 0.5rem 0; font-size: 0.875rem;">${orderDetails}</pre>
                        <strong>Total: $${orderTotal}</strong>
                    </div>
                    <button onclick="document.getElementById('cartModal').remove()" class="btn-viking-secondary" style="width: 100%;">
                        Close
                    </button>
                </div>
            `;
        }

        // Clear cart
        this.cart = [];
        this.saveCart();

        // Log order (would send to backend in production)
        console.log('Order submitted:', { name, email, address, items: this.cart, total: orderTotal });
    },

    // Show notification
    showNotification(message, type = 'info') {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem;
            background: var(--${type === 'success' ? 'success' : 'indigo'});
            color: white; border-radius: var(--radius-md); z-index: 10001;
            box-shadow: var(--shadow-lg); animation: slideInRight 0.3s ease-out;
        `;
        notif.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'info-circle'}"></i> ${message}`;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    MerchStore.init();
});

// Make globally available for inline handlers
window.MerchStore = MerchStore;

// CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes slideInRight {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
