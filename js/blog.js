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
                        <button class="whisper-link" onclick="event.stopPropagation(); openOwlModal('${window.location.origin}/pages/blog.html#${post._id}')">
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

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('[blog.js] DOMContentLoaded event fired');
    
    const token = localStorage.getItem('sessionToken');
    const blogForm = document.getElementById('blogForm');
    
    console.log('[blog.js] Session token:', token ? 'exists' : 'not found');
    console.log('[blog.js] Blog form element:', !!blogForm);

    if (blogForm && isTokenValid(token)) {
        blogForm.style.display = 'block';
        console.log('[blog.js] Blog form displayed');
    }
    
    const createBlogButton = document.querySelector('.blog-form button');
    if (createBlogButton) {
        createBlogButton.onclick = createBlog; 
        console.log('[blog.js] Create blog button event attached');
    }

    // Initialize blog list
    currentPage = 1;
    isLoading = false;
    hasMore = true;
    
    console.log('[blog.js] Reinitializing blogList element...');
    const blogListElement = document.getElementById('blogList');
    console.log('[blog.js] blogList element found:', !!blogListElement);
    
    if (blogListElement) {
        blogListElement.innerHTML = '';
        console.log('[blog.js] Starting to fetch blog posts...');
        fetchBlogPosts(currentPage);
    } else {
        console.error('[blog.js] ERROR: blogList element not found!');
    }
    
    // Check for blog ID in URL hash
    if (window.location.hash) {
        const blogId = window.location.hash.substring(1);
        console.log('[blog.js] Found blog ID in hash:', blogId);
        // Wait for blogs to load then open modal
        setTimeout(async () => {
            if (blogPosts[blogId]) {
                openBlogModal(blogId);
            } else {
                // Try to fetch the specific blog post
                const post = await fetchBlogPost(blogId);
                if (post) {
                    openBlogModal(blogId);
                }
            }
        }, 2000);
    }
    
    // Listen for hash changes
    window.addEventListener('hashchange', async () => {
        if (window.location.hash) {
            const blogId = window.location.hash.substring(1);
            if (blogPosts[blogId]) {
                openBlogModal(blogId);
            } else {
                // Try to fetch the specific blog post
                const post = await fetchBlogPost(blogId);
                if (post) {
                    openBlogModal(blogId);
                }
            }
        } else {
            closeBlogModal();
        }
    });
    
    // Initialization for active users sidebar is handled by activeUsers.js and mlnf-core.js
    console.log('[blog.js] DOMContentLoaded initialization complete');
}); 

// Modal functions
function openBlogModal(postId) {
    const post = blogPosts[postId];
    if (!post) return;
    
    currentPostId = postId;
    
    // Populate modal with post data
    document.getElementById('modal-author-avatar').src = post.author.avatar || '/assets/images/default.jpg';
    document.getElementById('modal-author-avatar').alt = `${post.author.displayName || post.author.username}'s avatar`;
    document.getElementById('modal-author-link').href = `/profile/${post.author._id}`;
    document.getElementById('modal-author-name-link').href = `/profile/${post.author._id}`;
    document.getElementById('modal-author-name-link').textContent = post.author.displayName || post.author.username;
    document.getElementById('modal-date').textContent = new Date(post.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('modal-title').textContent = post.title;
    document.getElementById('modal-content').innerHTML = DOMPurify.sanitize(post.content);
    
    // Show modal
    const modal = document.getElementById('blog-modal');
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeBlogModal() {
    const modal = document.getElementById('blog-modal');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentPostId = null;
}

function shareCurrentPost() {
    if (currentPostId) {
        openOwlModal(`${window.location.origin}/pages/blog.html#${currentPostId}`);
    }
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeBlogModal();
        closeOwlModal();
    }
});

// Close modal on background click
document.addEventListener('click', (e) => {
    const blogModal = document.getElementById('blog-modal');
    const sharingModal = document.getElementById('sharing-modal');
    if (e.target === blogModal) {
        closeBlogModal();
    }
    if (e.target === sharingModal) {
        closeOwlModal();
    }
}); 