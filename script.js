document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    initApp();
});

function initApp() {
    try {
        setupMobileMenu();
        setupNavigation();
        setupScrollEffects();
        setupEmailSignup();
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

function setupMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('nav ul');

    menuToggle.addEventListener('click', () => {
        navList.classList.toggle('active');
    });
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('href') === '#') return;
            e.preventDefault();
            const targetId = link.getAttribute('href').slice(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            } else {
                console.warn(`Target element "${targetId}" not found`);
            }

            // Close mobile menu after clicking a link
            const navList = document.querySelector('nav ul');
            if (navList.classList.contains('active')) {
                navList.classList.remove('active');
            }
        });
    });
    console.log('Navigation setup complete');
}

function setupScrollEffects() {
    // Removed animations that could interfere with text layout
}

function setupEmailSignup() {
    const form = document.getElementById('email-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            // Here you would typically send this to your server or a service like Mailchimp
            console.log(`Email submitted: ${email}`);
            alert('Thank you for subscribing!');
            form.reset();
        });
    } else {
        console.warn('Email form not found');
    }
}

// Error handling for image loading
window.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        console.error(`Error loading image: ${e.target.src}`);
        e.target.src = 'assets/placeholder.png'; // Replace with a placeholder image
    }
}, true);

