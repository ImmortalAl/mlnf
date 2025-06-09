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

const BLOG_API_BASE_URL = MLNF_CONFIG.API_BASE_URL;
console.log('[blog.js] BLOG_API_BASE_URL:', BLOG_API_BASE_URL);

// const activeUsers = document.getElementById('activeUsers'); // Handled by activeUsers.js
// const showUsersBtn = document.getElementById('showUsersBtn'); // Handled by activeUsers.js
// const closeUsersBtn = document.getElementById('closeUsers'); // Handled by activeUsers.js
const blogList = document.getElementById('blogList');
const scrollObserver = document.getElementById('scroll-observer');

console.log('[blog.js] Elements found - blogList:', !!blogList, 'scrollObserver:', !!scrollObserver);

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
            blogList.innerHTML = '<div class="blog-post"><p>No scrolls have been written yet. The chamber awaits the first whisper...</p></div>';
            hasMore = false;
        } else {
            console.log('[blog.js] Processing', posts.length, 'posts');
            posts.forEach(post => {
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
                
                postElement.innerHTML = `
                    <div class="scroll-author">
                        <a href="/profile/${post.author._id}" class="author-avatar">
                            <img src="${authorAvatar}" alt="${authorDisplayName}'s avatar" onerror="this.src='/assets/images/default.jpg'">
                        </a>
                        <a href="/profile/${post.author._id}" class="author-name">${authorDisplayName}</a>
                    </div>
                    <h3>${post.title}</h3>
                    <div class="content">${excerpt}</div>
                    <div class="scroll-footer">
                        <p class="date">${formattedDate}</p>
                        <button class="whisper-link" onclick="event.stopPropagation(); sharePost('${post._id}')">
                            🦉 Whisper this scroll to another soul
                        </button>
                    </div>
                `;
                
                // Store full post data
                blogPosts[post._id] = post;
                
                // Make post clickable
                postElement.onclick = () => openBlogModal(post._id);
                
                blogList.appendChild(postElement);
                console.log('[blog.js] Post added to DOM:', post._id);
            });
            
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
                <div class="blog-post">
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

if (scrollObserver) {
    observer.observe(scrollObserver);
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
    try {
        const response = await fetch(`${BLOG_API_BASE_URL}/blogs/${postId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch blog post: ${response.status}`);
        }
        
        const post = await response.json();
        blogPosts[post._id] = post;
        return post;
    } catch (error) {
        console.error('Error fetching blog post:', error);
        return null;
    }
}

// Open blog modal
function openBlogModal(postId) {
    console.log('[blog.js] Opening modal for post:', postId);
    currentPostId = postId;
    const modal = document.getElementById('blogModal');
    const post = blogPosts[postId];
    
    if (!post) {
        console.error('[blog.js] Blog post not found:', postId);
        return;
    }
    
    // Update modal content
    document.getElementById('modal-title').textContent = post.title;
    document.getElementById('modal-content').innerHTML = post.content;
    
    // Update author info
    const authorAvatar = post.author.avatar || '/assets/images/default.jpg';
    const authorDisplayName = post.author.displayName || post.author.username;
    const authorLink = `/souls/${post.author.username}`;
    
    document.getElementById('modal-author-avatar').src = authorAvatar;
    document.getElementById('modal-author-avatar').alt = `${authorDisplayName}'s avatar`;
    document.getElementById('modal-author-link').href = authorLink;
    document.getElementById('modal-author-name-link').href = authorLink;
    document.getElementById('modal-author-name-link').textContent = authorDisplayName;
    
    // Update date
    document.getElementById('modal-date').textContent = new Date(post.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Initialize comments system
    if (commentsSystem) {
        commentsSystem = null;
    }
    commentsSystem = new MLNF.CommentsSystem('blog', postId, 'blogComments');
}

// Close blog modal
function closeBlogModal() {
    console.log('[blog.js] Closing modal');
    const modal = document.getElementById('blogModal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    
    // Clean up comments system
    if (commentsSystem) {
        commentsSystem = null;
    }
}

// Share current post
function shareCurrentPost() {
    if (!currentPostId) return;
    const post = blogPosts[currentPostId];
    if (!post) return;
    
    const shareUrl = `${window.location.origin}/souls/${post.author.username}#blog-${currentPostId}`;
    window.MLNF.MessageModal.open(shareUrl);
}

// Share post by ID
function sharePost(postId) {
    const post = blogPosts[postId];
    if (!post) return;
    
    const shareUrl = `${window.location.origin}/souls/${post.author.username}#blog-${postId}`;
    window.MLNF.MessageModal.open(shareUrl);
}

// Make functions globally available
window.openBlogModal = openBlogModal;
window.closeBlogModal = closeBlogModal;
window.shareCurrentPost = shareCurrentPost;
window.sharePost = sharePost;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('[blog.js] Page loaded, initializing...');
    
    // Check if this should auto-initialize (only run on actual blog pages)
    if (window.DISABLE_BLOG_AUTO_INIT) {
        console.log('[blog.js] Auto-init disabled for this page');
        return;
    }
    
    // Only initialize if blogList exists (on actual blog pages)
    if (blogList) {
        fetchBlogPosts(1);
    } else {
        console.log('[blog.js] blogList not found, skipping auto-init');
    }
}); 