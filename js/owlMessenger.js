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
    const result = await response.json();
    if (result.success) {
      statusEl.textContent = '🦉 The owl has taken flight!';
      statusEl.style.color = '#3a2e28';
      document.getElementById('owl-email').value = '';
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    statusEl.textContent = error.message;
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
  if (owl) owl.style.animation = 'owlFlap 0.6s steps(3) infinite';
}

function stopOwlAnimation() {
  const owl = document.querySelector('.owl-sprite');
  if (owl) owl.style.animation = 'none';
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
} 