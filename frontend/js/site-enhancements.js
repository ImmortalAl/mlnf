/**
 * MLNF Site-Wide Enhancements
 * Performance optimizations, UX improvements, and Viking theming
 */

(function() {
    'use strict';

    // ===== PERFORMANCE OPTIMIZATIONS =====

    // Lazy load images
    function lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // Lazy load videos
    function lazyLoadVideos() {
        const videos = document.querySelectorAll('video[data-src]');

        const videoObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const video = entry.target;
                    const source = video.querySelector('source');
                    if (source && source.dataset.src) {
                        source.src = source.dataset.src;
                        video.load();
                    }
                    observer.unobserve(video);
                }
            });
        });

        videos.forEach(video => videoObserver.observe(video));
    }

    // Debounce function for performance
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ===== UX ENHANCEMENTS =====

    // Smooth scroll to anchors
    function smoothScrollToAnchors() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Form validation enhancement
    function enhanceFormValidation() {
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            const inputs = form.querySelectorAll('.viking-input, .viking-textarea, .viking-select');

            inputs.forEach(input => {
                // Real-time validation feedback
                input.addEventListener('blur', function() {
                    if (this.validity.valid) {
                        this.classList.remove('error');
                        this.classList.add('success');

                        // Remove error message if exists
                        const errorMsg = this.parentElement.querySelector('.viking-error-message');
                        if (errorMsg) errorMsg.remove();
                    } else {
                        this.classList.remove('success');
                        this.classList.add('error');

                        // Add error message if doesn't exist
                        if (!this.parentElement.querySelector('.viking-error-message')) {
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'viking-error-message';
                            errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${this.validationMessage}`;
                            this.parentElement.appendChild(errorDiv);
                        }
                    }
                });

                // Clear error on focus
                input.addEventListener('focus', function() {
                    this.classList.remove('error');
                    const errorMsg = this.parentElement.querySelector('.viking-error-message');
                    if (errorMsg) errorMsg.remove();
                });
            });
        });
    }

    // Loading state helpers
    function showLoading(element, message = 'Loading...') {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'viking-loader';
        loadingDiv.innerHTML = `
            <div style="text-align: center;">
                <div class="viking-spinner"></div>
                <div class="viking-loading-text">${message}</div>
            </div>
        `;
        element.innerHTML = '';
        element.appendChild(loadingDiv);
    }

    function hideLoading(element) {
        const loader = element.querySelector('.viking-loader');
        if (loader) loader.remove();
    }

    // Toast notifications
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `viking-alert viking-alert-${type}`;
        toast.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; max-width: 400px; animation: vikingSlideIn 0.3s ease;';

        const icon = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-triangle',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        }[type] || 'fa-info-circle';

        toast.innerHTML = `
            <div class="viking-alert-icon"><i class="fas ${icon}"></i></div>
            <div class="viking-alert-content">
                <div class="viking-alert-message">${message}</div>
            </div>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'vikingFadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ===== VIKING THEME ENHANCEMENTS =====

    // Add ripple effect to Viking buttons
    function addRippleEffect() {
        const buttons = document.querySelectorAll('.btn-viking-primary, .btn-viking-secondary, .btn-viking-danger');

        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    width: 20px;
                    height: 20px;
                    animation: ripple 0.6s ease-out;
                    pointer-events: none;
                `;

                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';

                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);

                setTimeout(() => ripple.remove(), 600);
            });
        });
    }

    // Add CSS for ripple animation if not exists
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        @keyframes vikingFadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-20px); }
        }
        .viking-input.success,
        .viking-textarea.success,
        .viking-select.success {
            border-color: var(--success);
        }
    `;
    document.head.appendChild(style);

    // Animate stats on scroll
    function animateStatsOnScroll() {
        const statValues = document.querySelectorAll('.stat-value');

        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                    entry.target.classList.add('animated');

                    const targetValue = parseInt(entry.target.textContent.replace(/,/g, ''));
                    if (!isNaN(targetValue)) {
                        animateCount(entry.target, targetValue);
                    }
                }
            });
        }, { threshold: 0.5 });

        statValues.forEach(stat => statsObserver.observe(stat));
    }

    function animateCount(element, targetValue, duration = 1000) {
        const start = 0;
        const startTime = performance.now();

        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (targetValue - start) * easeOut);

            element.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = targetValue.toLocaleString();
            }
        };

        requestAnimationFrame(update);
    }

    // Add keyboard shortcuts
    function addKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]');
                if (searchInput) searchInput.focus();
            }

            // ESC to close modals
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.viking-modal-overlay');
                modals.forEach(modal => modal.remove());
            }
        });
    }

    // Improve accessibility
    function improveAccessibility() {
        // Add ARIA labels to icon-only buttons
        document.querySelectorAll('.btn-viking-icon').forEach(btn => {
            if (!btn.getAttribute('aria-label') && !btn.textContent.trim()) {
                const icon = btn.querySelector('i');
                if (icon) {
                    const ariaLabel = icon.className.split(' ').pop().replace('fa-', '').replace(/-/g, ' ');
                    btn.setAttribute('aria-label', ariaLabel);
                }
            }
        });

        // Add role="status" to loading elements
        document.querySelectorAll('.viking-loader').forEach(loader => {
            loader.setAttribute('role', 'status');
            loader.setAttribute('aria-live', 'polite');
        });

        // Add role="alert" to error messages
        document.querySelectorAll('.viking-error-message, .viking-alert-error').forEach(error => {
            error.setAttribute('role', 'alert');
        });
    }

    // ===== INITIALIZE =====

    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Performance optimizations
        lazyLoadImages();
        lazyLoadVideos();

        // UX enhancements
        smoothScrollToAnchors();
        enhanceFormValidation();
        addRippleEffect();
        animateStatsOnScroll();
        addKeyboardShortcuts();
        improveAccessibility();

        console.log('🛡️ MLNF Site Enhancements loaded');
    }

    // Expose utility functions globally
    window.MLNF = window.MLNF || {};
    window.MLNF.showLoading = showLoading;
    window.MLNF.hideLoading = hideLoading;
    window.MLNF.showToast = showToast;
    window.MLNF.animateCount = animateCount;

    // Initialize
    init();
})();
