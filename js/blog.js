// Embedded jwt-decode
function jwt_decode(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        throw new Error('Invalid JWT token');
    }
}

console.log('[blog.js] Script loaded');
console.log('[blog.js] MLNF_CONFIG:', window.MLNF_CONFIG);

const BLOG_API_BASE_URL = window.MLNF_CONFIG?.API_BASE_URL || 'https://mlnf-auth.onrender.com/api';
console.log('[blog.js] BLOG_API_BASE_URL:', BLOG_API_BASE_URL);

// const activeUsers = document.getElementById('activeUsers'); // Handled by activeUsers.js
// const showUsersBtn = document.getElementById('showUsersBtn'); // Handled by activeUsers.js
// const closeUsersBtn = document.getElementById('closeUsers'); // Handled by activeUsers.js
let blogList = null;
let scrollObserver = null;

let currentPage = 1;
let isLoading = false;
let hasMore = true;
const PAGE_LIMIT = 10;
let blogPosts = {}; // Store full blog data for modal display
let currentPostId = null; // Track current post for sharing
let commentsSystem = null; // Track current comments system

// Check token validity
function isTokenValid(token) {
    if (!token) return false;
    try {
        const decoded = jwt_decode(token);
        const now = Math.floor(Date.now() / 1000);
        return decoded.exp > now && decoded.id;
    } catch (error) {
        console.error('Token decode error:', error.message);
        return false;
    }
}

// Create excerpt from content
function createExcerpt(content, maxLength = 150) {
    const textContent = content.replace(/<[^>]*>/g, ''); // Strip HTML
    return textContent.length > maxLength 
        ? textContent.substring(0, maxLength) + '...'
        : textContent;
}

// Fetch blog posts with pagination
async function fetchBlogPosts(page = 1) {
    console.log('[blog.js] fetchBlogPosts called with page:', page);
    console.log('[blog.js] Current state - isLoading:', isLoading, 'hasMore:', hasMore);
    
    if (isLoading || !hasMore) {
        console.log('[blog.js] Skipping fetch - isLoading:', isLoading, 'hasMore:', hasMore);
        return;
    }
    
    isLoading = true;
    showLoadingCrystal();
    
    const fetchUrl = `${BLOG_API_BASE_URL}/blogs?page=${page}&limit=${PAGE_LIMIT}`;
    console.log('[blog.js] Fetching from URL:', fetchUrl);
    
    try {
        const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('[blog.js] Response received - status:', response.status, 'ok:', response.ok);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch blog posts`);
        }
        
        const result = await response.json();
        console.log('[blog.js] Response data:', result);
        
        const posts = result.docs || result; // Handle both paginated and simple array responses
        console.log('[blog.js] Posts extracted:', posts.length, 'posts');
        
        if (posts.length === 0 && currentPage === 1) {
            console.log('[blog.js] No posts found, showing empty message');
            blogList.innerHTML = '<p class="empty-message">No scrolls have been written yet. The chamber awaits the first whisper...</p>';
            hasMore = false;
        } else {
            console.log('[blog.js] Processing', posts.length, 'posts');
            posts.forEach(post => {
                if (!post.author) {
                    console.warn('[blog.js] Post has no author, skipping:', post._id);
                    return;
                }
                console.log('[blog.js] Processing post:', post._id, post.title);
                const postElement = document.createElement('div');
                postElement.className = 'blog-post';
                postElement.id = post._id;
                
                const authorAvatar = post.author.avatar || '/assets/images/default.jpg';
                const authorDisplayName = post.author.displayName || post.author.username;
                const excerpt = createExcerpt(post.content);
                const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                // Create unified author display using MLNF Avatar System
                const authorDisplay = window.MLNFAvatars.createUserDisplay({
                    username: post.author.username,
                    title: post.author.title || 'Scroll Author',
                    avatarSize: 'md',
                    displaySize: 'sm',
                    compact: true,
                    mystical: post.author.isVIP || post.author.role === 'admin',
                    online: post.author.online,
                    customAvatar: post.author.avatar,
                    usernameStyle: 'immortal',
                    enableUnifiedNavigation: true
                });
                
                // Build post structure with DOM elements
                const titleEl = document.createElement('h3');
                titleEl.textContent = post.title;
                
                const contentEl = document.createElement('div');
                contentEl.className = 'content';
                contentEl.innerHTML = excerpt;
                
                const scrollFooter = document.createElement('div');
                scrollFooter.className = 'scroll-footer';
                scrollFooter.innerHTML = `
                    <p class="date">${formattedDate}</p>
                    <div class="post-actions">
                        <div class="like-dislike-buttons">
                            <button class="like-btn" data-post-id="${post._id}" onclick="event.stopPropagation(); likePost('${post._id}')">
                                <i class="fas fa-heart"></i> <span class="like-count">${post.likes ? post.likes.length : 0}</span>
                            </button>
                            <button class="dislike-btn" data-post-id="${post._id}" onclick="event.stopPropagation(); dislikePost('${post._id}')">
                                <i class="fas fa-heart-broken"></i> <span class="dislike-count">${post.dislikes ? post.dislikes.length : 0}</span>
                            </button>
                        </div>
                        <button class="whisper-link" onclick="event.stopPropagation(); sharePost('${post._id}')">
                            🦉 Whisper this scroll to another soul
                        </button>
                    </div>
                `;
                
                // Assemble the post element
                postElement.appendChild(authorDisplay);
                postElement.appendChild(titleEl);
                postElement.appendChild(contentEl);
                postElement.appendChild(scrollFooter);
                
                // Store full post data
                blogPosts[post._id] = post;
                
                // Make post clickable with proper event handling
                const handlePostClick = function(e) {
                    console.log('[blog.js] Click event triggered on post:', post._id, 'Title:', post.title, 'Author:', post.author.username);
                    console.log('[blog.js] Click target:', e.target.tagName, e.target.className, e.target);
                    // Don't open modal if clicking on links or buttons
                    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('a')) {
                        console.log('[blog.js] Click on link/button, not opening modal');
                        return;
                    }
                    console.log('[blog.js] Opening modal for post:', post._id);
                    e.preventDefault();
                    e.stopPropagation();
                    openBlogModal(post._id);
                };

                // Add click event only (remove touchend to prevent scroll conflicts)
                console.log('[blog.js] Adding event listeners to post:', post._id, 'Author:', post.author.username);
                postElement.addEventListener('click', handlePostClick);
                
                // Add touch handling that doesn't conflict with scrolling
                let touchStartY = 0;
                let touchStartTime = 0;
                
                postElement.addEventListener('touchstart', function(e) {
                    touchStartY = e.touches[0].clientY;
                    touchStartTime = Date.now();
                }, { passive: true });
                
                postElement.addEventListener('touchend', function(e) {
                    const touchEndY = e.changedTouches[0].clientY;
                    const touchEndTime = Date.now();
                    const touchDuration = touchEndTime - touchStartTime;
                    const touchDistance = Math.abs(touchEndY - touchStartY);
                    
                    // Only trigger if it's a tap (short duration, minimal movement)
                    if (touchDuration < 300 && touchDistance < 10) {
                        console.log('[blog.js] Touch tap detected on post:', post._id);
                        // Don't open modal if touching links or buttons
                        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('a')) {
                            console.log('[blog.js] Touch on link/button, not opening modal');
                            return;
                        }
                        console.log('[blog.js] Opening modal for post (touch tap):', post._id);
                        e.preventDefault();
                        e.stopPropagation();
                        openBlogModal(post._id);
                    }
                }, { passive: false });
                
                // Add hover effect class
                postElement.classList.add('blog-post-hover');
                
                blogList.appendChild(postElement);
                console.log('[blog.js] Post added to DOM:', post._id);
            });
            
            // DEBUG: Log the final DOM structure
            console.log("----------- DEBUG: Final blogList innerHTML -----------");
            console.log(blogList.innerHTML);
            console.log("----------------------------------------------------");
            
            // Check if we have more pages
            if (result.totalPages && currentPage >= result.totalPages) {
                hasMore = false;
                console.log('[blog.js] No more pages available');
            } else if (!result.totalPages && posts.length < PAGE_LIMIT) {
                hasMore = false;
                console.log('[blog.js] Fewer posts than limit, assuming no more pages');
            }
        }
    } catch (error) {
        console.error('[blog.js] Error fetching blog posts:', error);
        if (currentPage === 1) {
            blogList.innerHTML = `
                <div class="error-message">
                    <p>Error loading scrolls: ${error.message}</p>
                    <p>The ancient texts seem to be misplaced. Please try again later.</p>
                </div>
            `;
        }
        hasMore = false;
    } finally {
        hideLoadingCrystal();
        isLoading = false;
        console.log('[blog.js] fetchBlogPosts completed - isLoading:', isLoading, 'hasMore:', hasMore);
    }
}

function showLoadingCrystal() {
    if (scrollObserver) {
        scrollObserver.style.display = 'block';
        scrollObserver.classList.add('active');
    }
}

function hideLoadingCrystal() {
    if (scrollObserver) {
        scrollObserver.style.display = 'none';
        scrollObserver.classList.remove('active');
    }
}

// Intersection Observer for infinite scroll
const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !isLoading && hasMore) {
        currentPage++;
        fetchBlogPosts(currentPage);
    }
}, { threshold: 1.0 });

function initBlog() {
    console.log('[blog.js] initBlog() called');
    blogList = document.getElementById('blogList');
    scrollObserver = document.getElementById('scroll-observer');

    console.log('[blog.js] Elements found - blogList:', !!blogList, 'scrollObserver:', !!scrollObserver);

    // Safety check: ensure blog modal isn't blocking clicks on page load
    const blogModal = document.getElementById('blogModal');
    if (blogModal) {
        blogModal.classList.remove('show');
        blogModal.style.display = 'none';
        blogModal.style.opacity = '0';
        blogModal.style.visibility = 'hidden';
        blogModal.style.pointerEvents = 'none';
        document.body.classList.remove('modal-open');
        console.log('[blog.js] Cleared any stuck blog modal states on init');
    }

    if (!blogList) {
        console.log('[blog.js] blogList element not found, aborting init.');
        return;
    }

    if (scrollObserver) {
        observer.observe(scrollObserver);
    }

    fetchBlogPosts(1);
    
    // Check if we should auto-open a specific scroll from highlights
    const autoOpenScrollId = sessionStorage.getItem('openScrollId');
    if (autoOpenScrollId) {
        console.log('[blog.js] Auto-opening scroll from highlights:', autoOpenScrollId);
        sessionStorage.removeItem('openScrollId');
        
        // Wait a bit for posts to load before trying to open modal
        setTimeout(() => {
            openBlogModal(autoOpenScrollId);
        }, 1000);
    }
}

// Create blog post (for compatibility with existing forms)
async function createBlog() {
    const titleInput = document.getElementById('blogTitle');
    const contentInput = document.getElementById('blogContent');
    const errorElement = document.getElementById('blogFormError');
    const token = localStorage.getItem('sessionToken');

    if (errorElement) errorElement.style.display = 'none';
    
    if (!isTokenValid(token)) {
        if (errorElement) {
            errorElement.textContent = 'Please log in to share a scroll';
            errorElement.style.display = 'block';
        }
        if (window.MLNF && window.MLNF.openSoulModal) {
            window.MLNF.openSoulModal('login');
        }
        return;
    }

    const title = titleInput?.value.trim();
    const content = contentInput?.value.trim();
    
    if (!title || !content) {
        if (errorElement) {
            errorElement.textContent = 'Title and content are required';
            errorElement.style.display = 'block';
        }
        return;
    }

    try {
        const response = await fetch(`${BLOG_API_BASE_URL}/blogs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, content })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: Failed to post scroll`);
        }
        
        if (titleInput) titleInput.value = '';
        if (contentInput) contentInput.value = '';
        
        // Refresh blog list
        currentPage = 1;
        isLoading = false;
        hasMore = true;
        blogList.innerHTML = '';
        fetchBlogPosts(currentPage);
        
    } catch (error) {
        console.error('Error creating blog:', error);
        if (errorElement) {
            errorElement.textContent = `Failed to post scroll: ${error.message}`;
            errorElement.style.display = 'block';
        }
    }
}

// Removed fetchOnlineUsers function as activeUsers.js should handle the shared sidebar.

// Fetch a single blog post by ID
async function fetchBlogPost(postId) {
    console.log('[blog.js] fetchBlogPost called for ID:', postId);
    
    // Check if we have it cached
    if (blogPosts[postId] && blogPosts[postId].content) {
        console.log('[blog.js] Returning cached post:', blogPosts[postId]);
        return blogPosts[postId];
    }
    
    // Check if it exists in window.blogPosts (from profile page)
    if (window.blogPosts && window.blogPosts[postId]) {
        console.log('[blog.js] Found post in window.blogPosts:', window.blogPosts[postId]);
        blogPosts[postId] = window.blogPosts[postId];
        return window.blogPosts[postId];
    }
    
    console.log('[blog.js] Post not cached, fetching from API...');
    
    try {
        const url = `${BLOG_API_BASE_URL}/blogs/${postId}`;
        console.log('[blog.js] Fetching from URL:', url);
        
        const response = await fetch(url);
        console.log('[blog.js] API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[blog.js] API error response:', errorText);
            throw new Error(`Failed to fetch blog post: ${response.status}`);
        }
        
        const post = await response.json();
        console.log('[blog.js] API response data:', post);
        
        blogPosts[post._id] = post;
        return post;
    } catch (error) {
        console.error('[blog.js] Error fetching post:', error);
        return null;
    }
}

// Open blog modal
async function openBlogModal(postId) {
    // Prevent duplicate calls
    if (window._blogModalOpening) {
        console.log('[blog.js] Modal already opening, preventing duplicate call');
        return;
    }
    
    window._blogModalOpening = true;
    
    console.log('[blog.js] Opening modal for post:', postId);
    currentPostId = postId;
    
    // Get modal element first and check if it exists
    const modal = document.getElementById('blogModal');
    if (!modal) {
        console.error('[blog.js] blogModal element not found in DOM!');
        window._blogModalOpening = false;
        // Ensure body scroll is not locked
        document.body.classList.remove('modal-open');
        return;
    }
    
    console.log('[blog.js] Modal element found:', modal);
    
    // Fetch the post data
    let post;
    try {
        post = await fetchBlogPost(postId);
        console.log('[blog.js] Post data fetched:', post);
    } catch (error) {
        console.error('[blog.js] Error fetching post:', error);
        window._blogModalOpening = false;
        document.body.classList.remove('modal-open');
        return;
    }
    
    if (!post) {
        console.error('[blog.js] No post data returned for ID:', postId);
        window._blogModalOpening = false;
        document.body.classList.remove('modal-open');
        return;
    }
    
    // Check if all required modal elements exist
    const requiredElements = {
        'modal-title': document.getElementById('modal-title'),
        'modal-content': document.getElementById('modal-content'),
        'modal-author-avatar': document.getElementById('modal-author-avatar'),
        'modal-author-link': document.getElementById('modal-author-link'),
        'modal-author-name-link': document.getElementById('modal-author-name-link'),
        'modal-date': document.getElementById('modal-date')
    };
    
    // Log missing elements
    const missingElements = [];
    for (const [id, element] of Object.entries(requiredElements)) {
        if (!element) {
            missingElements.push(id);
        }
    }
    
    if (missingElements.length > 0) {
        console.error('[blog.js] Missing modal elements:', missingElements);
        window._blogModalOpening = false;
        document.body.classList.remove('modal-open');
        return;
    }
    
    console.log('[blog.js] All modal elements found, updating content...');
    
    // Update modal content
    try {
        requiredElements['modal-title'].textContent = post.title;
        requiredElements['modal-content'].innerHTML = post.content;
        
        // Update author info using MLNF Avatar System
        const modalAuthorContainer = document.querySelector('.modal-author-info');
        if (modalAuthorContainer) {
            // Clear existing content
            modalAuthorContainer.innerHTML = '';
            
            // Create unified author display for modal
            const modalAuthorDisplay = window.MLNFAvatars.createUserDisplay({
                username: post.author.username,
                title: post.author.title || 'Scroll Author',
                status: `Chronicled on ${new Date(post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}`,
                avatarSize: 'lg',
                displaySize: 'md',
                mystical: post.author.isVIP || post.author.role === 'admin',
                online: post.author.online,
                customAvatar: post.author.avatar,
                usernameStyle: 'mystical',
                enableUnifiedNavigation: true
            });
            
            modalAuthorContainer.appendChild(modalAuthorDisplay);
        } else {
            // Fallback to existing elements if modal structure is different
            const authorAvatar = post.author.avatar || '/assets/images/default.jpg';
            const authorDisplayName = post.author.displayName || post.author.username;
            const authorLink = `/souls/${post.author.username}.html`;
            
            if (requiredElements['modal-author-avatar']) {
                requiredElements['modal-author-avatar'].src = authorAvatar;
                requiredElements['modal-author-avatar'].alt = `${authorDisplayName}'s avatar`;
            }
            if (requiredElements['modal-author-link']) {
                requiredElements['modal-author-link'].href = authorLink;
            }
            if (requiredElements['modal-author-name-link']) {
                requiredElements['modal-author-name-link'].href = authorLink;
                requiredElements['modal-author-name-link'].textContent = authorDisplayName;
            }
        }
        
        // Update date
        requiredElements['modal-date'].textContent = new Date(post.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Show edit button if user is the author
        const editBtn = document.getElementById('editPostBtn');
        const token = localStorage.getItem('sessionToken');
        if (editBtn && isTokenValid(token)) {
            try {
                const decodedToken = jwt_decode(token);
                if (post.author.username === decodedToken.username || post.author._id === decodedToken.id) {
                    editBtn.style.display = 'inline-flex';
                } else {
                    editBtn.style.display = 'none';
                }
            } catch (error) {
                console.error('[blog.js] Error checking edit permissions:', error);
                editBtn.style.display = 'none';
            }
        } else if (editBtn) {
            editBtn.style.display = 'none';
        }
        
        console.log('[blog.js] Modal content updated successfully');
    } catch (error) {
        console.error('[blog.js] Error updating modal content:', error);
        window._blogModalOpening = false;
        document.body.classList.remove('modal-open');
        return;
    }

    // Remove any existing event listeners by using a data attribute
    if (modal.dataset.listenersAttached !== 'true') {
        // First time setup - add event listeners
        console.log('[blog.js] Attaching event listeners to modal...');
        
        // Add backdrop click listener
        modal.addEventListener('click', function(e) {
            // Only close if clicking the backdrop itself
            if (e.target === modal) {
                closeBlogModal();
            }
        });
        
        // Add close button listener
        const closeButton = modal.querySelector('.close-modal');
        if (closeButton) {
            // Remove inline onclick and use addEventListener
            closeButton.removeAttribute('onclick');
            closeButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeBlogModal();
            });
            console.log('[blog.js] Close button listener attached');
        } else {
            console.warn('[blog.js] Close button not found');
        }
        
        // Mark that listeners are attached
        modal.dataset.listenersAttached = 'true';
    }
    
    // Show the modal
    console.log('[blog.js] Showing modal...');
    
    // Remove any inline display style that might be overriding our CSS
    modal.style.removeProperty('display');
    
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    modal.style.zIndex = '10000';
    document.body.classList.add('modal-open');
    
    // Force a reflow to ensure the modal is visible
    modal.offsetHeight;
    
    // Get computed styles to debug visibility
    const computedStyle = window.getComputedStyle(modal);
    const modalContent = modal.querySelector('.blog-modal-content');
    const contentComputedStyle = modalContent ? window.getComputedStyle(modalContent) : null;
    
    console.log('[blog.js] Modal computed styles:', {
        display: computedStyle.display,
        position: computedStyle.position,
        top: computedStyle.top,
        left: computedStyle.left,
        width: computedStyle.width,
        height: computedStyle.height,
        opacity: computedStyle.opacity,
        visibility: computedStyle.visibility,
        zIndex: computedStyle.zIndex
    });
    
    if (contentComputedStyle) {
        console.log('[blog.js] Modal content computed styles:', {
            display: contentComputedStyle.display,
            width: contentComputedStyle.width,
            height: contentComputedStyle.height,
            opacity: contentComputedStyle.opacity,
            visibility: contentComputedStyle.visibility
        });
    }
    
    console.log('[blog.js] Body classes:', document.body.className);
    console.log('[blog.js] Modal classes:', modal.className);
    
    // Fallback: If the modal is still not visible after adding the show class, force it
    if (computedStyle.display === 'none') {
        console.warn('[blog.js] Modal still hidden after adding show class, forcing display');
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
    }
    
    console.log('[blog.js] Modal should now be visible. Display:', computedStyle.display, 'Z-index:', modal.style.zIndex);
    
    // Initialize comments system
    if (commentsSystem) {
        commentsSystem = null;
    }
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
        if (window.MLNF && window.MLNF.CommentsSystem) {
            try {
                commentsSystem = new window.MLNF.CommentsSystem('blog', postId, 'blogComments');
                console.log('[blog.js] Comments system initialized');
            } catch (error) {
                console.error('[blog.js] Error initializing comments:', error);
            }
        }
        window._blogModalOpening = false;
    }, 100);
}

// Close blog modal
function closeBlogModal() {
    console.log('[blog.js] Closing modal');
    const modal = document.getElementById('blogModal');
    if (modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }
    
    // Clean up comments system
    if (commentsSystem) {
        commentsSystem = null;
    }
    
    // Reset the opening flag
    window._blogModalOpening = false;
}

// Share current post
function shareCurrentPost() {
    if (currentPostId) {
        sharePost(currentPostId);
    }
}

// Share post by ID
function sharePost(postId) {
    currentPostId = postId;
    shareCurrentPost();
}

// Like a blog post
async function likePost(postId) {
    const token = localStorage.getItem('sessionToken');
    if (!isTokenValid(token)) {
        if (window.MLNF && window.MLNF.openSoulModal) {
            window.MLNF.openSoulModal('login');
        }
        return;
    }

    try {
        const response = await fetch(`${BLOG_API_BASE_URL}/blogs/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to like post`);
        }

        const result = await response.json();
        updateLikeButtons(postId, result);
    } catch (error) {
        console.error('Error liking post:', error);
        alert('Failed to like post: ' + error.message);
    }
}

// Dislike a blog post
async function dislikePost(postId) {
    const token = localStorage.getItem('sessionToken');
    if (!isTokenValid(token)) {
        if (window.MLNF && window.MLNF.openSoulModal) {
            window.MLNF.openSoulModal('login');
        }
        return;
    }

    try {
        const response = await fetch(`${BLOG_API_BASE_URL}/blogs/${postId}/dislike`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to dislike post`);
        }

        const result = await response.json();
        updateLikeButtons(postId, result);
    } catch (error) {
        console.error('Error disliking post:', error);
        alert('Failed to dislike post: ' + error.message);
    }
}

// Update like/dislike button states
function updateLikeButtons(postId, result) {
    const postElement = document.getElementById(postId);
    if (!postElement) return;

    const likeBtn = postElement.querySelector('.like-btn');
    const dislikeBtn = postElement.querySelector('.dislike-btn');
    const likeCount = postElement.querySelector('.like-count');
    const dislikeCount = postElement.querySelector('.dislike-count');

    if (likeCount) likeCount.textContent = result.likes;
    if (dislikeCount) dislikeCount.textContent = result.dislikes;

    // Update button states
    if (likeBtn) {
        if (result.userLiked) {
            likeBtn.classList.add('active');
        } else {
            likeBtn.classList.remove('active');
        }
    }

    if (dislikeBtn) {
        if (result.userDisliked) {
            dislikeBtn.classList.add('active');
        } else {
            dislikeBtn.classList.remove('active');
        }
    }
}

// Edit current post
function editCurrentPost() {
    if (currentPostId) {
        editPost(currentPostId);
    }
}

// Edit post by ID
async function editPost(postId) {
    const token = localStorage.getItem('sessionToken');
    if (!isTokenValid(token)) {
        if (window.MLNF && window.MLNF.openSoulModal) {
            window.MLNF.openSoulModal('login');
        }
        return;
    }

    // Get the current post data
    const post = blogPosts[postId];
    if (!post) {
        console.error('[blog.js] No post data found for editing:', postId);
        return;
    }

    // Check if user is the author
    const decodedToken = jwt_decode(token);
    if (post.author.username !== decodedToken.username && post.author._id !== decodedToken.id) {
        alert('You can only edit your own scrolls.');
        return;
    }

    // Create edit form
    const modalContent = document.getElementById('modal-content');
    const modalTitle = document.getElementById('modal-title');
    
    if (!modalContent || !modalTitle) {
        console.error('[blog.js] Modal elements not found for editing');
        return;
    }

    // Store original content
    const originalTitle = modalTitle.textContent;
    const originalContent = modalContent.innerHTML;

    // Create edit form
    modalTitle.innerHTML = `
        <input type="text" id="edit-title" value="${post.title}" 
               style="width: 100%; background: transparent; border: 2px solid var(--gold); 
                      border-radius: 8px; padding: 0.75rem; font-family: 'Cinzel', serif; 
                      font-size: clamp(1.2rem, 3vw, 1.8rem); font-weight: 700; 
                      color: var(--ink); text-align: center;">
    `;

    modalContent.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <textarea id="edit-content" style="width: 100%; min-height: 300px; 
                      background: rgba(255, 255, 255, 0.9); border: 2px solid var(--gold); 
                      border-radius: 12px; padding: 1.5rem; font-family: 'Montserrat', sans-serif; 
                      font-size: 1.1rem; line-height: 1.6; color: var(--ink); resize: vertical;">${post.content}</textarea>
        </div>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button onclick="savePostEdit('${postId}')" 
                    style="background: linear-gradient(135deg, var(--gold), var(--gold-dark)); 
                           color: white; border: none; padding: 0.75rem 1.5rem; 
                           border-radius: 25px; cursor: pointer; font-weight: 600; 
                           min-height: 44px; transition: var(--transition-smooth);">
                ✅ Save Changes
            </button>
            <button onclick="cancelPostEdit('${postId}', \`${originalTitle.replace(/`/g, '\\`')}\`, \`${originalContent.replace(/`/g, '\\`')}\`)" 
                    style="background: transparent; color: var(--ink-light); 
                           border: 2px solid var(--aged-border); padding: 0.75rem 1.5rem; 
                           border-radius: 25px; cursor: pointer; font-weight: 600; 
                           min-height: 44px; transition: var(--transition-smooth);">
                ❌ Cancel
            </button>
        </div>
    `;
}

// Save post edit
async function savePostEdit(postId) {
    const token = localStorage.getItem('sessionToken');
    const titleInput = document.getElementById('edit-title');
    const contentInput = document.getElementById('edit-content');
    
    if (!titleInput || !contentInput) {
        console.error('[blog.js] Edit form elements not found');
        return;
    }
    
    const newTitle = titleInput.value.trim();
    const newContent = contentInput.value.trim();
    
    if (!newTitle || !newContent) {
        alert('Title and content are required');
        return;
    }
    
    try {
        const response = await fetch(`${BLOG_API_BASE_URL}/blogs/${postId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: newTitle, content: newContent })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: Failed to update scroll`);
        }
        
        const updatedPost = await response.json();
        
        // Update cached post data
        blogPosts[postId] = updatedPost;
        
        // Update the modal display
        document.getElementById('modal-title').textContent = updatedPost.title;
        document.getElementById('modal-content').innerHTML = updatedPost.content;
        
        // Update the post in the blog list if visible
        const postElement = document.getElementById(postId);
        if (postElement) {
            const titleElement = postElement.querySelector('h3');
            const contentElement = postElement.querySelector('.content');
            if (titleElement) titleElement.textContent = updatedPost.title;
            if (contentElement) contentElement.innerHTML = createExcerpt(updatedPost.content);
        }
        
        alert('Scroll updated successfully!');
        
    } catch (error) {
        console.error('[blog.js] Error updating post:', error);
        alert(`Failed to update scroll: ${error.message}`);
    }
}

// Cancel post edit
function cancelPostEdit(postId, originalTitle, originalContent) {
    document.getElementById('modal-title').textContent = originalTitle;
    document.getElementById('modal-content').innerHTML = originalContent;
}

// Export functions to global scope for compatibility
window.createBlog = createBlog;
window.openBlogModal = openBlogModal;
window.closeBlogModal = closeBlogModal;
window.sharePost = sharePost;
window.shareCurrentPost = shareCurrentPost;
window.likePost = likePost;
window.dislikePost = dislikePost;
window.editCurrentPost = editCurrentPost;
window.editPost = editPost;
window.savePostEdit = savePostEdit;
window.cancelPostEdit = cancelPostEdit;

// Auto-initialization disabled for pages like profile where blog is not the main feature
if (!window.location.pathname.includes('/souls/') && !window.location.pathname.includes('/profile/')) {
    // Initialize blog functionality when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[blog.js] Initializing blog functionality.');
            initBlog();
        });
    } else {
        console.log('[blog.js] Initializing blog functionality.');
        initBlog();
    }
} else {
    console.log('[blog.js] Auto-initialization is disabled.');
}

// Debug function to find what's blocking clicks
window.debugClickBlocker = function() {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const elements = document.elementsFromPoint(centerX, centerY);
    
    console.log('[DEBUG] Elements at center of screen (top to bottom):');
    elements.forEach((el, index) => {
        const computed = window.getComputedStyle(el);
        const info = {
            tag: el.tagName,
            id: el.id || 'none',
            class: el.className || 'none',
            zIndex: computed.zIndex,
            position: computed.position,
            display: computed.display,
            visibility: computed.visibility,
            pointerEvents: computed.pointerEvents,
            opacity: computed.opacity
        };
        console.log(`[${index}]`, info);
    });
};

// Auto-run debug on page load if there are issues
setTimeout(() => {
    console.log('[blog.js] Running click blocker debug...');
    if (window.debugClickBlocker) {
        window.debugClickBlocker();
    }
}, 2000);