// 1. Starfield Background
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

let width, height, stars = [];

function initStars() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    
    stars = [];
    for(let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}

function animateStars() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        star.y -= star.speed; // Move stars upward
        if(star.y < 0) star.y = height;
    });
    
    requestAnimationFrame(animateStars);
}

// 2. Scroll Reveal
const observerOptions = { threshold: 0.1 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Initialize
window.addEventListener('resize', initStars);
initStars();
animateStars();

// 3. Typing Effect for Terminal
const typingText = document.querySelector('.typing');
const text = "Searching for modules in quadrant 7...";
let index = 0;

function type() {
    if (index < text.length) {
        typingText.innerHTML += text.charAt(index);
        index++;
        setTimeout(type, 50);
    }
}
setTimeout(type, 1500);

// 4. Copy to Clipboard
const installCmd = document.querySelector('.install-cmd');
if (installCmd) {
    installCmd.addEventListener('click', () => {
        const textToCopy = "npm install aura-voyager"; // Using fixed text to avoid innerHTML issues
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalContent = installCmd.innerHTML;
            installCmd.innerHTML = '<span style="color: var(--primary)">✓ Copied!</span>';
            setTimeout(() => {
                installCmd.innerHTML = originalContent;
            }, 2000);
        });
    });
}
