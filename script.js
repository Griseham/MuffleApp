document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    initApp();
});

function setupMobileMenu() {
    const menuToggle = document.createElement('button');
    menuToggle.innerHTML = '☰';
    menuToggle.classList.add('menu-toggle');
    document.querySelector('nav').appendChild(menuToggle);

    const navList = document.querySelector('nav ul');

    menuToggle.addEventListener('click', () => {
        navList.classList.toggle('active');
    });
}

function initApp() {
    try {
        setupNavigation();
        setupScrollEffects();
        setupMobileMenu();
        setupEmailSignup();
        setupIndiegogoLink();
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').slice(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            } else {
                console.warn(`Target element "${targetId}" not found`);
            }
        });
    });
    console.log('Navigation setup complete');
}

function setupScrollEffects() {
    const sections = document.querySelectorAll('.app-section');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.7
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            } else {
                entry.target.classList.remove('active');
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    console.log('Scroll effects setup complete');
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
    }
}

function setupIndiegogoLink() {
    const link = document.getElementById('indiegogo-link');
    if (link) {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Replace this with your actual Indiegogo campaign link
            window.open('https://www.indiegogo.com/your-campaign-link', '_blank');
        });
    }
}

// Error handling for image loading
window.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        console.error(`Error loading image: ${e.target.src}`);
        e.target.src = 'placeholder.png'; // Replace with a placeholder image
    }
}, true);