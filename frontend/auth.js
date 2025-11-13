// frontend/auth.js

document.getElementById('login-form').addEventListener('submit', handleLogin);

const loginURL = 'http://127.0.0.1:8000/api/token/'; 
const loadingOverlay = document.getElementById('loading-overlay'); // New: Overlay element

function showLoading() {
    if(loadingOverlay) loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    if(loadingOverlay) loadingOverlay.classList.add('hidden');
}


async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-message');
    errorMsg.textContent = '';

    showLoading(); // 1. Start Loading

    try {
        const response = await fetch(loginURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Token store karna
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            
            // 2. Success: Redirect (Loading automatically hides on redirect)
            // Hum thoda sa extra delay (1 second) manually add kar rahe hain for better UX
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000); // 1000 milliseconds = 1 second
            

        } else {
            // 3. Failure: Show error and hide loading
            hideLoading();
            errorMsg.textContent = 'Login failed. Check username and password.';
            console.error("Login Error:", data);
        }
    } catch (error) {
        // 4. Network error: Hide loading
        hideLoading();
        errorMsg.textContent = 'Network error. Could not connect to the server.';
        console.error("Network Error:", error);
    }
}