// navigation.js - Handles the consistent navigation bar across the site

function generateNavLinksHTML(currentPath, navType = 'main') {
    console.log(`[navigation.js] generateNavLinksHTML called. currentPath: ${currentPath}, navType: ${navType}`); // DEBUG
    
    // Normalize currentPath for local file testing (ends with / or /index.html)
    const isHomePageLocal = currentPath.endsWith('/index.html') || currentPath.endsWith('/');
    const normalizedCurrentPath = isHomePageLocal && currentPath.includes('/MLNF/index.html') ? '/' : currentPath; // Simplify if it's the full local path to index
    console.log(`[navigation.js] normalizedCurrentPath: ${normalizedCurrentPath}`); // DEBUG

    const allLinks = [
        { href: "/", icon: "fas fa-home", text: "Home" },
        { href: "/lander.html", icon: "fas fa-fire", text: "Eternal Hearth" },
        { href: "/souls", icon: "fas fa-users", text: "Eternal Souls" },
        { href: "/pages/blog.html", icon: "fas fa-scroll", text: "Soul Scrolls" },
        { href: "/pages/messageboard.html", icon: "fas fa-comments", text: "Echoes Unbound" },
        { href: "/pages/news.html", icon: "fas fa-newspaper", text: "Boundless Chronicles" },
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
                console.log('[navigation.js] Filtering Home link on main nav for homepage.'); // DEBUG
                return false; // Exclude Home on homepage
            }
            if (link.text === "Eternal Hearth") {
                return false; // Always exclude Eternal Hearth from main nav
            }
            return true;
        });
    }
    // For 'mobile' navType, we use allLinks by default or apply different rules if needed later

    console.log('[navigation.js] linksToRender BEFORE map:', JSON.stringify(linksToRender)); // DEBUG
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
        return `<li><a href="${link.href}" class="${isActive ? 'active' : ''}">${linkContent}</a></li>`;
    }).join('');
    console.log(`[navigation.js] finalHTML for ${navType}:`, finalHTML.length > 100 ? finalHTML.substring(0,100) + '...' : finalHTML); // DEBUG
    return finalHTML;
}

function injectNavigation() {
    const mainNavUl = document.querySelector('nav.main-nav ul');
    const mobileNavList = document.querySelector('.mobile-nav-list'); // Target for mobile links
    const currentPath = window.location.pathname;

    if (mainNavUl) {
        mainNavUl.innerHTML = generateNavLinksHTML(currentPath, 'main');
    } else {
        console.warn('Main navigation UL not found. Main links not injected.');
    }

    if (mobileNavList) {
        // Generate mobile links (can include more, like auth, handled separately if needed)
        // For now, mobile nav will also filter "Home" on homepage, but keeps "Eternal Hearth"
        // If Eternal Hearth should also be removed from mobile, adjust navType logic or filter here
        let mobileLinksHTML = generateNavLinksHTML(currentPath, 'mobile'); // Use 'mobile' type

        // Set the main navigation links first
        mobileNavList.innerHTML = mobileLinksHTML;

        // Now, let userMenu.js handle adding/updating the auth-related links and their events
        if (window.MLNF && window.MLNF.updateMobileAuthLinks) { // Assuming userMenu.js exposes this
            window.MLNF.updateMobileAuthLinks();
        } else {
            console.warn('[navigation.js] window.MLNF.updateMobileAuthLinks not found. Mobile auth links might be missing or stale.');
        }

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
            document.body.style.overflow = ''; // Restore background scroll
        };

        closeMobileNav.addEventListener('click', closeMenu);
        mobileOverlay.addEventListener('click', closeMenu);

        // Close mobile nav if a link inside it is clicked
        const mobileNavLinks = mobileNav.querySelectorAll('a');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Only close if it's a navigation link, not a control like logout
                // This check might need refinement based on actual link IDs/classes
                if (!link.id || (!link.id.includes('Logout') && !link.id.includes('Login') && !link.id.includes('Register'))) {
                    closeMenu();
                }
            });
        });

    } else {
        console.warn('One or more mobile navigation elements not found. Events not attached.');
    }
}


// Initialize navigation
function initNavigation() {
    injectNavigation();
    setupMobileNavEvents();
}

// Expose to global MLNF object
window.MLNF = window.MLNF || {};
window.MLNF.initNavigation = initNavigation;
// Expose injectNavigation if other scripts need to refresh it, e.g., after login/logout
window.MLNF.injectNavigation = injectNavigation;

// Make sure to call initNavigation after the DOM is loaded,
// for example, from mlnf-core.js or a DOMContentLoaded listener.
// For now, if no core script is orchestrating, call it directly for testing,
// but ideally this is called by a main script.
// document.addEventListener('DOMContentLoaded', initNavigation); // Example: direct call 