// scripts.js

document.addEventListener('DOMContentLoaded', () => {
    // Add any JavaScript functionality here if needed
    // Example: Smooth scroll for the "View More" link
    document.querySelector('.view-more').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.latest-blogs').scrollIntoView({ behavior: 'smooth' });
    });

    // Example: Form submission handling for subscribe
    document.querySelector('.subscribe form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        alert(`Subscribed with email: ${email}`);
        e.target.reset();
    });
});
