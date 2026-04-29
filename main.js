/* ============================================
   FORGE — Core Application Architecture
   v2.0 — Upgraded Animation Layer
   Going Merry choreography: UNTOUCHED
   ============================================ */

gsap.registerPlugin(ScrollTrigger);

/* ============================================
   SCENE ENGINE — UNTOUCHED
   ============================================ */
class SceneEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    
    this.initCamera();
    this.initRenderer();
    this.initLighting();
    
    this.modelGroup = new THREE.Group();
    this.scene.add(this.modelGroup);

    this.bindEvents();
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 1, 8);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
  }

  initLighting() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    
    const spotLight = new THREE.SpotLight(0xf5a623, 3);
    spotLight.position.set(4, 6, 4);
    spotLight.penumbra = 0.6;
    this.scene.add(spotLight);

    const rimLight = new THREE.PointLight(0xff6600, 2, 10);
    rimLight.position.set(-3, 2, -2);
    this.scene.add(rimLight);

    const fillLight = new THREE.PointLight(0x221100, 1, 8);
    fillLight.position.set(0, -2, 3);
    this.scene.add(fillLight);
  }

  bindEvents() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        ScrollTrigger.refresh();
      }, 150);
    });
  }

  render(activeModel, initialY) {
    if (activeModel) {
      const elapsed = this.clock.getElapsedTime();
      activeModel.position.y = initialY + (Math.sin(elapsed * 1.5) * 0.05); 
    }
    this.renderer.render(this.scene, this.camera);
  }
}

/* ============================================
   SPATIAL CHOREOGRAPHER — UNTOUCHED
   ============================================ */
class SpatialChoreographer {
  constructor(modelGroup, modelMesh, baseScale) {
    this.group = modelGroup;
    this.mesh = modelMesh;
    this.baseScale = baseScale;
    this.isMobile = window.innerWidth < 768;
    
    this.waypoints = {
      intro: { x: 0, y: -1.5, z: -6, rot: Math.PI * -0.1 },
      hero:  { x: this.isMobile ? 0 : 1.8, y: 0.8, z: 0, rot: Math.PI * 0.7 }, 
      about: { x: this.isMobile ? 0 : 2.2, y: 1.6, z: 0, rot: Math.PI * 0.2 } 
    };

    this.initSequence();
  }

  initSequence() {
    this.setupIntro();
    this.buildHeroTransition();
    this.buildAboutTransition();
    this.buildExitTransition();
  }

  setupIntro() {
    this.group.position.set(this.waypoints.intro.x, this.waypoints.intro.y, this.waypoints.intro.z);
    this.mesh.scale.set(this.baseScale * 0.5, this.baseScale * 0.5, this.baseScale * 0.5);
    this.group.rotation.y = this.waypoints.intro.rot; 

    gsap.to(this.mesh.scale, {
      x: this.baseScale * 0.6, y: this.baseScale * 0.6, z: this.baseScale * 0.6,
      duration: 8, ease: "power1.out"
    });
  }

  interpolateTransform(start, end, progress) {
    this.group.position.x = gsap.utils.interpolate(start.x, end.x, progress);
    this.group.position.y = gsap.utils.interpolate(start.y, end.y, progress);
    this.group.position.z = gsap.utils.interpolate(start.z, end.z, progress);
    this.group.rotation.y = gsap.utils.interpolate(start.rot, end.rot, progress);
  }

  buildHeroTransition() {
    ScrollTrigger.create({
      trigger: "#hero",
      start: "top bottom", 
      end: "center center", 
      scrub: 1,
      onEnter: () => gsap.killTweensOf(this.mesh.scale),
      onUpdate: (self) => {
        this.interpolateTransform(this.waypoints.intro, this.waypoints.hero, self.progress);
        const s = gsap.utils.interpolate(this.baseScale * 0.6, this.baseScale * 2.4, self.progress);
        this.mesh.scale.set(s, s, s);
      }
    });
  }

  buildAboutTransition() {
    ScrollTrigger.create({
      trigger: "#about",
      start: "top bottom", end: "center center", scrub: 1,
      onUpdate: (self) => {
        this.interpolateTransform(this.waypoints.hero, this.waypoints.about, self.progress);
        const s = gsap.utils.interpolate(this.baseScale * 2.8, this.baseScale * 1.2, self.progress);
        this.mesh.scale.set(s, s, s);
      }
    });
  }

  buildExitTransition() {
    ScrollTrigger.create({
      trigger: "#about",
      start: "center center", end: "bottom top", scrub: true,
      onUpdate: (self) => {
        this.group.position.y = gsap.utils.interpolate(this.waypoints.about.y, this.waypoints.about.y + 8, self.progress);
      }
    });
  }
}

/* ============================================
   EMBER PARTICLE SYSTEM
   ============================================ */
class EmberSystem {
  constructor() {
    this.canvas = document.getElementById('ember-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.spawn();
    this.loop();
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  spawn() {
    const target = 28;
    for (let i = this.particles.length; i < target; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  createParticle(randomY = false) {
    return {
      x:     Math.random() * window.innerWidth,
      y:     randomY ? Math.random() * window.innerHeight : window.innerHeight + 6,
      vx:    (Math.random() - 0.5) * 0.35,
      vy:    -(0.3 + Math.random() * 0.55),
      life:  0,
      maxLife: 160 + Math.random() * 120,
      radius: 0.8 + Math.random() * 1.4,
      flicker: Math.random() * Math.PI * 2,
    };
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((p, idx) => {
      p.life++;
      p.flicker += 0.07;
      p.x += p.vx + Math.sin(p.flicker * 0.6) * 0.18;
      p.y += p.vy;

      const progress = p.life / p.maxLife;
      const alpha = Math.sin(progress * Math.PI) * 0.55;
      const glow  = p.radius + Math.sin(p.flicker) * 0.4;

      const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glow * 3);
      grad.addColorStop(0,   `rgba(245,166,35,${alpha})`);
      grad.addColorStop(0.4, `rgba(255,100,10,${alpha * 0.5})`);
      grad.addColorStop(1,   `rgba(245,166,35,0)`);

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, glow * 3, 0, Math.PI * 2);
      this.ctx.fillStyle = grad;
      this.ctx.fill();

      if (p.life >= p.maxLife || p.y < -10) {
        this.particles[idx] = this.createParticle(false);
      }
    });
  }
}

/* ============================================
   CUSTOM CURSOR
   ============================================ */
class CursorSystem {
  constructor() {
    this.dot  = document.getElementById('cursorDot');
    this.ring = document.getElementById('cursorRing');
    if (!this.dot || !this.ring) return;

    this.mx = window.innerWidth  / 2;
    this.my = window.innerHeight / 2;
    this.rx = this.mx; 
    this.ry = this.my;

    this.bindEvents();
    this.loop();
  }

  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mx = e.clientX;
      this.my = e.clientY;
    });

    const targets = document.querySelectorAll('a, button, [data-magnetic], .project-card, .skill-tag');
    targets.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    this.rx += (this.mx - this.rx) * 0.12;
    this.ry += (this.my - this.ry) * 0.12;

    this.dot.style.left  = this.mx + 'px';
    this.dot.style.top   = this.my + 'px';
    this.ring.style.left = this.rx + 'px';
    this.ring.style.top  = this.ry + 'px';
  }
}

/* ============================================
   MAGNETIC PULL SYSTEM
   ============================================ */
class MagneticSystem {
  constructor() {
    const els = document.querySelectorAll('[data-magnetic]');
    els.forEach(el => this.bind(el));
  }

  bind(el) {
    const strength = 0.28;

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      gsap.to(el, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' });
    });

    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    });
  }
}

/* ============================================
   AI CARD RADIAL GLOW
   ============================================ */
class AICardGlow {
  constructor() {
    const cards = document.querySelectorAll('.ai-tool-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%';
        const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%';
        card.style.setProperty('--mx', x);
        card.style.setProperty('--my', y);
      });
    });
  }
}

/* ============================================
   PROJECT CARD TILT
   ============================================ */
class CardTilt {
  constructor() {
    document.querySelectorAll('[data-tilt]').forEach(card => this.bind(card));
  }

  bind(card) {
    const maxTilt = 6;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      gsap.to(card, {
        rotateY: x * maxTilt * 2,
        rotateX: -y * maxTilt * 2,
        duration: 0.4,
        ease: 'power2.out',
        transformPerspective: 800,
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
    });
  }
}

/* ============================================
   COUNTER ANIMATION
   ============================================ */
class CounterSystem {
  constructor() {
    const nums = document.querySelectorAll('.stat-num[data-count]');
    nums.forEach(el => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          const target = parseInt(el.dataset.count, 10);
          gsap.fromTo(el, { innerText: 0 }, {
            innerText: target,
            duration: 1.6,
            ease: 'power2.out',
            snap: { innerText: 1 },
            onUpdate() { el.innerText = Math.round(this.targets()[0].innerText); }
          });
        }
      });
    });
  }
}

/* ============================================
   SECTION TITLE SCAN SWEEP
   ============================================ */
class ScanReveal {
  constructor() {
    document.querySelectorAll('.section-title[data-scan]').forEach(el => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          gsap.fromTo(el, { opacity: 0, y: 18 }, {
            opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
            onComplete: () => el.classList.add('scan-active')
          });
        }
      });
    });
  }
}

/* ============================================
   DOM CONTROLLER
   ============================================ */
class DOMController {
  constructor() {
    this.initHeroBackground();
    this.initTypography();
    this.initScrollReveals();
    this.initParallaxHero();
  }
  
  initHeroBackground() {
    ScrollTrigger.create({
      trigger: "#hero", start: "top center", end: "bottom center",
      onEnter:      () => document.body.classList.add("hero-active"),
      onLeave:      () => document.body.classList.remove("hero-active"),
      onEnterBack:  () => document.body.classList.add("hero-active"),
      onLeaveBack:  () => document.body.classList.remove("hero-active")
    });

    ScrollTrigger.create({
      trigger: "#hero", start: "top center",
      onEnter: () => {
        gsap.fromTo(".hero-streak", { x: 0, opacity: 0 }, {
          x: window.innerWidth * 1.5, opacity: 1, duration: 1.2, ease: "power2.out",
          onComplete: () => gsap.to(".hero-streak", { opacity: 0, duration: 0.3 })
        });
      }
    });
  }

  initTypography() {
    const typedEl = document.getElementById('typed');
    if (!typedEl) return;
    new Typed('#typed', {
      strings: ['Web Developer.', 'Data Analyst.', 'Stack Agnostic.', "I don't pick sides. I pick outcomes."],
      typeSpeed: 50, backSpeed: 30, backDelay: 1500, startDelay: 500, loop: false
    });
  }

  initParallaxHero() {
    const heroContent = document.querySelector('.hero-content');
    if (!heroContent) return;
    window.addEventListener('mousemove', (e) => {
      const dx = (e.clientX / window.innerWidth  - 0.5) * 10;
      const dy = (e.clientY / window.innerHeight - 0.5) * 6;
      gsap.to(heroContent, { x: dx, y: dy, duration: 1.2, ease: 'power2.out' });
    });
  }
  
  initScrollReveals() {
    gsap.from(['.about-label', '.about-title', '.about-body', '.about-stats'], {
      opacity: 0, y: 40, duration: 1, stagger: 0.15, ease: 'power2.out',
      clearProps: 'all',
      scrollTrigger: { trigger: '#about', start: 'top 85%', toggleActions: 'play none none none' }
    });

    gsap.from(['.hero-tag', '.hero-name', '.hero-role', '.hero-divider', '.hero-loc'], {
      opacity: 0, y: 30, duration: 0.9, stagger: 0.12, ease: 'power2.out',
      clearProps: 'all',
      scrollTrigger: { trigger: '#hero', start: 'top 80%', toggleActions: 'play none none none' }
    });

    gsap.from('.project-card', {
      opacity: 0, y: 50, duration: 0.8, stagger: 0.08, ease: 'power2.out',
      clearProps: 'all',
      scrollTrigger: { trigger: '.projects-grid', start: 'top 85%', toggleActions: 'play none none none' }
    });

    gsap.from('.ai-tool-card', {
      opacity: 0, x: -30, duration: 0.7, stagger: 0.1, ease: 'power2.out',
      clearProps: 'all',
      scrollTrigger: { trigger: '.ai-grid', start: 'top 85%', toggleActions: 'play none none none' }
    });

    gsap.from('.stack-layer', {
      opacity: 0, y: 30, duration: 0.8, stagger: 0.2, ease: 'power2.out',
      clearProps: 'all',
      scrollTrigger: { trigger: '.skills', start: 'top 85%', toggleActions: 'play none none none' }
    });

    gsap.from('.skill-tag', {
      opacity: 0, y: 20, scale: 0.94, duration: 0.5, stagger: 0.04, ease: 'back.out(1.5)',
      clearProps: 'all',
      scrollTrigger: { trigger: '.skill-tags', start: 'top 85%', toggleActions: 'play none none none' }
    });

    gsap.from(['.contact .about-label', '.contact-title', '.contact-links'], {
      opacity: 0, y: 30, duration: 1, stagger: 0.15, ease: 'power2.out',
      clearProps: 'all',
      scrollTrigger: { trigger: '#contact', start: 'top 85%', toggleActions: 'play none none none' }
    });
  }
}

/* ============================================
   ORCHESTRATOR
   ============================================ */
class Application {
  constructor() {
    this.engine = new SceneEngine('webgl-canvas');
    this.dom    = new DOMController();
    this.activeModel  = null;
    this.initialModelY = 0;

    new EmberSystem();
    new CursorSystem();
    new MagneticSystem();
    new AICardGlow();
    new CardTilt();
    new CounterSystem();
    new ScanReveal();

    if (this.engine.canvas) {
      this.loadAssets();
    }
  }

  loadAssets() {
    const loader = new THREE.GLTFLoader();
    const loadingEl = document.getElementById('model-loading');

    loader.load('assets/going_merry.glb', 
      (gltf) => {
        this.activeModel = gltf.scene;

        const box    = new THREE.Box3().setFromObject(this.activeModel);
        const center = box.getCenter(new THREE.Vector3());
        const size   = box.getSize(new THREE.Vector3());
        this.activeModel.position.sub(center);
        this.initialModelY = this.activeModel.position.y;

        this.engine.modelGroup.add(this.activeModel);

        const maxDim   = Math.max(size.x, size.y, size.z);
        const baseScale = (window.innerWidth < 768 ? 1.8 : 2.5) / maxDim;
        new SpatialChoreographer(this.engine.modelGroup, this.activeModel, baseScale);

        ScrollTrigger.refresh(); 
        this.loop();

        // Hide loading indicator
        if (loadingEl) loadingEl.style.display = 'none';
      }, 
      undefined, 
      (err) => {
        console.warn('Going Merry failed to load, using fallback geometry:', err);
        // Hide loading indicator and show fallback
        if (loadingEl) loadingEl.style.display = 'none';

        // Create a fallback 3D mesh (amber dodecahedron)
        const geo = new THREE.DodecahedronGeometry(1.2, 1);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xf5a623,
          metalness: 0.6,
          roughness: 0.3
        });
        const fallbackMesh = new THREE.Mesh(geo, mat);
        fallbackMesh.castShadow = false;
        fallbackMesh.receiveShadow = false;

        this.activeModel = fallbackMesh;
        this.initialModelY = 0; // no offset needed

        this.engine.modelGroup.add(this.activeModel);

        const box = new THREE.Box3().setFromObject(this.activeModel);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const baseScale = (window.innerWidth < 768 ? 1.8 : 2.5) / maxDim;
        new SpatialChoreographer(this.engine.modelGroup, this.activeModel, baseScale);

        ScrollTrigger.refresh();
        this.loop();
      }
    );
  }

  loop = () => {
    requestAnimationFrame(this.loop);
    this.engine.render(this.activeModel, this.initialModelY);
  }
}

window.addEventListener('load', () => new Application());

/* ============================================
   PLAYGROUND SYSTEM ARCHITECTURE
   ============================================ */

class PlaygroundSystem {
  constructor() {
    this.trigger = document.getElementById('pg-trigger');
    this.dropdown = document.getElementById('pg-dropdown');
    this.container = document.getElementById('pg-container');
    this.closeBtn = document.getElementById('pg-close');
    this.contentArea = document.getElementById('pg-content');
    this.titleArea = document.getElementById('pg-title');
    
    this.activeApp = null;
    
    this.appRegistry = {
      typing: TypingApp,
      cleaner: CleanerApp,
      calculator: CalculatorApp,
      canvas: CanvasApp,
      puzzle: PuzzleApp,
      quiz: QuizApp
    };

    this.bindEvents();
  }

  bindEvents() {
    if (!this.trigger || !this.dropdown) return;
    
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!this.dropdown.contains(e.target) && e.target !== this.trigger) {
        this.dropdown.classList.remove('active');
      }
    });

    this.dropdown.querySelectorAll('.pg-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openApp(btn.dataset.app, btn.textContent);
        this.dropdown.classList.remove('active');
      });
    });

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closeApp());
    }
  }

  openApp(appId, title) {
    if (!this.appRegistry[appId]) return;

    this.titleArea.textContent = title;
    this.contentArea.innerHTML = ''; 
    this.container.classList.remove('hidden');
    
    document.body.classList.add('pg-open');

    if (this.activeApp && typeof this.activeApp.destroy === 'function') {
      this.activeApp.destroy();
    }

    this.activeApp = new this.appRegistry[appId](this.contentArea);
    this.activeApp.init();
  }

  closeApp() {
    this.container.classList.add('hidden');
    document.body.classList.remove('pg-open'); 
    
    setTimeout(() => {
      if (this.activeApp && typeof this.activeApp.destroy === 'function') {
        this.activeApp.destroy();
      }
      this.contentArea.innerHTML = '';
      this.activeApp = null;
    }, 400); 
  }
}

/* ============================================
   MINI APP IMPLEMENTATIONS
   ============================================ */
class TypingApp {
  constructor(container) { 
    this.container = container; 
    this.currentDifficulty = 'medium'; 
    this.isLoading = false;
    this.history = []; 
    
    this.fallbackQuotes = {
      easy: [
        "I will leave tomorrow's problems to tomorrow's me.",
        "A dropout will beat a genius through hard work.",
        "To defeat evil, I shall become an even greater evil."
      ],
      medium: [
        "Hard work is worthless for those that don't believe in themselves.",
        "Fear is not evil. It tells you what your weakness is. And once you know your weakness, you can become stronger.",
        "Whatever you lose, you'll find it again. But what you throw away you'll never get back."
      ],
      hard: [
        "A lesson without pain is meaningless. That's because no one can gain without sacrificing something. But by enduring that pain and overcoming it, he shall obtain a powerful, unmatched heart.",
        "If you feel yourself hitting up against your limit, remember for what cause you clench your fists. Remember why you started down this path, and let that memory carry you beyond your breaking point."
      ]
    };
  }
  
  init() {
    this.container.innerHTML = `
      <div class="pg-app-wrapper pg-fade-in" style="height: 100%; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div class="typing-stats">
            <span>WPM: <span id="twpm" style="color:var(--text)">0</span></span>
            <span>ACC: <span id="tacc" style="color:var(--text)">100</span>%</span>
          </div>
          
          <div class="type-diff-selector" style="display:flex; gap:8px;">
            <button class="pg-btn diff-btn" data-level="easy">Easy</button>
            <button class="pg-btn diff-btn active" data-level="medium" style="border-color:var(--accent); color:var(--accent)">Medium</button>
            <button class="pg-btn diff-btn" data-level="hard">Hard</button>
          </div>
        </div>

        <div id="ttext" class="typing-text">Initializing connection...</div>
        
        <input type="text" id="tinput" class="pg-input" autocomplete="off" placeholder="Wait for quote..." disabled>
        
        <button id="treset" class="pg-btn-primary" style="margin-top: 10px; width:fit-content;" disabled>Skip Quote</button>

        <div id="thistory" class="typing-history"></div>
      </div>
    `;
    
    this.textDiv = document.getElementById('ttext');
    this.input = document.getElementById('tinput');
    this.resetBtn = document.getElementById('treset');
    this.historyDiv = document.getElementById('thistory');
    
    this.inputHandler = (e) => this.processInput(e.target.value);
    this.input.addEventListener('input', this.inputHandler);
    this.resetBtn.addEventListener('click', () => this.resetState());

    this.container.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if(this.isLoading) return;
        
        this.container.querySelectorAll('.diff-btn').forEach(b => {
          b.style.borderColor = 'var(--border-dim)';
          b.style.color = 'var(--muted)';
        });
        e.target.style.borderColor = 'var(--accent)';
        e.target.style.color = 'var(--accent)';
        
        this.currentDifficulty = e.target.dataset.level;
        this.resetState();
      });
    });
    
    this.resetState();
  }

  async fetchOnlineQuote(level) {
    let url = 'https://api.quotable.io/random?tags=motivational'; 
    if (level === 'easy') url += '&maxLength=60';
    if (level === 'medium') url += '&minLength=61&maxLength=150';
    if (level === 'hard') url += '&minLength=151';

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network error");
      const data = await response.json();
      return data.content;
    } catch (error) {
      const fallbacks = this.fallbackQuotes[level];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }

  async resetState() {
    this.isLoading = true;
    this.input.disabled = true;
    this.resetBtn.disabled = true;
    this.input.value = '';
    this.input.placeholder = "Establishing uplink...";
    this.textDiv.innerHTML = `<span style="color:var(--muted); font-size:0.9rem; animation: pgBlink 1s infinite;">Fetching data stream...</span>`;
    document.getElementById('twpm').textContent = '0';
    document.getElementById('tacc').textContent = '100';

    this.text = await this.fetchOnlineQuote(this.currentDifficulty);
    
    this.startTime = null;
    this.errors = 0;
    this.textDiv.innerHTML = this.text.split('').map(char => `<span>${char}</span>`).join('');
    this.textDiv.querySelector('span').classList.add('active');
    
    this.isLoading = false;
    this.input.disabled = false;
    this.resetBtn.disabled = false;
    this.input.placeholder = "Start typing here...";
    this.resetBtn.textContent = "Skip Quote";
    this.input.focus();
  }

  processInput(val) {
    if (this.isLoading) return;
    if (!this.startTime) this.startTime = new Date();
    
    const spans = this.textDiv.querySelectorAll('span');
    spans.forEach(s => s.className = '');
    
    this.errors = 0;
    let correctChars = 0;
    let justErrored = false;

    for (let i = 0; i < spans.length; i++) {
      if (i < val.length) {
        if (val[i] === this.text[i]) {
          spans[i].classList.add('correct');
          correctChars++;
        } else {
          spans[i].classList.add('incorrect');
          this.errors++;
          if (i === val.length - 1) justErrored = true; 
        }
      } else if (i === val.length) {
        spans[i].classList.add('active');
      }
    }

    if (justErrored) {
      this.input.classList.remove('pg-shake');
      void this.input.offsetWidth; 
      this.input.classList.add('pg-shake');
    }

    const timeElapsed = (new Date() - this.startTime) / 60000;
    const wpm = timeElapsed > 0 ? Math.round((correctChars / 5) / timeElapsed) : 0;
    const acc = val.length > 0 ? Math.round(((val.length - this.errors) / val.length) * 100) : 100;

    document.getElementById('twpm').textContent = wpm;
    document.getElementById('tacc').textContent = Math.max(0, acc);

    if (val === this.text) {
      this.handleCompletion(wpm, Math.max(0, acc));
    }
  }

  handleCompletion(finalWpm, finalAcc) {
    this.history.unshift({
      text: this.text,
      wpm: finalWpm,
      acc: finalAcc
    });

    this.historyDiv.innerHTML = this.history.map(item => `
      <div class="typing-history-item">
        <span class="stats">[${item.wpm} WPM | ${item.acc}%]</span>
        ${item.text}
      </div>
    `).join('');

    this.resetState();
  }
}

class CleanerApp {
  constructor(container) { this.container = container; }
  
  init() {
    this.container.innerHTML = `
      <div class="pg-app-wrapper pg-fade-in" style="flex-direction:row; flex-wrap: wrap;">
        
        <div style="flex:1; min-width:300px; display:flex; flex-direction:column; gap:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <label style="color:var(--muted); font-size:0.8rem;">Raw Data Input</label>
            
            <select id="cl-mode" class="pg-input" style="width:auto; padding: 6px 12px; font-size: 0.8rem; cursor: pointer;">
              <option value="auto">🪄 Auto-Detect Intent</option>
              <option value="grid">🧮 Smart Grid (Table/Excel)</option>
              <option value="contacts">👥 Extract Contacts</option>
              <option value="keyvalue">📊 Parse Key-Value</option>
              <option value="deepclean">🧼 Deep Clean (Messy)</option>
              <option value="dedupe">🧹 Remove Duplicates</option>
            </select>
          </div>

          <textarea id="cl-in" class="pg-textarea" style="height:250px; font-family:var(--font-body); line-height: 1.5; white-space: nowrap; overflow-x: auto;" placeholder="Paste chaotic data, anime lists, or broken Excel rows here..."></textarea>
          <button id="cl-btn" class="pg-btn-primary">Execute Operation</button>
        </div>
        
        <div style="flex:1; min-width:300px; display:flex; flex-direction:column; gap:10px;">
          <label style="color:var(--muted); font-size:0.8rem;">Structured Output</label>
          
          <div id="cl-out" class="data-table-wrapper" style="flex:1; border: 1px solid var(--border-dim); border-radius: 6px; padding: 10px; background: rgba(0,0,0,0.3); overflow-y: auto; overflow-x: auto; height: 250px;">
            <p class="typing-text" style="font-size:0.9rem; color:var(--muted);">Organized results will appear here.</p>
          </div>
          
          <button id="cl-copy" class="pg-btn-primary" style="display:none; background:transparent; border-style: dashed;">Copy to Clipboard</button>
        </div>
      </div>
    `;
    
    document.getElementById('cl-btn').addEventListener('click', () => this.processData());
    document.getElementById('cl-copy').addEventListener('click', (e) => this.copyData(e.target));
  }

  processData() {
    const btn = document.getElementById('cl-btn');
    const raw = document.getElementById('cl-in').value;
    const out = document.getElementById('cl-out');
    const copyBtn = document.getElementById('cl-copy');
    const mode = document.getElementById('cl-mode').value;
    
    if (!raw.trim()) return;

    btn.textContent = "Processing Pipeline...";
    btn.disabled = true;
    out.innerHTML = `<p class="typing-text" style="font-size:0.9rem; animation: pgBlink 1s infinite; color: var(--accent);">Executing algorithms...</p>`;
    copyBtn.style.display = 'none';

    setTimeout(() => {
      try {
        switch(mode) {
          case 'auto':
            if (raw.includes('\t') || raw.split('\n')[0].split(/\s{2,}/).length > 2) {
              this.runSmartGrid(raw, out); 
            } else if (/@[a-zA-Z0-9.-]+/.test(raw) && /\d{7,15}/.test(raw)) {
              this.runEntityExtraction(raw, out); 
            } else if (/:/.test(raw)) {
              this.runKeyValueParsing(raw, out); 
            } else {
              this.runSmartGrid(raw, out); 
            }
            break;
          case 'grid': this.runSmartGrid(raw, out); break;
          case 'deepclean': this.runDeepClean(raw, out); break;
          case 'contacts': this.runEntityExtraction(raw, out); break;
          case 'keyvalue': this.runKeyValueParsing(raw, out); break;
          case 'dedupe': this.runDeduplication(raw, out); break;
        }
      } catch (error) {
        out.innerHTML = `<p style="color:#ff4444; font-size:0.9rem;">[Failed] ${error.message}</p>`;
      }

      btn.textContent = "Execute Operation";
      btn.disabled = false;
      if (!out.innerHTML.includes('[Failed]')) copyBtn.style.display = 'block';
      
      out.classList.remove('pg-fade-in'); void out.offsetWidth; out.classList.add('pg-fade-in');
    }, 400);
  }

  runSmartGrid(raw, outTarget) {
    let normalized = raw
      .replace(/\t/g, '  ') 
      .replace(/([a-z])([A-Z])/g, '$1  $2') 
      .replace(/(\d)([a-zA-Z])/g, '$1  $2') 
      .replace(/(TRUE|FALSE)/gi, '  $1  ')  
      .replace(/([✅❎])/g, '  $1  ');       

    const lines = normalized.split('\n').filter(l => l.trim() !== '');
    let maxCols = 0;
    
    const rows = lines.map(line => {
      let cols = line.split(/,{1,}|\|{1,}|\s{2,}/).map(c => c.trim()).filter(c => c);
      if (cols.length > maxCols) maxCols = cols.length;
      return cols;
    });

    if (maxCols === 0) throw new Error("No tabular data detected.");

    let html = `<table class="data-table" id="clean-output-data" style="width:100%; text-align:left; white-space:nowrap; font-size: 0.85rem;">
                  <thead><tr>`;
    
    for(let i = 0; i < maxCols; i++) {
      html += `<th style="padding:8px; border-bottom:1px solid var(--border-bright); color:var(--accent);">Col ${i+1}</th>`;
    }
    html += `</tr></thead><tbody>`;

    rows.forEach(cols => {
      html += `<tr>`;
      for(let i = 0; i < maxCols; i++) {
        html += `<td style="padding:8px; border-bottom:1px solid var(--border-dim);">${cols[i] || '-'}</td>`;
      }
      html += `</tr>`;
    });

    html += `</tbody></table>`;
    outTarget.innerHTML = html;
  }

  runDeepClean(raw, outTarget) {
    let normalized = raw.replace(/\t/g, '   ');
    const lines = normalized.split(/\n/).filter(l => l.trim() !== '');
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    const phoneRegex = /(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/;

    let html = `<table class="data-table" id="clean-output-data" style="width:100%; text-align:left;">
                  <thead><tr>
                    <th style="padding:8px; border-bottom:1px solid var(--border-bright); color:var(--accent);">Cleaned Name</th>
                    <th style="padding:8px; border-bottom:1px solid var(--border-bright); color:var(--accent);">Email</th>
                    <th style="padding:8px; border-bottom:1px solid var(--border-bright); color:var(--accent);">Local Phone</th>
                  </tr></thead><tbody>`;

    lines.forEach(line => {
      let current = line;
      let record = { Name: "N/A", Email: "N/A", Phone: "N/A" };

      const emailMatch = current.match(emailRegex);
      if (emailMatch) { record.Email = emailMatch[0].toLowerCase(); current = current.replace(emailMatch[0], ' '); }

      const phoneMatch = current.match(phoneRegex);
      if (phoneMatch) {
        let rawPhone = phoneMatch[0];
        let digits = rawPhone.replace(/\D/g, '');
        let localPhone = digits.length >= 10 ? digits.slice(-10) : digits;
        if(localPhone.length === 10) localPhone = localPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        record.Phone = localPhone;
        current = current.replace(rawPhone, ' '); 
      }

      current = current.replace(/([a-z])([A-Z])/g, '$1 $2');
      current = current.replace(/\b(Mr|Mrs|Ms|Miss|Dr|Prof|Sir|Madam|Rev|Hon)\.?\s*/gi, ' ');
      current = current.replace(/(name|email|phone|contact|tel)[\s:,-]*/gi, ' ');
      current = current.replace(/[\[\]{},:-]/g, ' ').replace(/\s{2,}/g, ' ').trim();
      if (current) record.Name = current.replace(/\b\w/g, l => l.toUpperCase());

      html += `<tr>
                <td style="padding:8px; border-bottom:1px solid var(--border-dim);">${record.Name}</td>
                <td style="padding:8px; border-bottom:1px solid var(--border-dim); color:var(--muted);">${record.Email}</td>
                <td style="padding:8px; border-bottom:1px solid var(--border-dim);">${record.Phone}</td>
               </tr>`;
    });
    html += `</tbody></table>`; outTarget.innerHTML = html;
  }

  runEntityExtraction(raw, outTarget) { }
  runKeyValueParsing(raw, outTarget) { }
  runDeduplication(raw, outTarget) { }

  copyData(btn) {
    const outData = document.getElementById('clean-output-data');
    if (!outData) return;
    let textToCopy = "";

    if (outData.tagName.toLowerCase() === 'table') {
      outData.querySelectorAll('tr').forEach(row => {
        const cols = Array.from(row.querySelectorAll('th, td')).map(col => col.innerText.trim());
        textToCopy += cols.join('\t') + '\n';
      });
    } else {
      textToCopy = outData.innerText;
    }

    navigator.clipboard.writeText(textToCopy.trim()).then(() => {
      const orig = btn.innerText;
      btn.innerText = "Copied for Excel!";
      btn.style.borderColor = "#4caf50"; btn.style.color = "#4caf50";
      setTimeout(() => { btn.innerText = orig; btn.style.borderColor = "var(--border-bright)"; btn.style.color = "var(--text)"; }, 2000);
    });
  }
}

/* ============================================
   SMART CALCULATOR (VISUAL AST)
   ============================================ */
class CalculatorApp {
  constructor(container) { 
    this.container = container; 
    
    // Camera / Canvas State
    this.cam = { x: 0, y: 0, zoom: 1 };
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    
    // Load persisted AST state
    const savedData = localStorage.getItem('forge_visual_calc');
    if (savedData) {
      try { this.tree = JSON.parse(savedData); } catch(e) { this.initDefaultTree(); }
    } else {
      this.initDefaultTree();
    }
  }

  initDefaultTree() {
    this.tree = {
      id: 'root', name: 'Total Output', type: 'operation', val: 0, op: '+',
      children: [
        { id: this.generateId(), name: 'Input A', type: 'value', val: 1000, op: '+', children: [] },
        { id: this.generateId(), name: 'Input B', type: 'value', val: 500, op: '+', children: [] }
      ]
    };
  }
  
  init() {
    this.container.innerHTML = `
      <div class="pg-app-wrapper pg-fade-in" style="height: 100%; display: flex; flex-direction: column;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
          <div>
            <label style="color:var(--accent); font-size:1.1rem; font-family:var(--font-head);">Data Graph Workspace</label>
            <p style="font-size: 0.75rem; color:var(--muted);">Scroll to Zoom. Click & Drag background to Pan.</p>
          </div>
          <button id="vc-reset" class="pg-btn" style="border-color:#ff4444; color:#ff4444;">Clear Workspace</button>
        </div>
        
        <div id="vc-viewport" class="vc-viewport">
          <div id="vc-canvas" class="vc-tree-canvas"></div>
          
          <div class="vc-zoom-controls">
            <button id="z-out" class="vc-z-btn">-</button>
            <span id="z-pct" class="vc-z-pct">100%</span>
            <button id="z-in" class="vc-z-btn">+</button>
            <button id="z-reset" class="vc-z-btn" style="width:auto; padding:0 10px; font-size:0.7rem;">RESET</button>
          </div>
        </div>
      </div>
    `;
    
    this.viewport = document.getElementById('vc-viewport');
    this.canvas = document.getElementById('vc-canvas');
    
    this.initCamera();
    this.bindASTEvents();

    document.getElementById('vc-reset').addEventListener('click', () => {
      this.tree = { id: 'root', name: 'Output', type: 'value', val: 0, op: '+', children: [] };
      this.centerCamera();
      this.fullRender();
    });

    this.fullRender();
    // Center the tree on initial load after DOM has painted
    setTimeout(() => this.centerCamera(), 50); 
  }

  // ==========================================
  // CAMERA & INFINITE CANVAS ENGINE
  // ==========================================
  initCamera() {
    // 1. Pan (Drag) Logic
    this.viewport.addEventListener('pointerdown', (e) => {
      // Do not pan if the user is interacting with a node's inputs or buttons
      if (e.target.closest('.vc-node')) return; 
      
      this.isDragging = true;
      this.dragStart.x = e.clientX - this.cam.x;
      this.dragStart.y = e.clientY - this.cam.y;
      this.viewport.style.cursor = 'grabbing';
      this.viewport.setPointerCapture(e.pointerId);
    });

    this.viewport.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      this.cam.x = e.clientX - this.dragStart.x;
      this.cam.y = e.clientY - this.dragStart.y;
      this.updateCameraTransform();
    });

    this.viewport.addEventListener('pointerup', () => {
      this.isDragging = false;
      this.viewport.style.cursor = 'grab';
    });

    // 2. Zoom (Scroll) Logic with Cursor Tracking
    this.viewport.addEventListener('wheel', (e) => {
      e.preventDefault(); // Stop page from scrolling
      
      const zoomIntensity = 0.0015;
      const delta = -e.deltaY * zoomIntensity;
      const newZoom = Math.min(Math.max(0.15, this.cam.zoom + delta), 3); // Clamp between 15% and 300%

      // Calculate mouse position relative to viewport
      const rect = this.viewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Mathematical offset to zoom IN to the mouse cursor
      this.cam.x = mouseX - (mouseX - this.cam.x) * (newZoom / this.cam.zoom);
      this.cam.y = mouseY - (mouseY - this.cam.y) * (newZoom / this.cam.zoom);
      this.cam.zoom = newZoom;

      this.updateCameraTransform();
    }, { passive: false });

    // 3. UI Zoom Button Logic
    document.getElementById('z-in').addEventListener('click', () => this.animateZoom(0.2));
    document.getElementById('z-out').addEventListener('click', () => this.animateZoom(-0.2));
    document.getElementById('z-reset').addEventListener('click', () => this.centerCamera());
  }

  animateZoom(amount) {
    const rect = this.viewport.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const newZoom = Math.min(Math.max(0.15, this.cam.zoom + amount), 3);
    this.cam.x = centerX - (centerX - this.cam.x) * (newZoom / this.cam.zoom);
    this.cam.y = centerY - (centerY - this.cam.y) * (newZoom / this.cam.zoom);
    this.cam.zoom = newZoom;
    this.updateCameraTransform();
  }

  centerCamera() {
    const rect = this.viewport.getBoundingClientRect();
    this.cam.zoom = 1;
    this.cam.x = 0; 
    this.cam.y = 50; 
    
    this.canvas.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    this.updateCameraTransform();
    
    setTimeout(() => this.canvas.style.transition = 'none', 300);
  }

  updateCameraTransform() {
    this.canvas.style.transform = `translate3d(${this.cam.x}px, ${this.cam.y}px, 0) scale(${this.cam.zoom})`;
    document.getElementById('z-pct').innerText = `${Math.round(this.cam.zoom * 100)}%`;
    this.viewport.style.backgroundPosition = `${this.cam.x}px ${this.cam.y}px`;
    this.viewport.style.backgroundSize = `${40 * this.cam.zoom}px ${40 * this.cam.zoom}px`;
  }

  // ==========================================
  // AST LOGIC & DOM BINDING 
  // ==========================================
  bindASTEvents() {
    this.canvas.addEventListener('click', (e) => {
      const target = e.target;
      if (target.classList.contains('vc-add-btn')) this.branchNode(target.dataset.id);
      if (target.classList.contains('vc-delete-btn')) this.deleteNode(target.dataset.id);
    });

    this.canvas.addEventListener('input', (e) => {
      const target = e.target;
      const id = target.dataset.id;
      
      if (target.classList.contains('vc-name-input')) {
        this.updateNodeData(id, 'name', target.value);
        this.saveState(); 
      } 
      else if (target.classList.contains('vc-val-input')) {
        const val = target.value === '' ? '' : Number(target.value);
        this.updateNodeData(id, 'val', isNaN(val) ? 0 : val);
        this.softUpdate();
      } 
      else if (target.classList.contains('vc-op-select')) {
        this.updateNodeData(id, 'op', target.value);
        this.softUpdate();
      }
    });
  }

  generateId() { return 'n_' + Math.random().toString(36).substr(2, 9); }

  evaluateNode(node) {
    if (node.type === 'value') return Number(node.val) || 0;
    if (!node.children || node.children.length === 0) return 0;
    const vals = node.children.map(child => this.evaluateNode(child));
    
    let rawResult = 0;
    switch(node.op) {
      case '+': rawResult = vals.reduce((a, b) => a + b, 0); break;
      case '-': rawResult = vals.length > 0 ? vals.reduce((a, b) => a - b) : 0; break;
      case '*': rawResult = vals.reduce((a, b) => a * b, 1); break;
      case '/': rawResult = vals.length > 0 ? vals.reduce((a, b) => b !== 0 ? a / b : 0) : 0; break;
    }
    return Math.round(rawResult * 100000) / 100000;
  }

  findNode(node, id) {
    if (node.id === id) return node;
    for (let child of node.children || []) {
      let found = this.findNode(child, id);
      if (found) return found;
    }
    return null;
  }

  findParent(node, childId) {
    if (!node.children) return null;
    for (let child of node.children) {
      if (child.id === childId) return node;
      let found = this.findParent(child, childId);
      if (found) return found;
    }
    return null;
  }

  updateNodeData(id, key, value) {
    const node = this.findNode(this.tree, id);
    if (node) node[key] = value;
  }

  branchNode(id) {
    const node = this.findNode(this.tree, id);
    if (!node) return;

    if (node.type === 'value') {
      const currentVal = Number(node.val) || 0;
      node.type = 'operation';
      node.op = '+';
      node.children = [
        { id: this.generateId(), name: 'Base Value', type: 'value', val: currentVal, op: '+', children: [] },
        { id: this.generateId(), name: 'New Input', type: 'value', val: 0, op: '+', children: [] }
      ];
    } else {
      node.children.push({
        id: this.generateId(), name: `Input ${node.children.length + 1}`, type: 'value', val: 0, op: '+', children: []
      });
    }
    this.fullRender();
  }

  deleteNode(id) {
    if (id === 'root') return;
    const parent = this.findParent(this.tree, id);
    if (!parent) return;

    parent.children = parent.children.filter(child => child.id !== id);

    if (parent.children.length === 0) {
      parent.type = 'value'; parent.val = 0;
    } else if (parent.children.length === 1) {
      parent.type = 'value'; parent.val = this.evaluateNode(parent.children[0]);
      parent.children = [];
    }
    this.fullRender();
  }

  formatNumber(num) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(num);
  }

  saveState() {
    localStorage.setItem('forge_visual_calc', JSON.stringify(this.tree));
  }

  softUpdate() {
    this.saveState();
    const updateOutputs = (node) => {
      const result = this.evaluateNode(node);
      const outEl = document.getElementById(`out_${node.id}`);
      if (outEl) outEl.innerText = this.formatNumber(result);
      if (node.children) node.children.forEach(updateOutputs);
    };
    updateOutputs(this.tree);
  }

  buildNodeHTML(node, isRoot = false) {
    const result = this.evaluateNode(node);
    const hasChildren = node.children && node.children.length > 0;
    
    let html = `<div class="vc-tree-wrapper ${hasChildren ? 'vc-has-children' : ''}">
                  <div class="vc-node">
                    <div class="vc-header">
                      <input type="text" class="vc-name-input" data-id="${node.id}" value="${node.name}" placeholder="Name">
                      ${!isRoot ? `<button class="vc-delete-btn" data-id="${node.id}" title="Delete Branch">&times;</button>` : ''}
                    </div>
                    <div class="vc-body">`;
                    
    if (node.type === 'value') {
      html += `<input type="number" step="any" class="vc-val-input" data-id="${node.id}" value="${node.val}">`;
    } else {
      html += `<select class="vc-op-select" data-id="${node.id}">
                 <option value="+" ${node.op === '+' ? 'selected' : ''}>SUM (+)</option>
                 <option value="-" ${node.op === '-' ? 'selected' : ''}>SUBTRACT (-)</option>
                 <option value="*" ${node.op === '*' ? 'selected' : ''}>MULTIPLY (×)</option>
                 <option value="/" ${node.op === '/' ? 'selected' : ''}>DIVIDE (÷)</option>
               </select>`;
    }
    
    html += `</div>
             <div class="vc-footer">
               <span>OUTPUT</span>
               <strong id="out_${node.id}">${this.formatNumber(result)}</strong>
             </div>
             <button class="vc-add-btn" data-id="${node.id}" title="Add another branch">+</button>
           </div>`;

    if (hasChildren) {
      html += `<div class="vc-children">`;
      node.children.forEach(child => {
        html += `<div class="vc-branch">${this.buildNodeHTML(child, false)}</div>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
    return html;
  }

  fullRender() {
    this.saveState();

    let activeData = null;
    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
      activeData = { id: document.activeElement.dataset.id, cursor: document.activeElement.selectionStart };
    }

    this.canvas.innerHTML = this.buildNodeHTML(this.tree, true);

    if (activeData) {
      const target = this.canvas.querySelector(`input[data-id="${activeData.id}"]`);
      if (target) {
        target.focus();
        try { target.setSelectionRange(activeData.cursor, activeData.cursor); } catch(e) {}
      }
    }
  }
}
class CanvasApp {
  constructor(container) { 
    this.container = container; 
    
    // Stroke Engine State
    this.drawing = false; 
    this.strokes = []; 
    this.currentStroke = null;
    
    // Tool State
    this.currentColor = '#000000'; 
    this.currentSize = 5; 
    
    this.resizeHandler = this.resizeCanvas.bind(this);
  }
  
  init() {
    this.container.innerHTML = `
      <div class="pg-app-wrapper pg-fade-in" style="height: 100%; display: flex; flex-direction: column;">
        <div class="cv-toolbar">
          
          <div class="cv-tool-group" id="cv-colors">
            <div class="cv-color-btn active" style="background:#000000;" data-color="#000000"></div>
            <div class="cv-color-btn" style="background:#ff4444;" data-color="#ff4444"></div>
            <div class="cv-color-btn" style="background:#3b82f6;" data-color="#3b82f6"></div>
            <div class="cv-color-btn" style="background:#10b981;" data-color="#10b981"></div>
            <div class="cv-color-btn" style="background:#f5a623;" data-color="#f5a623"></div>
            <button class="pg-btn cv-color-btn-alt" data-color="#ffffff" style="margin-left:5px;">Eraser</button>
          </div>
          
          <div class="cv-tool-group" id="cv-sizes">
            <button class="cv-size-btn" data-size="2">Small</button>
            <button class="cv-size-btn active" data-size="5">Med</button>
            <button class="cv-size-btn" data-size="12">Large</button>
          </div>
          
          <div class="cv-tool-group">
            <button id="cv-undo" class="pg-btn">Undo</button>
            <button id="cv-clear" class="pg-btn" style="color:#ff4444; border-color:rgba(255,68,68,0.3);">Clear</button>
            <button id="cv-download" class="pg-btn" style="color:#10b981; border-color:rgba(16,185,129,0.3); font-weight:bold;">Export</button>
          </div>
          
        </div>
        
        <div class="cv-board-wrap" id="cv-wrap">
          <canvas id="cv-board"></canvas>
        </div>
      </div>
    `;
    
    this.canvas = document.getElementById('cv-board');
    this.ctx = this.canvas.getContext('2d');
    
    this.bindUIEvents();
    this.bindDrawingEvents();
    
    setTimeout(() => this.resizeCanvas(), 50);
    window.addEventListener('resize', this.resizeHandler);
  }

  bindUIEvents() {
    const colorBtns = this.container.querySelectorAll('.cv-color-btn, .cv-color-btn-alt');
    colorBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        colorBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentColor = e.target.dataset.color;
      });
    });

    const sizeBtns = this.container.querySelectorAll('.cv-size-btn');
    sizeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        sizeBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentSize = parseInt(e.target.dataset.size);
      });
    });

    document.getElementById('cv-undo').addEventListener('click', () => this.undo());
    document.getElementById('cv-clear').addEventListener('click', () => {
      this.strokes = [];
      this.redrawCanvas();
    });
    document.getElementById('cv-download').addEventListener('click', () => this.downloadCanvas());
  }

  bindDrawingEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseleave', () => this.stopDrawing());

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault(); 
      this.startDrawing(e.touches[0]);
    }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.draw(e.touches[0]);
    }, { passive: false });
    this.canvas.addEventListener('touchend', () => this.stopDrawing());
  }

  getCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  startDrawing(e) {
    this.drawing = true;
    const coords = this.getCoordinates(e);
    
    this.currentStroke = {
      color: this.currentColor,
      size: this.currentSize,
      points: [coords]
    };

    this.ctx.beginPath();
    this.ctx.fillStyle = this.currentColor;
    this.ctx.arc(coords.x, coords.y, this.currentSize / 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.moveTo(coords.x, coords.y);
  }

  draw(e) {
    if (!this.drawing) return;
    const coords = this.getCoordinates(e);
    
    this.currentStroke.points.push(coords);

    this.ctx.lineTo(coords.x, coords.y);
    this.ctx.strokeStyle = this.currentStroke.color;
    this.ctx.lineWidth = this.currentStroke.size;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();
  }

  stopDrawing() {
    if (!this.drawing) return;
    this.drawing = false;
    this.ctx.closePath();
    
    if (this.currentStroke && this.currentStroke.points.length > 0) {
      this.strokes.push(this.currentStroke);
    }
    this.currentStroke = null;
  }

  undo() {
    if (this.strokes.length === 0) return;
    this.strokes.pop(); 
    this.redrawCanvas(); 
  }

  redrawCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.strokes.forEach(stroke => {
      this.ctx.strokeStyle = stroke.color;
      this.ctx.lineWidth = stroke.size;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      this.ctx.beginPath();
      for (let i = 0; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        if (i === 0) {
          this.ctx.moveTo(pt.x, pt.y);
          this.ctx.fillStyle = stroke.color;
          this.ctx.arc(pt.x, pt.y, stroke.size / 2, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.beginPath();
          this.ctx.moveTo(pt.x, pt.y);
        } else {
          this.ctx.lineTo(pt.x, pt.y);
        }
      }
      this.ctx.stroke();
    });
  }

  resizeCanvas() {
    const wrap = document.getElementById('cv-wrap');
    if (!wrap || !this.canvas) return;
    
    this.canvas.width = wrap.clientWidth;
    this.canvas.height = wrap.clientHeight;
    
    this.redrawCanvas();
  }

  // NEW: Download Logic
  downloadCanvas() {
    // 1. Create an off-screen phantom canvas
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.canvas.width;
    exportCanvas.height = this.canvas.height;
    const eCtx = exportCanvas.getContext('2d');

    // 2. Fill it with solid white (so it isn't transparent)
    eCtx.fillStyle = '#ffffff';
    eCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // 3. Stamp our real drawing on top of the white background
    eCtx.drawImage(this.canvas, 0, 0);

    // 4. Trigger the download natively
    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `forge_sketch_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }

  destroy() { 
    window.removeEventListener('resize', this.resizeHandler); 
  }
}
class PuzzleApp {
  constructor(container) { 
    this.container = container; 
    this.tiles = []; 
    this.gridSize = 3; // 3=Easy, 4=Medium, 5=Hard
    this.moves = 0;
    this.showHints = false;
    this.isShuffling = false;
    
    // Timer State
    this.timeElapsed = 0;
    this.timerInterval = null;
    this.hasStarted = false;
    
    this.imagePools = {
      3: [
        'assets/easy-goku.jpg',
        'assets/easy-luffy.jpg',
        'assets/easy-daredevil.jpg',
        'assets/easy-subaru.jpg'
      ],
      4: [
        'assets/med-aot.jpg',
        'assets/med-spiderman.jpg',
        'assets/med-cyberpunk.jpg',
        'assets/med-portrait.jpg'
      ],
      5: [
        'assets/hard-gojo.jpg',
        'assets/hard-squidgame.jpg',
        'assets/hard-vader.jpg',
        'assets/hard-scenery.jpg'
      ]
    };
    
    this.currentImgIndex = 0;
    this.failedImages = new Set(); // track broken URLs
    this.preloadAllImages();
    
    this.handleKeyboard = this.handleKeyboard.bind(this);
  }

  preloadAllImages() {
    // Preload each image and mark failed ones so we can fallback later
    const allSources = Object.values(this.imagePools).flat();
    allSources.forEach(src => {
      const img = new Image();
      img.onerror = () => {
        this.failedImages.add(src);
        console.warn(`Puzzle image failed to load: ${src}`);
      };
      img.src = src;
    });
  }
  
  init() {
    this.container.innerHTML = `
      <div class="pg-app-wrapper pg-fade-in" style="height: 100%; display: flex; flex-direction: column;">
        
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
          <div style="font-size: 0.9rem; color: var(--muted); display:flex; gap:15px;">
            <span>Moves: <span id="pz-moves" style="color:var(--text); font-weight:bold; font-size:1.1rem;">0</span></span>
            <span>Time: <span id="pz-time" style="color:var(--text); font-weight:bold; font-size:1.1rem;">00:00</span></span>
          </div>
          
          <div class="type-diff-selector" style="display:flex; gap:8px;">
            <button class="pg-btn diff-btn active" data-level="3" style="border-color:var(--accent); color:var(--accent)">3x3 (Easy)</button>
            <button class="pg-btn diff-btn" data-level="4">4x4 (Med)</button>
            <button class="pg-btn diff-btn" data-level="5">5x5 (Hard)</button>
          </div>
        </div>
        
        <div class="puzzle-grid-wrapper" style="flex: 1; display: flex; justify-content: center; align-items: center; position: relative;">
          
          <div id="pz-preview-img" style="position: absolute; width: 100%; max-width: 450px; aspect-ratio: 1; border-radius: 8px; background-size: cover; background-position: center; opacity: 0; transition: opacity 0.2s ease; z-index: 5; pointer-events: none; border: 1px solid var(--accent);"></div>

          <div id="pz-grid" class="puzzle-grid" style="background: rgba(10, 10, 15, 0.9);"></div>
          
          <div id="pz-win" class="puzzle-win-overlay" style="z-index: 10;">
            <h3 style="color:var(--accent); font-family:var(--font-head); font-size: 2rem; margin-bottom: 10px; text-transform:uppercase; letter-spacing:0.1em;">System Restored</h3>
            <p style="color:var(--muted); font-size: 0.9rem; margin-bottom: 25px;">
              Decrypted in <span id="pz-win-time" style="color:#ffffff;">00:00</span> with <span id="pz-win-moves" style="color:#4caf50; font-weight:bold; font-size:1.1rem;">0</span> moves.
            </p>
            <button id="pz-play-again" class="pg-btn-primary">Initialize New Matrix</button>
          </div>
        </div>

        <div style="display:flex; justify-content:center; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
          <button id="pz-shuffle" class="pg-btn">Shuffle</button>
          <button id="pz-hints" class="pg-btn">Toggle Hints</button>
          <button id="pz-image" class="pg-btn">Change Image</button>
          <button id="pz-preview" class="pg-btn" style="border-color: var(--border-bright); color: var(--text);">Hold to Preview</button>
        </div>
      </div>
    `;
    
    this.grid = document.getElementById('pz-grid');
    this.previewLayer = document.getElementById('pz-preview-img');
    this.bindEvents();
    this.setupGrid();
    
    document.addEventListener('keydown', this.handleKeyboard);
  }

  bindEvents() {
    const diffBtns = this.container.querySelectorAll('.diff-btn');
    diffBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        if(this.isShuffling) return;
        diffBtns.forEach(b => { b.style.borderColor = 'var(--border-dim)'; b.style.color = 'var(--muted)'; b.classList.remove('active'); });
        e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)'; e.target.classList.add('active');
        
        this.gridSize = parseInt(e.target.dataset.level);
        this.currentImgIndex = 0; 
        this.setupGrid();
      });
    });

    document.getElementById('pz-shuffle').addEventListener('click', () => this.shuffle());
    document.getElementById('pz-play-again').addEventListener('click', () => this.shuffle());
    
    document.getElementById('pz-hints').addEventListener('click', () => {
      this.showHints = !this.showHints;
      this.updateHints();
    });
    
    document.getElementById('pz-image').addEventListener('click', () => {
      const poolSize = this.imagePools[this.gridSize].length;
      this.currentImgIndex = (this.currentImgIndex + 1) % poolSize;
      this.setupGrid();
    });

    // UPDATED Preview Logic: Now toggles the dedicated layer
    const previewBtn = document.getElementById('pz-preview');
    const showPreview = () => { if(!this.isShuffling && this.hasStarted) this.previewLayer.style.opacity = '1'; };
    const hidePreview = () => { this.previewLayer.style.opacity = '0'; };
    
    previewBtn.addEventListener('mousedown', showPreview);
    previewBtn.addEventListener('mouseup', hidePreview);
    previewBtn.addEventListener('mouseleave', hidePreview);
    previewBtn.addEventListener('touchstart', (e) => { e.preventDefault(); showPreview(); }, {passive:false});
    previewBtn.addEventListener('touchend', hidePreview);
  }

  handleKeyboard(e) {
    if (this.isShuffling || !this.hasStarted) return;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) return;
    e.preventDefault();

    const N = this.gridSize;
    const emptyPos = this.tiles.indexOf(N * N - 1);
    let targetPos = -1;

    if ((e.key === 'ArrowUp' || e.key === 'w') && emptyPos < (N * N) - N) targetPos = emptyPos + N;
    if ((e.key === 'ArrowDown' || e.key === 's') && emptyPos >= N) targetPos = emptyPos - N;
    if ((e.key === 'ArrowLeft' || e.key === 'a') && (emptyPos % N) !== N - 1) targetPos = emptyPos + 1;
    if ((e.key === 'ArrowRight' || e.key === 'd') && (emptyPos % N) !== 0) targetPos = emptyPos - 1;

    if (targetPos !== -1) {
      const tileToMove = this.tiles[targetPos];
      this.moveTile(tileToMove);
    }
  }

  startTimer() {
    if (this.hasStarted) return;
    this.hasStarted = true;
    this.timeElapsed = 0;
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timeElapsed++;
      document.getElementById('pz-time').innerText = this.formatTime(this.timeElapsed);
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
    this.hasStarted = false;
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // Returns a solid colour data URL as fallback (amber/dark theme)
  getFallbackBackground() {
    return 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
        <rect width="400" height="400" fill="#1a1a2e"/>
        <text x="200" y="200" text-anchor="middle" fill="#f5a623" font-size="24" font-family="monospace">?</text>
      </svg>
    `);
  }

  setupGrid() {
    this.stopTimer();
    this.timeElapsed = 0;
    document.getElementById('pz-time').innerText = "00:00";
    
    this.grid.innerHTML = '';
    const N = this.gridSize;
    const totalTiles = N * N;
    
    this.tiles = Array.from({length: totalTiles}, (_, i) => i);
    let imgUrl = this.imagePools[this.gridSize][this.currentImgIndex];
    // Swap to fallback if the current image is known to be broken
    if (this.failedImages.has(imgUrl)) {
      imgUrl = this.getFallbackBackground();
    }
    
    // Set background of the separated preview layer
    this.previewLayer.style.backgroundImage = `url('${imgUrl}')`;
    
    for (let i = 0; i < totalTiles; i++) {
      if (i === totalTiles - 1) continue; 
      
      const tile = document.createElement('div');
      tile.className = 'puzzle-tile';
      tile.dataset.original = i;
      
      tile.style.width = `${100 / N}%`;
      tile.style.height = `${100 / N}%`;
      tile.style.backgroundImage = `url('${imgUrl}')`;
      tile.style.backgroundSize = `${N * 100}% ${N * 100}%`;
      
      const bx = (i % N) * (100 / (N - 1));
      const by = Math.floor(i / N) * (100 / (N - 1));
      tile.style.backgroundPosition = `${bx}% ${by}%`;
      
      tile.innerHTML = this.showHints ? `<span>${i + 1}</span>` : '';
      
      tile.addEventListener('click', () => this.moveTile(i));
      this.grid.appendChild(tile);
    }
    
    this.render();
    setTimeout(() => this.shuffle(), 50); 
  }

  updateHints() {
    Array.from(this.grid.children).forEach(el => {
      const originalIdx = parseInt(el.dataset.original);
      el.innerHTML = this.showHints ? `<span>${originalIdx + 1}</span>` : '';
    });
  }

  moveTile(originalIdx) {
    if (this.isShuffling) return;
    if (!this.hasStarted) this.startTimer(); 

    const N = this.gridSize;
    const emptyVal = N * N - 1;
    const emptyPos = this.tiles.indexOf(emptyVal);
    const currPos = this.tiles.indexOf(originalIdx);
    
    const rowEmpty = Math.floor(emptyPos / N);
    const colEmpty = emptyPos % N;
    const rowCurr = Math.floor(currPos / N);
    const colCurr = currPos % N;

    const isAdjacent = (Math.abs(rowEmpty - rowCurr) === 1 && colEmpty === colCurr) || 
                       (Math.abs(colEmpty - colCurr) === 1 && rowEmpty === rowCurr);

    if (isAdjacent) {
      [this.tiles[currPos], this.tiles[emptyPos]] = [this.tiles[emptyPos], this.tiles[currPos]];
      
      this.moves++;
      document.getElementById('pz-moves').innerText = this.moves;
      
      this.render();
      this.checkWin();
    } else {
      const el = this.grid.querySelector(`[data-original="${originalIdx}"]`);
      if(el) {
        el.classList.remove('pg-shake');
        void el.offsetWidth;
        el.classList.add('pg-shake');
      }
    }
  }

  shuffle() {
    if (this.isShuffling) return;
    this.isShuffling = true;
    this.stopTimer();
    
    document.getElementById('pz-win').classList.remove('active');
    this.moves = 0;
    this.timeElapsed = 0;
    document.getElementById('pz-moves').innerText = '0';
    document.getElementById('pz-time').innerText = '00:00';
    
    const N = this.gridSize;
    const emptyVal = N * N - 1;
    let lastEmpty = -1;
    const shuffleCount = N === 3 ? 150 : (N === 4 ? 300 : 500); 
    
    for (let i = 0; i < shuffleCount; i++) {
      const emptyPos = this.tiles.indexOf(emptyVal);
      const validMoves = [];
      const row = Math.floor(emptyPos / N);
      const col = emptyPos % N;
      
      if (col > 0) validMoves.push(emptyPos - 1); 
      if (col < N - 1) validMoves.push(emptyPos + 1); 
      if (row > 0) validMoves.push(emptyPos - N); 
      if (row < N - 1) validMoves.push(emptyPos + N); 
      
      const safeMoves = validMoves.filter(m => m !== lastEmpty);
      const moveChoice = safeMoves.length > 0 ? safeMoves : validMoves;
      const randomMove = moveChoice[Math.floor(Math.random() * moveChoice.length)];
      
      lastEmpty = emptyPos;
      [this.tiles[emptyPos], this.tiles[randomMove]] = [this.tiles[randomMove], this.tiles[emptyPos]];
    }
    
    this.render();
    setTimeout(() => { this.isShuffling = false; }, 300); 
  }

  render() {
    const N = this.gridSize;
    Array.from(this.grid.children).forEach((el) => {
      const originalIndex = parseInt(el.dataset.original);
      const currentPos = this.tiles.indexOf(originalIndex);
      
      const x = (currentPos % N) * 100;
      const y = Math.floor(currentPos / N) * 100;
      
      el.style.transform = `translate(${x}%, ${y}%)`;
    });
  }

  checkWin() {
    if (this.tiles.every((val, index) => val === index)) {
      this.stopTimer();
      document.getElementById('pz-win-moves').innerText = this.moves;
      document.getElementById('pz-win-time').innerText = this.formatTime(this.timeElapsed);
      setTimeout(() => {
        document.getElementById('pz-win').classList.add('active');
      }, 300); 
    }
  }

  destroy() {
    this.stopTimer();
    document.removeEventListener('keydown', this.handleKeyboard);
  }
}
class QuizApp {
  constructor(container) { 
    this.container = container; 
    
    // Core State
    this.sessionQuestions = [];
    this.currentQIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.hacksRemaining = 2;
    this.timerInterval = null;
    this.timeLeft = 15;
    this.selectedTopics = [];

    // The Topic Matrix (Added icons/subtext for UX)
    this.topics = [
      { id: '9', name: 'General Intel', sub: 'History & Facts', source: 'api' },
      { id: '31', name: 'Anime / Manga', sub: 'Otaku Lore', source: 'api' },
      { id: '18', name: 'Comp-Sci', sub: 'Algorithms & Code', source: 'api' },
      { id: '11', name: 'Cinema', sub: 'Film & Media', source: 'api' },
      { id: '17', name: 'Physics & Bio', sub: 'Natural Sciences', source: 'api' },
      { id: 'ai', name: 'Neural Nets', sub: 'AI & LLMs', source: 'local' },
      { id: 'india', name: 'India Matrix', sub: 'Tech & Lore', source: 'local' },
      { id: 'silly', name: 'Troll Logic', sub: 'Memes & Pain', source: 'local' }
    ];

    // Expanded Deep Local Databases (Strict adherence to topic)
    this.localDatabases = {
      ai: [
        { q: "Which architecture forms the basis of modern LLMs like GPT-4?", opts: ["Convolutional Neural Networks", "Transformers", "Recurrent Neural Networks", "Generative Adversarial Networks"], ans: "Transformers" },
        { q: "What does 'AGI' stand for in the context of AI?", opts: ["Artificial General Intelligence", "Automated Generative Inference", "Algorithmic Growth Index", "Applied Graphical Interfaces"], ans: "Artificial General Intelligence" },
        { q: "Which parameter controls the randomness of an AI's output?", opts: ["Velocity", "Temperature", "Frequency Penalty", "Top-K"], ans: "Temperature" },
        { q: "What is 'Hallucination' in LLMs?", opts: ["When the AI confidently generates false information", "A visual rendering error", "When the server overheats", "An infinite loop bug"], ans: "When the AI confidently generates false information" },
        { q: "Which technique is used to fine-tune a model using human feedback?", opts: ["RLHF", "GANs", "Backpropagation", "Zero-shot learning"], ans: "RLHF" }
      ],
      india: [
        { q: "Which Indian city is known as the 'Silicon Valley of India'?", opts: ["Mumbai", "Hyderabad", "Bengaluru", "Chennai"], ans: "Bengaluru" },
        { q: "What is the name of India's successful Mars orbiter mission?", opts: ["Chandrayaan", "Mangalyaan", "Gaganyaan", "Aditya-L1"], ans: "Mangalyaan" },
        { q: "Which Indian company launched the UPI (Unified Payments Interface) network?", opts: ["RBI", "NPCI", "SBI", "Paytm"], ans: "NPCI" },
        { q: "Who is known as the 'Missile Man of India'?", opts: ["Homi J. Bhabha", "Vikram Sarabhai", "A. P. J. Abdul Kalam", "C. V. Raman"], ans: "A. P. J. Abdul Kalam" },
        { q: "India's first supercomputer was named...?", opts: ["PARAM 8000", "EKA", "Pratyush", "Mihir"], ans: "PARAM 8000" }
      ],
      silly: [
        { q: "If you drop a slice of toast, what are the chances it lands butter-side down?", opts: ["50%", "100% because the universe hates you", "Depends on the height", "Cats always land on their feet"], ans: "100% because the universe hates you" },
        { q: "How do you properly exit VIM?", opts: [":wq", "Ctrl+C", "Pull the power plug", "You don't. You live there now."], ans: "You don't. You live there now." },
        { q: "What is the primary diet of a Senior Developer?", opts: ["Salads & Water", "Coffee & Existential Dread", "Soylent", "Pizza & Energy Drinks"], ans: "Coffee & Existential Dread" },
        { q: "What is the most common lie told by software engineers?", opts: ["I'll document this later", "It works on my machine", "It's a quick fix", "All of the above"], ans: "All of the above" },
        { q: "Why do programmers prefer dark mode?", opts: ["It saves battery", "Because light attracts bugs", "It looks cool", "To hide the tears"], ans: "Because light attracts bugs" }
      ]
    };
  }

  // 1. ENTRY SCREEN
  init() { 
    let topicsHtml = this.topics.map(t => 
      `<button class="quiz-topic-btn" data-id="${t.id}">
         <span style="font-weight:bold;">${t.name}</span>
         <span style="font-size:0.7rem; opacity:0.6;">${t.sub}</span>
       </button>`
    ).join('');

    this.container.innerHTML = `
      <div class="pg-app-wrapper pg-fade-in" style="align-items:center; justify-content:center; text-align:center; height:100%;">
        <h2 style="font-family:var(--font-head); color:var(--accent); font-size:2rem; margin-bottom: 5px;">Data Extraction</h2>
        <p style="color:var(--muted); margin-bottom: 25px; font-size:0.9rem;">Select exactly the domains you wish to query. Strict filtering enabled.</p>
        
        <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center; margin-bottom: 30px; max-width: 550px;">
          ${topicsHtml}
        </div>

        <button id="qz-start-btn" class="pg-btn-primary" style="font-size:1.1rem; padding: 12px 30px; opacity:0.5; pointer-events:none; transition: 0.3s;">Select Topics to Begin</button>
      </div>
    `;
    
    this.bindTopicSelection();
  }

  bindTopicSelection() {
    const btns = this.container.querySelectorAll('.quiz-topic-btn');
    const startBtn = document.getElementById('qz-start-btn');

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (this.selectedTopics.includes(id)) {
          this.selectedTopics = this.selectedTopics.filter(t => t !== id);
          btn.classList.remove('active');
        } else {
          if (this.selectedTopics.length >= 4) return; // Cap at 4 for UX
          this.selectedTopics.push(id);
          btn.classList.add('active');
        }

        if (this.selectedTopics.length > 0) {
          startBtn.style.opacity = '1';
          startBtn.style.pointerEvents = 'auto';
          startBtn.innerText = `Initialize Matrix (${this.selectedTopics.length} selected)`;
        } else {
          startBtn.style.opacity = '0.5';
          startBtn.style.pointerEvents = 'none';
          startBtn.innerText = 'Select Topics to Begin';
        }
      });
    });

    startBtn.addEventListener('click', () => this.buildGameMatrix());
  }

  // 2. STRICT COMPILATION LOGIC (The Fix)
  async buildGameMatrix() {
    this.container.innerHTML = `
      <div class="pg-app-wrapper pg-fade-in" style="align-items:center; justify-content:center; height:100%;">
        <p class="scramble-text" style="color:var(--accent); font-size: 1.2rem; letter-spacing:2px;">[ 0% ] Establishing Uplink...</p>
      </div>
    `;
    
    const loadingText = this.container.querySelector('.scramble-text');
    let rawQuestions = [];
    const targetQuestions = 5; 
    
    // Determine exactly how many questions to pull from EACH selected topic to hit target
    const perTopicTarget = Math.ceil(targetQuestions / this.selectedTopics.length);

    for (let i = 0; i < this.selectedTopics.length; i++) {
      const id = this.selectedTopics[i];
      const topicMeta = this.topics.find(t => t.id === id);
      loadingText.innerText = `[ ${Math.round(((i+1)/this.selectedTopics.length)*100)}% ] Fetching ${topicMeta.name}...`;
      
      if (topicMeta.source === 'local') {
        // Shuffle local array and slice exact amount needed
        const shuffledLocal = this.shuffleArray([...this.localDatabases[id]]);
        rawQuestions = rawQuestions.concat(shuffledLocal.slice(0, perTopicTarget));
      } 
      else if (topicMeta.source === 'api') {
        try {
          // Request exact amount from API to prevent over-fetching
          const res = await fetch(`https://opentdb.com/api.php?amount=${perTopicTarget}&category=${id}&type=multiple`);
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            const formatted = data.results.map(q => ({
              q: this.decodeHTML(q.question),
              opts: this.shuffleArray([q.correct_answer, ...q.incorrect_answers].map(a => this.decodeHTML(a))),
              ans: this.decodeHTML(q.correct_answer)
            }));
            rawQuestions = rawQuestions.concat(formatted);
          }
        } catch (e) {
          console.warn(`API failed for ${topicMeta.name}. Strict mode: Skipping to next.`);
        }
      }
    }

    // Safety: If completely offline and API was selected, alert user.
    if (rawQuestions.length === 0) {
      alert("Network Error: Could not fetch data for selected domains. Please try local categories.");
      return this.init();
    }

    // Shuffle the final compiled list and slice to exactly 5
    this.sessionQuestions = this.shuffleArray(rawQuestions).slice(0, targetQuestions);
    
    this.currentQIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.hacksRemaining = 2;
    
    setTimeout(() => this.renderQuestion(), 500);
  }

  decodeHTML(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  shuffleArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // 3. CINEMATIC RENDER LOOP
  renderQuestion() {
    if (this.currentQIndex >= this.sessionQuestions.length) return this.showResults();
    
    const q = this.sessionQuestions[this.currentQIndex];
    const progressPct = (this.currentQIndex / this.sessionQuestions.length) * 100;
    
    let optsHtml = q.opts.map((opt, i) => 
      `<button class="quiz-opt" style="opacity:0; transform:translateY(10px);" data-val="${btoa(encodeURIComponent(opt))}">${opt}</button>`
    ).join('');

    this.container.innerHTML = `
      <div class="pg-app-wrapper qz-wrapper" style="max-width:600px; margin:0 auto; width:100%; opacity:0; transform: translateX(30px);">
        
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 10px;">
          <div style="color:var(--muted); font-size:0.8rem;">
            Node ${this.currentQIndex + 1} <span style="opacity:0.5">/ ${this.sessionQuestions.length}</span>
          </div>
          <div style="font-size:0.85rem; color:${this.streak >= 3 ? '#ff4444' : 'var(--accent)'}; font-weight:bold;">
            ${this.streak > 1 ? `🔥 ${this.streak} Streak` : `Score: ${this.score}`}
          </div>
        </div>

        <div class="quiz-progress-wrapper" style="margin-bottom: 15px; position: relative;">
          <div class="quiz-progress-fill" style="width: ${progressPct}%"></div>
          <div id="qz-timer-bar" style="position:absolute; top:0; right:0; height:100%; width:100%; background:rgba(255,68,68,0.5); transform-origin:right; z-index:-1;"></div>
        </div>
        
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
           <span style="font-size: 1.5rem; color:var(--text); font-weight:bold;" id="qz-timer-text">15</span>
           <button id="qz-hack-btn" class="pg-btn" style="padding: 4px 10px; font-size:0.7rem; border-color:#3b82f6; color:#3b82f6; ${this.hacksRemaining <= 0 ? 'opacity:0.3; pointer-events:none;' : ''}">50/50 Hack (${this.hacksRemaining})</button>
        </div>

        <div class="quiz-q scramble-text" id="qz-question" style="font-size:1.15rem; margin-bottom:20px; line-height:1.4; min-height: 50px;"></div>
        <div class="quiz-opts" style="display:flex; flex-direction:column; gap:10px;">${optsHtml}</div>

        <div style="text-align:right; margin-top: 15px; min-height: 40px;">
           <button id="qz-next-btn" class="pg-btn-primary" style="display:none; margin-left:auto; background:var(--surface);">Continue →</button>
        </div>
      </div>
    `;

    // Slide in the wrapper
    gsap.to(this.container.querySelector('.qz-wrapper'), { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" });

    // Scramble Text Effect
    this.scrambleReveal(document.getElementById('qz-question'), q.q, () => {
      // Once text is revealed, stagger in the options
      gsap.to('.quiz-opt', { opacity: 1, y: 0, duration: 0.3, stagger: 0.1, ease: "back.out(1.5)" });
      this.startTimer();
    });

    const opts = this.container.querySelectorAll('.quiz-opt');
    opts.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleAnswer(e.target, q.ans));
    });

    document.getElementById('qz-next-btn').addEventListener('click', () => this.advanceToNext());
    document.getElementById('qz-hack-btn').addEventListener('click', (e) => this.useHack(e.target, q.ans));
  }

  // TERMINAL TEXT SCRAMBLE EFFECT
  scrambleReveal(element, targetText, callback) {
    const chars = '!<>-_\\\\/[]{}—=+*^?#_';
    let iterations = 0;
    const interval = setInterval(() => {
      element.innerText = targetText.split('').map((letter, index) => {
        if(index < iterations) return letter;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');
      
      if(iterations >= targetText.length){
        clearInterval(interval);
        if(callback) callback();
      }
      iterations += 1.5; // Speed of reveal
    }, 25);
  }

  startTimer() {
    this.timeLeft = 15;
    const timerText = document.getElementById('qz-timer-text');
    const timerBar = document.getElementById('qz-timer-bar');
    
    clearInterval(this.timerInterval);
    gsap.fromTo(timerBar, { scaleX: 1 }, { scaleX: 0, duration: 15, ease: "none" });

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (timerText) timerText.innerText = this.timeLeft;
      
      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.handleTimeOut();
      }
    }, 1000);
  }

  // GLITCH HACK UX
  useHack(hackBtn, correctAnswer) {
    if (this.hacksRemaining <= 0) return;
    this.hacksRemaining--;
    hackBtn.innerText = `50/50 Hack (${this.hacksRemaining})`;
    if (this.hacksRemaining === 0) { hackBtn.style.opacity = '0.3'; hackBtn.style.pointerEvents = 'none'; }

    const btns = Array.from(this.container.querySelectorAll('.quiz-opt'));
    const wrongBtns = btns.filter(b => decodeURIComponent(atob(b.dataset.val)) !== correctAnswer);
    
    const toRemove = this.shuffleArray(wrongBtns).slice(0, 2);
    toRemove.forEach(b => {
      // Trigger the CSS glitch animation
      b.classList.add('glitch-out');
    });
  }

  handleTimeOut() {
    this.streak = 0;
    const correctAnswer = this.sessionQuestions[this.currentQIndex].ans;
    const correctBtn = Array.from(this.container.querySelectorAll('.quiz-opt')).find(b => decodeURIComponent(atob(b.dataset.val)) === correctAnswer);
    
    if(correctBtn) correctBtn.classList.add('correct');
    
    const nextBtn = document.getElementById('qz-next-btn');
    nextBtn.style.display = 'inline-block';
    gsap.fromTo(nextBtn, {opacity: 0, y: 10}, {opacity: 1, y: 0, duration: 0.3});
  }

  handleAnswer(btn, correctAnswer) {
    if (this.container.querySelector('.correct') || this.container.querySelector('.wrong')) return; 
    clearInterval(this.timerInterval); 
    gsap.killTweensOf('#qz-timer-bar'); 
    
    const userAns = decodeURIComponent(atob(btn.dataset.val));
    const isCorrect = (userAns === correctAnswer);

    if (isCorrect) {
      btn.classList.add('correct');
      this.score += (this.timeLeft * 10) + 100;
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;
      
      setTimeout(() => this.advanceToNext(), 600);
    } else {
      this.streak = 0; 
      btn.classList.add('wrong', 'pg-shake');
      
      const correctBtn = Array.from(this.container.querySelectorAll('.quiz-opt')).find(b => decodeURIComponent(atob(b.dataset.val)) === correctAnswer);
      if(correctBtn) correctBtn.classList.add('correct');
      
      const nextBtn = document.getElementById('qz-next-btn');
      nextBtn.style.display = 'inline-block';
      gsap.fromTo(nextBtn, {opacity: 0, y: 10}, {opacity: 1, y: 0, duration: 0.3});
    }
  }

  advanceToNext() {
    clearInterval(this.timerInterval);
    gsap.to(this.container.querySelector('.qz-wrapper'), {
      opacity: 0, x: -30, duration: 0.3, ease: "power2.in",
      onComplete: () => {
        this.currentQIndex++;
        this.renderQuestion();
      }
    });
  }

  showResults() {
    const totalMaxPossible = this.sessionQuestions.length * 250; 
    const percentage = (this.score / totalMaxPossible) * 100;
    
    let rank = "", color = "";
    if (percentage >= 80) { rank = "God Tier"; color = "#f5a623"; } 
    else if (percentage >= 50) { rank = "Elite Agent"; color = "#4caf50"; } 
    else if (percentage >= 20) { rank = "Standard User"; color = "#3b82f6"; } 
    else { rank = "Skill Issue"; color = "#ff4444"; } 

    this.container.innerHTML = `
      <div class="pg-app-wrapper pg-fade-in" style="align-items:center; justify-content:center; text-align:center; height:100%;">
        <div class="quiz-progress-wrapper" style="margin-bottom:30px;"><div class="quiz-progress-fill" style="width: 100%"></div></div>
        
        <div style="font-size:0.9rem; color:var(--muted); text-transform:uppercase; letter-spacing:0.1em; margin-bottom:5px;">Assigned Rank</div>
        <h2 style="font-family:var(--font-head); color:${color}; font-size:2.5rem; margin-bottom: 20px;">
          ${rank}
        </h2>
        
        <div style="display:flex; gap:30px; margin-bottom:30px; background:rgba(0,0,0,0.3); padding:15px 30px; border-radius:8px; border:1px solid var(--border-dim);">
           <div>
             <div style="font-size:2rem; font-weight:bold; color:var(--text);">${this.score}</div>
             <div style="font-size:0.75rem; color:var(--muted);">Total Score</div>
           </div>
           <div style="width:1px; background:var(--border-dim);"></div>
           <div>
             <div style="font-size:2rem; font-weight:bold; color:var(--text);">${this.maxStreak}</div>
             <div style="font-size:0.75rem; color:var(--muted);">Max Streak</div>
           </div>
        </div>

        <button id="qz-restart" class="pg-btn-primary">Initialize New Matrix</button>
      </div>
    `;
    
    document.getElementById('qz-restart').addEventListener('click', () => {
      this.selectedTopics = [];
      this.init();
    });
  }

  destroy() { clearInterval(this.timerInterval); }
}

// ============================================
// BOOTSTRAP INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  new PlaygroundSystem();
});