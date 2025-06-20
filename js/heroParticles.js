// MLNF/js/heroParticles.js

function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle'; // CSS will define animation and base styles

    // Inline styles for variety
    particle.style.width = `${Math.random() * 6 + 3}px`; // Slightly smaller particles: 3px to 9px
    particle.style.height = particle.style.width;
    
    // Vibrant, ethereal colors (blues, purples, pinks with good opacity)
    const r = Math.floor(Math.random() * 50 + 100); // More blue/purple biased
    const g = Math.floor(Math.random() * 100 + 50); 
    const b = Math.floor(Math.random() * 100 + 155);
    particle.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${Math.random() * 0.5 + 0.3})`; // Opacity 0.3 to 0.8

    // Simple full-viewport coverage
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.bottom = `${-20 - Math.random() * 30}px`;
    
    // Much larger drift for full viewport coverage
    particle.style.setProperty('--drift', `${(Math.random() - 0.5) * window.innerWidth * 0.5}`);
    
    // Animation duration
    particle.style.animationDuration = `${Math.random() * 10 + 8}s`;

    // Get or create dedicated particle container
    let particleContainer = document.getElementById('particle-container');
    if (!particleContainer) {
        particleContainer = document.createElement('div');
        particleContainer.id = 'particle-container';
        particleContainer.className = 'particle-container';
        document.body.appendChild(particleContainer);
    }
    
    particleContainer.appendChild(particle);

    // The CSS animation will now handle the lifecycle due to animation-iteration-count: infinite
    // and opacity changes within the animation.
}

function initHeroParticles(creationInterval = 200) {
    console.log(`[heroParticles.js] Initializing continuous hero particles every ${creationInterval}ms...`);
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