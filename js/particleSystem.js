// Optimized Particle System for Hero Section
// Hardware accelerated particle animation with performance optimizations

class OptimizedParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 15; // Reduced for better performance
        this.isVisible = true;
        this.container = null;
        this.rafId = null;
        this.init();
    }
    
    init() {
        // Create container for better performance
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: var(--z-base, 1);
            overflow: hidden;
        `;
        document.body.appendChild(this.container);
        
        // Start with initial burst
        this.createInitialParticles();
        
        // Start animation loop
        this.animate();
        
        // Performance optimizations
        this.setupVisibilityOptimization();
        this.setupReducedMotionSupport();
    }
    
    createParticle() {
        if (this.particles.length >= this.maxParticles) return;
        
        const particle = document.createElement('div');
        const size = Math.random() * 6 + 2; // Smaller particles for better performance
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(${100 + Math.random() * 50}, ${50 + Math.random() * 100}, ${155 + Math.random() * 100}, ${0.3 + Math.random() * 0.4});
            left: ${Math.random() * 100}vw;
            bottom: -20px;
            will-change: transform;
            transform: translateZ(0);
        `;
        
        const particleData = {
            element: particle,
            x: Math.random() * window.innerWidth,
            y: -20,
            vx: (Math.random() - 0.5) * 2, // Horizontal drift velocity
            vy: 1 + Math.random() * 2, // Vertical velocity
            life: 1,
            decay: 0.005 + Math.random() * 0.005
        };
        
        this.particles.push(particleData);
        this.container.appendChild(particle);
    }
    
    createInitialParticles() {
        // Create initial particles with staggered timing
        for (let i = 0; i < 8; i++) {
            setTimeout(() => this.createParticle(), i * 100);
        }
    }
    
    animate() {
        if (!this.isVisible) {
            this.rafId = requestAnimationFrame(() => this.animate());
            return;
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.y -= particle.vy;
            particle.x += particle.vx;
            particle.life -= particle.decay;
            
            // Apply transform (hardware accelerated)
            particle.element.style.transform = `translate3d(${particle.x}px, ${particle.y}px, 0) scale(${particle.life})`;
            particle.element.style.opacity = particle.life;
            
            // Remove dead particles
            if (particle.life <= 0 || particle.y < -100) {
                this.container.removeChild(particle.element);
                this.particles.splice(i, 1);
            }
        }
        
        // Create new particles periodically
        if (Math.random() < 0.3 && this.particles.length < this.maxParticles) {
            this.createParticle();
        }
        
        this.rafId = requestAnimationFrame(() => this.animate());
    }
    
    setupVisibilityOptimization() {
        // Pause when tab is not visible
        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
        });
        
        // Pause when scrolled far from hero
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    this.isVisible = scrollY < window.innerHeight;
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
    
    setupReducedMotionSupport() {
        // Respect user's motion preferences
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (prefersReducedMotion.matches) {
            this.maxParticles = 3; // Minimal particles for accessibility
        }
    }
    
    destroy() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.particles = [];
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.particleSystem = new OptimizedParticleSystem();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.particleSystem) {
        window.particleSystem.destroy();
    }
});