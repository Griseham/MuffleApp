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
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.arrow-right');
    const prevButton = document.querySelector('.arrow-left');
    const dotsNav = document.querySelector('.carousel-nav');
    const dots = Array.from(dotsNav.children);

    const slideWidth = slides[0].getBoundingClientRect().width;

    // Arrange the slides next to one another
    const setSlidePosition = (slide, index) => {
        slide.style.left = `${slideWidth * index}px`;
    };
    slides.forEach(setSlidePosition);

    const moveToSlide = (track, currentSlide, targetSlide) => {
        track.style.transform = `translateX(-${targetSlide.style.left})`;
        currentSlide.classList.remove('current-slide');
        targetSlide.classList.add('current-slide');

        // Pause all videos
        const videos = track.querySelectorAll('video');
        videos.forEach(video => video.pause());

        // Play the video in the target slide if needed
        const videoInTargetSlide = targetSlide.querySelector('video');
        if (videoInTargetSlide) {
            videoInTargetSlide.currentTime = 0; // Optional: reset the video to the beginning
        }
    };

    const updateDots = (currentDot, targetDot) => {
        currentDot.classList.remove('current-slide');
        targetDot.classList.add('current-slide');
    };

    prevButton.addEventListener('click', () => {
        const currentSlide = track.querySelector('.current-slide') || slides[0];
        const prevSlide = currentSlide.previousElementSibling || slides[slides.length - 1];
        const currentDot = dotsNav.querySelector('.current-slide') || dots[0];
        const prevDot = currentDot.previousElementSibling || dots[dots.length - 1];

        moveToSlide(track, currentSlide, prevSlide);
        updateDots(currentDot, prevDot);
    });

    nextButton.addEventListener('click', () => {
        const currentSlide = track.querySelector('.current-slide') || slides[0];
        const nextSlide = currentSlide.nextElementSibling || slides[0];
        const currentDot = dotsNav.querySelector('.current-slide') || dots[0];
        const nextDot = currentDot.nextElementSibling || dots[0];

        moveToSlide(track, currentSlide, nextSlide);
        updateDots(currentDot, nextDot);
    });

    dotsNav.addEventListener('click', (e) => {
        const targetDot = e.target.closest('button');

        if (!targetDot) return;

        const currentSlide = track.querySelector('.current-slide') || slides[0];
        const currentDot = dotsNav.querySelector('.current-slide') || dots[0];
        const targetIndex = dots.findIndex((dot) => dot === targetDot);
        const targetSlide = slides[targetIndex];

        moveToSlide(track, currentSlide, targetSlide);
        updateDots(currentDot, targetDot);
    });

    // Set the first slide and dot as current
    slides[0].classList.add('current-slide');
    dots[0].classList.add('current-slide');
}


// Error handling for image loading
window.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        console.error(`Error loading image: ${e.target.src}`);
        e.target.src = 'assets/placeholder.png'; // Replace with a placeholder image
    }
}, true);

