/**
 * MLNF Donations Integration
 * Wires donation buttons to backend payment APIs
 */

const DonationsHandler = {
    // API base URL
    apiBase: (function() {
        const hostname = window.location.hostname;
        if (hostname.includes('netlify.app') || hostname.includes('mlnf.net') || hostname.includes('vercel.app')) {
            return 'https://much-love-no-fear.onrender.com/api';
        }
        return 'http://localhost:5000/api';
    })(),

    // Selected amount for one-time donations
    selectedAmount: 25,

    // Initialize
    init() {
        this.bindAmountButtons();
        this.bindTierButtons();
        this.bindDonateButton();
        this.bindCryptoButtons();
        this.bindCustomAmount();
    },

    // Bind one-time amount selection buttons
    bindAmountButtons() {
        const buttons = document.querySelectorAll('.grid-6 .btn-viking-secondary, .grid-6 .btn.btn-outline');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all
                buttons.forEach(b => {
                    b.classList.remove('active');
                    b.classList.remove('btn-outline');
                    b.classList.add('btn-viking-secondary');
                });

                // Add active class to clicked
                btn.classList.remove('btn-viking-secondary');
                btn.classList.add('btn', 'btn-outline', 'active');

                // Parse amount from button text
                const amount = parseInt(btn.textContent.replace('$', ''));
                if (!isNaN(amount)) {
                    this.selectedAmount = amount;
                    // Clear custom input
                    const customInput = document.querySelector('input[placeholder="Custom amount"]');
                    if (customInput) customInput.value = '';
                }
            });
        });
    },

    // Bind custom amount input
    bindCustomAmount() {
        const customInput = document.querySelector('input[placeholder="Custom amount"]');
        if (customInput) {
            customInput.addEventListener('input', (e) => {
                const amount = parseFloat(e.target.value);
                if (!isNaN(amount) && amount > 0) {
                    this.selectedAmount = amount;
                    // Remove active from preset buttons
                    document.querySelectorAll('.grid-6 button').forEach(b => {
                        b.classList.remove('active', 'btn-outline');
                        b.classList.add('btn-viking-secondary');
                    });
                }
            });
        }
    },

    // Bind subscription tier buttons
    bindTierButtons() {
        const tierButtons = document.querySelectorAll('.grid-3 .card button');
        tierButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const tiers = [
                    { name: 'Truth Warrior', price: 10, runegold: 100 },
                    { name: 'Viking Champion', price: 25, runegold: 300 },
                    { name: 'Freedom Jarl', price: 50, runegold: 750 }
                ];
                const tier = tiers[index];
                if (tier) {
                    this.showPaymentModal('subscription', tier);
                }
            });
        });
    },

    // Bind main donate button
    bindDonateButton() {
        const donateBtn = document.querySelector('.btn.btn-viking.btn-lg');
        if (donateBtn && donateBtn.textContent.includes('Donate Now')) {
            donateBtn.addEventListener('click', () => {
                if (this.selectedAmount < 1) {
                    this.showNotification('Please select or enter an amount of at least $1', 'error');
                    return;
                }
                this.showPaymentModal('one-time', { price: this.selectedAmount });
            });
        }
    },

    // Bind crypto copy buttons
    bindCryptoButtons() {
        document.querySelectorAll('.crypto-address').forEach(container => {
            const code = container.querySelector('code');
            const copyBtn = container.nextElementSibling;

            if (copyBtn && code) {
                copyBtn.addEventListener('click', async () => {
                    try {
                        await navigator.clipboard.writeText(code.textContent.trim());
                        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Address';
                        }, 2000);
                    } catch (err) {
                        this.showNotification('Failed to copy address', 'error');
                    }
                });
            }
        });
    },

    // Show payment modal
    showPaymentModal(type, details) {
        // Remove existing modal
        const existingModal = document.getElementById('paymentModal');
        if (existingModal) existingModal.remove();

        const isSubscription = type === 'subscription';
        const title = isSubscription ? `Subscribe: ${details.name}` : 'One-Time Donation';
        const amount = details.price;
        const runegoldBonus = isSubscription ? details.runegold : Math.floor(amount * 2);

        const modal = document.createElement('div');
        modal.id = 'paymentModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.3s ease-out;
        `;

        modal.innerHTML = `
            <div style="background: var(--gray-900); border: 2px solid var(--gold); border-radius: var(--radius-lg);
                        max-width: 500px; width: 90%; padding: 2rem; color: var(--cream);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="color: var(--gold); margin: 0;">
                        <i class="fas fa-heart"></i> ${title}
                    </h2>
                    <button id="closePaymentModal" style="background: none; border: none; color: var(--cream); font-size: 1.5rem; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div style="background: var(--gray-800); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Amount:</span>
                        <strong style="color: var(--gold);">$${amount}${isSubscription ? '/month' : ''}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Runegold Bonus:</span>
                        <strong style="color: var(--gold);">${runegoldBonus} ᚱ${isSubscription ? '/month' : ''}</strong>
                    </div>
                </div>

                <h4 style="margin-bottom: 1rem;">Select Payment Method</h4>

                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <button id="payWithStripe" class="btn-viking-primary" style="width: 100%; padding: 1rem;">
                        <i class="fas fa-credit-card"></i> Pay with Card
                    </button>

                    <button id="payWithPayPal" style="width: 100%; padding: 1rem; background: #0070ba; color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600;">
                        <i class="fab fa-paypal"></i> Pay with PayPal
                    </button>

                    <button id="payWithBitcoin" style="width: 100%; padding: 1rem; background: #f7931a; color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600;">
                        <i class="fab fa-bitcoin"></i> Pay with Bitcoin
                    </button>
                </div>

                <div id="paymentStatus" style="margin-top: 1rem; text-align: center; display: none;"></div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close button
        document.getElementById('closePaymentModal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Payment buttons
        document.getElementById('payWithStripe').addEventListener('click', () => {
            this.processStripePayment(amount, isSubscription);
        });

        document.getElementById('payWithPayPal').addEventListener('click', () => {
            this.processPayPalPayment(amount);
        });

        document.getElementById('payWithBitcoin').addEventListener('click', () => {
            this.showBitcoinPayment(amount);
        });
    },

    // Process Stripe payment
    async processStripePayment(amount, isSubscription) {
        const statusDiv = document.getElementById('paymentStatus');
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating payment...';

        try {
            const response = await fetch(`${this.apiBase}/donations/stripe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    name: 'Anonymous Warrior',
                    message: isSubscription ? 'Monthly subscription' : 'One-time donation'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create payment');
            }

            // If Stripe is configured, redirect to checkout
            if (data.clientSecret) {
                statusDiv.innerHTML = `
                    <div style="background: var(--warning); color: var(--navy); padding: 1rem; border-radius: var(--radius-md);">
                        <i class="fas fa-info-circle"></i> Stripe checkout would open here.<br>
                        <small>Configure STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY to enable.</small>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Stripe error:', error);
            statusDiv.innerHTML = `
                <div style="color: var(--error);">
                    <i class="fas fa-exclamation-circle"></i> ${error.message}
                </div>
            `;
        }
    },

    // Process PayPal payment
    async processPayPalPayment(amount) {
        const statusDiv = document.getElementById('paymentStatus');
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating PayPal payment...';

        try {
            const response = await fetch(`${this.apiBase}/donations/paypal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    name: 'Anonymous Warrior'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create PayPal payment');
            }

            if (data.approvalUrl) {
                window.location.href = data.approvalUrl;
            } else {
                statusDiv.innerHTML = `
                    <div style="background: var(--warning); color: var(--navy); padding: 1rem; border-radius: var(--radius-md);">
                        <i class="fas fa-info-circle"></i> PayPal checkout would open here.<br>
                        <small>Configure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to enable.</small>
                    </div>
                `;
            }
        } catch (error) {
            console.error('PayPal error:', error);
            statusDiv.innerHTML = `
                <div style="color: var(--error);">
                    <i class="fas fa-exclamation-circle"></i> ${error.message}
                </div>
            `;
        }
    },

    // Show Bitcoin payment
    async showBitcoinPayment(amountUSD) {
        const statusDiv = document.getElementById('paymentStatus');
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Bitcoin address...';

        try {
            // Get current BTC price
            const priceResponse = await fetch(`${this.apiBase}/blockonomics/convert?amount=${amountUSD}`);
            const priceData = await priceResponse.json();

            if (!priceResponse.ok) {
                throw new Error(priceData.error || 'Failed to get BTC price');
            }

            const btcAmount = priceData.btc;

            // Generate new address
            const addressResponse = await fetch(`${this.apiBase}/blockonomics/generate-address`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(btcAmount),
                    purpose: 'donation'
                })
            });

            const addressData = await addressResponse.json();

            if (!addressResponse.ok) {
                // Fallback to static address
                statusDiv.innerHTML = `
                    <div style="background: var(--gray-800); padding: 1.5rem; border-radius: var(--radius-md); text-align: center;">
                        <i class="fab fa-bitcoin" style="font-size: 3rem; color: #f7931a; margin-bottom: 1rem;"></i>
                        <h4 style="color: var(--gold); margin-bottom: 1rem;">Send Bitcoin</h4>
                        <p style="margin-bottom: 0.5rem;">Amount: <strong>${btcAmount} BTC</strong> (~$${amountUSD})</p>
                        <div style="background: var(--gray-900); padding: 0.75rem; border-radius: var(--radius-sm); margin: 1rem 0; word-break: break-all;">
                            <code style="color: var(--gold);">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</code>
                        </div>
                        <button onclick="navigator.clipboard.writeText('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')"
                                class="btn btn-sm btn-outline" style="color: var(--cream); border-color: var(--cream);">
                            <i class="fas fa-copy"></i> Copy Address
                        </button>
                    </div>
                `;
                return;
            }

            // Show generated address with QR
            statusDiv.innerHTML = `
                <div style="background: var(--gray-800); padding: 1.5rem; border-radius: var(--radius-md); text-align: center;">
                    <i class="fab fa-bitcoin" style="font-size: 3rem; color: #f7931a; margin-bottom: 1rem;"></i>
                    <h4 style="color: var(--gold); margin-bottom: 1rem;">Send Bitcoin</h4>
                    <p style="margin-bottom: 0.5rem;">Amount: <strong>${btcAmount} BTC</strong> (~$${amountUSD})</p>
                    <div style="background: white; padding: 1rem; border-radius: var(--radius-md); margin: 1rem auto; width: fit-content;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(addressData.qrCode)}"
                             alt="Bitcoin QR Code" style="display: block;">
                    </div>
                    <div style="background: var(--gray-900); padding: 0.75rem; border-radius: var(--radius-sm); margin: 1rem 0; word-break: break-all;">
                        <code style="color: var(--gold);">${addressData.address}</code>
                    </div>
                    <button onclick="navigator.clipboard.writeText('${addressData.address}')"
                            class="btn btn-sm btn-outline" style="color: var(--cream); border-color: var(--cream);">
                        <i class="fas fa-copy"></i> Copy Address
                    </button>
                    <p style="margin-top: 1rem; font-size: 0.875rem; color: var(--gray-400);">
                        Payment will be verified automatically
                    </p>
                </div>
            `;
        } catch (error) {
            console.error('Bitcoin error:', error);
            statusDiv.innerHTML = `
                <div style="color: var(--error);">
                    <i class="fas fa-exclamation-circle"></i> ${error.message}
                </div>
            `;
        }
    },

    // Show notification
    showNotification(message, type = 'info') {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem;
            background: var(--${type === 'error' ? 'error' : type === 'success' ? 'success' : 'indigo'});
            color: white; border-radius: var(--radius-md); z-index: 10001;
            box-shadow: var(--shadow-lg); animation: slideInRight 0.3s ease-out;
        `;
        notif.textContent = message;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 5000);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    DonationsHandler.init();
});

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
