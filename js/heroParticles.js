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

    particle.style.left = `${Math.random() * 100}vw`;
    
    // Animation duration for falling/drifting speed
    particle.style.animationDuration = `${Math.random() * 8 + 7}s`; // 7s to 15s for a slower, more ethereal drift

    // Add a random horizontal drift to each particle using a CSS variable
    particle.style.setProperty('--drift', `${Math.random() * 100 - 50}`); // -50px to +50px drift

    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroSection.appendChild(particle);
    } else {
        // Fallback to body, but ideally, a .hero section should exist
        console.warn('[heroParticles.js] .hero section not found. Appending to body.');
        document.body.appendChild(particle);
    }

    // The CSS animation will now handle the lifecycle due to animation-iteration-count: infinite
    // and opacity changes within the animation.
}

function initHeroParticles(creationInterval = 300) {
    console.log(`[heroParticles.js] Initializing continuous hero particles every ${creationInterval}ms...`);
    const heroSection = document.querySelector('.hero');
    if (!heroSection) {
        console.warn("[heroParticles.js] Hero section (.hero) not found. Particles may not display correctly or at all if CSS relies on this parent.");
        // Optionally, still try to create them on body if that's desired fallback
    }

    // Create an initial small burst so it doesn't feel empty at the start
    for (let i = 0; i < 10; i++) { 
        setTimeout(createParticle, Math.random() * creationInterval * 2); 
    }

    // Continuously create particles
    setInterval(createParticle, creationInterval);
}

// Expose to global MLNF namespace if it exists, otherwise just run on DOMContentLoaded
if (window.MLNF) {
    window.MLNF.initHeroParticles = initHeroParticles;
} else {
    document.addEventListener('DOMContentLoaded', () => {
        initHeroParticles(); // Default interval of 300ms
    });
} 