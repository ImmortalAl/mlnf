/**
 * MLNF Mobile Viewport Handler
 * Dynamic viewport calculations and mobile-specific optimizations
 */

(function() {
    'use strict';

    // ===== DYNAMIC VIEWPORT HEIGHT (FIX iOS SAFARI) =====

    function setViewportHeight() {
        // Calculate actual viewport height (accounts for iOS Safari bottom bar)
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--mobile-vh', `${vh}px`);

        // Also set a stable vh that doesn't change on scroll
        if (!document.documentElement.style.getPropertyValue('--initial-vh')) {
            document.documentElement.style.setProperty('--initial-vh', `${vh}px`);
        }
    }

    // Set on load
    setViewportHeight();

    // Update on resize (debounced)
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(setViewportHeight, 150);
    });

    // Update on orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(setViewportHeight, 200);
    });

    // ===== PREVENT DOUBLE-TAP ZOOM =====

    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // ===== SCROLL BEHAVIOR OPTIMIZATION =====

    // Prevent rubber-band scrolling on iOS
    let startY;
    document.addEventListener('touchstart', function(e) {
        startY = e.touches[0].pageY;
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        const scrollable = e.target.closest('.scrollable, .modal-body, .message-thread-body');
        if (scrollable) return; // Allow scrolling in designated areas

        const y = e.touches[0].pageY;
        const isAtTop = window.pageYOffset <= 0;
        const isAtBottom = window.pageYOffset + window.innerHeight >= document.documentElement.scrollHeight;

        if ((isAtTop && y > startY) || (isAtBottom && y < startY)) {
            e.preventDefault();
        }
    }, { passive: false });

    // ===== TOUCH FEEDBACK =====

    // Add active state to touch elements
    function addTouchFeedback() {
        const touchElements = document.querySelectorAll(
            'button, a, .btn, .viking-card, .conversation-item, .activity-item'
        );

        touchElements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            }, { passive: true });

            element.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.classList.remove('touch-active');
                }, 150);
            }, { passive: true });

            element.addEventListener('touchcancel', function() {
                this.classList.remove('touch-active');
            }, { passive: true });
        });
    }

    // ===== MOBILE KEYBOARD HANDLING =====

    function handleMobileKeyboard() {
        if (!('visualViewport' in window)) return;

        const viewport = window.visualViewport;

        function viewportHandler() {
            const viewportHeight = viewport.height;
            const windowHeight = window.innerHeight;
            const difference = windowHeight - viewportHeight;

            // Keyboard is open if difference > 150px
            if (difference > 150) {
                document.body.classList.add('keyboard-open');

                // Scroll active input into view
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                    setTimeout(() => {
                        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                }
            } else {
                document.body.classList.remove('keyboard-open');
            }

            // Update CSS variable
            document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
        }

        viewport.addEventListener('resize', viewportHandler);
        viewportHandler(); // Initial call
    }

    // ===== PREVENT PULL-TO-REFRESH IN PWA MODE =====

    if (window.matchMedia('(display-mode: standalone)').matches) {
        let startY = 0;

        document.addEventListener('touchstart', function(e) {
            startY = e.touches[0].pageY;
        }, { passive: true });

        document.addEventListener('touchmove', function(e) {
            const y = e.touches[0].pageY;
            if (document.scrollingElement.scrollTop === 0 && y > startY) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    // ===== OPTIMIZE VIDEO PLAYBACK =====

    function optimizeVideoForMobile() {
        const videos = document.querySelectorAll('video');

        videos.forEach(video => {
            // Prevent auto-fullscreen on iOS
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');

            // Add poster if missing
            if (!video.poster && video.dataset.poster) {
                video.poster = video.dataset.poster;
            }

            // Optimize loading
            video.setAttribute('preload', 'metadata');

            // Handle fullscreen on mobile
            video.addEventListener('play', function() {
                if (window.innerWidth <= 768) {
                    // Optional: Request fullscreen on play for mobile
                    // video.requestFullscreen?.() || video.webkitRequestFullscreen?.();
                }
            });
        });
    }

    // ===== DETECT NETWORK QUALITY =====

    function detectNetworkQuality() {
        if ('connection' in navigator) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

            function updateNetworkStatus() {
                const effectiveType = connection.effectiveType;
                document.body.classList.remove('network-4g', 'network-3g', 'network-2g', 'network-slow-2g');
                document.body.classList.add(`network-${effectiveType}`);

                // Adjust quality based on connection
                if (effectiveType === 'slow-2g' || effectiveType === '2g') {
                    // Disable animations for slow connections
                    document.body.classList.add('reduce-motion');

                    // Show low-quality notice
                    if (window.MLNF && window.MLNF.showToast) {
                        window.MLNF.showToast('Slow connection detected. Optimizing experience...', 'info');
                    }
                }
            }

            connection.addEventListener('change', updateNetworkStatus);
            updateNetworkStatus();
        }
    }

    // ===== MOBILE IMAGE OPTIMIZATION =====

    function optimizeImagesForMobile() {
        if (window.innerWidth > 768) return; // Desktop doesn't need this

        const images = document.querySelectorAll('img[data-src-mobile]');
        images.forEach(img => {
            img.src = img.dataset.srcMobile;
        });
    }

    // ===== HANDLE SAFE AREA INSETS =====

    function handleSafeAreaInsets() {
        // Detect if device has notch/safe areas
        const hasSafeArea = CSS.supports('padding-top: env(safe-area-inset-top)');

        if (hasSafeArea) {
            document.body.classList.add('has-safe-area');

            // Log safe area sizes for debugging
            const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)');
            console.log('📱 Safe area insets detected:', {
                top: safeAreaTop
            });
        }
    }

    // ===== VIBRATION FEEDBACK (FOR SUPPORTED DEVICES) =====

    function addVibrationFeedback() {
        if (!('vibrate' in navigator)) return;

        // Vibrate on important actions
        document.addEventListener('click', function(e) {
            const target = e.target.closest('button, a.btn, .btn-viking-primary');
            if (target && !target.classList.contains('no-vibrate')) {
                navigator.vibrate(10); // Short vibration
            }
        }, { passive: true });

        // Longer vibration for errors
        window.addEventListener('error', function() {
            navigator.vibrate([100, 50, 100]); // Pattern vibration
        });
    }

    // ===== OPTIMIZE SCROLLING PERFORMANCE =====

    function optimizeScrolling() {
        // Use passive event listeners for scroll
        let scrollTimeout;
        let isScrolling = false;

        window.addEventListener('scroll', function() {
            if (!isScrolling) {
                isScrolling = true;
                document.body.classList.add('is-scrolling');
            }

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                isScrolling = false;
                document.body.classList.remove('is-scrolling');
            }, 150);
        }, { passive: true });
    }

    // ===== BATTERY-AWARE PERFORMANCE =====

    function handleBatteryStatus() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then(function(battery) {
                function updateBatteryStatus() {
                    const level = battery.level;
                    const charging = battery.charging;

                    // Reduce performance on low battery
                    if (level < 0.20 && !charging) {
                        document.body.classList.add('low-battery', 'reduce-motion');
                        console.log('🔋 Low battery detected. Reducing animations.');
                    } else {
                        document.body.classList.remove('low-battery');
                    }
                }

                battery.addEventListener('levelchange', updateBatteryStatus);
                battery.addEventListener('chargingchange', updateBatteryStatus);
                updateBatteryStatus();
            });
        }
    }

    // ===== ADD SWIPE GESTURES =====

    function addSwipeGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        document.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const swipeThreshold = 50;
            const swipeX = touchEndX - touchStartX;
            const swipeY = touchEndY - touchStartY;

            if (Math.abs(swipeX) > Math.abs(swipeY) && Math.abs(swipeX) > swipeThreshold) {
                if (swipeX > 0) {
                    // Swipe right
                    document.dispatchEvent(new CustomEvent('swiperight'));
                } else {
                    // Swipe left
                    document.dispatchEvent(new CustomEvent('swipeleft'));
                }
            }
        }
    }

    // ===== INITIALIZE ALL MOBILE OPTIMIZATIONS =====

    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Apply optimizations
        addTouchFeedback();
        handleMobileKeyboard();
        optimizeVideoForMobile();
        detectNetworkQuality();
        optimizeImagesForMobile();
        handleSafeAreaInsets();
        addVibrationFeedback();
        optimizeScrolling();
        handleBatteryStatus();
        addSwipeGestures();

        // Log mobile optimizations loaded
        console.log('📱 Mobile viewport optimizations loaded');

        // Detect device type
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);

        if (isMobile) {
            document.body.classList.add('is-mobile');
            if (isIOS) document.body.classList.add('is-ios');
            if (isAndroid) document.body.classList.add('is-android');

            console.log('📱 Device:', {
                mobile: isMobile,
                ios: isIOS,
                android: isAndroid,
                viewport: `${window.innerWidth}x${window.innerHeight}`
            });
        }
    }

    // Initialize
    init();

})();
