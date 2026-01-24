// Theme Switcher Function
function toggleTheme() {
    const body = document.body;
    const logo = document.querySelector('.logo-section img');
    // Default is now Teal (no class). Alternate is Blue ('blue-theme').
    const isBlueTheme = body.classList.contains('blue-theme');

    if (!isBlueTheme) {
        // Switch to Blue
        body.classList.add('blue-theme');
        localStorage.setItem('clinicTheme', 'blue');
        if (logo) logo.src = 'logo-blue.png'; // Reusing blue logo as it fits better than green
    } else {
        // Switch to Default (Teal)
        body.classList.remove('blue-theme');
        localStorage.setItem('clinicTheme', 'teal');
        if (logo) logo.src = 'logo-blue.png'; // Teal also uses blue-ish logo
    }
}

// Load saved theme on page load
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('clinicTheme');
    const logo = document.querySelector('.logo-section img');

    // Default is Teal (no class needed)
    if (savedTheme === 'blue') {
        document.body.classList.add('blue-theme');
    }

    // Ensure logo matches
    if (logo) logo.src = 'logo-blue.png';
}

// Call on page load
loadSavedTheme();
