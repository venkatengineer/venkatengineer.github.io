// ===== SUBTLE INTERACTIVE BACKGROUND =====
// Floating star-field that gently reacts to mouse movement
(function () {
    if (window.matchMedia('(max-width: 768px)').matches) return;

    // Create container
    const container = document.createElement('div');
    container.id = 'interactive-bg';
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    document.body.prepend(container);

    const ctx = canvas.getContext('2d');
    let w, h;
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mousemove', (e) => {
        targetMouseX = (e.clientX / w - 0.5) * 2; // -1 to 1
        targetMouseY = (e.clientY / h - 0.5) * 2;
    });

    // Particles
    const PARTICLE_COUNT = 60;
    const particles = [];

    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00ffbb';

    // Parse accent color for rgba
    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return { r, g, b };
    }
    const accentRgb = hexToRgb(accent);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            baseX: Math.random() * w,
            baseY: Math.random() * h,
            size: Math.random() * 1.5 + 0.5,
            speedX: (Math.random() - 0.5) * 0.15,
            speedY: (Math.random() - 0.5) * 0.15,
            opacity: Math.random() * 0.3 + 0.05,
            pulseSpeed: Math.random() * 0.005 + 0.002,
            pulseOffset: Math.random() * Math.PI * 2,
            // How much this particle reacts to mouse (subtle)
            reactivity: Math.random() * 15 + 5
        });
    }

    let time = 0;

    function draw() {
        time++;
        ctx.clearRect(0, 0, w, h);

        // Smooth mouse interpolation
        mouseX += (targetMouseX - mouseX) * 0.03;
        mouseY += (targetMouseY - mouseY) * 0.03;

        for (const p of particles) {
            // Slow drift
            p.baseX += p.speedX;
            p.baseY += p.speedY;

            // Wrap around screen
            if (p.baseX < -20) p.baseX = w + 20;
            if (p.baseX > w + 20) p.baseX = -20;
            if (p.baseY < -20) p.baseY = h + 20;
            if (p.baseY > h + 20) p.baseY = -20;

            // Subtle parallax from mouse
            p.x = p.baseX + mouseX * p.reactivity;
            p.y = p.baseY + mouseY * p.reactivity;

            // Subtle pulse
            const pulse = Math.sin(time * p.pulseSpeed + p.pulseOffset) * 0.5 + 0.5;
            const currentOpacity = p.opacity * (0.6 + pulse * 0.4);
            const currentSize = p.size * (0.8 + pulse * 0.2);

            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${currentOpacity})`;
            ctx.fill();

            // Very faint glow for larger particles
            if (p.size > 1.2) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, currentSize * 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${currentOpacity * 0.08})`;
                ctx.fill();
            }
        }

        // Draw very subtle connection lines between nearby particles
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    const lineOpacity = (1 - dist / 120) * 0.04;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${lineOpacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(draw);
    }

    draw();
})();
