document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.querySelector('.login-btn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    // Focus first input on page load
    usernameInput.focus();

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Show loading state
        loginBtn.classList.add('btn-loading');
        loginBtn.disabled = true;

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // AUTHENTICATION LOGIC
        if (username === "admin" && password === "1234") {
            // Success! Store session data
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userRole', 'admin');
            sessionStorage.setItem('userId', username);
            
            // Success animation and redirect
            showSuccessAnimation().then(() => {
                window.location.href = 'doctor_dashboard.html';
            });
        } else {
            // Show error
            showError('❌ Invalid Employee ID or Password');
            shakeAnimation();
        }

        // Reset button state
        loginBtn.classList.remove('btn-loading');
        loginBtn.disabled = false;
    });

    // Input animations
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.parentElement.classList.remove('focused');
            }
        });
    });

    function showSuccessAnimation() {
        return new Promise(resolve => {
            const btnText = loginBtn.querySelector('.btn-text');
            btnText.innerHTML = 'Welcome! <i class="fas fa-check ml-2"></i>';
            loginBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            
            setTimeout(() => {
                resolve();
            }, 800);
        });
    }

    function showError(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-error';
        toast.innerHTML = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    function shakeAnimation() {
        const card = document.querySelector('.login-card');
        card.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            card.style.animation = '';
        }, 500);
    }

    // Add shake animation to CSS via JS (temporary)
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        .toast-error {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(239, 68, 68, 0.4);
            font-weight: 600;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        }
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // AUTHENTICATION LOGIC
        if (username === "admin" && password === "1234") {
            // Store session data
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userRole', 'admin');
            
            // Play animation then redirect
            showSuccessAnimation().then(() => {
                // We use a RELATIVE path. The browser looks in the same folder.
                window.location.href = 'doc_dashboard.html'; 
            });
        } else {
            showError('❌ Invalid Employee ID or Password');
            shakeAnimation();
        }

});