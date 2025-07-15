// navigation.js - Handles the consistent navigation bar across the site

function generateNavLinksHTML(currentPath, navType = 'main') {
    // Normalize currentPath for local file testing (ends with / or /index.html)
    const isHomePageLocal = currentPath.endsWith('/index.html') || currentPath.endsWith('/');
    const normalizedCurrentPath = isHomePageLocal && currentPath.includes('/MLNF/index.html') ? '/' : currentPath; // Simplify if it's the full local path to index

    const allLinks = [
        { href: "/", icon: "fas fa-home", text: "Home" },
        { href: "/lander.html", icon: "fas fa-fire", text: "Eternal Hearth" },
        { href: "/souls", icon: "fas fa-users", text: "Eternal Souls" },
        { href: "/pages/blog.html", icon: "fas fa-scroll", text: "Soul Scrolls" },
        { href: "/pages/news.html", icon: "fas fa-newspaper", text: "Boundless Chronicles" },
        { href: "/pages/messageboard.html", icon: "fas fa-comments", text: "Echoes Unbound" },
        { href: "/pages/celestial-commons.html", icon: "fas fa-star", text: "Celestial Commons" },
        { href: "/pages/debate.html", icon: "fas fa-gavel", text: "Clash of Immortals" },
        { href: "/pages/mindmap.html", icon: "fas fa-project-diagram", text: "Infinite Nexus" },
        { href: "/pages/archive.html", icon: "fas fa-vault", text: "Timeless Vault" }
    ];

    let linksToRender = allLinks;

    if (navType === 'main') {
        // For main navigation:
        // 1. Remove "Home" if on the homepage (normalized path)
        // 2. Always remove "Eternal Hearth"
        linksToRender = allLinks.filter(link => {
            if (link.text === "Home" && (normalizedCurrentPath === "/" || normalizedCurrentPath === "/index.html")) {
                return false; // Exclude Home on homepage
            }
            if (link.text === "Eternal Hearth") {
                return false; // Always exclude Eternal Hearth from main nav
            }
            return true;
        });
    } else if (navType === 'mobile') {
        // For mobile navigation:
        // 1. Remove "Home" if on the homepage (normalized path)  
        // 2. Always remove "Eternal Hearth" (available in user dropdown)
        linksToRender = allLinks.filter(link => {
            if (link.text === "Home" && (normalizedCurrentPath === "/" || normalizedCurrentPath === "/index.html")) {
                return false; // Exclude Home on homepage
            }
            if (link.text === "Eternal Hearth") {
                return false; // Always exclude Eternal Hearth from mobile nav
            }
            return true;
        });
    }
    // For any other navType, we use allLinks by default

    console.log(`generateNavLinksHTML called with navType: ${navType}, path: ${currentPath}`);
    console.log(`Links to render (${linksToRender.length}):`, linksToRender);
    
    const finalHTML = linksToRender.map(link => {
        const isActive = normalizedCurrentPath === link.href || 
                       (link.href !== "/" && normalizedCurrentPath.startsWith(link.href)) || 
                       (link.href.endsWith('.html') && normalizedCurrentPath.endsWith(link.href)); // Added check for .html files locally
        
        let linkText = link.text;
        if (navType === 'main' && link.text.includes(' ')) {
            // For main nav, if text has a space, replace the first one with <br> for two-line effect
            linkText = link.text.replace(' ', '<br>');
        }

        // For main nav, wrap icon and text in a span for precise underlining
        // The icon is now stacked above the (potentially two-line) text due to CSS flex-direction: column on the 'a' tag
        const linkContent = navType === 'main' 
            ? `<i class="${link.icon}"></i><span>${linkText}</span>` 
            : `<i class="${link.icon}"></i> ${link.text}`;
        const linkHTML = `<li><a href="${link.href}" class="${isActive ? 'active' : ''}">${linkContent}</a></li>`;
        console.log(`Generated link HTML: ${linkHTML}`);
        return linkHTML;
    }).join('');
    
    console.log(`Final HTML output: ${finalHTML}`);
    return finalHTML;
}

function injectNavigation() {
    const mainNavUls = document.querySelectorAll('nav.main-nav ul');
    const mobileNavList = document.querySelector('.mobile-nav-list'); // Target for mobile links
    const currentPath = window.location.pathname;

    if (mainNavUls.length > 0) {
        console.log(`Found ${mainNavUls.length} main navigation UL elements`);
        mainNavUls.forEach((mainNavUl, index) => {
            const linksHTML = generateNavLinksHTML(currentPath, 'main');
            console.log(`Generated HTML for nav ${index + 1}:`, linksHTML);
            console.log(`Generated HTML length: ${linksHTML.length}`);
            mainNavUl.innerHTML = linksHTML;
            console.log(`After setting innerHTML, nav ${index + 1} children:`, mainNavUl.children.length);
            console.log(`Nav ${index + 1} innerHTML after setting:`, mainNavUl.innerHTML);
        });
    } else {
        console.warn('Main navigation UL not found. Main links not injected.');
    }

    if (mobileNavList) {
        // Generate mobile links (can include more, like auth, handled separately if needed)
        // For now, mobile nav will also filter "Home" on homepage, but keeps "Eternal Hearth"
        // If Eternal Hearth should also be removed from mobile, adjust navType logic or filter here
        let mobileLinksHTML = generateNavLinksHTML(currentPath, 'mobile'); // Use 'mobile' type

        // Set the main navigation links - mobile nav is for navigation only
        mobileNavList.innerHTML = mobileLinksHTML;

    } else {
        console.warn('Mobile navigation list UL not found. Mobile links not injected.');
    }
}


function setupMobileNavEvents() {
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const mobileNav = document.getElementById('mobileNav');
    const closeMobileNav = document.getElementById('closeMobileNav');
    const mobileOverlay = document.getElementById('mobileOverlay');


    if (mobileNavToggle && mobileNav && closeMobileNav && mobileOverlay) {
        
        mobileNavToggle.addEventListener('click', () => {
            mobileNav.classList.add('active');
            mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
            
        });

        const closeMenu = () => {
            mobileNav.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.removeProperty('overflow'); // Restore background scroll
        };

        closeMobileNav.addEventListener('click', (e) => {
            closeMenu();
        });

        // Replace overlay click with document click that checks if click is outside nav
        document.addEventListener('click', (e) => {
            if (mobileNav.classList.contains('active')) {
                
                // Close menu if click is outside the nav and not the toggle button
                if (!mobileNav.contains(e.target) && !mobileNavToggle.contains(e.target) && e.target !== mobileNavToggle) {
                    closeMenu();
                }
            }
        });

        // Close mobile nav if a link inside it is clicked - this will be called initially and after auth links update
        setupMobileNavLinkHandlers();

    } else {
        console.warn('[navigation.js] One or more mobile navigation elements not found. Events not attached.');
        console.warn('[navigation.js] Missing elements:', {
            mobileNavToggle: !mobileNavToggle ? 'MISSING' : 'found',
            mobileNav: !mobileNav ? 'MISSING' : 'found', 
            closeMobileNav: !closeMobileNav ? 'MISSING' : 'found',
            mobileOverlay: !mobileOverlay ? 'MISSING' : 'found'
        });
    }
}

// Setup event handlers for mobile nav links (to close menu when clicked)
function setupMobileNavLinkHandlers() {
    const mobileNav = document.getElementById('mobileNav');
    if (!mobileNav) return;

    const closeMenu = () => {
        mobileNav.classList.remove('active');
        const mobileOverlay = document.getElementById('mobileOverlay');
        if (mobileOverlay) mobileOverlay.classList.remove('active');
        document.body.style.removeProperty('overflow'); // Restore background scroll
    };

    // All links in mobile nav are navigation links - close menu when any is clicked
    const mobileNavLinks = mobileNav.querySelectorAll('.mobile-nav-list a');
    mobileNavLinks.forEach(link => {
        // Remove existing event listener if any
        link.removeEventListener('click', closeMenu);
        // Add new event listener
        link.addEventListener('click', () => {
            closeMenu();
        });
    });
}


// Initialize navigation
function initNavigation() {
    // Skip navigation injection on admin pages
    if (window.location.pathname.includes('/admin')) {
        return;
    }
    
    injectNavigation();
    setupMobileNavEvents();
}

// Expose to global MLNF object
window.MLNF = window.MLNF || {};
window.MLNF.initNavigation = initNavigation;
// Expose injectNavigation if other scripts need to refresh it, e.g., after login/logout
window.MLNF.injectNavigation = injectNavigation;
// Expose setupMobileNavLinkHandlers so it can be called after auth links are updated
window.MLNF.setupMobileNavLinkHandlers = setupMobileNavLinkHandlers;

// Make sure to call initNavigation after the DOM is loaded,
// for example, from mlnf-core.js or a DOMContentLoaded listener.
// For now, if no core script is orchestrating, call it directly for testing,
// but ideally this is called by a main script.
// document.addEventListener('DOMContentLoaded', initNavigation); // Example: direct call 