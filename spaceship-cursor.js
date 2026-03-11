// ===== SPACESHIP CURSOR SYSTEM =====
(function () {
    // Don't run on mobile / touch-only devices
    if (window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window) return;

    // --- Inject HTML elements ---
    const shipEl = document.createElement('div');
    shipEl.id = 'spaceship-cursor';
    shipEl.innerHTML = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 10 L35 55 L40 55 L40 70 L45 75 L50 80 L55 75 L60 70 L60 55 L65 55 Z"
                  fill="#1a1a2e" stroke="var(--accent, #00ffbb)" stroke-width="1.5"/>
            <ellipse cx="50" cy="35" rx="6" ry="10" fill="rgba(0,255,187,0.3)" stroke="var(--accent, #00ffbb)" stroke-width="1"/>
            <path d="M35 55 L15 72 L20 75 L40 62 Z" fill="#0d0d1a" stroke="var(--accent, #00ffbb)" stroke-width="1"/>
            <path d="M65 55 L85 72 L80 75 L60 62 Z" fill="#0d0d1a" stroke="var(--accent, #00ffbb)" stroke-width="1"/>
            <ellipse cx="42" cy="78" rx="4" ry="6" fill="var(--accent, #00ffbb)" opacity="0.8">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="0.15s" repeatCount="indefinite"/>
                <animate attributeName="ry" values="5;8;5" dur="0.2s" repeatCount="indefinite"/>
            </ellipse>
            <ellipse cx="50" cy="82" rx="5" ry="8" fill="var(--accent, #00ffbb)" opacity="0.9">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="0.12s" repeatCount="indefinite"/>
                <animate attributeName="ry" values="7;11;7" dur="0.18s" repeatCount="indefinite"/>
            </ellipse>
            <ellipse cx="58" cy="78" rx="4" ry="6" fill="var(--accent, #00ffbb)" opacity="0.8">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="0.15s" repeatCount="indefinite"/>
                <animate attributeName="ry" values="5;8;5" dur="0.2s" repeatCount="indefinite"/>
            </ellipse>
            <circle cx="44" cy="50" r="2" fill="var(--accent, #00ffbb)" opacity="0.6">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1s" repeatCount="indefinite"/>
            </circle>
            <circle cx="56" cy="50" r="2" fill="var(--accent, #00ffbb)" opacity="0.6">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1s" repeatCount="indefinite" begin="0.5s"/>
            </circle>
        </svg>`;
    document.body.appendChild(shipEl);

    const glowEl = document.createElement('div');
    glowEl.id = 'cursor-glow';
    document.body.appendChild(glowEl);

    // --- State ---
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let shipX = mouseX;
    let shipY = mouseY;
    let currentAngle = 0;
    let prevMouseX = mouseX;
    let prevMouseY = mouseY;
    let speed = 0;
    let frameCount = 0;

    // --- Trail particle pool ---
    const TRAIL_COUNT = 20;
    const trails = [];
    for (let i = 0; i < TRAIL_COUNT; i++) {
        const t = document.createElement('div');
        t.className = 'cursor-trail';
        document.body.appendChild(t);
        trails.push({ el: t, x: 0, y: 0, life: 0, active: false, size: Math.random() * 4 + 2, vx: 0, vy: 0 });
    }

    // --- Warp streaks pool ---
    const STREAK_COUNT = 8;
    const streaks = [];
    for (let i = 0; i < STREAK_COUNT; i++) {
        const s = document.createElement('div');
        s.className = 'warp-streak';
        document.body.appendChild(s);
        streaks.push({ el: s, active: false, x: 0, y: 0, life: 0, angle: 0 });
    }

    let trailIndex = 0;
    let streakIndex = 0;

    // --- Mouse tracking ---
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // --- Hover detection ---
    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('a, button, input, textarea, select, .btn-futuristic, .cv-btn-ultimate, .hitech-widget, .project-card, .work-card, .event-card, [onclick], [role="button"]');
        if (target) {
            glowEl.classList.add('hovering');
            shipEl.style.filter = 'drop-shadow(0 0 12px var(--accent, #00ffbb)) drop-shadow(0 0 30px rgba(0, 255, 187, 0.5))';
        }
    });

    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('a, button, input, textarea, select, .btn-futuristic, .cv-btn-ultimate, .hitech-widget, .project-card, .work-card, .event-card, [onclick], [role="button"]');
        if (target) {
            glowEl.classList.remove('hovering');
            shipEl.style.filter = 'drop-shadow(0 0 8px var(--accent, #00ffbb)) drop-shadow(0 0 20px rgba(0, 255, 187, 0.3))';
        }
    });

    // --- Click explosion effect ---
    document.addEventListener('mousedown', (e) => {
        spawnClickExplosion(e.clientX, e.clientY);
    });

    function spawnClickExplosion(x, y) {
        // Expanding ring
        const ring = document.createElement('div');
        ring.className = 'click-ring';
        ring.style.left = x + 'px';
        ring.style.top = y + 'px';
        document.body.appendChild(ring);

        // Animate the ring expanding
        let ringSize = 10;
        let ringOpacity = 1;
        function animateRing() {
            ringSize += 6;
            ringOpacity -= 0.04;
            ring.style.width = ringSize + 'px';
            ring.style.height = ringSize + 'px';
            ring.style.opacity = Math.max(0, ringOpacity);
            ring.style.borderWidth = Math.max(0.5, 2 * ringOpacity) + 'px';
            if (ringOpacity > 0) {
                requestAnimationFrame(animateRing);
            } else {
                ring.remove();
            }
        }
        requestAnimationFrame(animateRing);

        // Burst particles shooting outward
        const PARTICLE_COUNT = 10;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const p = document.createElement('div');
            p.className = 'click-particle';
            p.style.left = x + 'px';
            p.style.top = y + 'px';
            document.body.appendChild(p);

            const angle = (Math.PI * 2 / PARTICLE_COUNT) * i + (Math.random() - 0.5) * 0.5;
            const velocity = 3 + Math.random() * 5;
            let px = x;
            let py = y;
            let pLife = 1;
            const pSize = 2 + Math.random() * 3;

            function animateParticle() {
                px += Math.cos(angle) * velocity;
                py += Math.sin(angle) * velocity;
                pLife -= 0.04;
                if (pLife <= 0) {
                    p.remove();
                    return;
                }
                p.style.left = px + 'px';
                p.style.top = py + 'px';
                p.style.opacity = pLife;
                p.style.width = p.style.height = (pSize * pLife) + 'px';
                requestAnimationFrame(animateParticle);
            }
            requestAnimationFrame(animateParticle);
        }

        // Brief ship scale pulse
        shipEl.style.transform = `translate(-50%, -50%) rotate(${currentAngle}deg) scale(1.4)`;
        setTimeout(() => {
            shipEl.style.transform = `translate(-50%, -50%) rotate(${currentAngle}deg) scale(1)`;
        }, 150);
    }

    // --- Spawn helpers ---
    function spawnTrail(x, y, angle) {
        const t = trails[trailIndex % TRAIL_COUNT];
        trailIndex++;
        const rad = (angle - 90) * Math.PI / 180;
        const offsetDist = 18;
        t.x = x - Math.cos(rad) * offsetDist + (Math.random() - 0.5) * 8;
        t.y = y - Math.sin(rad) * offsetDist + (Math.random() - 0.5) * 8;
        t.life = 1;
        t.active = true;
        t.size = Math.random() * 4 + 2;
        t.vx = -Math.cos(rad) * (1 + Math.random() * 2);
        t.vy = -Math.sin(rad) * (1 + Math.random() * 2);
    }

    function spawnStreak(x, y, angle) {
        const s = streaks[streakIndex % STREAK_COUNT];
        streakIndex++;
        const rad = (angle - 90) * Math.PI / 180;
        s.x = x - Math.cos(rad) * 25 + (Math.random() - 0.5) * 20;
        s.y = y - Math.sin(rad) * 25 + (Math.random() - 0.5) * 20;
        s.life = 1;
        s.active = true;
        s.angle = angle;
    }

    // --- Main animation loop ---
    function animate() {
        frameCount++;

        // Smooth follow
        const ease = 0.15;
        shipX += (mouseX - shipX) * ease;
        shipY += (mouseY - shipY) * ease;

        // Movement delta
        const dx = mouseX - prevMouseX;
        const dy = mouseY - prevMouseY;
        speed = Math.sqrt(dx * dx + dy * dy);

        // Rotation towards movement direction
        if (speed > 1.5) {
            const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
            let diff = targetAngle - currentAngle;
            while (diff > 180) diff -= 360;
            while (diff < -180) diff += 360;
            currentAngle += diff * 0.12;
        }

        // Position ship
        shipEl.style.left = shipX + 'px';
        shipEl.style.top = shipY + 'px';
        shipEl.style.transform = `translate(-50%, -50%) rotate(${currentAngle}deg) scale(${1 + speed * 0.005})`;

        // Position glow ring
        glowEl.style.left = shipX + 'px';
        glowEl.style.top = shipY + 'px';

        // Spawn exhaust trails when moving
        if (speed > 2 && frameCount % 2 === 0) {
            spawnTrail(shipX, shipY, currentAngle);
        }

        // Spawn warp streaks at high speed
        if (speed > 15 && frameCount % 4 === 0) {
            spawnStreak(shipX, shipY, currentAngle);
        }

        // Update trail particles
        for (const t of trails) {
            if (!t.active) continue;
            t.life -= 0.04;
            t.x += t.vx;
            t.y += t.vy;
            t.vx *= 0.96;
            t.vy *= 0.96;
            if (t.life <= 0) {
                t.active = false;
                t.el.style.opacity = '0';
                continue;
            }
            t.el.style.left = t.x + 'px';
            t.el.style.top = t.y + 'px';
            t.el.style.opacity = t.life * 0.8;
            t.el.style.width = t.el.style.height = (t.size * t.life) + 'px';
        }

        // Update warp streaks
        for (const s of streaks) {
            if (!s.active) continue;
            s.life -= 0.06;
            const rad = (s.angle - 90) * Math.PI / 180;
            s.x -= Math.cos(rad) * 4;
            s.y -= Math.sin(rad) * 4;
            if (s.life <= 0) {
                s.active = false;
                s.el.style.opacity = '0';
                continue;
            }
            s.el.style.left = s.x + 'px';
            s.el.style.top = s.y + 'px';
            s.el.style.opacity = s.life * 0.6;
            s.el.style.transform = `translate(-50%, -50%) rotate(${s.angle}deg) scaleY(${1 + speed * 0.1})`;
        }

        prevMouseX = mouseX;
        prevMouseY = mouseY;
        requestAnimationFrame(animate);
    }

    animate();
})();
