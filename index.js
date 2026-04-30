document.addEventListener('DOMContentLoaded', () => {
    // Vercel trigger commit
    // Trava rolagem da página em qualquer fase da experiência.
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    window.addEventListener('scroll', () => window.scrollTo(0, 0), { passive: true });

    // Permite arrastar apenas barras de range (player), bloqueando scroll por toque.
    document.addEventListener('touchmove', (event) => {
        if (event.target && event.target.matches('input[type="range"]')) return;
        event.preventDefault();
    }, { passive: false });

    // *************** CONFIGURAÇÕES INICIAIS ***************
    // Elementos da UI
    const elements = {
        eyeL: document.querySelector(".eyeball-l"),
        eyeR: document.querySelector(".eyeball-r"),
        handL: document.querySelector(".hand-l"),
        handR: document.querySelector(".hand-r")
    };

    // *************** BACKGROUND GLOBAL (oculto até após login) ***************
    (function mountGlobalBackground() {
        if (!document.getElementById('siteBackground')) {
            const bg = document.createElement('iframe');
            bg.id = 'siteBackground';
            bg.src = 'background/background.html';
            bg.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: none;
                z-index: 0;
                pointer-events: none;
                visibility: hidden;
            `;
            // Quando o iframe terminar de carregar, garanta que a animação inicie
            bg.addEventListener('load', () => {
                try {
                    const doc = bg.contentDocument || bg.contentWindow?.document;
                    const container = doc?.querySelector('.container');
                    if (container) container.classList.remove('container');
                } catch (_) { /* noop */ }
            });
            document.body.prepend(bg);
        }
    })();

    // Pré-criar camadas para evitar flash (flores + blur)
    (function precreateLayers() {
        if (!document.getElementById('flowersBackground')) {
            const flowersFrame = document.createElement('iframe');
            flowersFrame.id = 'flowersBackground';
            flowersFrame.src = 'flowers/dist/index.html';
            flowersFrame.style.cssText = `
                position: fixed;
                inset: 0;
                width: 100%;
                height: 100%;
                border: none;
                z-index: 0;
                pointer-events: none;
                background: transparent;
            `;
            document.body.prepend(flowersFrame);
        }
        if (!document.getElementById('blurLayer')) {
            const blurLayer = document.createElement('div');
            blurLayer.id = 'blurLayer';
            blurLayer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.45);
                backdrop-filter: blur(1px);
                -webkit-backdrop-filter: blur(1px);
                z-index: 1;
                pointer-events: none;
                display: none;
            `;
            document.body.appendChild(blurLayer);
        }
    })();

    // *************** PLAYER DE MÚSICA GLOBAL ***************
    function mountAudioPlayer(showPlayHint = false) {
        if (document.getElementById('globalAudioPlayer')) return;
        const isMobile = window.matchMedia('(max-width: 768px)').matches;

        const audioPlayer = document.createElement('div');
        audioPlayer.id = 'globalAudioPlayer';
        audioPlayer.style.cssText = isMobile ? `
            position: fixed;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            width: min(220px, calc(100dvw - 20px));
            max-width: calc(100dvw - 20px);
            background: rgba(0, 0, 0, 0.45);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 14px;
            padding: 8px;
            box-shadow: 0 6px 14px rgba(0, 0, 0, 0.22);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 20000;
            color: white;
            font-family: 'Poppins', sans-serif;
            pointer-events: auto;
            box-sizing: border-box;
            overflow: hidden;
        ` : `
            position: fixed;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            width: min(340px, calc(100dvw - 20px));
            max-width: calc(100dvw - 20px);
            background: rgba(0, 0, 0, 0.45);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 14px;
            padding: 8px 10px;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 20000;
            color: white;
            font-family: 'Poppins', sans-serif;
            pointer-events: auto;
            box-sizing: border-box;
            overflow: hidden;
        `;

        let audio;
        if (!window.gameAudio) {
            audio = new Audio();
            audio.src = 'music/comonossos.mp3';
            audio.volume = isMobile ? 0.4 : 0.015;
            audio.preload = 'auto';
            window.gameAudio = audio;
        } else {
            audio = window.gameAudio;
            if (isMobile) audio.volume = 0.4;
        }

        audioPlayer.innerHTML = isMobile ? `
            <div style="display: flex; align-items: center; gap: 8px; width: 100%; min-width: 0;">
                <img src="music/capa.jpg" style="width: 34px; height: 34px; border-radius: 6px; object-fit: cover; flex: 0 0 auto;">
                <div style="min-width: 0; flex: 1;">
                    <div style="font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Como Nossos Pais</div>
                </div>
            </div>
        ` : `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; width: 100%; min-width: 0;">
                <button class="play-pause-btn" style="
                    width: 24px;
                    min-width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.14);
                    border: none;
                    color: #fff;
                    font-size: 12px;
                    line-height: 1;
                    cursor: pointer;
                    display: grid;
                    place-items: center;
                ">⏸</button>
                <div style="min-width: 0; flex: 1;">
                    <div style="font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Como Nossos Pais</div>
                    <div style="font-size: 9px; color: #cfcfcf; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Elis Regina</div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; width: 100%; min-width: 0;">
                <span style="font-size: 9px; color: #cfcfcf; width: 12px;">▶</span>
                <input class="seek-bar" type="range" style="
                    flex-grow: 1;
                    min-width: 0;
                    width: 100%;
                    margin: 0;
                    height: 3px;
                    -webkit-appearance: none;
                    background: #4f4f4f;
                    border-radius: 2px;
                    cursor: pointer;
                " value="0">
            </div>
            <div style="display: flex; align-items: center; gap: 6px; width: 100%; min-width: 0;">
                <span style="font-size: 10px; color: #cfcfcf; width: 12px;">🔉</span>
                <input class="volume-bar" type="range" style="
                    flex-grow: 1;
                    min-width: 0;
                    width: 100%;
                    margin: 0;
                    height: 3px;
                    -webkit-appearance: none;
                    background: #4f4f4f;
                    border-radius: 2px;
                    cursor: pointer;
                " min="0" max="100" value="1.5">
                <span class="volume-display" style="
                    font-size: 9px;
                    color: #cfcfcf;
                    min-width: 24px;
                    text-align: center;
                ">1.5%</span>
            </div>
        `;

        document.body.appendChild(audioPlayer);

        // Tentar tocar automaticamente (alguns navegadores bloqueiam sem interação)
        let userPaused = false;
        audio.play().catch(() => {
            // Silenciosamente falha; o usuário pode dar play quando quiser
        });

        if (isMobile) return;

        const playPauseBtn = audioPlayer.querySelector('.play-pause-btn');
        const seekBar = audioPlayer.querySelector('.seek-bar');
        const volumeBar = audioPlayer.querySelector('.volume-bar');
        const volumeDisplay = audioPlayer.querySelector('.volume-display');

        // Função para atualizar o display do volume
        const updateVolumeDisplay = () => {
            const volumePercent = Math.round(audio.volume * 100);
            volumeDisplay.textContent = `${volumePercent}%`;
            volumeBar.value = volumePercent;
        };

        // Estado inicial do botão
        playPauseBtn.textContent = audio.paused ? '▶' : '⏸';
        updateVolumeDisplay();

        playPauseBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play().then(() => playPauseBtn.textContent = '⏸').catch(() => { });
            } else {
                audio.pause();
                playPauseBtn.textContent = '▶';
                userPaused = true;
            }
        });

        audio.addEventListener('timeupdate', () => {
            const progress = (audio.currentTime / (audio.duration || 1)) * 100;
            seekBar.value = progress;
            playPauseBtn.textContent = audio.paused ? '▶' : '⏸';
        });

        seekBar.addEventListener('change', () => {
            const time = (seekBar.value * (audio.duration || 0)) / 100;
            audio.currentTime = time;
        });

        // Controle de volume com barra de progresso
        volumeBar.addEventListener('input', () => {
            audio.volume = volumeBar.value / 100;
            updateVolumeDisplay();
        });

        // Desbloquear áudio no primeiro toque/clique caso necessário
        const unlock = () => {
            if (userPaused) { document.removeEventListener('pointerdown', unlock); return; }
            if (audio.paused) {
                audio.play().then(() => {
                    playPauseBtn.textContent = '⏸';
                }).catch(() => { });
            }
            document.removeEventListener('pointerdown', unlock);
        };
        document.addEventListener('pointerdown', unlock, { once: true });
    }

    // *************** ANIMAÇÕES DO PANDA ***************
    const pandaAnimations = {
        normalEyeStyle: () => {
            elements.eyeL.classList.remove('focused');
            elements.eyeR.classList.remove('focused');
        },
        normalHandStyle: () => {
            elements.handL.classList.remove('password-focused');
            elements.handR.classList.remove('password-focused');
        }
    };

    // *************** EVENT LISTENERS ***************
    // Gerenciador de foco nos inputs (removido - não há mais inputs de login)

    // *************** BOTÃO DE CLIQUE ***************
    let clickCount = 0;
    const maxClicks = 10;

    const createClickButton = () => {
        const globalAudioPlayer = document.getElementById('globalAudioPlayer');
        if (globalAudioPlayer) {
            globalAudioPlayer.style.display = 'none';
        }

        // Esconder o container do panda
        const loginContainer = document.querySelector('.container');
        if (loginContainer) {
            loginContainer.style.display = 'none';
        }

        // Garantir que o background de flores apareça durante esta fase
        const bgFrameEarly = document.getElementById('siteBackground');
        if (bgFrameEarly) {
            bgFrameEarly.style.visibility = 'visible';
            try {
                const idoc = bgFrameEarly.contentDocument || bgFrameEarly.contentWindow?.document;
                const cont = idoc?.querySelector('.container');
                if (cont) cont.classList.remove('container');
            } catch (_) { /* noop */ }
        }

        // Criar canvas para animação de lírios
        const canvas = document.createElement('canvas');
        canvas.id = 'lilyCanvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 50;
            pointer-events: none;
        `;

        // Configurar canvas
        const ctx = canvas.getContext('2d');
        let DPR = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));
        let animationId = null;

        function destroyLilyCanvas() {
            try { if (animationId) cancelAnimationFrame(animationId); } catch (_) { }
            try { window.removeEventListener('resize', resize); } catch (_) { }
            try { canvas.remove(); } catch (_) { }
        }

        function resize() {
            canvas.width = Math.floor(window.innerWidth * DPR);
            canvas.height = Math.floor(window.innerHeight * DPR);
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
            // Recalcular alvos do coração conforme o novo tamanho da tela
            try {
                const n = lilies?.length || 0;
                const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
                for (let i = 0; i < n; i++) {
                    const l = lilies[i];
                    const t = (i / n) * Math.PI * 2;
                    const baseScale = Math.min(window.innerWidth, window.innerHeight) / 35;
                    const scale = isMobileViewport ? baseScale * 0.82 : baseScale;
                    const p = heartPoint(t, scale);
                    l.targetX = window.innerWidth / 2 + p.x;
                    l.targetY = window.innerHeight / 2 + p.y - (isMobileViewport ? 104 : 80);
                    // Reaplicar o alvo intermediário conforme progresso atual
                    const fraction = (window.__heartProgressFraction ?? 0);
                    l.tx = l.startX + (l.targetX - l.startX) * fraction;
                    l.ty = l.startY + (l.targetY - l.startY) * fraction;
                }
            } catch (_) { /* noop */ }
        }
        window.addEventListener('resize', resize);
        // Ajustar canvas ao entrar/sair de tela cheia
        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
            .forEach(evt => document.addEventListener(evt, resize));
        resize();

        function heartPoint(t, scale = 12) {
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            return { x: x * scale, y: -y * scale };
        }

        class Lily {
            constructor(x, y) {
                this.x = x; this.y = y;
                this.startX = x; this.startY = y;
                this.tx = x; this.ty = y;
                this.size = 10 + Math.random() * 14;
                this.angle = Math.random() * Math.PI * 2;
                this.vx = 0;
                this.vy = 0;
                this.angularVelocity = (Math.random() * 0.02 - 0.01);
                this.wobbleAmplitude = 0.15 + Math.random() * 0.25;
                this.wobbleFrequency = 0.02 + Math.random() * 0.02;
                this.img = new Image();
                this.img.src = 'ui/lirio.png'; // Substitua pelo caminho do seu PNG
                this.imgLoaded = false;
                this.img.onload = () => {
                    this.imgLoaded = true;
                };

                // Adicionar movimento inicial
                this.initialSpeed = 0.5 + Math.random() * 0.5;
                this.direction = Math.random() * Math.PI * 2;
                this.driftX = Math.cos(this.direction) * this.initialSpeed;
                this.driftY = Math.sin(this.direction) * this.initialSpeed;
                this.time = Math.random() * Math.PI * 2;
            }

            update() {
                // Movimento inicial suave
                if (!this.moving) {
                    this.time += 0.02;
                    this.x += this.driftX + Math.sin(this.time) * 0.3;
                    this.y += this.driftY + Math.cos(this.time * 0.7) * 0.3;

                    // Manter dentro da tela
                    if (this.x < 0 || this.x > window.innerWidth) this.driftX *= -1;
                    if (this.y < 0 || this.y > window.innerHeight) this.driftY *= -1;
                } else {
                    // Movimento em direção ao coração (primavera amortecida)
                    const k = (window.__convergeSpeed || 0.008); // aceleração mais suave
                    const damping = 0.82; // mais amortecimento para menos oscilação
                    const dx = this.tx - this.x;
                    const dy = this.ty - this.y;

                    this.vx = this.vx * damping + dx * k;
                    this.vy = this.vy * damping + dy * k;

                    this.x += this.vx;
                    this.y += this.vy;

                    // Wobble sutil que diminui ao se aproximar
                    const dist = Math.hypot(dx, dy);
                    const wobbleScale = Math.min(1, dist / 200);
                    this.time += this.wobbleFrequency;
                    this.x += Math.sin(this.time) * this.wobbleAmplitude * wobbleScale;
                    this.y += Math.cos(this.time * 0.9) * this.wobbleAmplitude * wobbleScale;

                    // Suavizar rotação
                    this.angle += this.angularVelocity * (0.5 + 0.5 * wobbleScale);

                    // Prender no alvo quando bem próximo
                    if (dist < 0.8) {
                        this.x = this.tx;
                        this.y = this.ty;
                        this.vx *= 0.5;
                        this.vy *= 0.5;
                    }
                }
            }

            draw(ctx) {
                if (this.imgLoaded) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.angle);

                    // Aplicar efeito de pulsação quando há progresso na formação do coração
                    if (window.__heartProgressFraction > 0.1) {
                        const pulseScale = heartPulseScale;
                        ctx.scale(pulseScale, pulseScale);
                    }

                    ctx.drawImage(this.img, -this.size, -this.size, this.size * 2, this.size * 2);
                    ctx.restore();
                }
            }
        }

        function generateLilies(n) {
            const lilies = [];
            const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
            for (let i = 0; i < n; i++) {
                // posição inicial aleatória
                const x = Math.random() * window.innerWidth;
                const y = Math.random() * window.innerHeight;
                const lily = new Lily(x, y);

                // posição alvo no coração (calculada mas não aplicada ainda)
                const t = (i / n) * Math.PI * 2;
                const baseScale = Math.min(window.innerWidth, window.innerHeight) / 35;
                const scale = isMobileViewport ? baseScale * 0.82 : baseScale;
                const p = heartPoint(t, scale);
                lily.targetX = window.innerWidth / 2 + p.x;
                lily.targetY = window.innerHeight / 2 + p.y - (isMobileViewport ? 104 : 80);

                // Inicialmente, a posição atual é igual à posição inicial
                lily.tx = x;
                lily.ty = y;
                lily.moving = false; // Controla se o lírio está se movendo

                lilies.push(lily);
            }
            return lilies;
        }

        let lilies = generateLilies(160);
        let animationDone = false;
        let heartFormationStarted = false; // compat
        window.__heartProgressFraction = 0;

        // Variáveis para o efeito de pulsação do coração
        let heartPulseTime = 0;
        let heartPulseScale = 1;

        // Sistema de partículas para o coração pulsante
        class HeartParticle {
            constructor(x, y, dx, dy, heartProgress = 1) {
                this.position = { x, y };
                this.velocity = { x: dx, y: dy };
                this.acceleration = { x: dx * -1.3, y: dy * -1.3 };
                this.age = 0;
                this.duration = 2;
                this.size = 4 + heartProgress * 12; // Tamanho baseado no progresso (4 a 16)
                this.heartProgress = heartProgress;
                this.startTime = Date.now(); // Tempo de criação da partícula
            }

            update(deltaTime) {
                this.position.x += this.velocity.x * deltaTime;
                this.position.y += this.velocity.y * deltaTime;
                this.velocity.x += this.acceleration.x * deltaTime;
                this.velocity.y += this.acceleration.y * deltaTime;
                this.age += deltaTime;
            }

            draw(ctx) {
                const ease = (t) => (--t) * t * t + 1;
                const baseSize = this.size * ease(this.age / this.duration);

                // Usar a mesma pulsação do coração principal quando formado
                const heartFormed = window.__heartProgressFraction > 0.9;
                let pulseScale = 1;

                if (heartFormed) {
                    // Sincronizar com a pulsação do coração principal usando o tempo global
                    const currentTime = Date.now() * 0.00077; // Mesmo cálculo do coração principal
                    const pulsePhase = currentTime % 1.3;
                    if (pulsePhase < 0.3) {
                        pulseScale = 1 + (pulsePhase / 0.3) * -0.2; // 1 -> 0.8
                    } else if (pulsePhase < 0.6) {
                        pulseScale = 0.8 + ((pulsePhase - 0.3) / 0.3) * 0.4; // 0.8 -> 1.2
                    } else {
                        pulseScale = 1.2 + ((pulsePhase - 0.6) / 0.7) * -0.2; // 1.2 -> 1
                    }
                } else {
                    // Pulsação individual quando não formado
                    const currentTime = Date.now() * 0.00077;
                    const pulsePhase = currentTime % 1.3;
                    if (pulsePhase < 0.3) {
                        pulseScale = 1 + (pulsePhase / 0.3) * -0.2;
                    } else if (pulsePhase < 0.6) {
                        pulseScale = 0.8 + ((pulsePhase - 0.3) / 0.3) * 0.4;
                    } else {
                        pulseScale = 1.2 + ((pulsePhase - 0.6) / 0.7) * -0.2;
                    }
                }

                const size = baseSize * pulseScale;
                const alpha = 1 - this.age / this.duration;

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#FF0000';
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            isDead() {
                return this.age >= this.duration;
            }
        }

        // Pool de partículas para o coração
        class HeartParticlePool {
            constructor(maxSize) {
                this.particles = [];
                this.maxSize = maxSize;
                this.firstActive = 0;
                this.firstFree = 0;
            }

            add(x, y, dx, dy, heartProgress = 1) {
                if (this.particles.length < this.maxSize) {
                    this.particles.push(new HeartParticle(x, y, dx, dy, heartProgress));
                } else {
                    const particle = this.particles[this.firstFree];
                    particle.position.x = x;
                    particle.position.y = y;
                    particle.velocity.x = dx;
                    particle.velocity.y = dy;
                    particle.acceleration.x = dx * -1.3;
                    particle.acceleration.y = dy * -1.3;
                    particle.age = 0;
                    particle.size = 4 + heartProgress * 12;
                    particle.heartProgress = heartProgress;
                    this.firstFree = (this.firstFree + 1) % this.maxSize;
                }
            }

            update(deltaTime) {
                for (let i = 0; i < this.particles.length; i++) {
                    const particle = this.particles[i];
                    if (particle.age < particle.duration) {
                        particle.update(deltaTime);
                    }
                }
            }

            draw(ctx) {
                for (let i = 0; i < this.particles.length; i++) {
                    const particle = this.particles[i];
                    if (particle.age < particle.duration) {
                        particle.draw(ctx);
                    }
                }
            }
        }

        // Criar pool de partículas (aumentado para suportar mais partículas)
        const heartParticlePool = new HeartParticlePool(5000);
        let lastParticleTime = 0;

        function drawInitial() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const l of lilies) {
                l.draw(ctx);
            }
        }

        // Função para mover TODOS os lírios juntos, avançando igualmente a cada clique
        function moveLiliesToHeart(progress) {
            const fraction = Math.min(1, progress / 100);
            // Velocidade de convergência mais lenta e crescente
            window.__convergeSpeed = 0.004 + fraction * 0.006; // 0.004 -> 0.01
            window.__heartProgressFraction = fraction;

            for (let i = 0; i < lilies.length; i++) {
                const l = lilies[i];
                l.moving = true;
                // alvo intermediário proporcional ao progresso
                l.tx = l.startX + (l.targetX - l.startX) * fraction;
                l.ty = l.startY + (l.targetY - l.startY) * fraction;
            }
        }

        // Iniciar animação imediatamente
        function animate() {
            // desenhar em menor frequência para aliviar CPU
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Atualizar pulsação do coração
            heartPulseTime += 0.016; // ~60fps

            // Pulsação mais intensa quando o coração estiver formado
            const heartFormed = window.__heartProgressFraction > 0.9;
            const pulseIntensity = heartFormed ? 0.4 : 0.2; // Aumentei a intensidade
            const pulseSpeed = heartFormed ? 2 : 1;

            heartPulseScale = 1 + Math.sin(heartPulseTime * pulseSpeed) * pulseIntensity;

            // Adicionar partículas do coração pulsante desde o início
            const heartProgress = window.__heartProgressFraction;
            const shouldShowParticles = true; // Sempre mostrar partículas

            if (shouldShowParticles && heartPulseTime - lastParticleTime >= 0.02) { // Mais frequente
                const centerX = window.innerWidth / 2;
                const isMobile = window.matchMedia('(max-width: 768px)').matches;
                const centerY = window.innerHeight / 2 + (isMobile ? -48 : 10);

                // Calcular escala baseada no progresso (0.6 a 1.5) - ainda maior
                const baseHeartScale = Math.max(0.6, heartProgress * 0.9 + 0.6);
                const heartScale = isMobile ? baseHeartScale * 0.76 : baseHeartScale;

                // Calcular intensidade baseada no progresso (muito mais partículas)
                const baseIntensity = 8; // Base de 8 partículas
                const progressIntensity = Math.floor(heartProgress * 12); // Até 12 partículas extras
                const particleIntensity = baseIntensity + progressIntensity; // 8 a 20 partículas

                // Criar partículas em forma de coração com escala progressiva
                for (let i = 0; i < particleIntensity; i++) {
                    const t = Math.PI - 2 * Math.PI * Math.random();
                    const heartX = 160 * Math.pow(Math.sin(t), 3);
                    const heartY = 130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t) + 25;

                    const posX = centerX + heartX * heartScale;
                    const posY = centerY - heartY * heartScale;
                    const dirX = heartX * (0.2 + heartProgress * 0.6); // Velocidade aumenta com o progresso
                    const dirY = -heartY * (0.2 + heartProgress * 0.6);

                    heartParticlePool.add(posX, posY, dirX, dirY, heartProgress);
                }
                lastParticleTime = heartPulseTime;
            }

            // Atualizar e desenhar partículas
            heartParticlePool.update(0.016);
            heartParticlePool.draw(ctx);

            for (const l of lilies) {
                l.update();
                l.draw(ctx);
            }

            animationId = requestAnimationFrame(animate);
        }
        animate(); // Iniciar imediatamente

        // Camada de blur (usar a pré-criada)
        const blurLayer = document.getElementById('blurLayer');
        if (blurLayer) blurLayer.style.display = 'block';

        // Carregar fonte moderna
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);

        // Overlay transparente para UI (acima do blur)
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            z-index: 9000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        `;

        // Camada separada para partículas de coração acima do overlay para evitar artefatos
        let heartsLayer = document.getElementById('heartsLayer');
        if (!heartsLayer) {
            heartsLayer = document.createElement('div');
            heartsLayer.id = 'heartsLayer';
            heartsLayer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 10000; /* acima do overlay */
            `;
            document.body.appendChild(heartsLayer);
        }

        // Título removido

        // Contador removido

        // Criar barra de progresso
        const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            position: fixed;
            bottom: ${isMobileViewport ? 56 : 20}px;
            left: 50%;
            transform: translateX(-50%);
            width: min(420px, calc(100dvw - 24px));
            height: ${isMobileViewport ? 22 : 28}px;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            overflow: visible;
            border: 1px solid rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(8px);
            z-index: 1000;
        `;

        const progressBar = document.createElement('div');
        progressBar.id = 'progressBar';
        progressBar.style.cssText = `
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, 
                rgb(255, 120, 120), 
                rgb(255, 80, 80), 
                rgb(255, 40, 40),
                rgb(255, 0, 0)
            );
            border-radius: 13px;
            transition: width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            z-index: 1;
            box-shadow: 
                0 0 15px rgba(255, 20, 147, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.3);
            animation: progressGlow 2s ease-in-out infinite alternate;
        `;

        // Criar coração que se move na barra
        const heart = document.createElement('img');
        heart.id = 'progressHeart';
        heart.src = 'ui/cc.png';
        heart.alt = 'Coração';
        heart.style.cssText = `
            position: absolute;
            top: 50%;
            transform: translate(-50%, -50%);
            left: 0%;
            width: 38px;
            height: 38px;
            pointer-events: none;
            transition: left 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            z-index: 100;
            filter: drop-shadow(0 0 6px rgba(255, 20, 147, 0.6));
        `;

        // Criar texto do nível de amor
        const loveLevelText = document.createElement('div');
        loveLevelText.id = 'loveLevelText';
        loveLevelText.textContent = 'CLICK NA TELA';
        loveLevelText.style.cssText = `
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            color:rgb(255, 255, 255);
            font-family: 'Poppins', 'Segoe UI', 'Roboto', sans-serif;
            font-size: 19px;
            font-weight: 600;
            text-shadow: 0 0 10px rgba(255, 105, 180, 0.8);
            white-space: nowrap;
            z-index: 1001;
            letter-spacing: 0.5px;
        `;

        progressContainer.appendChild(loveLevelText);
        progressContainer.appendChild(progressBar);
        progressContainer.appendChild(heart);


        // Botão removido - apenas tecla espaço funciona

        // Efeitos de botão removidos

        // Lógica de tecla espaço
        const handleSpaceKey = () => {
            if (clickCount < maxClicks) {
                clickCount++;
                const progress = (clickCount / maxClicks) * 100;

                // Calcular nível de amor (arredondado para múltiplos de 10)
                const loveLevel = Math.floor(progress / 10) * 10;

                // Atualizar texto do nível de amor
                const loveLevelText = document.getElementById('loveLevelText');
                if (loveLevelText) {
                    loveLevelText.textContent = ` ${loveLevel}%`;
                }

                // Adicionar efeito de pulso na barra
                progressBar.style.animation = 'progressPulse 0.3s ease-out';

                progressBar.style.width = `${progress}%`;

                // Mover o coração na barra de progresso
                heart.style.left = `${progress}%`;

                // Adicionar efeito de pulso no coração
                heart.style.animation = 'heartPulse 0.3s ease-out';


                // Mover TODOS os lírios em direção ao coração baseado no progresso
                moveLiliesToHeart(progress);


                // Verificar se chegou a 100 apenas quando incrementa
                if (clickCount >= maxClicks) {
                    // Desabilitar tecla espaço durante a espera
                    document.removeEventListener('keydown', spaceKeyDownHandler);
                    document.removeEventListener('keyup', spaceKeyUpHandler);
                    document.removeEventListener('click', screenClickHandler);
                    document.removeEventListener('touchstart', screenClickHandler);
                    // Mostrar o background de flores imediatamente
                    const bgFrame = document.getElementById('siteBackground');
                    if (bgFrame) bgFrame.style.visibility = 'visible';
                    // Garantir alvo final exato, mantendo velocidade moderada
                    window.__convergeSpeed = 0.012;
                    lilies.forEach(l => {
                        l.moving = true;
                        l.tx = l.targetX;
                        l.ty = l.targetY;
                    });
                    // Manter o coração formado na tela por 5s e só depois abrir o quiz
                    setTimeout(() => {
                        console.log('Iniciando quiz...');
                        destroyLilyCanvas();
                        overlay.remove();
                        try { if (blurLayer) blurLayer.style.display = 'none'; } catch (_) { }
                        if (globalAudioPlayer) globalAudioPlayer.style.display = 'none';
                        showQuiz();
                    }, 5000);
                }
            }

            // Efeito visual removido
        };


        // Adicionar animações CSS
        const heartStyle = document.createElement('style');
        heartStyle.textContent = `
            @keyframes heartFloat {
                0% { transform: translate(-50%, -50%) scale(1); }
                100% { transform: translate(-50%, -50%) scale(1.1); }
            }
            @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            @keyframes progressShimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            @keyframes progressPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.02); }
                100% { transform: scale(1); }
            }
            @keyframes heartPulse {
                0% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -50%) scale(1.1); }
                100% { transform: translate(-50%, -50%) scale(1); }
            }
            @keyframes progressGlow {
                0% { 
                    box-shadow: 
                        0 0 15px rgba(255, 20, 147, 0.5),
                        inset 0 1px 0 rgba(255, 255, 255, 0.3);
                }
                100% { 
                    box-shadow: 
                        0 0 25px rgba(255, 20, 147, 0.7),
                        inset 0 1px 0 rgba(255, 255, 255, 0.5);
                }
            }
        `;
        document.head.appendChild(heartStyle);

        // Sistema para detectar "apertar" da barra de espaço (pressionar e soltar)
        let spaceKeyPressed = false;
        let spaceKeyHandled = false;

        const spaceKeyDownHandler = (e) => {
            if (e.code === 'Space' && !spaceKeyPressed) {
                e.preventDefault();
                spaceKeyPressed = true;
                spaceKeyHandled = false;
            }
        };

        const spaceKeyUpHandler = (e) => {
            if (e.code === 'Space' && spaceKeyPressed && !spaceKeyHandled) {
                e.preventDefault();
                spaceKeyHandled = true;
                handleSpaceKey();
                spaceKeyPressed = false;
            }
        };

        const screenClickHandler = (e) => {
            e.preventDefault(); // Prevent default touch actions if needed
            handleSpaceKey();
        };

        document.addEventListener('keydown', spaceKeyDownHandler);
        document.addEventListener('keyup', spaceKeyUpHandler);
        document.addEventListener('click', screenClickHandler);
        document.addEventListener('touchstart', screenClickHandler, { passive: false });

        // Montar a interface
        overlay.appendChild(canvas); // canvas acima do blur e abaixo da UI
        overlay.appendChild(progressContainer);
        document.body.appendChild(overlay);
    };

    const showQuiz = () => {
        console.log('showQuiz chamada!');
        // Criar overlay do quiz
        const quizOverlay = document.createElement('div');
        quizOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 12000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            font-family: 'Segoe UI', sans-serif;
        `;

        let currentQuestion = 0;
        const questions = [
            {
                question: "Quizz",
                answers: ["Começar"],
                correct: 0
            },
            {
                question: "Primeiro filme que vimos juntos?",
                answers: ["O Auto da Compadecida", "Django Livre", "Seven - Os Sete Crimes Capitais"],
                correct: 2
            },
            {
                question: "Data do meu Aniversário?",
                answers: ["28/08", "06/09", "07/09"],
                correct: 1
            },
            {
                question: "Dia da semana que começamos a nos falar?",
                answers: ["Domingo", "Quarta", "Sexta"],
                correct: 0
            }
        ];

        function createQuestionElement() {
            const questionContainer = document.createElement('div');
            questionContainer.style.cssText = `
                text-align: center;
                max-width: 600px;
                padding: 40px;
            `;

            const questionText = document.createElement('h2');
            questionText.textContent = questions[currentQuestion].question;
            questionText.style.cssText = `
                font-size: 32px;
                margin-bottom: 40px;
                color: #ffffff;
                font-weight: 300;
                letter-spacing: 1px;
            `;

            const answersContainer = document.createElement('div');
            answersContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 28px;
                align-items: center;
            `;

            // Adicionar envelope abaixo das respostas (versão de envelope da pasta envelope1)
            const envelopeContainer = document.createElement('div');
            envelopeContainer.style.cssText = `
                margin-top: 40px;
                display: flex;
                justify-content: center;
            `;

            // Estilos locais do envelope (baseado em envelope1/carta.css), com escopo
            if (!document.getElementById('quiz-envelope-styles')) {
                const scopedStyles = document.createElement('style');
                scopedStyles.id = 'quiz-envelope-styles';
                scopedStyles.textContent = `
                .quiz-envelope { position: relative; margin-top: 36px; }
                .quiz-envelope .quiz-envelope-scale { transform: scale(0.36); transform-origin: top center; }
                .quiz-envelope .valentines-day { position: relative; cursor: pointer; }
                .quiz-envelope .envelope { position: relative; filter: drop-shadow(0 0 25px rgba(0,0,0,.3)); }
                .quiz-envelope .envelope:before { content:""; position: absolute; width:254px; height:254px; background-color: #ff9494; transform: rotate(-45deg); border-radius: 0 15px 0 0; left:-37px; top:-82px; }
                .quiz-envelope .envelope:after { content:""; position: absolute; background-color: #ff9494; width:360px; height:225px; left:-90px; top:45px; }
                .quiz-envelope .heart { position: relative; background-color: #e01911; display: inline-block; height: 180px; top:50px; left:0; transform: rotate(-45deg); width:180px; filter: drop-shadow(0 -10px 25px rgba(0,0,0,.3)); transition: .5s; }
                .quiz-envelope .heart:before, .quiz-envelope .heart:after { content:""; background-color: #e01911; border-radius:50%; height: 180px; width: 180px; position: absolute; }
                .quiz-envelope .heart:before { top:-100px; left:0; }
                .quiz-envelope .heart:after { left:100px; top:0; }
                .quiz-envelope .front { position: absolute; width:0; height:0; border-right: 190px solid #fbd2d2; border-top: 113px solid transparent; border-bottom: 113px solid transparent; top:44px; left:80px; z-index:4; }
                .quiz-envelope .front:before { content:""; position: absolute; width:0; height:0; border-left: 190px solid #fbd2d2; border-top: 113px solid transparent; border-bottom: 113px solid transparent; top:-113px; left:-170px; }
                .quiz-envelope .front:after { width:0; height:0; position: absolute; content:""; border-bottom: 150px solid #fce7e9; border-right:180px solid transparent; border-left: 180px solid transparent; top:-36px; left:-170px; }
                .quiz-envelope .valentines-day:hover .heart { transform: translateY(-50px) rotate(-45deg); }
                /* Papel com texto (efeito sem deformar) */
                .quiz-envelope .paper-panel { position: absolute; top: -220px; left: 50%; transform: translateX(-50%); width: 520px; max-width: 88vw; background: linear-gradient(135deg, #fff5f7, #ffe6ec); border-radius: 16px; box-shadow: 0 8px 25px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.85); opacity: 0; transition: height .45s ease, opacity .45s ease; z-index: 100; overflow: hidden; border: 1px solid rgba(0,0,0,0.06); height: 0; }
                .quiz-envelope .paper-content { padding: 20px; height: 100%; box-sizing: border-box; display: flex; justify-content: center; align-items: center; }
                .quiz-envelope.open .paper-panel { height: 360px; opacity: 1; }
                `;
                document.head.appendChild(scopedStyles);
            }

            // Estrutura do envelope (carta) conforme envelope1/carta.html, encapsulada
            const wrapper = document.createElement('div');
            wrapper.className = 'quiz-envelope';
            const scaled = document.createElement('div');
            scaled.className = 'quiz-envelope-scale';
            const valentines = document.createElement('div');
            valentines.className = 'valentines-day';
            const env = document.createElement('div');
            env.className = 'envelope';
            const heart = document.createElement('div');
            heart.className = 'heart';
            const front = document.createElement('div');
            front.className = 'front';

            valentines.appendChild(env);
            valentines.appendChild(heart);
            valentines.appendChild(front);

            // Papel com texto (inicialmente oculto)
            const paperPanel = document.createElement('div');
            paperPanel.className = 'paper-panel';
            const paperContent = document.createElement('div');
            paperContent.className = 'paper-content';
            paperContent.innerHTML = `<img src="ui/gif.gif" alt="Surpresa" style="max-width: 100%; max-height: 100%; border-radius: 8px; object-fit: contain; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">`;
            paperPanel.appendChild(paperContent);

            scaled.appendChild(valentines);
            wrapper.appendChild(scaled);
            wrapper.appendChild(paperPanel);
            envelopeContainer.appendChild(wrapper);

            // Som da baleia
            const baleiaSound = new Audio('ui/baleiasom.mp3');

            // Clique no coração abre/fecha o papel (apenas após concluir o quiz)
            const togglePaper = () => {
                if (currentQuestion >= questions.length) {
                    wrapper.classList.toggle('open');
                    if (wrapper.classList.contains('open')) {
                        baleiaSound.currentTime = 0;
                        baleiaSound.play().catch(err => console.log('Erro ao tocar som:', err));
                        showProceedButton();
                    } else {
                        baleiaSound.pause();
                    }
                }
            };
            heart.addEventListener('click', togglePaper);
            // Permitir clicar em qualquer parte do envelope (frente) também
            front.addEventListener('click', togglePaper);
            env.addEventListener('click', togglePaper);

            questions[currentQuestion].answers.forEach((answer, index) => {
                const answerButton = document.createElement('button');
                answerButton.textContent = answer;
                answerButton.style.cssText = `
                    padding: 15px 40px;
                    font-size: 18px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 25px;
                    color: white;
                    cursor: url("ui/pink2.cur"), pointer;
                    transition: all 0.3s ease;
                    min-width: 200px;
                `;

                answerButton.addEventListener('mouseenter', () => {
                    answerButton.style.background = 'rgba(255, 255, 255, 0.2)';
                    answerButton.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                });

                answerButton.addEventListener('mouseleave', () => {
                    answerButton.style.background = 'rgba(255, 255, 255, 0.1)';
                    answerButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                });

                answerButton.addEventListener('click', () => {
                    if (index === questions[currentQuestion].correct) {
                        currentQuestion++;
                        if (currentQuestion < questions.length) {
                            questionContainer.remove();
                            quizOverlay.appendChild(createQuestionElement());
                        } else {
                            // Quiz completo - mostrar botão prosseguir após abrir carta
                            showProceedButton();
                        }
                    } else {
                        // Resposta errada - mostrar feedback
                        answerButton.style.background = 'rgba(255, 0, 0, 0.3)';
                        answerButton.style.borderColor = 'rgba(255, 0, 0, 0.5)';
                        setTimeout(() => {
                            answerButton.style.background = 'rgba(255, 255, 255, 0.1)';
                            answerButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        }, 1000);
                    }
                });

                answersContainer.appendChild(answerButton);
            });

            questionContainer.appendChild(questionText);
            questionContainer.appendChild(answersContainer);
            questionContainer.appendChild(envelopeContainer);
            return questionContainer;
        }

        function showProceedButton() {
            // Verificar se o botão já existe
            if (document.getElementById('proceedButton')) return;

            const proceedButton = document.createElement('button');
            proceedButton.id = 'proceedButton';
            proceedButton.textContent = 'PROSSEGUIR';
            proceedButton.style.cssText = `
                position: fixed;
                bottom: 50px;
                left: 50%;
                transform: translateX(-50%);
                padding: 15px 40px;
                font-size: 18px;
                background: linear-gradient(45deg, #ff69b4, #ff1493);
                border: 2px solid #ff1493;
                border-radius: 25px;
                color: white;
                cursor: url("ui/pink2.cur"), pointer;
                transition: all 0.3s ease;
                font-weight: bold;
                letter-spacing: 1px;
                z-index: 13000;
                box-shadow: 0 4px 15px rgba(255, 20, 147, 0.4);
            `;

            proceedButton.addEventListener('mouseenter', () => {
                proceedButton.style.transform = 'translateX(-50%) scale(1.05)';
                proceedButton.style.boxShadow = '0 6px 20px rgba(255, 20, 147, 0.6)';
            });

            proceedButton.addEventListener('mouseleave', () => {
                proceedButton.style.transform = 'translateX(-50%) scale(1)';
                proceedButton.style.boxShadow = '0 4px 15px rgba(255, 20, 147, 0.4)';
            });

            proceedButton.addEventListener('click', () => {
                proceedButton.remove();
                quizOverlay.remove();
                showSuccessAnimation();
            });

            // Adicionar dentro do overlay do quiz, para ficar na mesma "tela" da carta
            quizOverlay.appendChild(proceedButton);
        }

        quizOverlay.appendChild(createQuestionElement());
        document.body.appendChild(quizOverlay);
    };

    const showSuccessAnimation = () => {
        // Create glass overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(45deg, rgba(255,20,147,0.15), rgba(138,43,226,0.15));
                backdrop-filter: blur(15px) brightness(1.2);
                -webkit-backdrop-filter: blur(15px) brightness(1.2);
                z-index: 10050;
                display: flex;
                justify-content: center;
                align-items: center;
                border: 1px solid rgba(255,255,255,0.3);
                box-shadow: 0 0 50px rgba(255,20,147,0.3);
            `;

        // Create particles container
        const particles = document.createElement('div');
        particles.style.cssText = `
                position: absolute;
                width: 100%;
                height: 100%;
                overflow: hidden;
                pointer-events: none;
            `;

        // Add floating particles
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                    position: absolute;
                    width: ${Math.random() * 8 + 4}px;
                    height: ${Math.random() * 8 + 4}px;
                    background: rgba(255,255,255,${Math.random() * 0.6 + 0.4});
                    border-radius: 50%;
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 100}%;
                    animation: float ${Math.random() * 6 + 4}s infinite linear;
                    filter: blur(${Math.random() * 3}px);
                `;
            particles.appendChild(particle);
        }

        // Create success PNG
        const successImg = document.createElement('img');
        successImg.src = 'ui/euteamo.png';
        successImg.style.cssText = `
                width: 600px;
                height: 500px;
                animation: popIn 0.5s ease-out, float 4s ease-in-out infinite;
                pointer-events: none;
                filter: 
                    drop-shadow(0 0 20px rgba(255, 20, 147, 0.5))
                    brightness(1.1);
                transform-origin: center;
            `;

        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
                @keyframes popIn {
                    0% { transform: scale(0); opacity: 0; }
                    80% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-20px) scale(1.05); }
                }
                @keyframes particle {
                    0% { transform: translateY(0) translateX(0); }
                    100% { transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px); }
                }
            `;
        document.head.appendChild(style);

        overlay.appendChild(particles);
        overlay.appendChild(successImg);
        document.body.appendChild(overlay);

        // Remove after 2 seconds
        setTimeout(() => {
            overlay.remove();
            style.remove();
        }, 2500);

        mainContent.initialize();
        // Exibir o background global após concluir o login/fluxo inicial
        const bg = document.getElementById('siteBackground');
        if (bg) bg.style.visibility = 'visible';
        const staticBg = document.getElementById('staticBgLayer');
        if (staticBg) staticBg.style.display = 'none';
    };

    // *************** EFEITOS VISUAIS ***************
    const backgroundEffects = {
        createLiliesBackground: () => {
            const heartsContainer = document.createElement('div');
            heartsContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                z-index: -1;
            `;
            document.body.appendChild(heartsContainer);

            function createLily() {
                const lily = document.createElement('img');
                lily.src = 'ui/lirio.png';
                lily.className = 'lily-particle';
                lily.style.cssText = `
                    position: fixed;
                    width: ${Math.random() * 40 + 45}px;
                    user-select: none;
                    opacity: ${Math.random() * 0.5 + 0.5};
                    z-index: -1;
                    animation: fall ${Math.random() * 3 + 2}s linear forwards;
                `;
                lily.style.left = Math.random() * 100 + 'vw';
                lily.style.top = '-20px';

                heartsContainer.appendChild(lily);

                // Ajuste preciso para remoção
                const computedStyle = getComputedStyle(lily);
                const animationDuration = parseFloat(computedStyle.animationDuration) * 1000;

                setTimeout(() => {
                    lily.remove();
                }, animationDuration + 500);  // Buffer aumentado
            }

            // Use requestAnimationFrame for smoother animation
            let lastTime = 0;
            function animateLilies(timestamp) {
                if (timestamp - lastTime >= 500) {
                    createLily();
                    lastTime = timestamp;
                }
                requestAnimationFrame(animateLilies);
            }
            requestAnimationFrame(animateLilies);

            // Adicionar animação de queda
            const styleSheet = document.createElement('style');
            styleSheet.textContent = `
                @keyframes fall {
                    0% { transform: translateY(-20px) rotate(0deg); }
                    100% { transform: translateY(100vh) rotate(360deg); }
                }
            `;
            document.head.appendChild(styleSheet);
        },
        createHearts: () => {

            // Voltar para versão original com 15 corações
            for (let i = 0; i < 50; i++) {
                setTimeout(() => {
                    const heart = document.createElement('div');
                    heart.textContent = '❤️';
                    heart.style.cssText = `
                        position: fixed;
                        font-size: ${Math.random() * 30 + 20}px;
                        left: ${Math.random() * 100}%;
                        top: ${Math.random() * 100}%;
                        opacity: 1;
                        z-index: 1002;
                        animation: heartFloat ${Math.random() * 3 + 2}s ease-in-out infinite;
                        pointer-events: none;
                    `;

                    document.body.appendChild(heart);

                    // Remover após animação
                    setTimeout(() => heart.remove(), 1500);
                }, i * 100);
            }
        },
        createCryVideo: () => {
            const videoOverlay = document.createElement('div');
            videoOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.15) !important;
                backdrop-filter: blur(15px) !important;
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
            `;

            const video = document.createElement('video');
            video.src = 'videos/bomb.webm';
            video.controls = false;
            video.autoplay = true;
            video.style.cssText = `
                max-width: 90%;
                max-height: 90%;
                background: transparent !important;
                mix-blend-mode: multiply;
                filter: drop-shadow(0 0 20px rgba(255,20,147,0.5));
            `;

            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'CANCELAR';
            cancelButton.style.cssText = `
                position: absolute;
                top: 655px;
                right: 580px;
                padding: 3px 21px;
                background-color: green;
                border: none;
                border-radius: 4px;
                color: white;
                font-weight: bold;
                cursor: url("ui/pink2.cur"), pointer;
                z-index: 10001;
                font-size: 1em;
                transition: all 0.3s ease;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            `;

            // Adicionar efeito hover
            cancelButton.addEventListener('mouseenter', () => {
                cancelButton.style.backgroundColor = '#006400';
            });
            cancelButton.addEventListener('mouseleave', () => {
                cancelButton.style.backgroundColor = 'green';
            });

            videoOverlay.appendChild(video);
            videoOverlay.appendChild(cancelButton);
            document.body.appendChild(videoOverlay);

            // Evento para cancelar
            cancelButton.addEventListener('click', () => {
                video.pause();
                videoOverlay.remove();
            });

            // Evento quando o vídeo termina
            video.addEventListener('ended', () => {
                videoOverlay.remove();
                location.reload();
            });
        }
    };

    // *************** CONTEÚDO PRINCIPAL ***************
    const mainContent = {
        initialize: () => {
            // Container principal (sem fundos estáticos; deixamos só o fundo do login e o iframe de flores)
            const container = document.createElement('div');
            container.style.cssText = `
                position: relative;
                z-index: 2;
                width: 100%;
                height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
            `;

            // Adicionar elementos ao body
            document.body.appendChild(container);

            // Adicionar elementos ao container
            const topText = document.createElement('div');
            topText.textContent = "AMAR É COMPREENDER QUE A VULNERABILIDADE É A BASE PARA UMA CONEXÃO PROFUNDA";
            topText.style.cssText = `
                color: white;
                font-size: 24px;
                font-weight: 300;
                text-align: center;
                padding: 24px 20px;
                max-width: 800px;
                line-height: 1.5;
                letter-spacing: 1px;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                font-family: 'Segoe Print', sans-serif;
                margin-top: 8px;
            `;

            container.appendChild(topText);

            // Ajuste do texto superior em modo tela cheia
            const adjustTopTextForViewport = () => {
                const apiFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
                // cobre também F11 (sem Fullscreen API)
                const approxFs = window.innerHeight >= (window.screen.height - 40);
                const isFs = apiFs || approxFs;
                const newMargin = isFs ? '36px' : '8px';
                if (topText.style.marginTop !== newMargin) {
                    topText.style.marginTop = newMargin;
                    // Dispara um resize para reposicionar botões/contagem alinhados ao texto
                    try { window.dispatchEvent(new Event('resize')); } catch (_) { }
                }
            };
            adjustTopTextForViewport();
            ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
                .forEach(evt => document.addEventListener(evt, adjustTopTextForViewport));
            window.addEventListener('resize', adjustTopTextForViewport);

            // Criar o grid do jogo da memória
            // Defina aqui as 6 imagens base (uma de cada par)
            const baseImages = [
                'memoria/1.jpg',
                'memoria/2.jpg',
                'memoria/3.jpg',
                'memoria/4.jpg',
                'memoria/5.jpg',
                'memoria/6.jpg'
            ];

            // Gerar os 12 cards (pares) usando fragmentos para diferenciar no equality check
            const gameCards = baseImages.flatMap(p => [p + '#a', p + '#b']);

            // Embaralhar as cartas
            for (let i = gameCards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]];
            }

            let firstCard = null;
            let secondCard = null;
            let canFlip = true;
            let matchedPairs = 0;

            // Ajustar layout do grid para 6 cartas
            const memoryGame = document.createElement('div');
            memoryGame.style.cssText = `
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                gap: 20px;
                max-width: 900px;
                margin: 20px auto;
                padding: 20px;
                position: absolute;
                top: 52%;
                left: 50%;
                transform: translate(-50%, -50%);
                justify-content: center;
            `;


            // Função para criar PNG "duvida" após o jogo da memória ser completado
            function createBouncingPngAfterMemory() {
                // Verificar se o PNG já existe
                const existingBouncing = document.querySelector('img[src="ui/duvida.png"]');
                if (existingBouncing) return;

                // Adicionar estilo de animação de quique
                const bounceStyle = document.createElement('style');
                bounceStyle.textContent = `
                    @keyframes bounce {
                        0%, 100% { transform: translate(-50%, 0); }
                        50% { transform: translate(-50%, -20px); }
                    }
                `;
                document.head.appendChild(bounceStyle);

                const bouncingPng = document.createElement('img');
                bouncingPng.src = 'ui/duvida.png';
                bouncingPng.style.cssText = `
                    position: fixed;
                    width: 100px;
                    height: 100px;
                    left: 50%;
                    top: 80%;
                    transform: translateX(-50%);
                    cursor: pointer;
                    z-index: 1001;
                    animation: bounce 1s infinite ease-in-out;
                `;

                bouncingPng.addEventListener('click', () => {
                    // Habilitar o botão "eu te amo" quando o PNG "duvida" for clicado
                    const moveButton = document.querySelector('button[data-type="love-button"]');
                    if (moveButton) {
                        moveButton.style.pointerEvents = 'auto';
                        moveButton.style.opacity = '1';
                        moveButton.style.cursor = 'pointer';
                    }

                    // Abrir o mario com o PNG "duvida" integrado
                    const existing = document.getElementById('marioOverlay');
                    if (existing) {
                        existing.style.display = 'block';
                        document.body.style.overflow = 'hidden';
                        // Esconder o player de música
                        const audioPlayer = document.getElementById('globalAudioPlayer');
                        if (audioPlayer) audioPlayer.style.display = 'none';
                        return;
                    }
                    const overlay = document.createElement('div');
                    overlay.id = 'marioOverlay';
                    overlay.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.95);
                        z-index: 10050;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    `;
                    const frame = document.createElement('iframe');
                    frame.src = 'mario/dist/index.html';
                    frame.style.cssText = `
                        width: 100%;
                        height: 100%;
                        border: 0;
                    `;
                    const closeBtn = document.createElement('button');
                    closeBtn.textContent = '×';
                    closeBtn.setAttribute('aria-label', 'Fechar');
                    closeBtn.style.cssText = `
                        position: absolute;
                        top: 16px;
                        right: 24px;
                        width: 48px;
                        height: 48px;
                        font-size: 32px;
                        line-height: 32px;
                        color: #fff;
                        background: rgba(0,0,0,0.4);
                        border: 2px solid rgba(255,255,255,0.5);
                        border-radius: 8px;
                        cursor: pointer;
                        z-index: 10060;
                    `;
                    function closeOverlay() {
                        overlay.remove();
                        document.body.style.overflow = '';
                        // Fora da tela de senha, player permanece oculto
                        const audioPlayer = document.getElementById('globalAudioPlayer');
                        if (audioPlayer) audioPlayer.style.display = 'none';
                    }
                    closeBtn.addEventListener('click', closeOverlay);
                    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
                    document.addEventListener('keydown', function escHandler(e) { if (e.key === 'Escape') { closeOverlay(); document.removeEventListener('keydown', escHandler); } });

                    // Listener para mensagens do iframe
                    window.addEventListener('message', function (event) {
                        if (event.data === 'closeMarioOverlay') {
                            closeOverlay();
                        }
                    });

                    overlay.appendChild(frame);
                    overlay.appendChild(closeBtn);
                    document.body.appendChild(overlay);
                    document.body.style.overflow = 'hidden';
                    // Esconder o player de música
                    const audioPlayer = document.getElementById('globalAudioPlayer');
                    if (audioPlayer) audioPlayer.style.display = 'none';
                });

                document.body.appendChild(bouncingPng);
            }

            // Criar as cartas
            gameCards.forEach((imgSrc, index) => {
                const card = document.createElement('div');
                card.className = 'memory-card';
                card.style.cssText = `
                    width: 200px;
                    height: 300px;
                    background: linear-gradient(45deg, #ff69b4, #ff1493);
                    border-radius: 10px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    cursor: pointer;
                    transition: transform 0.3s;
                    transform-style: preserve-3d;
                    position: relative;
                    will-change: transform;
                    backface-visibility: hidden;
                `;

                const front = document.createElement('div');
                front.style.cssText = `
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    backface-visibility: hidden;
                    background: linear-gradient(45deg, #ff69b4, #ff1493);
                    border-radius: 10px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                `;

                // Adicionar coração na parte de trás
                const heart = document.createElement('div');
                heart.textContent = '❤️';
                heart.style.cssText = `
                    position: absolute;
                    font-size: 50px;
                    color: rgba(255, 255, 255, 255);
                    user-select: none;
                `;
                front.appendChild(heart);

                const back = document.createElement('div');
                back.style.cssText = `
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    backface-visibility: hidden;
                    border-radius: 10px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transform: rotateY(180deg);
                    overflow: hidden;
                `;

                // Adicionar imagem ao verso da carta
                const img = document.createElement('img');
                // Remover o fragmento (#a/#b) para carregar o arquivo real
                img.src = imgSrc.split('#')[0];
                img.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 10px;
                `;
                back.appendChild(img);

                card.appendChild(front);
                card.appendChild(back);

                card.addEventListener('click', () => {
                    if (!canFlip || card === firstCard || card.classList.contains('matched')) return;

                    card.style.transform = 'rotateY(180deg)';

                    if (!firstCard) {
                        firstCard = card;
                    } else {
                        secondCard = card;
                        canFlip = false;

                        const firstImg = firstCard.querySelector('img').src.split('#')[0];
                        const secondImg = secondCard.querySelector('img').src.split('#')[0];

                        if (firstImg === secondImg) {
                            firstCard.classList.add('matched');
                            secondCard.classList.add('matched');
                            firstCard = null;
                            secondCard = null;
                            canFlip = true;
                            matchedPairs++;

                            if (matchedPairs === gameCards.length / 2) {
                                setTimeout(() => {
                                    uiComponents.createModernAlert('❤️ Você completou o jogo das partes que eu amo em você ❤️', () => {
                                        // Criar o PNG "duvida" apenas após clicar OK na mensagem
                                        createBouncingPngAfterMemory();
                                    });
                                }, 500);
                            }
                        } else {
                            setTimeout(() => {
                                firstCard.style.transform = 'rotateY(0deg)';
                                secondCard.style.transform = 'rotateY(0deg)';
                                firstCard = null;
                                secondCard = null;
                                canFlip = true;
                            }, 1000);
                        }
                    }
                });

                memoryGame.appendChild(card);
            });

            container.appendChild(memoryGame);

            // ===================== PERSONAGEM LADO DOS CARDS =====================
            const karenImg = document.createElement('img');
            karenImg.src = 'ui/karen.png';
            karenImg.alt = 'Karen';
            karenImg.id = 'karenCharacter';
            karenImg.style.cssText = `
                position: fixed;
                width: 400px;
                height: auto;
                object-fit: contain;
                pointer-events: auto;
                cursor: url('ui/pink2.cur'), pointer;
                z-index: 1200;
                filter: drop-shadow(0 10px 18px rgba(0,0,0,.35));
                animation: karenFloat 3s ease-in-out infinite, karenGlow 2s ease-in-out infinite alternate;
                transition: transform 0.3s ease, filter 0.3s ease;
            `;

            const positionKaren = () => {
                const rect = memoryGame.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                // Fixa no canto direito com margem
                karenImg.style.left = 'auto';
                karenImg.style.right = '-60px';
                const box = karenImg.getBoundingClientRect();
                const imgH = box.height || (karenImg.naturalHeight || 400);
                const verticalMargin = 24;
                const top = Math.max(verticalMargin, Math.min(window.innerHeight - imgH - verticalMargin, midY - imgH / 2));
                karenImg.style.top = top + 'px';
            };

            // Adicionar animações CSS para a Karen
            const karenStyle = document.createElement('style');
            karenStyle.textContent = `
                @keyframes karenFloat {
                    0%, 100% { 
                        transform: translateY(0px) rotate(0deg); 
                    }
                    25% { 
                        transform: translateY(-8px) rotate(1deg); 
                    }
                    50% { 
                        transform: translateY(-12px) rotate(0deg); 
                    }
                    75% { 
                        transform: translateY(-8px) rotate(-1deg); 
                    }
                }
                
                @keyframes karenGlow {
                    0% { 
                        filter: drop-shadow(0 10px 18px rgba(0,0,0,.35)) drop-shadow(0 0 10px rgba(255, 20, 147, 0.3));
                    }
                    100% { 
                        filter: drop-shadow(0 10px 18px rgba(0,0,0,.35)) drop-shadow(0 0 20px rgba(255, 20, 147, 0.6)) drop-shadow(0 0 30px rgba(255, 105, 180, 0.4));
                    }
                }
                
                #karenCharacter:hover {
                    transform: scale(1.05) !important;
                    filter: drop-shadow(0 15px 25px rgba(0,0,0,.5)) drop-shadow(0 0 25px rgba(255, 20, 147, 0.8)) !important;
                    animation-play-state: paused !important;
                }
                
                #karenCharacter:active {
                    transform: scale(0.95) !important;
                }
            `;
            document.head.appendChild(karenStyle);

            document.body.appendChild(karenImg);
            // Ajustar depois de carregar para pegar dimensões naturais
            if (!karenImg.complete) {
                karenImg.addEventListener('load', () => { positionKaren(); try { window.dispatchEvent(new Event('resize')); } catch (_) { } }, { once: true });
            }
            positionKaren();
            try { window.dispatchEvent(new Event('resize')); } catch (_) { }
            window.addEventListener('resize', positionKaren);
            ;['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
                .forEach(evt => document.addEventListener(evt, positionKaren));

            // Abre o mini game em um overlay ao clicar na Karen
            karenImg.addEventListener('click', () => {
                // Efeito especial de clique na Karen
                karenImg.style.animation = 'karenFloat 0.5s ease-in-out, karenGlow 0.3s ease-in-out';

                // Criar efeito de corações ao redor da Karen
                const heartsEffect = document.createElement('div');
                heartsEffect.style.cssText = `
					position: fixed;
					pointer-events: none;
					z-index: 1300;
					width: 100px;
					height: 100px;
					left: ${karenImg.getBoundingClientRect().left + karenImg.getBoundingClientRect().width / 2 - 50}px;
					top: ${karenImg.getBoundingClientRect().top + karenImg.getBoundingClientRect().height / 2 - 50}px;
				`;

                // Criar corações animados
                for (let i = 0; i < 8; i++) {
                    const heart = document.createElement('div');
                    heart.innerHTML = '💖';
                    heart.style.cssText = `
						position: absolute;
						font-size: 20px;
						animation: heartExplosion 1s ease-out forwards;
						animation-delay: ${i * 0.1}s;
						left: 50%;
						top: 50%;
						transform: translate(-50%, -50%);
					`;
                    heartsEffect.appendChild(heart);
                }

                // Adicionar keyframes para o efeito de corações
                const heartStyle = document.createElement('style');
                heartStyle.textContent = `
					@keyframes heartExplosion {
						0% {
							transform: translate(-50%, -50%) scale(0) rotate(0deg);
							opacity: 1;
						}
						50% {
							transform: translate(-50%, -50%) scale(1.2) rotate(180deg);
							opacity: 0.8;
						}
						100% {
							transform: translate(-50%, -50%) scale(0.5) rotate(360deg);
							opacity: 0;
						}
					}
				`;
                document.head.appendChild(heartStyle);

                document.body.appendChild(heartsEffect);

                // Remover efeitos após animação
                setTimeout(() => {
                    heartsEffect.remove();
                    heartStyle.remove();
                    karenImg.style.animation = 'karenFloat 3s ease-in-out infinite, karenGlow 2s ease-in-out infinite alternate';
                }, 1000);

                const blurLayer = document.getElementById('blurLayer');
                if (blurLayer) blurLayer.style.display = 'block';

                const gameOverlay = document.createElement('div');
                gameOverlay.style.cssText = `
					position: fixed;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					background: rgba(0, 0, 0, 0.95);
					z-index: 12000;
					display: flex;
					align-items: center;
					justify-content: center;
				`;

                const frameWrapper = document.createElement('div');
                frameWrapper.style.cssText = `
					position: relative;
					width: min(1280px, 98vw);
					height: min(900px, 95vh);
					box-shadow: 0 20px 60px rgba(0,0,0,0.6);
					border-radius: 14px;
					border: 2px solid #ff1493;
					overflow: hidden;
					background: #000;
				`;

                const iframe = document.createElement('iframe');
                iframe.src = 'zombie/index.html';
                iframe.style.cssText = `
					width: 100%;
					height: 100%;
					border: 0;
					background: #000;
					display: block;
				`;
                iframe.setAttribute('allowfullscreen', '');

                const closeBtn = document.createElement('div');
                closeBtn.textContent = '×';
                closeBtn.style.cssText = `
					position: absolute;
					top: 8px;
					right: 12px;
					color: #fff;
					font-size: 32px;
					cursor: pointer;
					z-index: 10001;
					line-height: 1;
					text-shadow: 0 2px 12px rgba(0,0,0,0.6);
				`;

                const cleanup = () => {
                    try { gameOverlay.remove(); } catch (_) { }
                    try { if (blurLayer) blurLayer.style.display = 'none'; } catch (_) { }
                    document.removeEventListener('keydown', onKeyDown);
                };

                const onKeyDown = (e) => {
                    if (e.key === 'Escape') cleanup();
                };

                closeBtn.addEventListener('click', cleanup);
                gameOverlay.addEventListener('click', (e) => { if (e.target === gameOverlay) cleanup(); });
                document.addEventListener('keydown', onKeyDown);

                frameWrapper.appendChild(iframe);
                frameWrapper.appendChild(closeBtn);
                gameOverlay.appendChild(frameWrapper);
                document.body.appendChild(gameOverlay);
            });


            // ===================== CONTADOR DE TEMPO =====================
            const countdownBar = document.createElement('div');
            countdownBar.id = 'countdownBar';
            countdownBar.style.cssText = `
                position: fixed;
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                gap: 30px;
                padding: 6px;
                z-index: 1000;
            `;

            // Função para posicionar a barra alinhada e logo abaixo do grid de cartas
            const positionCountdownBar = () => {
                const rect = memoryGame.getBoundingClientRect();
                const scale = Math.min(1, Math.max(0.7, rect.width / 900));
                countdownBar.style.left = rect.left + 'px';
                countdownBar.style.width = rect.width + 'px';
                countdownBar.style.top = Math.min(window.innerHeight - 80, rect.bottom + 6) + 'px';
                countdownBar.style.transform = `scale(${scale})`;
                countdownBar.style.transformOrigin = 'left top';
            };

            // Cria um bloco do contador (valor + label)
            function createCounterBox(label) {
                const box = document.createElement('div');
                box.style.cssText = `
                    background: linear-gradient(45deg, #ff69b4, #ff1493);
                    border: 2px solid #ff1493;
                    border-radius: 10px;
                    padding: 10px 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    text-align: center;
                    box-shadow: 0 6px 0 #ff1493;
                    filter: drop-shadow(0 6px 10px #ff0095);
                    transform: skew(-6deg);
                `;

                const valueEl = document.createElement('div');
                valueEl.style.cssText = `
                    font-weight: 800;
                    font-size: 24px;
                    letter-spacing: 1px;
                    transform: skew(6deg);
                `;
                valueEl.textContent = '00';

                const labelEl = document.createElement('div');
                labelEl.style.cssText = `
                    margin-top: 2px;
                    font-size: 11px;
                    opacity: .95;
                    transform: skew(6deg);
                `;
                labelEl.textContent = label;

                box.appendChild(valueEl);
                box.appendChild(labelEl);
                return { box, valueEl };
            }

            const parts = [
                createCounterBox('Anos'),
                createCounterBox('Meses'),
                createCounterBox('Dias'),
                createCounterBox('Horas'),
                createCounterBox('Minutos'),
                createCounterBox('Segundos'),
            ];

            parts.forEach(p => countdownBar.appendChild(p.box));
            document.body.appendChild(countdownBar);
            positionCountdownBar();
            window.addEventListener('resize', positionCountdownBar);
            // Recalcular quando entrar/sair de tela cheia
            ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
                .forEach(evt => document.addEventListener(evt, positionCountdownBar));

            // Data de quando vocês se conheceram (ajuste se precisar)
            const startDate = new Date(2026, 3, 26, 0, 0, 0); // 26 Abril 2026 (mês 3)

            function pad2(n) { return String(n).padStart(2, '0'); }

            // Calcula o tempo decorrido com precisão de calendário para anos/meses
            function diffSince(start, now) {
                // Avança anos inteiros
                let years = now.getFullYear() - start.getFullYear();
                const afterYears = new Date(start.getTime());
                afterYears.setFullYear(start.getFullYear() + years);
                if (afterYears > now) { years--; afterYears.setFullYear(afterYears.getFullYear() - 1); }

                // Avança meses inteiros
                let months = (now.getMonth() - afterYears.getMonth());
                let temp = new Date(afterYears.getTime());
                temp.setMonth(afterYears.getMonth() + months);
                if (temp > now) { months--; temp.setMonth(temp.getMonth() - 1); }

                // Restante em milissegundos
                const msRest = now - temp;
                const days = Math.floor(msRest / (24 * 60 * 60 * 1000));
                const hours = Math.floor((msRest % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                const minutes = Math.floor((msRest % (60 * 60 * 1000)) / (60 * 1000));
                const seconds = Math.floor((msRest % (60 * 1000)) / 1000);

                return { years, months, days, hours, minutes, seconds };
            }

            function updateCountdown() {
                const now = new Date();
                const d = diffSince(startDate, now);
                const values = [d.years, d.months, d.days, d.hours, d.minutes, d.seconds];
                values.forEach((v, i) => { parts[i].valueEl.textContent = pad2(v); });
                positionCountdownBar();
            }

            updateCountdown();
            setInterval(updateCountdown, 1000);
            // =================== FIM CONTADOR DE TEMPO ====================

            // Create envelope container
            const envelopeContainer = document.createElement('div');
            envelopeContainer.id = 'originalEnvelopeContainer';
            envelopeContainer.style.cssText = `
                position: fixed;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 1002;
                background: rgba(0, 0, 0, 0.8);
            `;

            // Add envelope HTML structure
            envelopeContainer.innerHTML = `
                <div class="envelope-wrapper">
                    <div class="envelope"></div>
                    <div class="card">
                        <div class="back">
                            <div class="b-box">
                                <img src="https://i.ibb.co/1vhwbyp/ValCard2.jpg" alt="">
                            </div>
                        </div>
                        <div class="front">
                            <div class="f-box">
                                <img src="https://i.ibb.co/Y74sKPB/ValCard.jpg" alt="">
                            </div>
                        </div>
                        <div class="text-container" style="position: absolute; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; z-index: -1;">
                            <img src="https://i.ibb.co/Fmf3xSC/card3.jpg" alt="" style="width: 100%; height: 100%; object-fit: contain;">
                        </div>
                    </div>
                </div>
            `;

            // Add envelope styles
            const linkElement = document.createElement('link');
            linkElement.rel = 'stylesheet';
            linkElement.href = 'envelope.css';
            document.head.appendChild(linkElement);

            document.body.appendChild(envelopeContainer);

            // Fechar envelope ao clicar fora
            envelopeContainer.addEventListener('click', (e) => {
                if (e.target === envelopeContainer) {
                    envelopeContainer.style.display = 'none';
                }
            });

            // Verificar se os botões já existem antes de criar
            if (!document.getElementById('loveButton')) {
                // Barra de botões alinhada ao grid
                const buttonsBar = document.createElement('div');
                buttonsBar.id = 'buttonsBar';
                buttonsBar.style.cssText = `
                    position: fixed;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 16px;
                    z-index: 9999;
                `;

                // Função para posicionar a barra alinhada ao grid de cartas
                const positionButtonsBar = () => {
                    const rect = memoryGame.getBoundingClientRect();
                    const scale = Math.min(1, Math.max(0.75, rect.width / 900));
                    const titleBottom = topText?.getBoundingClientRect()?.bottom || 0;
                    const barHeight = buttonsBar.getBoundingClientRect().height || 64;
                    // Limites
                    const minTop = Math.max(16, titleBottom + 16); // abaixo do texto
                    const maxTop = rect.top - barHeight - 16;        // acima dos cards (com margem)
                    // Posiciona, priorizando NUNCA cobrir os cards
                    const desired = rect.top - barHeight - 24;
                    const finalTop = Math.min(maxTop, Math.max(minTop, desired));
                    buttonsBar.style.left = rect.left + 'px';
                    buttonsBar.style.width = rect.width + 'px';
                    buttonsBar.style.top = finalTop + 'px';
                    buttonsBar.style.transform = `scale(${scale})`;
                    buttonsBar.style.transformOrigin = 'left top';
                };

                // Criar botão TAMBÉM TE AMO
                const moveButton = document.createElement('button');
                moveButton.id = 'loveButton';
                moveButton.textContent = 'TAMBÉM TE AMO';
                moveButton.setAttribute('data-type', 'love-button');
                moveButton.style.cssText = `
                    width: 220px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    font-size: 1.125em;
                    font-weight: 800;
                    letter-spacing: 2px;
                    color: #fff;
                    background: linear-gradient(45deg, #ff69b4, #ff1493);
                    border: 2px solid #ff1493;
                    border-radius: .75rem;
                    box-shadow: 0 8px 0 #ff1493;
                    transform: skew(-10deg);
                    filter: drop-shadow(0 10px 10px #ff0095);
                    transition: all .1s ease;
                    font-family: 'Evil Empire', sans-serif;
                    z-index: 1;
                    pointer-events: none;
                    opacity: 0.5;
                `;
                moveButton.addEventListener('click', (event) => {
                    // Abrir envelope quando o botão "TAMBÉM TE AMO" for clicado
                    const existingEnvelope = document.getElementById('tambemTeAmoEnvelopeOverlay');
                    if (existingEnvelope) {
                        existingEnvelope.style.display = 'block';
                        document.body.style.overflow = 'hidden';
                        return;
                    }

                    // Criar overlay do envelope apenas uma vez
                    const envelopeOverlay = document.createElement('div');
                    envelopeOverlay.id = 'tambemTeAmoEnvelopeOverlay';
                    envelopeOverlay.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.95);
                        z-index: 10050;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    `;

                    // Criar container do envelope com a estrutura original
                    const envelopeContainer = document.createElement('div');
                    envelopeContainer.style.cssText = `
                        position: relative;
                        cursor: pointer;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 100%;
                        height: 100%;
                    `;

                    // Adicionar estilos do envelope (usando envelope.css) apenas uma vez
                    if (!document.querySelector('link[href="envelope.css"]')) {
                        const linkElement = document.createElement('link');
                        linkElement.rel = 'stylesheet';
                        linkElement.href = 'envelope.css';
                        document.head.appendChild(linkElement);
                    }

                    // Adicionar estilos específicos para garantir posicionamento fixo
                    const envelopeSpecificStyles = document.createElement('style');
                    envelopeSpecificStyles.id = 'tambemTeAmoEnvelopeStyles';
                    envelopeSpecificStyles.textContent = `
                        #tambemTeAmoEnvelopeOverlay .envelope-wrapper {
                            margin: 0 !important;
                            position: relative !important;
                            left: 0 !important;
                            top: 0 !important;
                            transform: none !important;
                        }
                    `;
                    if (!document.getElementById('tambemTeAmoEnvelopeStyles')) {
                        document.head.appendChild(envelopeSpecificStyles);
                    }

                    // Estrutura do envelope original
                    envelopeContainer.innerHTML = `
                        <div class="envelope-wrapper">
                            <div class="envelope"></div>
                            <div class="card">
                                <div class="back">
                                    <div class="b-box">
                                        <img src="elementos/ValCard2.jpg" alt="">
                                    </div>
                                </div>
                                <div class="front">
                                    <div class="f-box">
                                        <img src="elementos/ValCard.jpg" alt="">
                                    </div>
                                </div>
                                <div class="text-container" style="position: absolute; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; z-index: -1;">
                                    <img src="elementos/card3.jpg" alt="" style="width: 100%; height: 100%; object-fit: contain;">
                                </div>
                            </div>
                        </div>
                    `;

                    envelopeOverlay.appendChild(envelopeContainer);

                    // Adicionar botão de fechar
                    const closeButton = document.createElement('button');
                    closeButton.innerHTML = '✕';
                    closeButton.style.cssText = `
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        width: 40px;
                        height: 40px;
                        border: none;
                        background: rgba(255, 255, 255, 0.9);
                        color: #333;
                        font-size: 20px;
                        font-weight: bold;
                        border-radius: 50%;
                        cursor: pointer;
                        z-index: 10051;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                        transition: all 0.2s ease;
                    `;

                    closeButton.addEventListener('mouseenter', () => {
                        closeButton.style.background = 'rgba(255, 0, 0, 0.9)';
                        closeButton.style.color = 'white';
                    });

                    closeButton.addEventListener('mouseleave', () => {
                        closeButton.style.background = 'rgba(255, 255, 255, 0.9)';
                        closeButton.style.color = '#333';
                    });

                    envelopeOverlay.appendChild(closeButton);

                    // Fechar overlay
                    const closeOverlay = () => {
                        envelopeOverlay.style.display = 'none';
                        document.body.style.overflow = '';
                    };

                    // Event listener para o botão de fechar
                    closeButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        closeOverlay();
                    });

                    // Event listener para fechar ao clicar no fundo
                    envelopeOverlay.addEventListener('click', (e) => {
                        if (e.target === envelopeOverlay) {
                            closeOverlay();
                        }
                    });

                    // Event listener para fechar com ESC
                    const handleEscKey = (e) => {
                        if (e.key === 'Escape') {
                            closeOverlay();
                            document.removeEventListener('keydown', handleEscKey);
                        }
                    };
                    document.addEventListener('keydown', handleEscKey);

                    document.body.appendChild(envelopeOverlay);
                });

                // Criar botão NÃO TE AMO
                const cryButton = document.createElement('button');
                cryButton.id = 'cryButton';
                cryButton.textContent = 'NÃO TE AMO';
                cryButton.style.cssText = `
                    width: 184px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    font-size: 1.125em;
                    font-weight: 800;
                    letter-spacing: 2px;
                    color: #fff;
                    background: linear-gradient(45deg, #ff69b4, #ff1493);
                    border: 2px solid #ff1493;
                    border-radius: .75rem;
                    box-shadow: 0 8px 0 #ff1493;
                    transform: skew(-10deg);
                    filter: drop-shadow(0 10px 10px #ff0095);
                    transition: all .1s ease;
                    font-family: 'Evil Empire', sans-serif;
                    z-index: 1;
                `;
                cryButton.addEventListener('click', backgroundEffects.createCryVideo);

                // Criar botão JOGOS
                const gameButton = document.createElement('button');
                gameButton.id = 'gameButton';
                gameButton.textContent = 'JOGOS';
                gameButton.style.cssText = `
                    width: 184px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    font-size: 1.125em;
                    font-weight: 800;
                    letter-spacing: 2px;
                    color: #fff;
                    background: linear-gradient(45deg, #ff69b4, #ff1493);
                    border: 2px solid #ff1493;
                    border-radius: .75rem;
                    box-shadow: 0 8px 0 #ff1493;
                    transform: skew(-10deg);
                    filter: drop-shadow(0 10px 10px #ff0095);
                    transition: all .1s ease;
                    font-family: 'Evil Empire', sans-serif;
                    z-index: 1;
                `;
                gameButton.addEventListener('click', mainContent.createGameSlideshow);

                // Criar botão METAS (ao lado direito de JOGOS)
                const metasButton = document.createElement('button');
                metasButton.id = 'metasButton';
                metasButton.textContent = 'METAS';
                metasButton.style.cssText = `
                    width: 184px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    font-size: 1.125em;
                    font-weight: 800;
                    letter-spacing: 2px;
                    color: #fff;
                    background: linear-gradient(45deg, #ff69b4, #ff1493);
                    border: 2px solid #ff1493;
                    border-radius: .75rem;
                    box-shadow: 0 8px 0 #ff1493;
                    transform: skew(-10deg);
                    filter: drop-shadow(0 10px 10px #ff0095);
                    transition: all .1s ease;
                    font-family: 'Evil Empire', sans-serif;
                    z-index: 1;
                `;
                metasButton.addEventListener('click', () => {
                    uiComponents.createMetasTab();
                });

                // Criar botão JORNAL (ao lado de METAS)
                const jornalButton = document.createElement('button');
                jornalButton.id = 'jornalButton';
                jornalButton.textContent = 'JORNAL';
                jornalButton.style.cssText = `
                    width: 184px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    font-size: 1.125em;
                    font-weight: 800;
                    letter-spacing: 2px;
                    color: #fff;
                    background: linear-gradient(45deg, #ff69b4, #ff1493);
                    border: 2px solid #ff1493;
                    border-radius: .75rem;
                    box-shadow: 0 8px 0 #ff1493;
                    transform: skew(-10deg);
                    filter: drop-shadow(0 10px 10px #ff0095);
                    transition: all .1s ease;
                    font-family: 'Evil Empire', sans-serif;
                    z-index: 1;
                `;
                jornalButton.addEventListener('click', () => {
                    const existing = document.getElementById('jornalOverlay');
                    if (existing) {
                        existing.style.display = 'block';
                        document.body.style.overflow = 'hidden';
                        // Esconder o player de música
                        const audioPlayer = document.getElementById('globalAudioPlayer');
                        if (audioPlayer) audioPlayer.style.display = 'none';
                        return;
                    }
                    const overlay = document.createElement('div');
                    overlay.id = 'jornalOverlay';
                    overlay.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.95);
                        z-index: 10050;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    `;
                    const frame = document.createElement('iframe');
                    frame.src = 'jornal/dist/index.html';
                    frame.style.cssText = `
                        width: 100%;
                        height: 100%;
                        border: 0;
                        background: #000;
                    `;
                    const closeBtn = document.createElement('button');
                    closeBtn.textContent = '×';
                    closeBtn.setAttribute('aria-label', 'Fechar');
                    closeBtn.style.cssText = `
                        position: absolute;
                        top: 16px;
                        right: 24px;
                        width: 48px;
                        height: 48px;
                        font-size: 32px;
                        line-height: 32px;
                        color: #fff;
                        background: rgba(0,0,0,0.4);
                        border: 2px solid rgba(255,255,255,0.5);
                        border-radius: 8px;
                        cursor: pointer;
                        z-index: 10060;
                    `;
                    function closeOverlay() {
                        overlay.remove();
                        document.body.style.overflow = '';
                        // Fora da tela de senha, player permanece oculto
                        const audioPlayer = document.getElementById('globalAudioPlayer');
                        if (audioPlayer) audioPlayer.style.display = 'none';
                    }
                    closeBtn.addEventListener('click', closeOverlay);
                    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
                    document.addEventListener('keydown', function escHandler(e) { if (e.key === 'Escape') { closeOverlay(); document.removeEventListener('keydown', escHandler); } });
                    overlay.appendChild(frame);
                    overlay.appendChild(closeBtn);
                    document.body.appendChild(overlay);
                    document.body.style.overflow = 'hidden';
                    // Esconder o player de música
                    const audioPlayer = document.getElementById('globalAudioPlayer');
                    if (audioPlayer) audioPlayer.style.display = 'none';
                });

                // Adicionar efeito de clique apenas uma vez
                [jornalButton].forEach(button => {
                    button.addEventListener('mousedown', () => {
                        button.style.letterSpacing = '0px';
                        button.style.transform = 'skew(-10deg) translateY(8px)';
                        button.style.boxShadow = '0 0 0 #654dff63';
                    });

                    button.addEventListener('mouseup', () => {
                        button.style.letterSpacing = '2px';
                        button.style.transform = 'skew(-10deg)';
                        button.style.boxShadow = '0 8px 0 #ff1493';
                    });
                });

                // Adicionar os botões à barra e posicionar
                buttonsBar.appendChild(jornalButton);
                document.body.appendChild(buttonsBar);
                positionButtonsBar();
                window.addEventListener('resize', positionButtonsBar);
                // Recalcular quando entrar/sair de tela cheia
                ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
                    .forEach(evt => document.addEventListener(evt, positionButtonsBar));
            }

            // Player de música global (reutiliza se já existir)
            mountAudioPlayer();

            // Garantir visibilidade
            container.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        },
        createGameSlideshow: () => {
            const slideshowContainer = document.createElement('div');
            slideshowContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
            `;

            const closeBtn = document.createElement('div');
            closeBtn.textContent = '×';
            closeBtn.style.cssText = `
                position: absolute;
                top: 20px;
                right: 30px;
                color: white;
                font-size: 40px;
                cursor: pointer;
                z-index: 10001;
            `;
            closeBtn.onclick = () => slideshowContainer.remove();

            const imgContainer = document.createElement('div');
            imgContainer.style.cssText = `
                max-width: 90%;
                max-height: 90%;
                position: relative;
            `;

            const gameImages = [];
            const totalImages = 7; // Altere para o número de imagens que você tem na pasta show

            // Carrega as imagens
            for (let i = 1; i <= totalImages; i++) {
                const img = new Image();
                img.src = `show/${i}.jpg`;
                img.style.cssText = `
                    max-width: 100%;
                    max-height: 80vh;
                    object-fit: contain;
                    display: ${i === 1 ? 'block' : 'none'};
                    border-radius: 10px;
                    box-shadow: 0 0 20px rgba(255,20,147,0.5);
                `;
                img.dataset.index = i;
                gameImages.push(img);
                imgContainer.appendChild(img);
            }

            // Botões de navegação
            const prevBtn = document.createElement('div');
            prevBtn.textContent = '‹';
            prevBtn.style.cssText = `
                position: absolute;
                left: -50px;
                top: 50%;
                transform: translateY(-50%);
                color: white;
                font-size: 60px;
                cursor: pointer;
                text-shadow: 0 0 10px #ff1493;
            `;

            const nextBtn = document.createElement('div');
            nextBtn.textContent = '›';
            nextBtn.style.cssText = `
                position: absolute;
                right: -50px;
                top: 50%;
                transform: translateY(-50%);
                color: white;
                font-size: 60px;
                cursor: pointer;
                text-shadow: 0 0 10px #ff1493;
            `;

            let currentIndex = 0;

            function showImage(index) {
                gameImages.forEach(img => img.style.display = 'none');
                gameImages[index].style.display = 'block';
            }

            prevBtn.onclick = () => {
                currentIndex = (currentIndex - 1 + totalImages) % totalImages;
                showImage(currentIndex);
            };

            nextBtn.onclick = () => {
                currentIndex = (currentIndex + 1) % totalImages;
                showImage(currentIndex);
            };

            imgContainer.appendChild(prevBtn);
            imgContainer.appendChild(nextBtn);
            slideshowContainer.appendChild(imgContainer);
            slideshowContainer.appendChild(closeBtn);
            document.body.appendChild(slideshowContainer);
        }
    };

    // *************** ALERTAS E MODAIS ***************
    const uiComponents = {
        createModernAlert: (message, onOkCallback = null) => {
            const alertBox = document.createElement('div');
            alertBox.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 255, 255, 0.95);
                padding: 30px 50px;
                border-radius: 15px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                z-index: 1005;
                animation: fadeIn 0.3s ease-out;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                text-align: center;
            `;



            const messageText = document.createElement('div');
            messageText.style.cssText = `
                color: #ff1493;
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                font-family: 'Segoe Print', sans-serif;
                margin-bottom: 20px;
            `;
            messageText.textContent = message;

            const okButton = document.createElement('button');
            okButton.style.cssText = `
                background: linear-gradient(45deg, #ff69b4, #ff1493);
                border: none;
                padding: 10px 30px;
                color: white;
                border-radius: 25px;
                font-size: 16px;
                cursor: pointer;
                transition: transform 0.2s;
                font-family: 'Segoe Print', sans-serif;
                display: block;
                margin: 0 auto;
            `;
            okButton.textContent = '❤️ OK ❤️';
            okButton.onmouseover = () => okButton.style.transform = 'scale(1.05)';
            okButton.onmouseout = () => okButton.style.transform = 'scale(1)';

            // Add animation keyframes
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -60%);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%);
                    }
                }
            `;
            document.head.appendChild(style);

            alertBox.appendChild(messageText);
            alertBox.appendChild(okButton);
            document.body.appendChild(alertBox);

            // Close on button click
            okButton.onclick = () => {
                alertBox.style.animation = 'fadeIn 0.3s ease-out reverse';
                setTimeout(() => {
                    alertBox.remove();
                    // Executar callback se fornecido
                    if (onOkCallback && typeof onOkCallback === 'function') {
                        onOkCallback();
                    }
                }, 300);
            };

            // Close on click outside
            alertBox.addEventListener('click', (e) => {
                if (e.target === alertBox) {
                    alertBox.style.animation = 'fadeIn 0.3s ease-out reverse';
                    setTimeout(() => {
                        alertBox.remove();
                    }, 300);
                }
            });
        },
        createMetasTab: () => {
            // Verificar se já existe uma aba de metas aberta
            const existingTab = document.getElementById('metasTab');
            if (existingTab) {
                existingTab.remove();
                return;
            }

            const metasTab = document.createElement('div');
            metasTab.id = 'metasTab';
            metasTab.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 255, 255, 0.95);
                padding: 30px 40px;
                border-radius: 20px;
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
                z-index: 10050;
                animation: fadeIn 0.3s ease-out;
                backdrop-filter: blur(15px);
                border: 2px solid rgba(255, 182, 193, 0.3);
                text-align: center;
                min-width: 500px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
            `;

            // Título
            const title = document.createElement('h2');
            title.style.cssText = `
                color: #ff1493;
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 25px;
                font-family: 'Segoe Print', sans-serif;
                text-shadow: 2px 2px 4px rgba(255, 20, 147, 0.3);
            `;
            title.textContent = '❤️ Nossas Metas Juntos ❤️';

            // Container das metas
            const metasContainer = document.createElement('div');
            metasContainer.style.cssText = `
                text-align: left;
                margin-bottom: 25px;
            `;

            // Lista de metas
            const metas = [
                'Morar juntos em nossa própria casa',
                'Casar e formar uma família',
                'Ter um filho - Ano de 2070',
                'Ver o nascer do sol na praia',
                'Dar uma volta de bicicleta',
                'Foder gostoso',
                'Dormir de conchinha',
            ];

            // Carregar metas salvas do localStorage
            const savedMetas = JSON.parse(localStorage.getItem('metasProgress') || '{}');

            metas.forEach((meta, index) => {
                const metaItem = document.createElement('div');
                metaItem.style.cssText = `
                    display: flex;
                    align-items: center;
                    margin-bottom: 15px;
                    padding: 10px;
                    background: rgba(255, 182, 193, 0.1);
                    border-radius: 10px;
                    transition: background 0.3s ease;
                `;

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `meta-${index}`;
                checkbox.checked = savedMetas[`meta-${index}`] || false;
                checkbox.style.cssText = `
                    width: 20px;
                    height: 20px;
                    margin-right: 15px;
                    cursor: pointer;
                    accent-color: #ff1493;
                `;

                const label = document.createElement('label');
                label.htmlFor = `meta-${index}`;
                label.style.cssText = `
                    color: ${checkbox.checked ? '#ff1493' : '#666'};
                    font-size: 16px;
                    font-family: 'Segoe UI', sans-serif;
                    cursor: pointer;
                    flex: 1;
                    text-decoration: ${checkbox.checked ? 'line-through' : 'none'};
                    opacity: ${checkbox.checked ? '0.7' : '1'};
                    transition: all 0.3s ease;
                `;
                label.textContent = meta;

                // Evento para atualizar o estilo quando marcado
                checkbox.addEventListener('change', () => {
                    label.style.color = checkbox.checked ? '#ff1493' : '#666';
                    label.style.textDecoration = checkbox.checked ? 'line-through' : 'none';
                    label.style.opacity = checkbox.checked ? '0.7' : '1';

                    // Salvar progresso no localStorage
                    savedMetas[`meta-${index}`] = checkbox.checked;
                    localStorage.setItem('metasProgress', JSON.stringify(savedMetas));

                    // Efeito visual
                    metaItem.style.background = checkbox.checked ?
                        'rgba(255, 20, 147, 0.2)' :
                        'rgba(255, 182, 193, 0.1)';
                });

                metaItem.appendChild(checkbox);
                metaItem.appendChild(label);
                metasContainer.appendChild(metaItem);
            });

            // Botão de fechar
            const closeButton = document.createElement('button');
            closeButton.style.cssText = `
                background: linear-gradient(45deg, #ff69b4, #ff1493);
                border: none;
                padding: 12px 35px;
                color: white;
                border-radius: 25px;
                font-size: 16px;
                cursor: pointer;
                transition: transform 0.2s;
                font-family: 'Segoe Print', sans-serif;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(255, 20, 147, 0.3);
            `;
            closeButton.textContent = '❤️ Fechar ❤️';
            closeButton.onmouseover = () => closeButton.style.transform = 'scale(1.05)';
            closeButton.onmouseout = () => closeButton.style.transform = 'scale(1)';

            // Adicionar animação CSS
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -60%);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%);
                    }
                }
            `;
            document.head.appendChild(style);

            // Montar a aba
            metasTab.appendChild(title);
            metasTab.appendChild(metasContainer);
            metasTab.appendChild(closeButton);
            document.body.appendChild(metasTab);

            // Eventos de fechamento
            closeButton.onclick = () => {
                metasTab.style.animation = 'fadeIn 0.3s ease-out reverse';
                setTimeout(() => {
                    metasTab.remove();
                }, 300);
            };

            // Fechar clicando fora
            metasTab.addEventListener('click', (e) => {
                if (e.target === metasTab) {
                    metasTab.style.animation = 'fadeIn 0.3s ease-out reverse';
                    setTimeout(() => {
                        metasTab.remove();
                    }, 300);
                }
            });
        }
    };

    // *************** INICIALIZAÇÃO ***************
    backgroundEffects.createLiliesBackground(); // Restaurar panda no início

    // Mostrar player de música desde a tela de login
    mountAudioPlayer(true);

    // Criar tela inicial com panda e teclado numérico (sem login)
    const createLoginScreen = () => {
        const container = document.querySelector('.container');

        // Criar o panda completo
        const pandaFace = document.createElement('div');
        pandaFace.className = 'panda-face';
        pandaFace.style.zIndex = '1000';

        // Orelhas
        const earL = document.createElement('div');
        earL.className = 'ear-l';
        earL.style.zIndex = '999';
        earL.style.position = 'absolute';
        earL.style.left = 'calc(50% - 4.2em - 1.2em)';
        earL.style.top = '0.5em';
        earL.style.transform = 'rotate(-45deg)';
        earL.style.backgroundColor = '#ffffff';
        earL.style.height = '2.5em';
        earL.style.width = '2.81em';
        earL.style.border = '0.18em solid #000000';
        earL.style.borderRadius = '2.5em 2.5em 0 0';
        earL.style.display = 'block';
        earL.style.visibility = 'visible';

        const earR = document.createElement('div');
        earR.className = 'ear-r';
        earR.style.zIndex = '999';
        earR.style.position = 'absolute';
        earR.style.right = 'calc(50% - 4.2em - 1.2em)';
        earR.style.top = '0.5em';
        earR.style.transform = 'rotate(45deg)';
        earR.style.backgroundColor = '#ffffff';
        earR.style.height = '2.5em';
        earR.style.width = '2.81em';
        earR.style.border = '0.18em solid #000000';
        earR.style.borderRadius = '2.5em 2.5em 0 0';
        earR.style.display = 'block';
        earR.style.visibility = 'visible';

        console.log('Orelhas criadas:', earL, earR);

        // Blush
        const blushL = document.createElement('div');
        blushL.className = 'blush-l';
        blushL.style.zIndex = '1001';
        const blushR = document.createElement('div');
        blushR.className = 'blush-r';
        blushR.style.zIndex = '1001';

        // Olhos
        const eyeL = document.createElement('div');
        eyeL.className = 'eye-l';
        eyeL.style.zIndex = '1001';
        const eyeR = document.createElement('div');
        eyeR.className = 'eye-r';
        eyeR.style.zIndex = '1001';

        // Pupilas
        const eyeballL = document.createElement('div');
        eyeballL.className = 'eyeball-l';
        eyeballL.style.zIndex = '1002';
        const eyeballR = document.createElement('div');
        eyeballR.className = 'eyeball-r';
        eyeballR.style.zIndex = '1002';

        // Nariz
        const nose = document.createElement('div');
        nose.className = 'nose';
        nose.style.zIndex = '1001';

        // Boca
        const mouth = document.createElement('div');
        mouth.className = 'mouth';
        mouth.style.zIndex = '1001';

        // Mãos
        const handL = document.createElement('div');
        handL.className = 'hand-l';
        handL.style.zIndex = '1000';
        const handR = document.createElement('div');
        handR.className = 'hand-r';
        handR.style.zIndex = '1000';

        // Patas
        const pawL = document.createElement('div');
        pawL.className = 'paw-l';
        pawL.style.zIndex = '1000';
        const pawR = document.createElement('div');
        pawR.className = 'paw-r';
        pawR.style.zIndex = '1000';

        // Montar o panda
        eyeL.appendChild(eyeballL);
        eyeR.appendChild(eyeballR);

        console.log('Orelhas criadas:', earL, earR);
        pandaFace.appendChild(blushL);
        pandaFace.appendChild(blushR);
        pandaFace.appendChild(eyeL);
        pandaFace.appendChild(eyeR);
        pandaFace.appendChild(nose);
        pandaFace.appendChild(mouth);

        container.appendChild(earL);
        container.appendChild(earR);
        container.appendChild(pandaFace);
        container.appendChild(handL);
        container.appendChild(handR);
        container.appendChild(pawL);
        container.appendChild(pawR);

        // Reusar iframe pré-criado
        const flowersFrame = document.getElementById('flowersBackground');

        // Encaminhar cliques da página para o iframe das flores
        const forwardClickToFlowers = (ev) => {
            try {
                const x = ev.clientX / window.innerWidth;
                const y = ev.clientY / window.innerHeight;
                const idoc = flowersFrame.contentDocument || flowersFrame.contentWindow?.document;
                const api = flowersFrame.contentWindow || {};
                if (api && typeof api.__flowersSetPointer === 'function') {
                    api.__flowersSetPointer(x, y);
                } else {
                    // fallback: despachar evento de clique no canvas
                    const canvas = idoc && idoc.getElementById('canvas');
                    if (canvas) {
                        const evt = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: ev.clientX, clientY: ev.clientY });
                        canvas.dispatchEvent(evt);
                    }
                }
            } catch (_) { }
        };
        document.addEventListener('click', forwardClickToFlowers);

        // Criar teclado numérico estilo da imagem
        const keypadContainer = document.createElement('div');
        keypadContainer.className = 'keypad-container';

        // visor com bolinhas
        const display = document.createElement('div');
        display.className = 'pin-display';
        const dots = [];
        for (let i = 0; i < 8; i++) {
            const d = document.createElement('span');
            d.className = 'dot';
            display.appendChild(d);
            dots.push(d);
        }

        const grid = document.createElement('div');
        grid.className = 'keypad-grid';
        const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
        let pressed = 0;
        let buffer = '';

        function updateDots() {
            dots.forEach((d, i) => {
                d.classList.toggle('filled', i < pressed);
            });
        }

        keys.forEach(k => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'key';
            btn.textContent = k;

            // Adicionar efeito de ondas ao clicar
            btn.addEventListener('click', (e) => {
                // Criar efeito de ondas
                const ripple = document.createElement('div');
                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(47, 122, 82, 0.3);
                    transform: scale(0);
                    animation: rippleEffect 0.6s ease-out;
                    pointer-events: none;
                    z-index: 1;
                `;

                const rect = btn.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
                ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

                btn.appendChild(ripple);

                // Remover o efeito após a animação
                setTimeout(() => {
                    ripple.remove();
                }, 600);

                // Adicionar keyframes para o efeito ripple se ainda não existir
                if (!document.getElementById('rippleKeyframes')) {
                    const style = document.createElement('style');
                    style.id = 'rippleKeyframes';
                    style.textContent = `
                        @keyframes rippleEffect {
                            to {
                                transform: scale(2);
                                opacity: 0;
                            }
                        }
                    `;
                    document.head.appendChild(style);
                }
            });

            btn.addEventListener('click', () => {
                // Aceita apenas números para o PIN
                if (/^[0-9]$/.test(k)) {
                    // no primeiro dígito, cobrir os olhos
                    if (pressed === 0) {
                        try {
                            handL.classList.add('password-focused');
                            handR.classList.add('password-focused');
                        } catch (_) { }
                    }

                    if (pressed < 8) {
                        buffer += k;
                        pressed = Math.min(8, pressed + 1);
                        updateDots();
                    }
                    if (pressed === 8) {
                        setTimeout(() => {
                            if (buffer === '28082007') {
                                // voltar mãos ao normal
                                try {
                                    handL.classList.remove('password-focused');
                                    handR.classList.remove('password-focused');
                                } catch (_) { }
                                container.style.display = 'none';
                                // Remover background de flores e listener ao prosseguir
                                try {
                                    document.removeEventListener('click', forwardClickToFlowers);
                                    const f = document.getElementById('flowersBackground');
                                    if (f) f.remove();
                                } catch (_) { }
                                createClickButton();
                            } else {
                                // erro: tremer e resetar
                                display.classList.add('error');
                                setTimeout(() => {
                                    display.classList.remove('error');
                                    pressed = 0;
                                    buffer = '';
                                    updateDots();
                                    // retirar as mãos após erro
                                    try {
                                        handL.classList.remove('password-focused');
                                        handR.classList.remove('password-focused');
                                    } catch (_) { }
                                }, 450);
                            }
                        }, 120);
                    }
                }
                // Tecla apagar
                else if (k === '*') {
                    if (pressed > 0) {
                        pressed -= 1;
                        buffer = buffer.slice(0, -1);
                        updateDots();
                        if (pressed === 0) {
                            try {
                                handL.classList.remove('password-focused');
                                handR.classList.remove('password-focused');
                            } catch (_) { }
                        }
                    }
                }
            });
            grid.appendChild(btn);
        });

        keypadContainer.appendChild(display);
        keypadContainer.appendChild(grid);
        container.appendChild(keypadContainer);
    };

    createLoginScreen();

    // Adicionar no final do arquivo, antes do DOMContentLoaded
    const cursorStyle = 'url("ui/pink2.cur"), text';

    const enforceCursorStyles = () => {
        // Inputs
        document.querySelectorAll('input').forEach(input => {
            if (!input.style.cssText.includes('cursor')) {
                input.style.setProperty('cursor', cursorStyle, 'important');
            }
        });

        // Cartas do jogo
        document.querySelectorAll('.memory-game > div').forEach(card => {
            card.style.setProperty('cursor', 'url("ui/pink2.cur"), pointer', 'important');
        });

        // Imagens interativas
        document.querySelectorAll('img[src*=".png"], img[src*=".jpg"]').forEach(img => {
            img.style.setProperty('cursor', 'url("ui/pink2.cur"), pointer', 'important');
        });

        // Botões
        document.querySelectorAll('button').forEach(button => {
            button.style.setProperty('cursor', 'url("ui/pink2.cur"), pointer', 'important');
        });

        // Labels dos inputs
        document.querySelectorAll('form label').forEach(label => {
            label.style.setProperty('cursor', 'url("ui/pink2.cur"), text', 'important');
        });

        // Seleção de texto
        document.querySelectorAll('input').forEach(input => {
            input.style.setProperty('caret-color', 'transparent', 'important');
            input.style.setProperty('::selection', 'cursor: url("ui/pink2.cur"), text', 'important');
        });
    };

    // Observar mudanças no DOM
    const observer = new MutationObserver(enforceCursorStyles);
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
    });

    // Executar inicialmente e em eventos de interação
    ['DOMContentLoaded', 'click', 'mousemove', 'focus', 'blur', 'input', 'keydown', 'mouseenter'].forEach(event => {
        document.addEventListener(event, enforceCursorStyles);
    });
});
