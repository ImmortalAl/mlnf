let isOwlFlying = false;

async function sendOwlMessage() {
  if (isOwlFlying) return;
  const email = document.getElementById('owl-email').value.trim();
  const url = document.getElementById('share-url').value;
  const statusEl = document.getElementById('owl-status');
  if (!validateEmail(email)) {
    statusEl.textContent = 'The owl needs a valid destination';
    statusEl.style.color = '#d44';
    return;
  }
  isOwlFlying = true;
  statusEl.textContent = 'Preparing the messenger...';
  startOwlAnimation();
  try {
    
    const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/send-owl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, url })
    });
    
    
    if (response.status === 404) {
      throw new Error('FALLBACK_NEEDED');
    }
    
    if (response.status === 500) {
      throw new Error('FALLBACK_NEEDED');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      statusEl.textContent = '🦉 The owl has taken flight!';
      statusEl.style.color = '#3a2e28';
      document.getElementById('owl-email').value = '';
    } else {
      throw new Error(result.message || 'Unknown error occurred');
    }
  } catch (error) {
    console.error('[owlMessenger] Error:', error);
    
    if (error.message === 'FALLBACK_NEEDED') {
      provideFallbackSharing(email, url, statusEl);
    } else {
      statusEl.textContent = `The owl was hindered: ${error.message}`;
      statusEl.style.color = '#d44';
    }
  } finally {
    setTimeout(() => {
      isOwlFlying = false;
      stopOwlAnimation();
      if (!statusEl.textContent.includes('Copy this link')) {
        statusEl.textContent = '';
      }
    }, 3000);
  }
}

function provideFallbackSharing(email, url, statusEl) {
  const subject = encodeURIComponent('📜 A Sacred Scroll Awaits Your Gaze');
  const body = encodeURIComponent(`🦉 An Owl Bears Wisdom\n\nA fellow seeker has shared this ancient knowledge with you:\n${url}\n\n"Wisdom flies on silent wings - guard it well"`);
  const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
  
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(url).then(() => {
      statusEl.innerHTML = `🦉 The owl's message service is resting! <br><a href="${mailtoLink}" style="color: #d4af37; text-decoration: underline;">Open your email app</a> or<br>Share this link: <strong>${url}</strong>`;
      statusEl.style.color = '#3a2e28';
    }).catch(() => {
      statusEl.innerHTML = `🦉 The owl's message service is resting! <br><a href="${mailtoLink}" style="color: #d4af37; text-decoration: underline;">Open your email app</a> or<br>Share this link: <strong>${url}</strong>`;
      statusEl.style.color = '#3a2e28';
    });
  } else {
    statusEl.innerHTML = `🦉 The owl's message service is resting! <br><a href="${mailtoLink}" style="color: #d4af37; text-decoration: underline;">Open your email app</a> or<br>Share this link: <strong>${url}</strong>`;
    statusEl.style.color = '#3a2e28';
  }
}

function startOwlAnimation() {
  const owl = document.querySelector('.owl-sprite');
  if (owl) {
    owl.classList.add('flying');
    owl.style.animation = 'owlFlap 0.6s steps(3) infinite';
  }
}

function stopOwlAnimation() {
  const owl = document.querySelector('.owl-sprite');
  if (owl) {
    owl.classList.remove('flying');
    owl.style.animation = 'owlFlap 0.5s steps(3) infinite';
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
} 