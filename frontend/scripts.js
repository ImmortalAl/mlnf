// Much Love, No Fear - Main JavaScript

// API Configuration
const API_BASE_URL = 'https://much-love-no-fear.onrender.com/api';
const SOCKET_URL = 'https://much-love-no-fear.onrender.com';

// Global State
let currentUser = null;
let socket = null;
let breadcrumbs = [];
let notifications = [];

// DOM Elements Cache
const elements = {
  body: document.body,
  navbar: null,
  sidebar: null,
  notificationBell: null,
  notificationDropdown: null,
  runegoldDisplay: null,
  breadcrumbsContainer: null,
  themeToggle: null
};

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', init);

function init() {
  // Cache DOM elements
  cacheElements();
  
  // Load user session
  loadUserSession();
  
  // Initialize Socket.io
  initializeSocket();
  
  // Setup event listeners
  setupEventListeners();
  
  // Load breadcrumbs from session
  loadBreadcrumbs();
  
  // Check theme preference
  loadThemePreference();
  
  // Initialize page-specific functionality
  initializePageSpecific();
}

// Cache DOM Elements
function cacheElements() {
  elements.navbar = document.querySelector('.navbar');
  elements.sidebar = document.querySelector('.sidebar');
  elements.notificationBell = document.querySelector('.notification-bell');
  elements.notificationDropdown = document.querySelector('.notification-dropdown');
  elements.runegoldDisplay = document.querySelector('.runegold-display');
  elements.breadcrumbsContainer = document.querySelector('.breadcrumbs');
  elements.themeToggle = document.querySelector('.theme-toggle');
}

// API Helper Functions
async function authFetch(url, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...defaultOptions,
    ...options
  });
  
  if (response.status === 401) {
    // Token expired or invalid
    logout();
    throw new Error('Unauthorized');
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

// User Session Management
function loadUserSession() {
  const token = localStorage.getItem('authToken');
  const userData = localStorage.getItem('userData');
  
  if (token && userData) {
    currentUser = JSON.parse(userData);
    updateUIForLoggedInUser();
  }
}

function saveUserSession(token, user) {
  localStorage.setItem('authToken', token);
  localStorage.setItem('userData', JSON.stringify(user));
  currentUser = user;
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  currentUser = null;
  if (socket) {
    socket.disconnect();
  }
  window.location.href = '/';
}

// Update UI for Logged In User
function updateUIForLoggedInUser() {
  // Update navigation
  const authLinks = document.querySelectorAll('.auth-link');
  const userLinks = document.querySelectorAll('.user-link');
  
  authLinks.forEach(link => link.style.display = 'none');
  userLinks.forEach(link => link.style.display = 'flex');
  
  // Update user info
  if (currentUser) {
    const userAvatar = document.querySelector('.user-avatar');
    const userName = document.querySelector('.user-name');
    
    if (userAvatar) userAvatar.src = currentUser.avatar || '/assets/images/default-avatar.png';
    if (userName) userName.textContent = currentUser.username;
    
    updateRunegoldDisplay(currentUser.runegoldBalance);
  }
}

// Socket.io Setup
function initializeSocket() {
  if (!currentUser) return;
  
  socket = io(SOCKET_URL, {
    auth: {
      token: localStorage.getItem('authToken')
    }
  });
  
  socket.on('connect', () => {
    console.log('Connected to server');
    socket.emit('authenticate', currentUser.id);
  });
  
  socket.on('onlineUsers', (users) => {
    updateOnlineUsersList(users);
  });
  
  socket.on('privateMessage', (data) => {
    handlePrivateMessage(data);
  });
  
  socket.on('voteUpdate', (data) => {
    handleVoteUpdate(data);
  });
  
  socket.on('newComment', (data) => {
    handleNewComment(data);
  });
  
  socket.on('notification', (notification) => {
    handleNotification(notification);
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });
}

// Event Listeners Setup
function setupEventListeners() {
  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
  }
  
  // Sidebar toggle
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', toggleSidebar);
  }
  
  // Theme toggle
  if (elements.themeToggle) {
    elements.themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Notification bell
  if (elements.notificationBell) {
    elements.notificationBell.addEventListener('click', toggleNotifications);
  }
  
  // Global search
  const searchForm = document.querySelector('.search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', handleSearch);
  }
  
  // Click outside handlers
  document.addEventListener('click', handleClickOutside);
}

// Mobile Menu Toggle
function toggleMobileMenu() {
  const navMenu = document.querySelector('.nav-menu');
  navMenu.classList.toggle('mobile-active');
}

// Sidebar Toggle
function toggleSidebar() {
  if (elements.sidebar) {
    elements.sidebar.classList.toggle('active');
  }
}

// Theme Toggle
function toggleTheme() {
  const currentTheme = elements.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  elements.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Update theme icon
  const themeIcon = elements.themeToggle?.querySelector('i');
  if (themeIcon) {
    themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}

// Load Theme Preference
function loadThemePreference() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  elements.body.setAttribute('data-theme', savedTheme);
}

// Notifications Toggle
function toggleNotifications() {
  if (elements.notificationDropdown) {
    elements.notificationDropdown.classList.toggle('active');
    
    if (elements.notificationDropdown.classList.contains('active')) {
      loadNotifications();
    }
  }
}

// Load Notifications
async function loadNotifications() {
  try {
    const data = await authFetch('/auth/notifications');
    notifications = data;
    renderNotifications();
  } catch (error) {
    console.error('Failed to load notifications:', error);
  }
}

// Render Notifications
function renderNotifications() {
  const notificationList = document.querySelector('.notification-list');
  if (!notificationList) return;
  
  if (notifications.length === 0) {
    notificationList.innerHTML = '<div class="p-lg text-center text-muted">No notifications</div>';
    return;
  }
  
  notificationList.innerHTML = notifications.map(notification => `
    <div class="notification-item ${notification.read ? '' : 'unread'}" data-id="${notification._id}">
      <div class="notification-icon ${notification.type}">
        ${getNotificationIcon(notification.type)}
      </div>
      <div class="notification-content">
        <div class="notification-message">${notification.message}</div>
        <div class="notification-time">${formatTimeAgo(notification.createdAt)}</div>
      </div>
    </div>
  `).join('');
  
  // Update notification count
  const unreadCount = notifications.filter(n => !n.read).length;
  updateNotificationCount(unreadCount);
  
  // Add click handlers
  notificationList.querySelectorAll('.notification-item').forEach(item => {
    item.addEventListener('click', () => markNotificationAsRead(item.dataset.id));
  });
}

// Get Notification Icon
function getNotificationIcon(type) {
  const icons = {
    vote: '<i class="fas fa-thumbs-up"></i>',
    comment: '<i class="fas fa-comment"></i>',
    follow: '<i class="fas fa-user-plus"></i>',
    runegold: '<i class="fas fa-coins"></i>',
    badge: '<i class="fas fa-award"></i>',
    system: '<i class="fas fa-info-circle"></i>'
  };
  return icons[type] || '<i class="fas fa-bell"></i>';
}

// Update Notification Count
function updateNotificationCount(count) {
  const countElement = document.querySelector('.notification-count');
  if (countElement) {
    countElement.textContent = count;
    countElement.style.display = count > 0 ? 'flex' : 'none';
  }
}

// Mark Notification as Read
async function markNotificationAsRead(notificationId) {
  try {
    await authFetch('/auth/notifications/read', {
      method: 'PUT',
      body: JSON.stringify({ notificationIds: [notificationId] })
    });
    
    // Update local state
    const notification = notifications.find(n => n._id === notificationId);
    if (notification) {
      notification.read = true;
      renderNotifications();
    }
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
}

// Handle New Notification
function handleNotification(notification) {
  notifications.unshift(notification);
  
  // Show toast notification
  showToast(notification.message, notification.type);
  
  // Update notification count
  const unreadCount = notifications.filter(n => !n.read).length;
  updateNotificationCount(unreadCount);
  
  // Play notification sound if enabled
  if (currentUser?.preferences?.soundNotifications) {
    playNotificationSound();
  }
}

// Update Online Users List
function updateOnlineUsersList(users) {
  const onlineUserList = document.querySelector('.online-user-list');
  if (!onlineUserList) return;
  
  onlineUserList.innerHTML = users.map(userId => `
    <div class="online-user-item" data-user-id="${userId}">
      <img class="online-user-avatar" src="/assets/images/default-avatar.png" alt="User">
      <span class="online-user-name">User ${userId.slice(-4)}</span>
    </div>
  `).join('');
  
  // Add click handlers for messaging
  onlineUserList.querySelectorAll('.online-user-item').forEach(item => {
    item.addEventListener('click', () => openMessageModal(item.dataset.userId));
  });
}

// Video Voting
async function handleVote(videoId, voteType) {
  try {
    const response = await authFetch(`/videos/${videoId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ voteType })
    });
    
    // Update UI
    updateVoteUI(videoId, response);
    
    // Show feedback
    showToast(response.message, 'success');
  } catch (error) {
    showToast('Failed to record vote', 'error');
  }
}

// Update Vote UI
function updateVoteUI(videoId, voteData) {
  const videoElement = document.querySelector(`[data-video-id="${videoId}"]`);
  if (!videoElement) return;
  
  const upvoteBtn = videoElement.querySelector('.vote-btn.upvote');
  const downvoteBtn = videoElement.querySelector('.vote-btn.downvote');
  const voteCount = videoElement.querySelector('.vote-count');
  
  // Update active states
  upvoteBtn.classList.toggle('active', voteData.userVote === 'up');
  downvoteBtn.classList.toggle('active', voteData.userVote === 'down');
  
  // Update counts
  upvoteBtn.querySelector('.count').textContent = voteData.upvotes;
  downvoteBtn.querySelector('.count').textContent = voteData.downvotes;
  
  if (voteCount) {
    voteCount.textContent = voteData.netScore;
  }
}

// Handle Vote Update from Socket
function handleVoteUpdate(data) {
  updateVoteUI(data.videoId, data);
}

// Video Comments
async function submitComment(videoId, text, timestamp = null) {
  try {
    const response = await authFetch(`/videos/${videoId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ text, timestamp })
    });
    
    // Add comment to UI
    addCommentToUI(response.comment);
    
    // Clear comment form
    const commentForm = document.querySelector('.comment-form');
    if (commentForm) {
      commentForm.reset();
    }
    
    // Update Runegold if earned
    if (response.runegoldEarned) {
      updateRunegoldDisplay(currentUser.runegoldBalance + response.runegoldEarned);
      showToast(`+${response.runegoldEarned} Runegold earned!`, 'success');
    }
  } catch (error) {
    showToast('Failed to post comment', 'error');
  }
}

// Add Comment to UI
function addCommentToUI(comment) {
  const commentList = document.querySelector('.comment-list');
  if (!commentList) return;
  
  const commentHTML = createCommentHTML(comment);
  commentList.insertAdjacentHTML('afterbegin', commentHTML);
}

// Create Comment HTML
function createCommentHTML(comment) {
  return `
    <div class="comment-item ${comment.isHighlighted ? 'highlighted' : ''}" data-comment-id="${comment._id}">
      <img class="comment-avatar" src="${comment.user.avatar || '/assets/images/default-avatar.png'}" alt="${comment.user.username}">
      <div class="comment-content">
        <div class="comment-header">
          <span class="comment-author">${comment.user.username}</span>
          ${comment.timestamp ? `<span class="comment-video-timestamp" data-timestamp="${comment.timestamp}">${formatVideoTime(comment.timestamp)}</span>` : ''}
          <span class="comment-timestamp">${formatTimeAgo(comment.createdAt)}</span>
        </div>
        <div class="comment-text">${escapeHtml(comment.text)}</div>
        <div class="comment-actions">
          <span class="comment-action"><i class="fas fa-thumbs-up"></i> Like</span>
          <span class="comment-action"><i class="fas fa-reply"></i> Reply</span>
          ${currentUser?.id === comment.user._id ? '<span class="comment-action"><i class="fas fa-star"></i> Highlight</span>' : ''}
        </div>
      </div>
    </div>
  `;
}

// Handle New Comment from Socket
function handleNewComment(data) {
  addCommentToUI(data.comment);
}

// Breadcrumbs (Rune-Path Tracker)
function loadBreadcrumbs() {
  const stored = sessionStorage.getItem('breadcrumbs');
  if (stored) {
    breadcrumbs = JSON.parse(stored);
    renderBreadcrumbs();
  }
}

function addBreadcrumb(video) {
  // Check if video already exists
  const existingIndex = breadcrumbs.findIndex(b => b.id === video.id);
  if (existingIndex !== -1) {
    breadcrumbs.splice(existingIndex, 1);
  }
  
  // Add to beginning
  breadcrumbs.unshift({
    id: video.id,
    title: video.title,
    thumbnail: video.thumbnail
  });
  
  // Keep only last 5
  if (breadcrumbs.length > 5) {
    breadcrumbs = breadcrumbs.slice(0, 5);
  }
  
  // Save to session storage
  sessionStorage.setItem('breadcrumbs', JSON.stringify(breadcrumbs));
  
  renderBreadcrumbs();
}

function renderBreadcrumbs() {
  if (!elements.breadcrumbsContainer || breadcrumbs.length === 0) return;
  
  elements.breadcrumbsContainer.innerHTML = breadcrumbs.map((crumb, index) => `
    ${index > 0 ? '<span class="breadcrumb-arrow">→</span>' : ''}
    <div class="breadcrumb-item" data-video-id="${crumb.id}" title="${crumb.title}">
      <img src="${crumb.thumbnail}" alt="${crumb.title}">
    </div>
  `).join('') + '<button class="btn btn-sm breadcrumb-clear">Clear</button>';
  
  // Add click handlers
  elements.breadcrumbsContainer.querySelectorAll('.breadcrumb-item').forEach(item => {
    item.addEventListener('click', () => {
      window.location.href = `/pages/archive.html#video-${item.dataset.videoId}`;
    });
  });
  
  // Clear button
  const clearBtn = elements.breadcrumbsContainer.querySelector('.breadcrumb-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearBreadcrumbs);
  }
}

function clearBreadcrumbs() {
  breadcrumbs = [];
  sessionStorage.removeItem('breadcrumbs');
  if (elements.breadcrumbsContainer) {
    elements.breadcrumbsContainer.innerHTML = '';
  }
}

// Runegold Management
function updateRunegoldDisplay(balance) {
  if (currentUser) {
    currentUser.runegoldBalance = balance;
    localStorage.setItem('userData', JSON.stringify(currentUser));
  }
  
  const displays = document.querySelectorAll('.runegold-amount');
  displays.forEach(display => {
    display.textContent = balance.toLocaleString();
  });
}

// Runegold Purchase
async function purchaseRunegold(method, packageId) {
  try {
    showLoader('Processing payment...');
    
    let response;
    switch (method) {
      case 'stripe':
        response = await authFetch('/runegold/purchase/stripe', {
          method: 'POST',
          body: JSON.stringify({ packageId })
        });
        // Redirect to Stripe checkout
        window.location.href = response.checkoutUrl;
        break;
        
      case 'paypal':
        response = await authFetch('/runegold/purchase/paypal', {
          method: 'POST',
          body: JSON.stringify({ packageId })
        });
        // Redirect to PayPal
        window.location.href = response.approveUrl;
        break;
        
      case 'bitcoin':
        response = await authFetch('/blockonomics/new-address', {
          method: 'POST',
          body: JSON.stringify({ packageId })
        });
        // Show Bitcoin payment modal
        showBitcoinPaymentModal(response);
        break;
        
      case 'ethereum':
        // Handle MetaMask payment
        await handleMetaMaskPayment(packageId);
        break;
    }
  } catch (error) {
    hideLoader();
    showToast('Payment failed: ' + error.message, 'error');
  }
}

// Bitcoin Payment Modal
function showBitcoinPaymentModal(paymentData) {
  const modalHTML = `
    <div class="modal active" id="bitcoin-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Bitcoin Payment</h3>
          <button class="modal-close" onclick="closeModal('bitcoin-modal')">×</button>
        </div>
        <div class="modal-body text-center">
          <img src="${paymentData.qrCode}" alt="Bitcoin QR Code" class="mb-lg">
          <p class="mb-md">Send exactly <strong>${paymentData.amount} BTC</strong> to:</p>
          <div class="form-input mb-lg" style="font-family: monospace; font-size: 0.875rem;">
            ${paymentData.address}
          </div>
          <p class="text-sm text-muted">Payment expires in 1 hour</p>
          <button class="btn btn-primary" onclick="checkBitcoinPayment('${paymentData.address}')">
            Check Payment Status
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Check Bitcoin Payment
async function checkBitcoinPayment(address) {
  try {
    const response = await authFetch(`/blockonomics/check-payment/${address}`);
    
    if (response.status >= 1) {
      showToast('Payment confirmed! Runegold added to your account.', 'success');
      closeModal('bitcoin-modal');
      location.reload();
    } else {
      showToast(`Payment status: ${response.statusText}`, 'info');
    }
  } catch (error) {
    showToast('Failed to check payment status', 'error');
  }
}

// MetaMask Payment
async function handleMetaMaskPayment(packageId) {
  if (typeof window.ethereum === 'undefined') {
    showToast('Please install MetaMask to use Ethereum payments', 'error');
    return;
  }
  
  try {
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    
    // Get package details
    const packages = {
      '1000': { amount: 1000, price: 10 },
      '5000': { amount: 5000, price: 45 },
      '10000': { amount: 10000, price: 85 }
    };
    
    const package = packages[packageId];
    const ethAmount = (package.price / 3000).toFixed(6); // Assuming ETH price of $3000
    
    // Send transaction
    const transactionHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: account,
        to: '0xYourEthereumWalletAddress', // This should be from env
        value: '0x' + (ethAmount * 1e18).toString(16),
        gas: '0x5208', // 21000 Gwei
      }],
    });
    
    // Record donation
    await authFetch('/donations/crypto', {
      method: 'POST',
      body: JSON.stringify({
        amount: package.price,
        currency: 'ethereum',
        transactionHash,
        userId: currentUser.id
      })
    });
    
    showToast('Transaction sent! Your Runegold will be added once confirmed.', 'success');
  } catch (error) {
    showToast('Transaction failed: ' + error.message, 'error');
  }
}

// Search Functionality
async function handleSearch(e) {
  e.preventDefault();
  
  const searchInput = e.target.querySelector('.search-input');
  const query = searchInput.value.trim();
  
  if (!query) return;
  
  // Redirect to search results
  window.location.href = `/pages/archive.html?search=${encodeURIComponent(query)}`;
}

// Video Upload
async function uploadVideo(formData) {
  try {
    showLoader('Uploading video...');
    
    const response = await fetch(`${API_BASE_URL}/videos/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    
    hideLoader();
    showToast(`Video uploaded! +${data.runegoldEarned} Runegold earned!`, 'success');
    
    // Redirect to video page
    setTimeout(() => {
      window.location.href = `/pages/archive.html#video-${data.video._id}`;
    }, 2000);
  } catch (error) {
    hideLoader();
    showToast('Upload failed: ' + error.message, 'error');
  }
}

// Utility Functions
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  
  return 'Just now';
}

function formatVideoTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} slide-in-up`;
  toast.innerHTML = `
    <div class="toast-content">
      ${getToastIcon(type)}
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function getToastIcon(type) {
  const icons = {
    success: '<i class="fas fa-check-circle"></i>',
    error: '<i class="fas fa-exclamation-circle"></i>',
    warning: '<i class="fas fa-exclamation-triangle"></i>',
    info: '<i class="fas fa-info-circle"></i>'
  };
  return icons[type] || icons.info;
}

function showLoader(message = 'Loading...') {
  const loader = document.createElement('div');
  loader.className = 'loader-overlay';
  loader.innerHTML = `
    <div class="loader-content">
      <div class="spinner spinner-lg"></div>
      <p class="mt-md">${message}</p>
    </div>
  `;
  document.body.appendChild(loader);
}

function hideLoader() {
  const loader = document.querySelector('.loader-overlay');
  if (loader) {
    loader.remove();
  }
}

function playNotificationSound() {
  const audio = new Audio('/assets/sounds/notification.mp3');
  audio.volume = 0.5;
  audio.play().catch(() => {
    // Autoplay might be blocked
  });
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.remove();
  }
}

function handleClickOutside(e) {
  // Close dropdowns when clicking outside
  if (elements.notificationDropdown && !elements.notificationBell.contains(e.target) && !elements.notificationDropdown.contains(e.target)) {
    elements.notificationDropdown.classList.remove('active');
  }
}

// Page-specific initialization
function initializePageSpecific() {
  const page = document.body.dataset.page;
  
  switch (page) {
    case 'archive':
      initializeArchivePage();
      break;
    case 'dashboard':
      initializeDashboardPage();
      break;
    case 'profile':
      initializeProfilePage();
      break;
    case 'auth':
      initializeAuthPage();
      break;
    // Add more page-specific initializations
  }
}

// Archive Page
function initializeArchivePage() {
  // Video grid interactions
  const videoCards = document.querySelectorAll('.video-card');
  videoCards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.vote-btn')) {
        const videoId = card.dataset.videoId;
        window.location.href = `#video-${videoId}`;
      }
    });
  });
  
  // Vote buttons
  const voteButtons = document.querySelectorAll('.vote-btn');
  voteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const videoId = btn.closest('[data-video-id]').dataset.videoId;
      const voteType = btn.classList.contains('upvote') ? 'up' : 'down';
      handleVote(videoId, voteType);
    });
  });
  
  // Load more videos on scroll
  let loading = false;
  window.addEventListener('scroll', () => {
    if (loading) return;
    
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
      loading = true;
      loadMoreVideos().finally(() => {
        loading = false;
      });
    }
  });
}

// Load More Videos
async function loadMoreVideos() {
  const currentPage = parseInt(document.body.dataset.currentPage || '1');
  const nextPage = currentPage + 1;
  
  try {
    const params = new URLSearchParams(window.location.search);
    params.set('page', nextPage);
    
    const response = await fetch(`${API_BASE_URL}/videos?${params}`);
    const data = await response.json();
    
    if (data.videos.length > 0) {
      const videoGrid = document.querySelector('.video-grid');
      data.videos.forEach(video => {
        videoGrid.insertAdjacentHTML('beforeend', createVideoCardHTML(video));
      });
      
      document.body.dataset.currentPage = nextPage;
      
      // Re-initialize event listeners for new cards
      initializeArchivePage();
    }
  } catch (error) {
    console.error('Failed to load more videos:', error);
  }
}

// Create Video Card HTML
function createVideoCardHTML(video) {
  return `
    <div class="video-card" data-video-id="${video._id}">
      <div class="video-thumbnail">
        <img src="${video.thumbnail}" alt="${video.title}">
        <span class="video-duration">${formatVideoTime(video.duration)}</span>
        ${video.boost?.isActive ? '<div class="video-boost-badge"><i class="fas fa-fire"></i> Boosted</div>' : ''}
      </div>
      <div class="video-info">
        <h3 class="video-title">${video.title}</h3>
        <div class="video-meta">
          <div class="video-author">
            <img class="video-author-avatar" src="${video.uploadedBy.avatar}" alt="${video.uploadedBy.username}">
            <span>${video.uploadedBy.username}</span>
          </div>
          <span>${video.views} views</span>
          <span>${formatTimeAgo(video.createdAt)}</span>
        </div>
        <div class="vote-buttons">
          <button class="vote-btn upvote ${video.userVote === 'up' ? 'active' : ''}">
            <i class="fas fa-thumbs-up"></i>
            <span class="count">${video.upvoteCount}</span>
          </button>
          <button class="vote-btn downvote ${video.userVote === 'down' ? 'active' : ''}">
            <i class="fas fa-thumbs-down"></i>
            <span class="count">${video.downvoteCount}</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Export functions for use in HTML
window.MLNF = {
  login: handleLogin,
  register: handleRegister,
  logout,
  uploadVideo,
  submitComment,
  handleVote,
  purchaseRunegold,
  checkBitcoinPayment,
  closeModal,
  showToast
};

// Auth Functions
async function handleLogin(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = {
    username: formData.get('username'),
    password: formData.get('password')
  };
  
  try {
    showLoader('Logging in...');
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error);
    }
    
    saveUserSession(result.token, result.user);
    
    hideLoader();
    showToast('Login successful!', 'success');
    
    // Check for login bonus
    if (result.loginBonus) {
      showToast(`Daily login bonus: +${result.loginBonus.bonus} Runegold!`, 'success');
    }
    
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 1500);
  } catch (error) {
    hideLoader();
    showToast(error.message, 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = {
    username: formData.get('username'),
    password: formData.get('password'),
    secretQuestion: formData.get('secretQuestion'),
    secretAnswer: formData.get('secretAnswer'),
    referralCode: formData.get('referralCode')
  };
  
  // Validate password confirmation
  if (data.password !== formData.get('confirmPassword')) {
    showToast('Passwords do not match', 'error');
    return;
  }
  
  try {
    showLoader('Creating account...');
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error);
    }
    
    saveUserSession(result.token, result.user);
    
    hideLoader();
    showToast('Account created successfully!', 'success');
    
    setTimeout(() => {
      window.location.href = '/pages/profile-setup.html';
    }, 1500);
  } catch (error) {
    hideLoader();
    showToast(error.message, 'error');
  }
}

// Additional Styles for Toast and Loader
const additionalStyles = `
<style>
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: var(--white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  max-width: 350px;
  z-index: var(--z-tooltip);
}

.toast-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.toast-success { border-left: 4px solid var(--success); }
.toast-error { border-left: 4px solid var(--error); }
.toast-warning { border-left: 4px solid var(--warning); }
.toast-info { border-left: 4px solid var(--info); }

.loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-tooltip);
}

.loader-content {
  background-color: var(--white);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  text-align: center;
}

.fade-out {
  opacity: 0;
  transition: opacity var(--transition-normal);
}
</style>
`;

// Inject additional styles
document.head.insertAdjacentHTML('beforeend', additionalStyles);
