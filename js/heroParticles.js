// MLNF/js/heroParticles.js

function createParticle() {
    
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Make particles more visible for debugging
    particle.style.width = '10px';
    particle.style.height = '10px';
    particle.style.backgroundColor = 'red'; // Bright red for visibility
    particle.style.position = 'fixed';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.bottom = '50px'; // Start higher for visibility
    particle.style.borderRadius = '50%';
    particle.style.zIndex = '9999'; // High z-index for visibility
    particle.style.pointerEvents = 'none';
    
    // Simple animation
    particle.style.animation = 'floatUp 10s linear infinite';
    
    // Append directly to body for testing
    document.body.appendChild(particle);
    
    
    // Remove after animation
    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, 10000);
}

function initHeroParticles(creationInterval = 200) {
    // Particles now append to body for full viewport coverage

    // Create an initial larger burst for immediate visual impact
    for (let i = 0; i < 25; i++) { 
        setTimeout(createParticle, Math.random() * creationInterval * 3); 
    }

    // Continuously create particles at a faster rate
    setInterval(createParticle, creationInterval);
}

// Expose to global MLNF namespace if it exists, otherwise just run on DOMContentLoaded
if (window.MLNF) {
    window.MLNF.initHeroParticles = initHeroParticles;
} else {
    document.addEventListener('DOMContentLoaded', () => {
        initHeroParticles(); // Default interval of 200ms
    });
} 