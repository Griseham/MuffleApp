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
        setupCarousel(); 
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

function setupCarousel() {
    const carousels = document.querySelectorAll('.carousel');
    carousels.forEach(carousel => {
        const track = carousel.querySelector('.carousel-track');
        const slides = Array.from(track.children);
        const nextButton = carousel.querySelector('.arrow-right');
        const prevButton = carousel.querySelector('.arrow-left');
        const dotsNav = carousel.parentElement.querySelector('.carousel-nav');
        let dots = [];

        // Generate dots dynamically
        if (dotsNav) {
            dotsNav.innerHTML = ''; // Clear existing dots
            slides.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.classList.add('carousel-indicator');
                if (index === 0) dot.classList.add('current-slide');
                dot.setAttribute('aria-label', `Slide ${index + 1}`);
                dotsNav.appendChild(dot);
                dots.push(dot);
            });
        }

        let currentSlideIndex = 0;

        if (!slides.length) {
            console.warn('No slides found in the carousel.');
            return;
        }
        
        // Ensure buttons exist before adding event listeners
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                const prevIndex = (currentSlideIndex === 0) ? slides.length - 1 : currentSlideIndex - 1;
                moveToSlide(prevIndex);
            });
        } else {
            console.warn('Previous button not found in the carousel.');
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                const nextIndex = (currentSlideIndex === slides.length - 1) ? 0 : currentSlideIndex + 1;
                moveToSlide(nextIndex);
            });
        } else {
            console.warn('Next button not found in the carousel.');
        }

        if (dotsNav) {
            dotsNav.addEventListener('click', (e) => {
                const targetDot = e.target.closest('button');
                if (!targetDot) return;

                const targetIndex = dots.indexOf(targetDot);
                if (targetIndex !== -1) {
                    moveToSlide(targetIndex);
                }
            });
        }

        function moveToSlide(index) {
            track.style.transform = `translateX(-${100 * index}%)`;
            currentSlideIndex = index;
            updateDots();
        }

        function updateDots() {
            dots.forEach((dot, index) => {
                dot.classList.toggle('current-slide', index === currentSlideIndex);
            });
        }

        // Initialize carousel
        moveToSlide(0);
    });
}






// Error handling for image loading
window.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        console.error(`Error loading image: ${e.target.src}`);
        e.target.src = 'assets/placeholder.png'; // Replace with a placeholder image
    }
}, true);

