/* =============================================
   CYBERPUNK PORTFOLIO — MAIN.JS
   Three.js + GSAP + Lenis
   ============================================= */

(function () {
  'use strict';

  /* ── LENIS SMOOTH SCROLL ── */
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    smoothTouch: false,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Sync Lenis with GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ── THREE.JS SCENE ── */
  const canvas = document.getElementById('webgl-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 30);

  // Mouse tracking
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  // ── Particle system ──
  const PARTICLE_COUNT = 180;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors    = new Float32Array(PARTICLE_COUNT * 3);
  const sizes     = new Float32Array(PARTICLE_COUNT);

  const particleData = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const x = (Math.random() - 0.5) * 80;
    const y = (Math.random() - 0.5) * 60;
    const z = (Math.random() - 0.5) * 40;

    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const isRed = Math.random() < 0.18;
    colors[i * 3]     = isRed ? 1.0 : 0.22;
    colors[i * 3 + 1] = isRed ? 0.0 : 0.22;
    colors[i * 3 + 2] = isRed ? 0.13 : 0.22;

    sizes[i] = Math.random() * 2 + 0.5;

    particleData.push({
      x, y, z,
      vx: (Math.random() - 0.5) * 0.008,
      vy: (Math.random() - 0.5) * 0.008,
      vz: (Math.random() - 0.5) * 0.004,
      isRed,
    });
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const particleMat = new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ── Connection lines ──
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x2a2a2a,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const lineGeo = new THREE.BufferGeometry();
  const maxLines = 300;
  const linePositions = new Float32Array(maxLines * 6);
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lineSegments);

  // ── Floating wireframe geometries ──
  const geos = [
    new THREE.IcosahedronGeometry(1.2, 0),
    new THREE.OctahedronGeometry(1.0, 0),
    new THREE.TetrahedronGeometry(0.9, 0),
    new THREE.IcosahedronGeometry(0.8, 0),
    new THREE.OctahedronGeometry(1.4, 0),
  ];

  const meshes = geos.map((geo, i) => {
    const mat = new THREE.MeshBasicMaterial({
      color: i % 3 === 0 ? 0xff0033 : 0x222222,
      wireframe: true,
      transparent: true,
      opacity: i % 3 === 0 ? 0.35 : 0.12,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 15 - 5
    );
    mesh.userData = {
      rx: (Math.random() - 0.5) * 0.005,
      ry: (Math.random() - 0.5) * 0.008,
      rz: (Math.random() - 0.5) * 0.003,
      floatSpeed: Math.random() * 0.3 + 0.1,
      floatAmp: Math.random() * 1.5 + 0.5,
      baseY: mesh.position.y,
    };
    scene.add(mesh);
    return mesh;
  });

  // ── ASCII/symbol sprites in 3D ──
  function makeSymbolSprite(text, color = '#444444', size = 24) {
    const cvs = document.createElement('canvas');
    cvs.width = 64; cvs.height = 64;
    const ctx = cvs.getContext('2d');
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px 'Share Tech Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 32, 32);
    const tex = new THREE.CanvasTexture(cvs);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2.5, 2.5, 1);
    return sprite;
  }

  const symbols = ['</', '{}', '=>', '01', '\\', '//', '##', '&&'];
  symbols.forEach((sym) => {
    const sprite = makeSymbolSprite(sym, Math.random() < 0.25 ? '#ff0033' : '#333333');
    sprite.position.set(
      (Math.random() - 0.5) * 60,
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 20 - 5
    );
    sprite.userData = {
      vy: (Math.random() - 0.5) * 0.006,
      vx: (Math.random() - 0.5) * 0.003,
      baseX: sprite.position.x,
      baseY: sprite.position.y,
      t: Math.random() * Math.PI * 2,
    };
    scene.add(sprite);
    meshes.push(sprite);
  });

  // ── Update line connections ──
  function updateLines() {
    let lineIdx = 0;
    const pos = particleGeo.attributes.position.array;
    const DIST = 14;

    for (let i = 0; i < PARTICLE_COUNT && lineIdx < maxLines; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT && lineIdx < maxLines; j++) {
        const dx = pos[i*3]   - pos[j*3];
        const dy = pos[i*3+1] - pos[j*3+1];
        const dz = pos[i*3+2] - pos[j*3+2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist < DIST) {
          linePositions[lineIdx*6]   = pos[i*3];
          linePositions[lineIdx*6+1] = pos[i*3+1];
          linePositions[lineIdx*6+2] = pos[i*3+2];
          linePositions[lineIdx*6+3] = pos[j*3];
          linePositions[lineIdx*6+4] = pos[j*3+1];
          linePositions[lineIdx*6+5] = pos[j*3+2];
          lineIdx++;
        }
      }
    }

    lineGeo.setDrawRange(0, lineIdx * 2);
    lineGeo.attributes.position.needsUpdate = true;
  }

  // ── Render loop ──
  let clock = { t: 0 };

  function animate(ts) {
    requestAnimationFrame(animate);
    const t = ts * 0.001;

    // Mouse lerp
    mouse.tx += (mouse.x - mouse.tx) * 0.04;
    mouse.ty += (mouse.y - mouse.ty) * 0.04;

    camera.position.x += (mouse.tx * 8 - camera.position.x) * 0.02;
    camera.position.y += (mouse.ty * 4 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    // Animate particles
    const pos = particleGeo.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const d = particleData[i];
      d.x += d.vx;
      d.y += d.vy;
      d.z += d.vz;

      if (Math.abs(d.x) > 40) d.vx *= -1;
      if (Math.abs(d.y) > 30) d.vy *= -1;
      if (Math.abs(d.z) > 20) d.vz *= -1;

      pos[i*3]   = d.x;
      pos[i*3+1] = d.y;
      pos[i*3+2] = d.z;
    }
    particleGeo.attributes.position.needsUpdate = true;

    // Animate wireframes
    meshes.forEach((m, i) => {
      if (m.isSprite) {
        m.userData.t += 0.008;
        m.position.x = m.userData.baseX + Math.sin(m.userData.t) * 2;
        m.position.y = m.userData.baseY + Math.cos(m.userData.t * 0.7) * 1.5;
      } else if (m.isMesh) {
        m.rotation.x += m.userData.rx;
        m.rotation.y += m.userData.ry;
        m.rotation.z += m.userData.rz;
        m.position.y = m.userData.baseY + Math.sin(t * m.userData.floatSpeed) * m.userData.floatAmp;
      }
    });

    updateLines();
    renderer.render(scene, camera);
  }
  animate(0);

  // ── Resize ──
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Mouse move ──
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * -2;
  });

  /* ── GSAP ANIMATIONS ── */
  gsap.registerPlugin(ScrollTrigger);

  // Utility
  function revealIn(el, vars = {}) {
    return gsap.to(el, {
      opacity: 1,
      y: 0,
      x: 0,
      duration: 0.9,
      ease: 'power3.out',
      ...vars,
    });
  }

  /* ── HERO ENTRANCE ── */
  const heroTL = gsap.timeline({ defaults: { ease: 'power3.out' } });

  heroTL
    .to('.hero-tag', { opacity: 1, y: 0, duration: 0.6, delay: 0.3 })
    .from('.glitch-word', {
      y: 80,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power4.out',
    }, '-=0.2')
    .to('.hero-sub', { opacity: 1, duration: 0.6 }, '-=0.3')
    .to('.hero-cta-row', { opacity: 1, duration: 0.6 }, '-=0.2')
    .to('.hud-fill', { width: (i, el) => el.style.width || '100%', duration: 1.5, ease: 'power2.out', stagger: 0.15 }, '-=0.5');

  /* ── TYPEWRITER EFFECT ── */
  const phrases = ['FULL STACK DEV', 'CREATIVE CODER', 'UI / UX ENGINEER', 'WEBGL SPECIALIST'];
  let phraseIdx = 0;
  let charIdx = 0;
  let deleting = false;
  const typeEl = document.getElementById('typewriter');

  function typeLoop() {
    const phrase = phrases[phraseIdx];
    if (!deleting) {
      typeEl.textContent = phrase.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx === phrase.length) {
        deleting = true;
        setTimeout(typeLoop, 1600);
        return;
      }
    } else {
      typeEl.textContent = phrase.slice(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
      }
    }
    setTimeout(typeLoop, deleting ? 40 : 80);
  }
  setTimeout(typeLoop, 1000);

  /* ── GLITCH FLICKER (random) ── */
  function randomGlitch() {
    const target = document.querySelector('.hero-title');
    if (!target) return;
    gsap.to(target, {
      skewX: (Math.random() - 0.5) * 6,
      x: (Math.random() - 0.5) * 8,
      duration: 0.05,
      ease: 'none',
      onComplete() {
        gsap.to(target, { skewX: 0, x: 0, duration: 0.08 });
      },
    });
  }
  setInterval(randomGlitch, 3200 + Math.random() * 2000);

  /* ── SCROLL REVEALS ── */
  // Stagger delay from CSS custom property
  function scrollReveal(selector, from = {}, extra = {}) {
    document.querySelectorAll(selector).forEach((el) => {
      const delay = parseFloat(getComputedStyle(el).getPropertyValue('--delay') || 0);
      gsap.to(el, {
        opacity: 1,
        y: 0,
        x: 0,
        duration: 0.85,
        ease: 'power3.out',
        delay,
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
        ...extra,
      });
    });
  }

  scrollReveal('.reveal-up');
  scrollReveal('.reveal-left');
  scrollReveal('.reveal-right');

  /* ── STAT COUNTERS ── */
  document.querySelectorAll('.stat-number[data-count]').forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter() {
        gsap.to({ val: 0 }, {
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate() {
            el.textContent = String(Math.round(this.targets()[0].val)).padStart(2, '0');
          },
        });
        el.closest('.stat-panel')?.querySelector('.stat-fill')
          && gsap.to(el.closest('.stat-panel').querySelector('.stat-fill'), {
            width: el.closest('.stat-panel').querySelector('.stat-fill').style.width,
            duration: 1.4,
            ease: 'power2.out',
          });
      },
    });
  });

  /* ── SKILL BARS ── */
  document.querySelectorAll('.skill-bar[data-width]').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter() {
        gsap.to(el, {
          width: el.dataset.width + '%',
          duration: 1.2,
          ease: 'power2.out',
        });
      },
    });
  });

  /* ── SECTION TRANSITION GLITCH on enter ── */
  document.querySelectorAll('.section').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 75%',
      once: true,
      onEnter() {
        const title = sec.querySelector('.section-title');
        if (!title) return;
        const orig = title.style.opacity;
        let flickers = 0;
        const flicker = () => {
          title.style.opacity = flickers % 2 === 0 ? '0.1' : '1';
          flickers++;
          if (flickers < 8) setTimeout(flicker, 60);
          else title.style.opacity = orig || '1';
        };
        setTimeout(flicker, 200);
      },
    });
  });

  /* ── PARALLAX HUD ELEMENTS ── */
  gsap.to('.hero-corner-tl', {
    y: -30,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
  });
  gsap.to('.hero-corner-br', {
    y: 30,
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
  });

  /* ── MOBILE MENU ── */
  const menuBtn  = document.querySelector('.nav-menu-btn');
  const closeBtn = document.querySelector('.mobile-menu-close');
  const mobileMenu = document.querySelector('.mobile-menu');

  function openMenu() {
    mobileMenu.classList.add('open');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  menuBtn?.addEventListener('click', openMenu);
  closeBtn?.addEventListener('click', closeMenu);

  document.querySelectorAll('.mobile-link').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  /* ── CONTACT FORM ── */
  const form = document.getElementById('contact-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    const statusEl = form.querySelector('.form-hud-status');

    btn.disabled = true;
    btn.querySelector('.btn-text').textContent = 'TRANSMITTING...';
    if (statusEl) statusEl.textContent = 'SENDING';

    // Simulate send (replace with real fetch/email logic)
    setTimeout(() => {
      btn.querySelector('.btn-text').textContent = 'TRANSMITTED';
      if (statusEl) statusEl.textContent = 'SENT OK';
      gsap.fromTo(btn, { x: -3 }, { x: 3, duration: 0.05, repeat: 5, yoyo: true, onComplete: () => gsap.set(btn, { x: 0 }) });
      setTimeout(() => {
        btn.disabled = false;
        btn.querySelector('.btn-text').textContent = 'TRANSMIT';
        if (statusEl) statusEl.textContent = 'READY';
        form.reset();
      }, 3000);
    }, 1500);
  });

  /* ── NAV ACTIVE STATE on scroll ── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function updateNav() {
    const scrollY = window.scrollY;
    sections.forEach((sec) => {
      const top = sec.offsetTop - 100;
      const bot = top + sec.offsetHeight;
      const id  = sec.getAttribute('id');
      const link = document.querySelector(`.nav-link[href="#${id}"]`);
      if (link) {
        link.style.color = scrollY >= top && scrollY < bot ? 'var(--text)' : '';
      }
    });
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ── CURSOR CUSTOM ── */
  const cursorDot = document.createElement('div');
  cursorDot.className = 'cursor-dot';
  cursorDot.style.cssText = `
    position: fixed; width: 6px; height: 6px;
    background: var(--red); border-radius: 50%;
    pointer-events: none; z-index: 9999;
    transform: translate(-50%,-50%);
    transition: transform 0.1s, opacity 0.2s;
    box-shadow: 0 0 8px var(--red);
  `;

  const cursorRing = document.createElement('div');
  cursorRing.className = 'cursor-ring';
  cursorRing.style.cssText = `
    position: fixed; width: 28px; height: 28px;
    border: 1px solid rgba(255,0,51,0.4); border-radius: 50%;
    pointer-events: none; z-index: 9998;
    transform: translate(-50%,-50%);
    transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), width 0.3s, height 0.3s, opacity 0.2s;
  `;

  document.body.appendChild(cursorDot);
  document.body.appendChild(cursorRing);

  let cx = 0, cy = 0;

  window.addEventListener('mousemove', (e) => {
    cx = e.clientX; cy = e.clientY;
    cursorDot.style.left = cx + 'px';
    cursorDot.style.top  = cy + 'px';
    cursorRing.style.left = cx + 'px';
    cursorRing.style.top  = cy + 'px';
  });

  document.querySelectorAll('a, button, [tabindex="0"]').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      cursorRing.style.width  = '48px';
      cursorRing.style.height = '48px';
      cursorRing.style.borderColor = 'rgba(255,0,51,0.8)';
      cursorDot.style.transform = 'translate(-50%,-50%) scale(1.5)';
    });
    el.addEventListener('mouseleave', () => {
      cursorRing.style.width  = '28px';
      cursorRing.style.height = '28px';
      cursorRing.style.borderColor = 'rgba(255,0,51,0.4)';
      cursorDot.style.transform = 'translate(-50%,-50%) scale(1)';
    });
  });

  // Hide on mobile
  if ('ontouchstart' in window) {
    cursorDot.style.display = 'none';
    cursorRing.style.display = 'none';
  }

})();
