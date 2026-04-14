// ===== IMPROVED SPACESHIP CURSOR SYSTEM =====
(function () {
    // Don't run on mobile / touch-only devices
    if (window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window) return;

    // --- 1. PINPOINT CURSOR (INSTANT FOLLOW, PRECISE ALIGNMENT) ---
    const pinpointEl = document.createElement('div');
    pinpointEl.id = 'cursor-pinpoint';
    document.body.appendChild(pinpointEl);

    const glowEl = document.createElement('div');
    glowEl.id = 'cursor-glow';
    document.body.appendChild(glowEl);

    // --- 2. SPACESHIP FOLLOWER ---
    const shipEl = document.createElement('div');
    shipEl.id = 'spaceship-cursor';
    shipEl.innerHTML = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(90deg);">
            <!-- The spaceship has been rotated 90 degrees in SVG so that 0-deg rotation in CSS points it RIGHT -->
            <g transform="translate(50, 50) rotate(-90) translate(-50, -50)">
                <path d="M50 10 L35 55 L40 55 L40 70 L45 75 L50 80 L55 75 L60 70 L60 55 L65 55 Z"
                      fill="#1a1a2e" stroke="var(--accent, #00ffbb)" stroke-width="1.5"/>
                <ellipse cx="50" cy="35" rx="6" ry="10" fill="rgba(0,255,187,0.3)" stroke="var(--accent, #00ffbb)" stroke-width="1"/>
                <path d="M35 55 L15 72 L20 75 L40 62 Z" fill="#0d0d1a" stroke="var(--accent, #00ffbb)" stroke-width="1"/>
                <path d="M65 55 L85 72 L80 75 L60 62 Z" fill="#0d0d1a" stroke="var(--accent, #00ffbb)" stroke-width="1"/>
                
                <!-- Engine Flares -->
                <ellipse cx="42" cy="78" rx="4" ry="6" fill="var(--accent, #00ffbb)" opacity="0.8" class="engine-flare" />
                <ellipse cx="50" cy="82" rx="5" ry="8" fill="#fff" opacity="0.9" class="engine-main" />
                <ellipse cx="58" cy="78" rx="4" ry="6" fill="var(--accent, #00ffbb)" opacity="0.8" class="engine-flare" />
            </g>
        </svg>`;
    document.body.appendChild(shipEl);

    // --- State Variables ---
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let shipX = mouseX;
    let shipY = mouseY;
    let currentAngle = 0; // The angle the ship is facing (0 is right, 90 is down)
    
    let speed = 0;
    let frameCount = 0;

    // --- Trail & Streak Pools for Performance ---
    const TRAIL_COUNT = 15;
    const trails = [];
    for (let i = 0; i < TRAIL_COUNT; i++) {
        const t = document.createElement('div');
        t.className = 'cursor-trail';
        document.body.appendChild(t);
        trails.push({ el: t, x: 0, y: 0, life: 0, active: false, size: 0, vx: 0, vy: 0 });
    }

    const STREAK_COUNT = 10;
    const streaks = [];
    for (let i = 0; i < STREAK_COUNT; i++) {
        const s = document.createElement('div');
        s.className = 'warp-streak';
        document.body.appendChild(s);
        streaks.push({ el: s, active: false, x: 0, y: 0, life: 0, angle: 0 });
    }

    let trailIndex = 0;
    let streakIndex = 0;

    // --- Event Listeners ---
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Pinpoint instantly matches mouse for zero-lag precision clicking
        pinpointEl.style.left = mouseX + 'px';
        pinpointEl.style.top = mouseY + 'px';
        
        // Glow also follows mouse closely
        glowEl.style.left = mouseX + 'px';
        glowEl.style.top = mouseY + 'px';
    });

    const hoverSelectors = 'a, button, input, textarea, select, .btn-futuristic, .cv-btn-ultimate, .hitech-widget, .project-card, .work-card, .event-card, [onclick], [role="button"]';
    
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(hoverSelectors)) {
            pinpointEl.classList.add('hovering');
            glowEl.classList.add('hovering');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(hoverSelectors)) {
            pinpointEl.classList.remove('hovering');
            glowEl.classList.remove('hovering');
        }
    });

    // --- Click Burst Generator ---
    document.addEventListener('mousedown', (e) => {
        pinpointEl.style.transform = 'translate(-50%, -50%) scale(0.5)';
        
        const PARTICLE_COUNT = 8;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const p = document.createElement('div');
            p.className = 'click-particle';
            p.style.left = mouseX + 'px';
            p.style.top = mouseY + 'px';
            document.body.appendChild(p);

            const angle = (Math.PI * 2 / PARTICLE_COUNT) * i;
            const velocity = 2 + Math.random() * 4;
            let px = mouseX;
            let py = mouseY;
            let pLife = 1;

            function animateBurst() {
                px += Math.cos(angle) * velocity;
                py += Math.sin(angle) * velocity;
                pLife -= 0.05;
                
                if (pLife <= 0) {
                    p.remove();
                    return;
                }
                
                p.style.left = px + 'px';
                p.style.top = py + 'px';
                p.style.opacity = pLife;
                p.style.transform = `translate(-50%, -50%) scale(${pLife})`;
                requestAnimationFrame(animateBurst);
            }
            requestAnimationFrame(animateBurst);
        }
        
        // Give the ship a little thrust kick
        speed += 15;
    });

    document.addEventListener('mouseup', () => {
        pinpointEl.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    // --- Spawner Logic ---
    function spawnTrail(x, y, angle) {
        const t = trails[trailIndex % TRAIL_COUNT];
        trailIndex++;
        
        // Spawn behind the ship
        const rad = (angle + 180) * Math.PI / 180;
        const offsetDist = 12; // Distance from ship center to engine
        
        t.x = x + Math.cos(rad) * offsetDist + (Math.random() - 0.5) * 6;
        t.y = y + Math.sin(rad) * offsetDist + (Math.random() - 0.5) * 6;
        t.life = 1;
        t.active = true;
        t.size = Math.random() * 3 + 2;
        
        // Engine exhaust velocity
        t.vx = Math.cos(rad) * (1 + Math.random() * 2);
        t.vy = Math.sin(rad) * (1 + Math.random() * 2);
    }

    function spawnStreak(x, y, angle) {
        const s = streaks[streakIndex % STREAK_COUNT];
        streakIndex++;
        
        const rad = (angle + 180) * Math.PI / 180;
        // Spread streaks around the ship wide
        const perpRad = rad + Math.PI/2;
        const spread = (Math.random() - 0.5) * 40;
        
        s.x = x + Math.cos(rad) * 15 + Math.cos(perpRad) * spread;
        s.y = y + Math.sin(rad) * 15 + Math.sin(perpRad) * spread;
        s.life = 1;
        s.active = true;
        s.angle = angle;
    }

    // --- Main Animation Loop ---
    let prevShipX = mouseX;
    let prevShipY = mouseY;

    function animate() {
        frameCount++;

        // Smooth follow logic for the ship
        // We use a tight ease so it doesn't lag too much, but has weight
        const distanceX = mouseX - shipX;
        const distanceY = mouseY - shipY;
        const dist = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        // Faster follow when further away
        const ease = Math.min(0.3, 0.1 + (dist * 0.005)); 
        
        shipX += distanceX * ease;
        shipY += distanceY * ease;

        // Calculate speed of the ship itself
        const dx = shipX - prevShipX;
        const dy = shipY - prevShipY;
        speed = Math.sqrt(dx * dx + dy * dy);

        // Rotation logic
        if (speed > 0.5) {
            // Target angle based on actual movement direction
            let targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            // Shortest path rotation
            let diff = targetAngle - currentAngle;
            while (diff > 180) diff -= 360;
            while (diff < -180) diff += 360;
            
            // We rotate rapidly towards movement
            currentAngle += diff * 0.25; 
        }

        // Apply transformations to ship
        shipEl.style.left = shipX + 'px';
        shipEl.style.top = shipY + 'px';
        
        // Scale down slightly when stationary to look like idling, and tilt up slightly with speed
        const scale = Math.min(1.1, 0.8 + (speed * 0.05));
        shipEl.style.transform = `translate(-50%, -50%) rotate(${currentAngle + 90}deg) scale(${scale})`;

        // Animate the engine flares based on speed
        const flares = document.querySelectorAll('.engine-flare, .engine-main');
        if (speed > 5) {
            flares.forEach(f => f.style.opacity = Math.random() * 0.5 + 0.5);
            // Spawn exhaust
            if (frameCount % 2 === 0) spawnTrail(shipX, shipY, currentAngle);
        } else {
            flares.forEach(f => f.style.opacity = Math.random() * 0.2 + 0.2);
        }

        // Warp streaks at high speeds
        if (speed > 12 && frameCount % 3 === 0) {
            spawnStreak(shipX, shipY, currentAngle);
        }

        // Process Trails
        for (const t of trails) {
            if (!t.active) continue;
            t.life -= 0.05;
            t.x += t.vx;
            t.y += t.vy;
            // Drag
            t.vx *= 0.9;
            t.vy *= 0.9;
            
            if (t.life <= 0) {
                t.active = false;
                t.el.style.opacity = '0';
                continue;
            }
            t.el.style.left = t.x + 'px';
            t.el.style.top = t.y + 'px';
            t.el.style.opacity = t.life;
            t.el.style.transform = `translate(-50%, -50%) scale(${t.size * Math.max(0, t.life)})`;
        }

        // Process Streaks
        for (const s of streaks) {
            if (!s.active) continue;
            s.life -= 0.1;
            
            // Move opposite to heading
            const rad = (s.angle + 180) * Math.PI / 180;
            s.x += Math.cos(rad) * 15;
            s.y += Math.sin(rad) * 15;
            
            if (s.life <= 0) {
                s.active = false;
                s.el.style.opacity = '0';
                continue;
            }
            s.el.style.left = s.x + 'px';
            s.el.style.top = s.y + 'px';
            s.el.style.opacity = s.life * 0.8;
            s.el.style.transform = `translate(-50%, -50%) rotate(${s.angle + 90}deg) scaleY(${1 + speed * 0.2})`;
        }

        prevShipX = shipX;
        prevShipY = shipY;

        requestAnimationFrame(animate);
    }

    animate();
})();
