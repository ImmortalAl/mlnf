document.addEventListener('DOMContentLoaded', () => {
    const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : 'https://mlnf-auth.onrender.com'; 

    // Registration Handler
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    username: document.getElementById('register-username').value,
                    password: document.getElementById('register-password').value
                }),
                credentials: 'include'
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                window.location.href = '/pages/profile-setup.html';
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Network error - check console');
        }
    });

    // Login Handler
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    username: document.getElementById('login-username').value,
                    password: document.getElementById('login-password').value
                }),
                credentials: 'include'
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                window.location.href = '/pages/profiles.html';
            } else {
                alert(data.error || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Network error - check console');
        }
    });
});