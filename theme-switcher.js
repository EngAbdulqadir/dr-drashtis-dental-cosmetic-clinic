// Theme Switcher Function
function toggleTheme() {
    const body = document.body;
    const logo = document.querySelector('.logo-section img');
    const currentTheme = body.classList.contains('blue-green-theme') ? 'blue-green' : 'green';

    if (currentTheme === 'green') {
        body.classList.add('blue-green-theme');
        localStorage.setItem('clinicTheme', 'blue-green');
        if (logo) logo.src = 'logo-blue.png';
    } else {
        body.classList.remove('blue-green-theme');
        localStorage.setItem('clinicTheme', 'green');
        if (logo) logo.src = 'logo-green.png';
    }
}

// Load saved theme on page load
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('clinicTheme');
    const logo = document.querySelector('.logo-section img');

    if (savedTheme === 'blue-green') {
        document.body.classList.add('blue-green-theme');
        if (logo) logo.src = 'logo-blue.png';
    } else {
        if (logo) logo.src = 'logo-green.png';
    }
}

// Call on page load
loadSavedTheme();
