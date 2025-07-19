
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

const BLOG_API_BASE_URL = window.MLNF_CONFIG?.API_BASE_URL || 'https://mlnf-auth.onrender.com/api';

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
    if (isLoading || !hasMore) {
        return;
    }
    
    isLoading = true;
    showLoadingCrystal();
    
    const fetchUrl = `${BLOG_API_BASE_URL}/blogs?page=${page}&limit=${PAGE_LIMIT}`;
    
    try {
        const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch blog posts`);
        }
        
        const result = await response.json();
        
        const posts = result.docs || result; // Handle both paginated and simple array responses
        
        if (posts.length === 0 && currentPage === 1) {
            blogList.innerHTML = '<p class="empty-message">No scrolls have been written yet. The chamber awaits the first whisper...</p>';
            hasMore = false;
        } else {
            posts.forEach(post => {
                if (!post.author) {
                    return;
                }
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
                
                // Check if current user is the author for delete button
                const token = localStorage.getItem('token');
                let canDelete = false;
                if (token && isTokenValid(token)) {
                    try {
                        const decoded = jwt_decode(token);
                        canDelete = decoded.id === post.author._id || decoded.role === 'admin';
                    } catch (error) {
                        console.error('Token decode error:', error);
                    }
                }

                const scrollFooter = document.createElement('div');
                scrollFooter.className = 'scroll-footer';
                
                const deleteButton = canDelete ? 
                    `<button class="delete-btn" data-post-id="${post._id}" onclick="event.stopPropagation(); confirmDeletePost('${post._id}')" title="Delete this scroll">
                        <i class="fas fa-trash"></i>
                    </button>` : '';

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
                        <div class="scroll-controls">
                            <button class="whisper-link" onclick="event.stopPropagation(); sharePost('${post._id}')">
                                🔗 Share this scroll
                            </button>
                            ${deleteButton}
                        </div>
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
                    // Don't open modal if clicking on links or buttons
                    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('a')) {
                        return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    openBlogModal(post._id);
                };

                // Add click event only (remove touchend to prevent scroll conflicts)
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
                        // Don't open modal if touching links or buttons
                        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('a')) {
                            return;
                        }
                        e.preventDefault();
                        e.stopPropagation();
                        openBlogModal(post._id);
                    }
                }, { passive: false });
                
                
                blogList.appendChild(postElement);
            });
            
            // Check if we have more pages
            if (result.totalPages && currentPage >= result.totalPages) {
                hasMore = false;
            } else if (!result.totalPages && posts.length < PAGE_LIMIT) {
                hasMore = false;
            }
        }
    } catch (error) {
        console.error('Error fetching blog posts:', error);
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
    blogList = document.getElementById('blogList');
    scrollObserver = document.getElementById('scroll-observer');

    // Safety check: ensure blog modal isn't blocking clicks on page load
    const blogModal = document.getElementById('blogModal');
    if (blogModal) {
        blogModal.classList.remove('show');
        blogModal.style.display = 'none';
        blogModal.style.opacity = '0';
        blogModal.style.visibility = 'hidden';
        blogModal.style.pointerEvents = 'none';
        document.body.classList.remove('modal-open');
    }

    if (!blogList) {
        return;
    }

    if (scrollObserver) {
        observer.observe(scrollObserver);
    }

    fetchBlogPosts(1);
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
    // Check if we have it cached
    if (blogPosts[postId] && blogPosts[postId].content) {
        return blogPosts[postId];
    }
    
    // Check if it exists in window.blogPosts (from profile page)
    if (window.blogPosts && window.blogPosts[postId]) {
        blogPosts[postId] = window.blogPosts[postId];
        return window.blogPosts[postId];
    }
    
    try {
        const url = `${BLOG_API_BASE_URL}/blogs/${postId}`;
        
        const response = await fetch(url, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Blog] API request failed:`, {
                status: response.status,
                url: url,
                error: errorText
            });
            throw new Error(`Failed to fetch blog post: ${response.status} - ${errorText}`);
        }
        
        const post = await response.json();
        
        blogPosts[post._id] = post;
        return post;
    } catch (error) {
        console.error('[Blog] Error fetching post:', error);
        console.error('[Blog] Current API base URL:', BLOG_API_BASE_URL);
        return null;
    }
}

// Enhanced modal functionality variables

// Enhanced openBlogModal with loading states and new features
async function openBlogModal(postId) {
    // Prevent duplicate calls
    if (window._blogModalOpening) {
        return;
    }
    
    window._blogModalOpening = true;
    currentPostId = postId;
    
    // Get modal element first and check if it exists
    const modal = document.getElementById('blogModal');
    if (!modal) {
        console.error('Blog modal element not found');
        window._blogModalOpening = false;
        document.body.classList.remove('modal-open');
        return;
    }

    // Show modal and loading state immediately
    showModalWithLoading(modal);
    
    // Fetch the post data
    let post;
    try {
        post = await fetchBlogPost(postId);
    } catch (error) {
        console.error('[Blog] Error fetching post:', error);
        hideModalLoading(modal);
        window._blogModalOpening = false;
        document.body.classList.remove('modal-open');
        return;
    }
    
    if (!post) {
        console.error('No post data returned for ID:', postId);
        hideModalLoading(modal);
        window._blogModalOpening = false;
        document.body.classList.remove('modal-open');
        return;
    }

    // Hide loading and show content
    hideModalLoading(modal);
    populateModalContent(modal, post);
    
    // Setup enhanced features
    setupKeyboardNavigation();
    
    // Initialize comments system
    initializeCommentsSystem(postId);
    
    window._blogModalOpening = false;
}

function showModalWithLoading(modal) {
    // Remove any inline display style
    modal.removeAttribute('style');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    modal.style.zIndex = '10000';
    document.body.classList.add('modal-open');
    
    // Add click-outside-to-close functionality
    setupModalClickOutside(modal);
    
    // Show loading state
    const modalLoading = document.getElementById('modalLoading');
    const modalBody = document.getElementById('modalBody');
    
    if (modalLoading) modalLoading.style.display = 'flex';
    if (modalBody) modalBody.style.display = 'none';
}

function hideModalLoading(modal) {
    const modalLoading = document.getElementById('modalLoading');
    const modalBody = document.getElementById('modalBody');
    
    if (modalLoading) modalLoading.style.display = 'none';
    if (modalBody) modalBody.style.display = 'block';
}

function populateModalContent(modal, post) {
    // Check essential modal elements
    const essentialElements = {
        'modal-title': document.getElementById('modal-title'),
        'modal-content': document.getElementById('modal-content')
    };
    
    const missingEssential = [];
    for (const [id, element] of Object.entries(essentialElements)) {
        if (!element) {
            missingEssential.push(id);
        }
    }
    
    if (missingEssential.length > 0) {
        console.error('Missing essential modal elements:', missingEssential);
        return;
    }

    // Update modal content
    try {
        essentialElements['modal-title'].textContent = post.title;
        essentialElements['modal-content'].innerHTML = post.content;
        
        // Update author info
        updateAuthorInfo(post);
        
        // Show edit button if user is the author
        updateEditButton(post);
        
    } catch (error) {
        console.error('Error updating modal content:', error);
        return;
    }
}

function updateReadingStats(content) {
    const textContent = content.replace(/<[^>]*>/g, ''); // Strip HTML
    const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed
    
    const readingTimeEl = document.getElementById('readingTime');
    const wordCountEl = document.getElementById('wordCount');
    
    if (readingTimeEl) {
        readingTimeEl.textContent = `${readingTime} min read`;
    }
    
    if (wordCountEl) {
        wordCountEl.textContent = `${wordCount} words`;
    }
}

function updateAuthorInfo(post) {
    // Existing author info logic from the original function
    const modalAuthorContainer = document.querySelector('.modal-author-info');
    const fallbackContainer = document.querySelector('.scroll-author');
    
    if (modalAuthorContainer && window.MLNFAvatars) {
        modalAuthorContainer.innerHTML = '';
        const modalAuthorDisplay = window.MLNFAvatars.createUserDisplay({
            username: post.author.username,
            displayName: post.author.displayName || post.author.username,
            title: post.author.title || 'Scroll Author',
            status: `Chronicled on ${new Date(post.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}`,
            avatarSize: 'xl',
            displaySize: 'lg',
            mystical: post.author.isVIP || post.author.role === 'admin',
            online: post.author.online,
            customAvatar: post.author.avatar,
            usernameStyle: 'immortal',
            enableUnifiedNavigation: true,
            showStatus: true,
            compact: false
        });
        
        modalAuthorContainer.appendChild(modalAuthorDisplay);
        
        if (fallbackContainer) {
            fallbackContainer.style.display = 'none';
        }
    } else {
        console.warn('MLNF Avatar System not available, using fallback author display');
        
        if (fallbackContainer) {
            fallbackContainer.style.display = 'flex';
        }
        
        const fallbackElements = {
            'modal-author-avatar': document.getElementById('modal-author-avatar'),
            'modal-author-link': document.getElementById('modal-author-link'),
            'modal-author-name-link': document.getElementById('modal-author-name-link'),
            'modal-date': document.getElementById('modal-date')
        };
        
        const authorAvatar = post.author.avatar || '/assets/images/default.jpg';
        const authorDisplayName = post.author.displayName || post.author.username;
        const authorLink = `/souls/${post.author.username}.html`;
        
        if (fallbackElements['modal-author-avatar']) {
            fallbackElements['modal-author-avatar'].src = authorAvatar;
            fallbackElements['modal-author-avatar'].alt = `${authorDisplayName}'s avatar`;
        }
        if (fallbackElements['modal-author-link']) {
            fallbackElements['modal-author-link'].href = authorLink;
        }
        if (fallbackElements['modal-author-name-link']) {
            fallbackElements['modal-author-name-link'].href = authorLink;
            fallbackElements['modal-author-name-link'].textContent = authorDisplayName;
        }
        if (fallbackElements['modal-date']) {
            fallbackElements['modal-date'].textContent = new Date(post.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        if (modalAuthorContainer) {
            modalAuthorContainer.style.display = 'none';
        }
    }
}

function updateEditButton(post) {
    const editBtn = document.getElementById('editPostBtn');
    const deleteBtn = document.getElementById('deletePostBtn');
    const token = localStorage.getItem('token') || localStorage.getItem('sessionToken');
    
    if (isTokenValid(token)) {
        try {
            const decodedToken = jwt_decode(token);
            const isAuthor = post.author.username === decodedToken.username || post.author._id === decodedToken.id;
            const isAdmin = decodedToken.role === 'admin';
            const canEdit = isAuthor;
            const canDelete = isAuthor || isAdmin;
            
            if (editBtn) {
                editBtn.style.display = canEdit ? 'inline-flex' : 'none';
            }
            if (deleteBtn) {
                deleteBtn.style.display = canDelete ? 'inline-flex' : 'none';
            }
        } catch (error) {
            console.error('[blog.js] Error checking permissions:', error);
            if (editBtn) editBtn.style.display = 'none';
            if (deleteBtn) deleteBtn.style.display = 'none';
        }
    } else {
        if (editBtn) editBtn.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';
    }
}

function setupReadingProgress() {
    const modalBody = document.getElementById('modalBody');
    const progressFill = document.querySelector('.progress-fill');
    
    if (!modalBody || !progressFill) return;
    
    modalBody.addEventListener('scroll', () => {
        const scrollTop = modalBody.scrollTop;
        const scrollHeight = modalBody.scrollHeight - modalBody.clientHeight;
        const progress = (scrollTop / scrollHeight) * 100;
        
        progressFill.style.width = `${Math.min(progress, 100)}%`;
        progressFill.parentElement.setAttribute('aria-valuenow', Math.round(progress));
    });
}

function setupKeyboardNavigation() {
    document.addEventListener('keydown', handleModalKeyboard);
}

function handleModalKeyboard(e) {
    const modal = document.getElementById('blogModal');
    if (!modal || !modal.classList.contains('show')) return;
    
    switch(e.key) {
        case 'Escape':
            e.preventDefault();
            closeBlogModal();
            break;
    }
}

function initializeCommentsSystem(postId) {
    // Initialize comments system
    setTimeout(() => {
        if (window.MLNF && window.MLNF.CommentsSystem) {
            try {
                if (commentsSystem) {
                    commentsSystem = null;
                }
                commentsSystem = new window.MLNF.CommentsSystem('blog', postId, 'blogComments');
            } catch (error) {
                console.error('Error initializing comments:', error);
            }
        }
    }, 100);
}

// New enhanced features
function copyPostLink() {
    const postUrl = `${window.location.origin}/pages/blog.html?id=${currentPostId}`;
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(postUrl).then(() => {
            showNotification('✨ Link copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopyText(postUrl);
        });
    } else {
        fallbackCopyText(postUrl);
    }
}

function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('✨ Link copied to clipboard!', 'success');
    } catch (err) {
        showNotification('📋 Copy failed. Link: ' + text, 'error');
    }
    
    document.body.removeChild(textArea);
}

function toggleTextSize(direction) {
    const modalBody = document.getElementById('modalBody');
    if (!modalBody) return;
    
    if (direction === 'larger' || (direction === undefined && currentTextSize === 'normal')) {
        modalBody.classList.add('large-text');
        currentTextSize = 'large';
        showNotification('📖 Text size increased', 'info');
    } else {
        modalBody.classList.remove('large-text');
        currentTextSize = 'normal';
        showNotification('📖 Text size reset', 'info');
    }
}

function bookmarkPost() {
    if (!currentPostId) return;
    
    const isBookmarked = bookmarkedPosts.includes(currentPostId);
    const bookmarkBtn = document.querySelector('.bookmark-btn');
    
    if (isBookmarked) {
        bookmarkedPosts = bookmarkedPosts.filter(id => id !== currentPostId);
        if (bookmarkBtn) {
            bookmarkBtn.classList.remove('bookmarked');
            bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i>';
        }
        showNotification('🔖 Bookmark removed', 'info');
    } else {
        bookmarkedPosts.push(currentPostId);
        if (bookmarkBtn) {
            bookmarkBtn.classList.add('bookmarked');
            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
        }
        showNotification('🔖 Post bookmarked!', 'success');
    }
    
    localStorage.setItem('bookmarkedPosts', JSON.stringify(bookmarkedPosts));
}

function updateBookmarkState(postId) {
    const bookmarkBtn = document.querySelector('.bookmark-btn');
    if (!bookmarkBtn) return;
    
    const isBookmarked = bookmarkedPosts.includes(postId);
    if (isBookmarked) {
        bookmarkBtn.classList.add('bookmarked');
        bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
    } else {
        bookmarkBtn.classList.remove('bookmarked');
        bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i>';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `modal-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 
                     type === 'error' ? 'rgba(244, 67, 54, 0.9)' : 'rgba(255, 94, 120, 0.9)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        z-index: 10002;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Enhanced closeBlogModal
function closeBlogModal() {
    const modal = document.getElementById('blogModal');
    if (modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }
    
    // Clean up event listeners
    document.removeEventListener('keydown', handleModalKeyboard);
    cleanupModalClickOutside();
    
    // Clean up comments system
    if (commentsSystem) {
        commentsSystem = null;
    }
    
    // Reset the opening flag
    window._blogModalOpening = false;
}

// Click-outside-to-close functionality
let modalClickOutsideHandler = null;

function setupModalClickOutside(modal) {
    // Remove any existing handler first
    cleanupModalClickOutside();
    
    // Create new handler
    modalClickOutsideHandler = function(event) {
        // Only close if clicking directly on the modal background (not on modal content)
        if (event.target === modal) {
            closeBlogModal();
        }
    };
    
    // Add the click listener to the modal
    modal.addEventListener('click', modalClickOutsideHandler);
}

function cleanupModalClickOutside() {
    if (modalClickOutsideHandler) {
        const modal = document.getElementById('blogModal');
        if (modal) {
            modal.removeEventListener('click', modalClickOutsideHandler);
        }
        modalClickOutsideHandler = null;
    }
}

// Share current post  
function shareCurrentPost() {
    if (currentPostId) {
        sharePost(currentPostId);
    }
}

// Share post by ID - Clean URL only
function sharePost(postId) {
    const post = blogPosts[postId];
    if (!post) {
        console.error('Post not found for sharing:', postId);
        return;
    }
    
    const shareUrl = `${window.location.origin}${window.location.pathname}#scroll-${postId}`;
    
    // Copy clean URL to clipboard without metadata
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Link copied');
        }).catch(() => {
            prompt('Copy link:', shareUrl);
        });
    } else {
        // Fallback: show the clean link for manual copy
        prompt('Copy link:', shareUrl);
    }
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

    // Create edit form with rich text editor
    modalTitle.innerHTML = `
        <input type="text" id="edit-title" value="${post.title}" 
               style="width: 100%; background: linear-gradient(135deg, rgba(26, 26, 51, 0.95), rgba(42, 64, 102, 0.9)); 
                      border: 2px solid rgba(255, 94, 120, 0.4); border-radius: 12px; 
                      padding: 1rem; font-family: 'Cinzel', serif; 
                      font-size: clamp(1.2rem, 3vw, 1.8rem); font-weight: 700; 
                      color: var(--text); text-align: center; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);">
    `;

    modalContent.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <div id="edit-content-container"></div>
        </div>
        <div style="display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap;">
            <button id="save-edit-btn"
                    style="background: linear-gradient(135deg, rgba(255, 94, 120, 0.9), rgba(255, 202, 40, 0.8)); 
                           color: var(--primary); border: 2px solid rgba(255, 94, 120, 0.4); 
                           padding: 0.9rem 2rem; border-radius: 30px; cursor: pointer; 
                           font-weight: 700; font-family: 'Cinzel', serif; font-size: 1rem;
                           min-height: 50px; transition: var(--transition-smooth);
                           text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                           box-shadow: 0 6px 20px rgba(255, 94, 120, 0.4), 0 3px 10px rgba(0, 0, 0, 0.3);">
                ✅ Save Changes
            </button>
            <button id="cancel-edit-btn"
                    style="background: linear-gradient(135deg, rgba(26, 26, 51, 0.9), rgba(42, 64, 102, 0.8)); 
                           color: var(--accent); border: 2px solid var(--accent); 
                           padding: 0.75rem 1.75rem; border-radius: 30px; cursor: pointer; 
                           font-weight: 600; font-family: 'Cinzel', serif; font-size: 0.95rem;
                           min-height: 46px; transition: var(--transition-smooth);
                           text-shadow: 0 0 8px rgba(255, 94, 120, 0.3);
                           box-shadow: 0 4px 16px rgba(255, 94, 120, 0.2), 0 2px 8px rgba(0, 0, 0, 0.3);">
                ❌ Cancel
            </button>
        </div>
    `;

    // Initialize rich text editor with post content
    window.currentEditEditor = new MLNFRichTextEditor('edit-content-container', {
        placeholder: 'Edit your eternal thoughts...',
        theme: 'snow'
    });
    
    // Set the content after editor is initialized
    setTimeout(() => {
        if (window.currentEditEditor) {
            window.currentEditEditor.setContent(post.content);
            window.currentEditEditor.focus();
        }
    }, 100);

    // Add event listeners for buttons (replacing inline onclick)
    document.getElementById('save-edit-btn').addEventListener('click', () => savePostEdit(postId));
    document.getElementById('cancel-edit-btn').addEventListener('click', () => {
        cancelPostEdit(postId, originalTitle, originalContent);
    });
}

// Save post edit
async function savePostEdit(postId) {
    const token = localStorage.getItem('sessionToken');
    const titleInput = document.getElementById('edit-title');
    
    if (!titleInput || !window.currentEditEditor) {
        console.error('[blog.js] Edit form elements not found');
        return;
    }
    
    const newTitle = titleInput.value.trim();
    const newContent = window.currentEditEditor.getContent().trim();
    const textContent = window.currentEditEditor.getText().trim();
    
    if (!newTitle || !textContent) {
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
        
        // Clean up rich text editor
        if (window.currentEditEditor) {
            window.currentEditEditor.destroy();
            window.currentEditEditor = null;
        }
        
        alert('Scroll updated successfully!');
        
    } catch (error) {
        console.error('[blog.js] Error updating post:', error);
        alert(`Failed to update scroll: ${error.message}`);
    }
}

// Cancel post edit
function cancelPostEdit(postId, originalTitle, originalContent) {
    // Clean up rich text editor
    if (window.currentEditEditor) {
        window.currentEditEditor.destroy();
        window.currentEditEditor = null;
    }
    
    // Restore original content
    document.getElementById('modal-title').textContent = originalTitle;
    document.getElementById('modal-content').innerHTML = originalContent;
}


// Enhanced modal functionality - remove duplicate declarations

// Duplicate functions removed - kept the enhanced versions above

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

// Export new enhanced functions
window.copyPostLink = copyPostLink;

// ALWAYS check for auto-open regardless of page type - multiple triggers to ensure it runs
// Immediate check
setTimeout(checkAutoOpen, 100);

// DOM ready check
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAutoOpen);
} else {
    checkAutoOpen();
}

// Backup check after window load
window.addEventListener('load', checkAutoOpen);

// Auto-initialization disabled for pages like profile where blog is not the main feature

if (!window.location.pathname.includes('/souls/') && !window.location.pathname.includes('/profile/')) {
    // Initialize blog functionality when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initBlog();
        });
    } else {
        initBlog();
    }
} else {
}

// Separate function to handle auto-opening from highlights
function checkAutoOpen() {
    // Check for URL parameter first (from profile links)
    const urlParams = new URLSearchParams(window.location.search);
    const urlPostId = urlParams.get('id');
    
    // Check for sessionStorage (from internal navigation)
    const sessionPostId = sessionStorage.getItem('openScrollId');
    
    // Use URL parameter if present, otherwise use session storage
    const autoOpenScrollId = urlPostId || sessionPostId;
    
    if (autoOpenScrollId) {
        // Clear session storage if we used it
        if (sessionPostId) {
            sessionStorage.removeItem('openScrollId');
        }
        
        
        // Wait for all systems to be ready
        const attemptAutoOpen = (attempts = 0) => {
            if (!window.MLNFAvatars) {
                if (attempts < 20) {
                    setTimeout(() => attemptAutoOpen(attempts + 1), 500);
                }
                return;
            }
            
            // Check if modal exists
            const modal = document.getElementById('blogModal');
            if (!modal) {
                if (attempts < 20) {
                    setTimeout(() => attemptAutoOpen(attempts + 1), 500);
                }
                return;
            }
            
            try {
                openBlogModal(autoOpenScrollId);
                
                // Clean up URL if we used URL parameter
                if (urlPostId) {
                    // Remove the ?id= parameter from URL without page reload
                    const newUrl = window.location.pathname;
                    window.history.replaceState({}, document.title, newUrl);
                }
            } catch (error) {
                console.error('Error opening modal:', error);
            }
            
            // Also try fetching the post if it's not cached
            if (!blogPosts[autoOpenScrollId]) {
                fetchBlogPost(autoOpenScrollId).then(post => {
                    if (post) {
                        openBlogModal(autoOpenScrollId);
                    }
                });
            }
        };
        
        setTimeout(() => attemptAutoOpen(), 2000);
    }
}


// Delete functionality
async function deletePost(postId) {
    const token = localStorage.getItem('token') || localStorage.getItem('sessionToken');
    if (!token) {
        alert('You must be logged in to delete posts.');
        return false;
    }

    try {
        const response = await fetch(`${BLOG_API_BASE_URL}/blogs/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to delete post: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete scroll: ' + error.message);
        return false;
    }
}

function confirmDeletePost(postId) {
    const post = blogPosts[postId];
    if (!post) {
        alert('Post not found.');
        return;
    }

    const confirmMessage = `Are you sure you want to permanently delete the scroll "${post.title}"?\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
        deletePost(postId).then(success => {
            if (success) {
                // Remove from UI
                const postElement = document.getElementById(postId);
                if (postElement) {
                    postElement.remove();
                }
                
                // Remove from cache
                delete blogPosts[postId];
                
                // Show success message
                alert('Scroll has been permanently deleted.');
                
                // Close modal if it's open
                if (currentPostId === postId) {
                    closeBlogModal();
                }
            }
        });
    }
}

function confirmDeleteCurrentPost() {
    if (currentPostId) {
        confirmDeletePost(currentPostId);
    }
}

// Export new functions to global scope
window.copyPostLink = copyPostLink;
window.deletePost = deletePost;
window.confirmDeletePost = confirmDeletePost;
window.confirmDeleteCurrentPost = confirmDeleteCurrentPost;

