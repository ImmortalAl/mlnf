// Configuration
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://much-love-no-fear.onrender.com/api';

// State Management
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let socket = null;
let currentVideo = null;
let breadcrumbs = JSON.parse(sessionStorage.getItem('breadcrumbs') || '[]');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

async function initializeApp() {
  // Check authentication
  if (authToken) {
    await loadCurrentUser();
  }

  // Initialize Socket.io if authenticated
  if (currentUser) {
    initializeSocket();
  }

  // Load initial content
  if (window.location.pathname.includes('archive.html')) {
    initializeArchivePage();
  } else {
    initializeHomePage();
  }

  // Setup event listeners
  setupEventListeners();

  // Load theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }
}

// Authentication Functions
async function loadCurrentUser() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      updateUIForAuthenticatedUser();
    } else {
      logout();
    }
  } catch (error) {
    console.error('Failed to load user:', error);
  }
}

function updateUIForAuthenticatedUser() {
  document.getElementById('authButtons').style.display = 'none';
  document.getElementById('userMenu').style.display = 'flex';

  if (currentUser) {
    document.querySelector('.runegold-amount').textContent = currentUser.runegold.balance;
    document.querySelector('.avatar-img').src = currentUser.avatar || 'assets/default-avatar.png';
  }
}

async function login(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: formData.get('username'),
        password: formData.get('password')
      })
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      currentUser = data.user;
      updateUIForAuthenticatedUser();
      initializeSocket();
      closeModal('loginModal');
      showNotification('Login successful!', 'success');
    } else {
      showNotification(data.error || 'Login failed', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showNotification('Login failed', 'error');
  }
}

async function register(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        secretQuestion: formData.get('secretQuestion'),
        secretAnswer: formData.get('secretAnswer')
      })
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      currentUser = data.user;
      updateUIForAuthenticatedUser();
      initializeSocket();
      closeModal('registerModal');
      showNotification('Registration successful!', 'success');
    } else {
      showNotification(data.error || 'Registration failed', 'error');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showNotification('Registration failed', 'error');
  }
}

function logout() {
  localStorage.removeItem('authToken');
  authToken = null;
  currentUser = null;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  document.getElementById('authButtons').style.display = 'flex';
  document.getElementById('userMenu').style.display = 'none';

  showNotification('Logged out successfully', 'info');
}

// Socket.io Functions
function initializeSocket() {
  if (!authToken) return;

  socket = io(API_BASE_URL.replace('/api', ''), {
    auth: { token: authToken }
  });

  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('onlineUsers', (users) => {
    updateOnlineUsersList(users);
  });

  socket.on('newMessage', (data) => {
    handleNewMessage(data);
  });

  socket.on('videoUpdated', (data) => {
    handleVideoUpdate(data);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });
}

function updateOnlineUsersList(users) {
  const container = document.getElementById('onlineUsersList');
  if (!container) return;

  container.innerHTML = users.map(user => `
    <div class="online-user" onclick="openMessageModal('${user._id}', '${user.username}')">
      <img src="${user.avatar || 'assets/default-avatar.png'}" alt="${user.username}" class="online-avatar">
      <div class="online-user-info">
        <div class="online-username">${user.username}</div>
        <div class="online-runegold">⚡ ${user.runegold.balance}</div>
      </div>
    </div>
  `).join('');
}

// Video Functions
async function loadVideos(sort = 'recent', category = '') {
  try {
    const params = new URLSearchParams({ sort, category, limit: 20 });
    const response = await fetch(`${API_BASE_URL}/videos?${params}`);

    if (response.ok) {
      const data = await response.json();
      displayVideos(data.videos);
    }
  } catch (error) {
    console.error('Failed to load videos:', error);
  }
}

function displayVideos(videos) {
  const container = document.getElementById('videoGrid');
  if (!container) return;

  container.innerHTML = videos.map(video => `
    <div class="video-card" onclick="playVideo('${video._id}')">
      <img src="${video.thumbnail || 'assets/default-thumbnail.jpg'}" alt="${video.title}" class="video-thumbnail">
      <div class="video-card-content">
        <h3 class="video-card-title">${video.title}</h3>
        <div class="video-card-meta">
          <span>${video.author.username}</span>
          <span>${video.views} views</span>
        </div>
      </div>
    </div>
  `).join('');
}

async function playVideo(videoId) {
  // Add to breadcrumbs
  addBreadcrumb(videoId);

  try {
    const response = await fetch(`${API_BASE_URL}/videos/${videoId}`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });

    if (response.ok) {
      const data = await response.json();
      currentVideo = data.video;

      // Update player section
      const playerSection = document.getElementById('playerSection');
      if (playerSection) {
        playerSection.style.display = 'block';
        const player = document.getElementById('videoPlayer');
        player.src = `${API_BASE_URL}/videos/${videoId}/stream`;

        document.getElementById('currentVideoTitle').textContent = currentVideo.title;
        document.getElementById('videoAuthor').textContent = currentVideo.author.username;
        document.getElementById('videoViews').textContent = `${currentVideo.views} views`;
        document.getElementById('videoDescription').textContent = currentVideo.description;
        document.getElementById('upvoteCount').textContent = currentVideo.upvoteCount;
        document.getElementById('downvoteCount').textContent = currentVideo.downvoteCount;

        loadComments(videoId);
      }

      // Join video room for real-time updates
      if (socket) {
        socket.emit('joinVideoRoom', videoId);
      }
    }
  } catch (error) {
    console.error('Failed to play video:', error);
  }
}

async function voteVideo(voteType) {
  if (!currentUser || !currentVideo) {
    showNotification('Please login to vote', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/videos/${currentVideo._id}/vote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ voteType })
    });

    if (response.ok) {
      const data = await response.json();
      document.getElementById('upvoteCount').textContent = data.upvotes;
      document.getElementById('downvoteCount').textContent = data.downvotes;
    }
  } catch (error) {
    console.error('Vote error:', error);
  }
}

async function boostVideo() {
  if (!currentUser || !currentVideo) {
    showNotification('Please login to boost', 'error');
    return;
  }

  if (currentUser.runegold.balance < 50) {
    showNotification('Insufficient Runegold', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/videos/${currentVideo._id}/boost`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      currentUser.runegold.balance = data.runegoldBalance;
      document.querySelector('.runegold-amount').textContent = data.runegoldBalance;
      showNotification('Video boosted successfully!', 'success');
    }
  } catch (error) {
    console.error('Boost error:', error);
  }
}

// Upload Functions
function initializeUploadArea() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');

  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('active');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('active');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('active');
      handleFileSelect(e.dataTransfer.files[0]);
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      handleFileSelect(e.target.files[0]);
    });
  }
}

function handleFileSelect(file) {
  if (!file || !file.type.startsWith('video/')) {
    showNotification('Please select a valid video file', 'error');
    return;
  }

  document.getElementById('uploadArea').querySelector('.upload-dropzone').style.display = 'none';
  document.getElementById('uploadForm').style.display = 'block';
}

async function uploadVideo() {
  const formData = new FormData();
  formData.append('video', document.getElementById('fileInput').files[0]);
  formData.append('title', document.getElementById('videoTitle').value);
  formData.append('description', document.getElementById('videoDescription').value);
  formData.append('tags', document.getElementById('videoTags').value);
  formData.append('category', document.getElementById('videoCategory').value);
  formData.append('isExclusive', document.getElementById('isExclusive').checked);

  try {
    const response = await fetch(`${API_BASE_URL}/videos/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    if (response.ok) {
      showNotification('Video uploaded successfully!', 'success');
      cancelUpload();
      loadVideos();
    } else {
      showNotification('Upload failed', 'error');
    }
  } catch (error) {
    console.error('Upload error:', error);
    showNotification('Upload failed', 'error');
  }
}

// Comment Functions
async function loadComments(videoId) {
  // This would load comments from the video object or make a separate API call
  const container = document.getElementById('commentsList');
  if (!container || !currentVideo) return;

  container.innerHTML = currentVideo.comments.map(comment => `
    <div class="comment ${comment.highlight?.isActive ? 'highlighted' : ''}">
      <div class="comment-header">
        <span class="comment-author">${comment.author.username}</span>
        ${comment.timestamp ? `<span class="comment-timestamp" onclick="seekTo(${comment.timestamp})">${formatTimestamp(comment.timestamp)}</span>` : ''}
      </div>
      <div class="comment-content">${comment.content}</div>
      <div class="comment-actions">
        <button onclick="highlightComment('${comment._id}')">⚡ Highlight (20)</button>
      </div>
    </div>
  `).join('');
}

async function postComment() {
  if (!currentUser || !currentVideo) {
    showNotification('Please login to comment', 'error');
    return;
  }

  const content = document.getElementById('commentInput').value;
  if (!content.trim()) return;

  try {
    const response = await fetch(`${API_BASE_URL}/comments/video/${currentVideo._id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content,
        timestamp: Math.floor(document.getElementById('videoPlayer').currentTime)
      })
    });

    if (response.ok) {
      document.getElementById('commentInput').value = '';
      loadComments(currentVideo._id);
    }
  } catch (error) {
    console.error('Comment error:', error);
  }
}

// Breadcrumb Functions
function addBreadcrumb(videoId) {
  breadcrumbs = breadcrumbs.filter(b => b.id !== videoId);
  breadcrumbs.push({ id: videoId, timestamp: Date.now() });

  if (breadcrumbs.length > 5) {
    breadcrumbs = breadcrumbs.slice(-5);
  }

  sessionStorage.setItem('breadcrumbs', JSON.stringify(breadcrumbs));
  updateBreadcrumbDisplay();
}

function updateBreadcrumbDisplay() {
  const container = document.getElementById('breadcrumbChain');
  if (!container) return;

  container.innerHTML = breadcrumbs.map(b => `
    <div class="breadcrumb-item" onclick="playVideo('${b.id}')">
      <img src="assets/default-thumbnail.jpg" alt="Video">
    </div>
  `).join('');
}

function clearBreadcrumbs() {
  breadcrumbs = [];
  sessionStorage.removeItem('breadcrumbs');
  updateBreadcrumbDisplay();
}

// Utility Functions
function showModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function showLoginModal() { showModal('loginModal'); }
function showRegisterModal() { showModal('registerModal'); }

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    border-radius: 8px;
    z-index: 3000;
    animation: slideIn 0.3s;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}

function formatTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function seekTo(seconds) {
  const player = document.getElementById('videoPlayer');
  if (player) {
    player.currentTime = seconds;
    player.play();
  }
}

function triggerFileInput() {
  document.getElementById('fileInput').click();
}

function cancelUpload() {
  document.getElementById('uploadForm').style.display = 'none';
  document.querySelector('.upload-dropzone').style.display = 'block';
  document.getElementById('fileInput').value = '';
}

function changePlaybackSpeed() {
  const player = document.getElementById('videoPlayer');
  const speed = document.getElementById('playbackSpeed').value;
  if (player) {
    player.playbackRate = parseFloat(speed);
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Form submissions
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', login);

  const registerForm = document.getElementById('registerForm');
  if (registerForm) registerForm.addEventListener('submit', register);

  // Sort and filter
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.addEventListener('change', (e) => loadVideos(e.target.value));

  const categorySelect = document.getElementById('categorySelect');
  if (categorySelect) categorySelect.addEventListener('change', (e) => loadVideos('recent', e.target.value));

  // Initialize upload if on archive page
  if (window.location.pathname.includes('archive.html')) {
    initializeUploadArea();
  }
}

// Page Initialization
function initializeHomePage() {
  loadVideos();
  updateBreadcrumbDisplay();
}

function initializeArchivePage() {
  loadVideos();
  initializeUploadArea();
  updateBreadcrumbDisplay();
}