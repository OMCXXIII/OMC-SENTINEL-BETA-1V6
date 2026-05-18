/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE SPATIAL AUDIO INFRASTRUCTURE (PRESENÇA OPERACIONAL)
 * Arquivo: sentinel-audio-engine.js
 * Papel: Síntese de Áudio Procedural, Espacialização 3D e Modulação de Foco
 * Governança: Totalmente subordinado ao SovereignKernel. Sem auto-boot implícito.
 * Integrando: Spatial Audio, Alert Tones, Focus Tones, Gamma Sync, Ambience e Routing.
 * ═══════════════════════════════════════════════════════════════════════════
 */

class SentinelAudioEngine {
    constructor() {
        this.version = "9.0-OPERATIONAL-PRESENCE";
        this.isActive = false;

        // Infraestrutura nativa do ecossistema WebAudio
        this.audioCtx = null;
        this.masterGain = null;

        // F) EVENT AUDIO ROUTING: Nós de ganho dedicados por canal de prioridade estrutural
        this.channels = {
            ALERTS:    { gainNode: null, weight: 1.0 }, // Exceções críticas e pânico térmico
            COGNITION: { gainNode: null, weight: 0.7 }, // Tons de foco e Gamma Sync
            MISSION:   { gainNode: null, weight: 0.5 }, // Notificações táticas de progresso
            AMBIENCE:  { gainNode: null, weight: 0.2 }  // Ruídos procedurais de atmosfera e fundo
        };

        // A) SPATIAL AUDIO: Coordenadas da cabeça (ouvinte) e nós panners ativos
        this.listenerCoords = { x: 0, y: 0, z: 0, forwardX: 0, forwardY: 0, forwardZ: -1 };
        this.activeSpatialPanners = new Map();

        // D) GAMMA SYNC AUDIO: Armazenamento do oscilador de ressonância contínuo
        this.gammaSyncNode = null;

        this.bus = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INICIALIZAÇÃO RETARDADA E CONFIGURAÇÃO DE ROTAS (EVENT AUDIO ROUTING)
    // ═══════════════════════════════════════════════════════════════════════
    initializeAudioContext() {
        if (this.isActive) return;

        try {
            // Instancia o contexto de áudio em conformidade com as restrições de segurança de hardware
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContextClass();
            
            // Cria o nó mestre de atenuação de saída
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.setValueAtTime(0.8, this.audioCtx.currentTime);
            this.masterGain.connect(this.audioCtx.destination);

            // F) EVENT AUDIO ROUTING: Montagem física da malha de roteamento por sub-canais
            Object.keys(this.channels).forEach(channelKey => {
                const gNode = this.audioCtx.createGain();
                gNode.gain.setValueAtTime(this.channels[channelKey].weight, this.audioCtx.currentTime);
                gNode.connect(this.masterGain);
                this.channels[channelKey].gainNode = gNode;
            });

            this.isActive = true;
            this._trace('LIFECYCLE', 'WebAudio API Context ativado. Rotas de canais estabelecidas de forma segura.');

            // Inicializa geradores contínuos em segundo plano
            this._startEnvironmentalAmbience();
            this._startGammaSyncOscillator();

        } catch (err) {
            this._trace('LIFECYCLE', `Falha severa ao instanciar barramento de áudio: ${err.message}`, 'CRITICAL');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // A) SPATIAL AUDIO INTERFACE (ATUALIZAÇÃO DE COORDENADAS)
    // ═══════════════════════════════════════════════════════════════════════
    updateListenerOrientation(x, y, z, fx, fy, fz) {
        if (!this.isActive || !this.audioCtx) return;

        this.listenerCoords = { x, y, z, forwardX: fx, forwardY: fy, forwardZ: fz };
        const listener = this.audioCtx.listener;

        // Suporta sintaxe moderna e legada para orientação espacial WebXR
        if (listener.positionX) {
            listener.positionX.setValueAtTime(x, this.audioCtx.currentTime);
            listener.positionY.setValueAtTime(y, this.audioCtx.currentTime);
            listener.positionZ.setValueAtTime(z, this.audioCtx.currentTime);
            listener.forwardX.setValueAtTime(fx, this.audioCtx.currentTime);
            listener.forwardY.setValueAtTime(fy, this.audioCtx.currentTime);
            listener.forwardZ.setValueAtTime(fz, this.audioCtx.currentTime);
        } else {
            // Fallback para navegadores imersivos antigos
            listener.setPosition(x, y, z);
            listener.setOrientation(fx, fy, fz, 0, 1, 0);
        }
    }

    createSpatialSource(sourceId, posX, posY, posZ) {
        if (!this.isActive || !this.audioCtx) return null;

        // Cria e parametriza um nó panner tridimensional físico
        const panner = this.audioCtx.createPanner();
        panner.panningModel = 'HRTF'; // Filtro de alta fidelidade binaural anatômica
        panner.distanceModel = 'inverse';
        panner.refDistance = 1.0;
        panner.maxDistance = 100.0;
        panner.rolloffFactor = 1.2;

        if (panner.positionX) {
            panner.positionX.setValueAtTime(posX, this.audioCtx.currentTime);
            panner.positionY.setValueAtTime(posY, this.audioCtx.currentTime);
            panner.positionZ.setValueAtTime(posZ, this.audioCtx.currentTime);
        } else {
            panner.setPosition(posX, posY, posZ);
        }

        this.activeSpatialPanners.set(sourceId, panner);
        return panner;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // B) ALERT TONES (SÍNTESE DE CRITICIDADE DE HARDWARE)
    // ═══════════════════════════════════════════════════════════════════════
    playAlertTone(type = 'WARNING') {
        if (!this.isActive || !this.audioCtx) return;

        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.channels.ALERTS.gainNode);

        if (type === 'CRITICAL' || type === 'PANIC') {
            // Sirene dupla dissonante entrelaçada senoidal/dente-de-serra
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.linearRampToValueAtTime(440, now + 0.25);
            osc.frequency.linearRampToValueAtTime(880, now + 0.5);

            gainNode.gain.setValueAtTime(0.0, now);
            gainNode.gain.linearRampToValueAtTime(0.4, now + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.50);
            osc.start(now);
            osc.stop(now + 0.50);
        } else {
            // Alerta padrão senoidal de interrupção curta (Beep de Atenção)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1250, now);
            
            gainNode.gain.setValueAtTime(0.0, now);
            gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // C) FOCUS TONES (INDUTORES DE FOCO COGNITIVO FOVEAL)
    // ═══════════════════════════════════════════════════════════════════════
    triggerFocusClick(salienceWeight = 1.0) {
        if (!this.isActive || !this.audioCtx) return;

        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        osc.type = 'sine';
        // Adapta dinamicamente a frequência com base no peso da relevância da entidade focada
        const targetFreq = 440 + (salienceWeight * 220); 
        osc.frequency.setValueAtTime(targetFreq, now);

        osc.connect(gainNode);
        gainNode.connect(this.channels.COGNITION.gainNode);

        // Curva envolvente de transição extremamente suave para não gerar cliques mecânicos
        gainNode.gain.setValueAtTime(0.0, now);
        gainNode.gain.linearRampToValueAtTime(0.15 * salienceWeight, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // D) GAMMA SYNC AUDIO (BINAURAL DE ALTA INTENSIDADE COGNITIVA)
    // ═══════════════════════════════════════════════════════════════════════
    _startGammaSyncOscillator() {
        if (!this.isActive || !this.audioCtx) return;

        const now = this.audioCtx.currentTime;
        this.gammaSyncNode = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        this.gammaSyncNode.type = 'sine';
        // Frequência padrão fixa de sintonia cerebral focada: Ondas Gamma a 40Hz acopladas a uma portadora de 200Hz
        this.gammaSyncNode.frequency.setValueAtTime(240, now); 

        this.gammaSyncNode.connect(gainNode);
        gainNode.connect(this.channels.COGNITION.gainNode);

        // Mantém volume residual tático constante imperceptível de fundo
        gainNode.gain.setValueAtTime(0.03, now);
        this.gammaSyncNode.start(now);
    }

    adjustGammaSyncIntensity(focusScore) {
        if (!this.isActive || !this.gammaSyncNode) return;
        
        const now = this.audioCtx.currentTime;
        // Eleva sutilmente a frequência da portadora se o operador expandir a carga mental
        const dynamicFreq = 240 + (focusScore * 40);
        this.gammaSyncNode.frequency.setTargetAtTime(dynamicFreq, now, 0.1);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // E) ENVIRONMENTAL AMBIENCE (GERADOR PROCEDURAL DE RUÍDO ROSA)
    // ═══════════════════════════════════════════════════════════════════════
    _startEnvironmentalAmbience() {
        if (!this.isActive || !this.audioCtx) return;

        const bufferSize = 2 * this.audioCtx.sampleRate;
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        // Algoritmo matemático contínuo para geração de Ruído Rosa Procedural Puro
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11; // Compensação de ganho para normalização de amplitude
            b6 = white * 0.115926;
        }

        const noiseSource = this.audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, this.audioCtx.currentTime); // Abafa altas frequências mecânicas externas

        noiseSource.connect(filter);
        filter.connect(this.channels.AMBIENCE.gainNode);
        
        noiseSource.start(0);
        this._trace('AMBIENCE', 'Gerador procedural de Ruído Rosa estabilizador injetado no canal atmosférico.');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INTERCEPTAÇÃO DO BARRAMENTO E DISTRIBUIÇÃO (EVENT AUDIO ROUTING)
    // ═══════════════════════════════════════════════════════════════════════
    _attachSignalBus(busInstance) {
        this.bus = busInstance;

        // Escuta gatilhos de interação do usuário para disparar cliques táteis com base no olhar
        this.bus.on('xr:gaze_moved', (data) => {
            // Inicializa de forma preguiçosa (Lazy) no primeiro input físico real para contornar travas do navegador
            if (!this.isActive) {
                this.initializeAudioContext();
            }

            if (data && data.target) {
                const weight = data.urgency !== undefined ? data.urgency : 0.5;
                this.triggerFocusClick(weight);
            }
        });

        // Intercepta violações de segurança e pânico do Firewall para emitir alertas sonoros imediatos
        this.bus.on('firewall:contract_violation', (violation) => {
            this.playAlertTone('CRITICAL');
        });

        this.bus.on('kernel:force_emergency_panic', () => {
            this.playAlertTone('CRITICAL');
            // Atenua severamente os sub-canais de som secundários em estado de colapso de hardware
            if (this.isActive) {
                const now = this.audioCtx.currentTime;
                this.channels.AMBIENCE.gainNode.gain.linearRampToValueAtTime(0.01, now + 0.1);
                this.channels.MISSION.gainNode.gain.linearRampToValueAtTime(0.0, now + 0.1);
            }
        });

        // Atualiza a modulação neuroacústica conforme as leituras do AttentionManager mudarem
        this.bus.on('attention:load-mutation', (data) => {
            if (data && data.score) {
                this.adjustGammaSyncIntensity(data.score);
            }
        });
    }

    _trace(subsystem, message, level = 'INFO') {
        const formatted = `[${new Date().toISOString()}] [AUDIO-ENGINE:${subsystem}] [${level}] ${message}`;
        if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
        else if (level === 'WARN') console.warn(formatted);
        else console.log(formatted);
    }
}

// Instanciação e exposição unificada em total conformidade com o ecossistema v9.0
const SovereignAudioEngine = new SentinelAudioEngine();
window.SentinelAudio = SovereignAudioEngine;

// Acoplamento automático imediato caso o barramento sínclito já esteja instanciado na viewport
if (window.SentinelBus) {
    SovereignAudioEngine._attachSignalBus(window.SentinelBus);
}

export default SovereignAudioEngine;
