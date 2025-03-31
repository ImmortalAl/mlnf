    document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
});

document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    const nav = document.getElementById('mainNav');
    nav.classList.toggle('active');
});

// Theme Toggle (example)
document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
});

document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        if (targetId.startsWith('#')) {
            document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });
        } else {
            window.location.href = targetId; // For page links
        }
    });
});

// Message Board: New Thread (only if on messageboard.html)
if (document.getElementById('newThreadBtn')) {
    document.getElementById('newThreadBtn').addEventListener('click', () => {
        const title = prompt('Enter thread title:');
        if (title) {
            const threads = document.querySelector('.threads');
            const newThread = document.createElement('div');
            newThread.classList.add('thread');
            newThread.innerHTML = `
                <h3><i class="fas fa-comment-dots"></i> ${title}</h3>
                <p class="thread-meta">Started by You • Just now • 0 replies</p>
                <p>Begin the eternal discourse...</p>
            `;
            threads.prepend(newThread);
        }
    });
}

// Message Board: Replies (only if on messageboard.html)
if (document.querySelector('.reply-btn')) {
    document.querySelectorAll('.reply-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const replyText = prompt('Enter your reply:');
            if (replyText) {
                const replyDiv = e.target.parentElement;
                const newReply = document.createElement('div');
                newReply.classList.add('reply');
                newReply.innerHTML = `<p><strong>You:</strong> ${replyText}</p>`;
                replyDiv.insertBefore(newReply, e.target);
            }
        });
    });
}