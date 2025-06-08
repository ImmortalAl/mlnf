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
    console.log('[owlMessenger] Sending owl to:', email, 'with URL:', url);
    console.log('[owlMessenger] API endpoint:', `${window.MLNF_CONFIG.API_BASE_URL}/send-owl`);
    
    const response = await fetch(`${window.MLNF_CONFIG.API_BASE_URL}/send-owl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, url })
    });
    
    console.log('[owlMessenger] Response status:', response.status);
    console.log('[owlMessenger] Response ok:', response.ok);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('[owlMessenger] Response data:', result);
    
    if (result.success) {
      statusEl.textContent = '🦉 The owl has taken flight!';
      statusEl.style.color = '#3a2e28';
      document.getElementById('owl-email').value = '';
    } else {
      throw new Error(result.message || 'Unknown error occurred');
    }
  } catch (error) {
    console.error('[owlMessenger] Error:', error);
    statusEl.textContent = `The owl was hindered: ${error.message}`;
    statusEl.style.color = '#d44';
  } finally {
    setTimeout(() => {
      isOwlFlying = false;
      stopOwlAnimation();
      statusEl.textContent = '';
    }, 3000);
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