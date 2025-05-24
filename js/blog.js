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

const API_BASE_URL = MLNF_CONFIG.API_BASE_URL;
// const activeUsers = document.getElementById('activeUsers'); // Handled by activeUsers.js
// const showUsersBtn = document.getElementById('showUsersBtn'); // Handled by activeUsers.js
// const closeUsersBtn = document.getElementById('closeUsers'); // Handled by activeUsers.js
const blogList = document.getElementById('blogList');
// let onlineUsersInterval; // Handled by activeUsers.js if it implements polling, or not needed if using WebSockets

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

// Fetch blog posts
async function fetchBlogPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/blogs`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch blog posts`);
        }
        const posts = await response.json();
        blogList.innerHTML = posts.length === 0 ? '<div class="blog-post"><p>No blog posts yet.</p></div>' : '';
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'blog-post';
            postElement.id = post._id;
            // Ensure DOMPurify is available or handle sanitization appropriately
            postElement.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize : (html) => html)(`
                <h3>${post.title}</h3>
                <div class="content">${post.content}</div>
                <p class="author">— ${post.author.displayName || post.author.username}</p>
                <p class="date">${new Date(post.createdAt).toLocaleDateString()}</p>
            `);
            blogList.appendChild(postElement);
        });
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        blogList.innerHTML = `<div class="blog-post"><p>Error loading blog posts: ${error.message}</p></div>`;
    }
}

// Create blog post
async function createBlog() {
    const titleInput = document.getElementById('blogTitle');
    const contentInput = document.getElementById('blogContent');
    const errorElement = document.getElementById('blogFormError');
    const token = localStorage.getItem('sessionToken');

    errorElement.style.display = 'none';
    if (!isTokenValid(token)) {
        errorElement.textContent = 'Please log in to share a scroll';
        errorElement.style.display = 'block';
        if (window.MLNF && window.MLNF.openSoulModal) {
            window.MLNF.openSoulModal('login');
        }
        return;
    }

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    if (!title || !content) {
        errorElement.textContent = 'Title and content are required';
        errorElement.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/blogs`, {
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
        titleInput.value = '';
        contentInput.value = '';
        fetchBlogPosts(); // Refresh blog list
    } catch (error) {
        console.error('Error creating blog:', error);
        errorElement.textContent = `Failed to post scroll: ${error.message}`;
        errorElement.style.display = 'block';
    }
}

// Removed fetchOnlineUsers function as activeUsers.js should handle the shared sidebar.

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('sessionToken');
    const blogForm = document.getElementById('blogForm');

    if (blogForm && isTokenValid(token)) {
        blogForm.style.display = 'block';
    }
    
    const createBlogButton = document.querySelector('.blog-form button');
    if (createBlogButton) {
        createBlogButton.onclick = createBlog; 
    }

    fetchBlogPosts();
    
    // Initialization for active users sidebar is handled by activeUsers.js and mlnf-core.js
}); 