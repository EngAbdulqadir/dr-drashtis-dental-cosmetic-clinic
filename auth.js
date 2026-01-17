// Authentication System
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'drashti@123';

// Check if user is logged in
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('staffLoggedIn') === 'true';
    return isLoggedIn;
}

// Show login modal
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('loginForm').reset();
}

// Close login modal
function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginError').style.display = 'none';
}

// Handle login form submission
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('loginError');

            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                // Successful login
                sessionStorage.setItem('staffLoggedIn', 'true');
                closeLoginModal();
                // Show dashboard
                document.getElementById('dashboard').style.display = 'block';
                document.getElementById('main-content').style.display = 'none';
                if (typeof loadAppointments === 'function') {
                    loadAppointments();
                }
            } else {
                // Failed login
                errorMsg.textContent = 'Invalid username or password';
                errorMsg.style.display = 'block';
            }
        });
    }
});

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('staffLoggedIn');
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        showSection('home');
    }
}

// Toggle Dashboard with authentication check
function toggleDashboard() {
    if (!checkAuth()) {
        showLoginModal();
        return;
    }

    const dashboard = document.getElementById('dashboard');
    const mainContent = document.getElementById('main-content');

    if (dashboard.style.display === 'none' || dashboard.style.display === '') {
        dashboard.style.display = 'block';
        mainContent.style.display = 'none';
        if (typeof loadAppointments === 'function') {
            loadAppointments();
        }
    } else {
        dashboard.style.display = 'none';
        mainContent.style.display = 'block';
    }
}
