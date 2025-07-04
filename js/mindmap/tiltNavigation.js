/**
 * Tilt Navigation Module
 * Enables device orientation-based navigation on mobile devices
 */
class TiltNavigation {
    constructor(nexusEngine) {
        this.nexusEngine = nexusEngine;
        this.enabled = false;
        this.calibration = { alpha: 0, beta: 0, gamma: 0 };
        this.sensitivity = 0.5;
        this.deadZone = 5; // degrees
        this.animationFrame = null;
        this.lastPan = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        // Check if device orientation is supported and we're on mobile
        if (this.isMobile() && 'DeviceOrientationEvent' in window) {
            this.setupTiltControls();
        }
    }
    
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    setupTiltControls() {
        // Show tilt indicator on mobile
        const tiltIndicator = document.getElementById('tiltIndicator');
        tiltIndicator.style.display = 'flex';
        
        // Set up toggle button
        const tiltToggle = document.getElementById('tiltToggle');
        tiltToggle.addEventListener('click', () => {
            if (this.enabled) {
                this.disable();
            } else {
                this.enable();
            }
        });
    }
    
    async enable() {
        // Request permission on iOS 13+
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission !== 'granted') {
                    this.showError('Permission denied for device orientation');
                    return;
                }
            } catch (error) {
                console.error('Error requesting device orientation permission:', error);
                this.showError('Could not request device orientation permission');
                return;
            }
        }
        
        this.enabled = true;
        document.getElementById('tiltToggle').classList.add('active');
        
        // Calibrate to current position
        this.calibrate();
        
        // Start listening to device orientation
        window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
        
        this.showMessage('Tilt navigation enabled - tilt your device to pan');
    }
    
    disable() {
        this.enabled = false;
        document.getElementById('tiltToggle').classList.remove('active');
        
        // Stop listening to device orientation
        window.removeEventListener('deviceorientation', this.handleOrientation.bind(this));
        
        // Cancel any pending animation
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        this.showMessage('Tilt navigation disabled');
    }
    
    calibrate() {
        // Set current orientation as neutral position
        window.addEventListener('deviceorientation', (event) => {
            this.calibration = {
                alpha: event.alpha || 0,
                beta: event.beta || 0,
                gamma: event.gamma || 0
            };
        }, { once: true });
    }
    
    handleOrientation(event) {
        if (!this.enabled || !this.nexusEngine.cy) return;
        
        // Get orientation values
        const beta = event.beta || 0; // Front-to-back tilt (-180 to 180)
        const gamma = event.gamma || 0; // Left-to-right tilt (-90 to 90)
        
        // Calculate tilt relative to calibration
        const tiltX = gamma - this.calibration.gamma;
        const tiltY = beta - this.calibration.beta;
        
        // Apply dead zone
        const adjustedTiltX = Math.abs(tiltX) > this.deadZone ? tiltX : 0;
        const adjustedTiltY = Math.abs(tiltY) > this.deadZone ? tiltY : 0;
        
        // Convert tilt to pan velocity
        const panVelocity = {
            x: adjustedTiltX * this.sensitivity,
            y: adjustedTiltY * this.sensitivity
        };
        
        // Apply panning if there's movement
        if (panVelocity.x !== 0 || panVelocity.y !== 0) {
            this.applyPan(panVelocity);
        }
    }
    
    applyPan(velocity) {
        // Cancel previous animation frame
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Smooth panning using animation frame
        const pan = () => {
            const currentPan = this.nexusEngine.cy.pan();
            const zoom = this.nexusEngine.cy.zoom();
            
            // Calculate new pan position
            const newPan = {
                x: currentPan.x - velocity.x * zoom,
                y: currentPan.y - velocity.y * zoom
            };
            
            // Apply easing for smoother movement
            const easedPan = {
                x: this.lastPan.x + (newPan.x - this.lastPan.x) * 0.1,
                y: this.lastPan.y + (newPan.y - this.lastPan.y) * 0.1
            };
            
            this.nexusEngine.cy.pan(easedPan);
            this.lastPan = easedPan;
            
            // Continue animation if still enabled
            if (this.enabled) {
                this.animationFrame = requestAnimationFrame(pan);
            }
        };
        
        this.animationFrame = requestAnimationFrame(pan);
    }
    
    showMessage(message) {
        // Could be enhanced with a toast notification
        console.log(message);
    }
    
    showError(message) {
        console.error(message);
        alert(message); // Simple alert for now
    }
}

// Initialize when nexusEngine is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for nexusEngine to be initialized
    const checkNexusEngine = setInterval(() => {
        if (window.nexusEngine && window.nexusEngine.cy) {
            clearInterval(checkNexusEngine);
            window.tiltNavigation = new TiltNavigation(window.nexusEngine);
        }
    }, 100);
}); 