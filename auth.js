// Firebase Authentication System
// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyAyqjUuNTM_vArtzYzQG0bf9VWDiFLEnbU",
    authDomain: "dr-drashti-clinic-d1.firebaseapp.com",
    projectId: "dr-drashti-clinic-d1",
    storageBucket: "dr-drashti-clinic-d1.firebasestorage.app",
    messagingSenderId: "333980385600",
    appId: "1:333980385600:web:dd25b2a5712bff5bd2faa5",
    measurementId: "G-387QCRVGZ9"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

// Global Auth State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        sessionStorage.setItem('staffLoggedIn', 'true');
    } else {
        sessionStorage.removeItem('staffLoggedIn');
    }
});

// Check if user is logged in
function checkAuth() {
    return sessionStorage.getItem('staffLoggedIn') === 'true';
}

// Show login modal
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('loginForm').reset();

    // Dynamically update the form label to allow Username again
    const userLabel = document.querySelector('label[for="username"]');
    if (userLabel) userLabel.textContent = "Username or Email";

    const userInput = document.getElementById('username');
    if (userInput) {
        userInput.placeholder = "Enter username or email";
        userInput.type = "text"; // Changed from email so "admin" works
    }
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
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            let emailOrUser = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('loginError');

            errorMsg.style.display = 'none';

            // Map old "admin" username directly to the secure Firebase email account!
            if (emailOrUser.toLowerCase() === 'admin') {
                emailOrUser = 'drashtijani1812@gmail.com';
            }

            try {
                // Actual Firebase Login
                await auth.signInWithEmailAndPassword(emailOrUser, password);

                // Successful login
                sessionStorage.setItem('staffLoggedIn', 'true');
                closeLoginModal();

                // Show dashboard
                document.getElementById('dashboard').style.display = 'block';
                document.getElementById('main-content').style.display = 'none';
                if (typeof loadAppointments === 'function') {
                    loadAppointments();
                }
            } catch (error) {
                // Failed login
                console.error("Firebase Login Error:", error);

                // Format Firebase errors to be user friendly
                let friendlyMessage = 'Invalid username or password';
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-email') {
                    friendlyMessage = 'Invalid username or password';
                } else if (error.code === 'auth/too-many-requests') {
                    friendlyMessage = 'Too many attempts. Please try again later.';
                } else {
                    friendlyMessage = error.message;
                }

                errorMsg.textContent = friendlyMessage;
                errorMsg.style.display = 'block';
            }
        });
    }
});

// Logout function
async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            await auth.signOut();
            sessionStorage.removeItem('staffLoggedIn');
            document.getElementById('dashboard').style.display = 'none';
            document.getElementById('main-content').style.display = 'block';
            showSection('home');
        } catch (error) {
            console.error("Logout error:", error);
            alert("Failed to log out.");
        }
    }
}

// Toggle Dashboard with authentication check
function toggleDashboard() {
    if (!checkAuth() && !auth.currentUser) {
        showLoginModal();
        return;
    }

    const dashboard = document.getElementById('dashboard');
    const mainContent = document.getElementById('main-content');

    if (dashboard.style.display === 'none' || dashboard.style.display === '') {
        dashboard.style.display = 'block';
        mainContent.style.display = 'none';
        if (window.broadcastSystem) window.broadcastSystem.showTab('recordsSection');
        if (typeof loadAppointments === 'function') {
            loadAppointments();
        }
    } else {
        dashboard.style.display = 'none';
        mainContent.style.display = 'block';
    }
}
