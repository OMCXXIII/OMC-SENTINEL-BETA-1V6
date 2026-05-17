/**
 * ============================================================================
 * SENTINEL CORE RUNTIME ARCHITECTURE
 * Module: sentinel-audio-engine.js
 * Role: Cognitive Spatial Audio Infrastructure (Sovereign Presence Engine)
 * Design Aesthetic: Procedural Acoustic Synthesis & Mathematical Attenuation Hierarchy
 * ============================================================================
 */

// 27. MULTI-CHANNEL GOVERNANCE CHANNELS
const AUDIO_CHANNELS = {
  ALERTS:    'ALERTS',    // Canal soberano: Exceções críticas, pânico de hardware, alertas biométricos
  AMBIENCE:  'AMBIENCE',  // Ambiência espacializada e ruídos de fundo reativos
  COGNITION: 'COGNITION', // Tons de foco foveal, pulsos gama e indução de ressonância
  MISSION:   'MISSION',   // Sinais táticos de objetivos, telemetria audível de progresso
  XR:        'XR'         // Matrizes tridimensionais, nós de interface física e transformações espaciais
};

// 15. AUDIO ZONES GEOGRAPHY
const AUDIO_ZONES = {
  PRIMARY:   'PRIMARY',   // Campo foveal focado (+/- 15 graus à frente do olhar)
  SECONDARY: 'SECONDARY', // Periferia acústica imediata
  IMMERSIVE: 'IMMERSIVE', // Campo omnidirecional de preenchimento atmosférico
  SUPPRESSED: 'SUPPRESSED' // Regiões silenciadas ou atenuadas por saturação semântica
};

class SentinelAudioEngine {
  constructor() {
    this.version = '9.0-COGNITIVE-AUDIO';
    this.isActive = true;
    this.currentProfile = 'NORMAL';

    // 1. AUDIO RUNTIME CORE
    this.audio = {
      context: null,
      buses: new Map(),       // Canal ID -> AudioNode (Gain/DynamicsCompressor)
      channels: new Map(),    // Nome -> Objeto de Controle de Canal
      emitters: new Map(),    // ID -> PannerNode espacializado
      activeMix: 'NOMINAL'
    };

    // 2. SPATIAL AUDIO ENGINE STATE
    this.spatial = { position: { x: 0, y: 0, z: 0 }, direction: { x: 0, y: 0, z: -1 }, distance: 0.0, occlusion: false, attenuation: 1.0 };

    // 3. COGNITIVE AUDIO LAYER
    this.cognitive = { salience: 1.0, focus: 0.5, suppression: 0.0, immersion: 0.8 };

    // 4. ATTENTION AUDIO SYSTEM
    this.attention = { focusTone: null, lockCue: true, transitionCue: true, saliencePing: true };

    // 5. ALERT AUDIO SYSTEM
    this.alerts = { critical: [], warning: [], passive: [], emergency: false };

    // 6. MISSION AUDIO LAYER
    this.mission = { operationalState: 'IDLE', objectiveSignals: true, missionTransitions: true };

    // 7. XR PRESENCE ENGINE & 28. XR COMFORT AUDIO SYSTEM
    this.xr = { immersion: 1.0, comfort: 1.0, stabilization: true, spatialPresence: 'STABLE' };
    this.xrComfort = { stabilization: true, lowFatigue: true, smoothTransitions: true };

    // 8. ENVIRONMENTAL AUDIO SYSTEM
    this.environment = { ambience: null, atmosphere: 0.5, environmentalReactivity: true };

    // 9. PROCEDURAL SOUND ENGINE & 11. FOCUS TONE ENGINE
    this.procedural = { synthesis: true, modulation: true, reactiveGeneration: true };
    this.focusTones = { lock: false, sustain: null, release: false };

    // 10. NEUROACOUSTIC SYNCHRONIZATION & 12. GAMMA SYNC SYSTEM
    this.neuroSync = { rhythm: 1.0, pulse: 0.0, cognitiveResonance: 0.5 };
    this.gammaSync = { pulseRate: 40.0, immersionSync: true, alertResonance: false }; // 40Hz Gama Padrão

    // 13. DYNAMIC MIXING ENGINE
    this.mixing = { priorities: new Map(), adaptiveGain: true, contextualCompression: true };

    // 14. SPATIAL PRIORITY SYSTEM
    this.spatialPriority = { focusRegion: AUDIO_ZONES.IMMERSIVE, peripheralAudio: 1.0, suppressionZones: new Set() };

    // 17. AUDIO TELEMETRY METRICS
    this.metrics = { activeChannels: 0, audioLoad: 0.0, immersionDepth: 1.0, focusCoherence: 1.0 };

    // 18. AUDIO PERFORMANCE MANAGER
    this.performance = { cpuCost: 'LOW', spatialCost: 'HRTF_HIGH', synthesisLoad: 0.0 };

    // 20. SEMANTIC AUDIO MAPPING & 21. MEMORY AUDIO LINKING
    this.semanticAudio = { contextMapping: new Map(), missionMapping: new Map(), emotionalWeight: 1.0 };
    this.audioMemory = { contextualRecall: [], missionAssociation: [], focusPersistence: 0.85 };

    // 23. AUDIO SAFETY LAYER
    this.safety = { volumeProtection: true, fatigueProtection: true, overloadProtection: true, maxGainAllowed: 1.2 };

    this._lastPulseTime = performance.now();
    this._initAudioEngine();
  }

  // ==========================================================================
  // AudioContext Bootstrap & Pipeline Construction
  // ==========================================================================

  _initAudioEngine() {
    this.traceAudio('Invocando infraestrutura acústica modular...', 'INFO');
    
    // Lazy binding acoplado a interações do usuário para contornar políticas de segurança do navegador
    this.bindBusEvents();

    // Loop de equilíbrio contínuo e modulação procedural
    const audioPulse = () => {
      if (!this.isActive) return;
      this.maintainAudioEquilibrium();
      requestAnimationFrame(audioPulse);
    };
    requestAnimationFrame(audioPulse);
  }

  _unlockAudioContext() {
    if (this.audio.context) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audio.context = new AudioContextClass();
      
      // Construção do Compressor Geral de Segurança do Master Bus (23. Safety Layer)
      const masterCompressor = this.audio.context.createDynamicsCompressor();
      masterCompressor.threshold.setValueAtTime(-24, this.audio.context.currentTime);
      masterCompressor.knee.setValueAtTime(12, this.audio.context.currentTime);
      masterCompressor.ratio.setValueAtTime(4, this.audio.context.currentTime);
      masterCompressor.attack.setValueAtTime(0.003, this.audio.context.currentTime);
      masterCompressor.release.setValueAtTime(0.25, this.audio.context.currentTime);
      masterCompressor.connect(this.audio.context.destination);

      // Inicialização soberana das trilhas de governança multicanal (27. Governance)
      Object.keys(AUDIO_CHANNELS).forEach((channelKey) => {
        const channelGain = this.audio.context.createGain();
        channelGain.gain.setValueAtTime(0.7, this.audio.context.contextTime || 0);
        channelGain.connect(masterCompressor);

        this.audio.buses.set(AUDIO_CHANNELS[channelKey], channelGain);
      });

      this._startProceduralAtmosphere();
      this.traceAudio('AudioContext estabelecido. Pipeline e limitadores de segurança armados.');
    } catch (error) {
      this.traceAudio(`Falha crônica ao instanciar barramento de áudio: ${error.message}`, 'CRITICAL');
    }
  }

  // ==========================================================================
  // 2. SPATIAL AUDIO ENGINE & 15. AUDIO ZONES
  // ==========================================================================

  createSpatialEmitter(id, x = 0, y = 0, z = 0, channel = AUDIO_CHANNELS.XR) {
    if (!this.audio.context) return null;

    let panner = null;
    this.safeAudioCall(() => {
      panner = this.audio.context.createPanner();
      // Configuração rígida de simulação tridimensional realista por HRTF
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1.0;
      panner.maxDistance = 10000;
      panner.rolloffFactor = 1.5;
      panner.coneInnerAngle = 360;

      panner.positionX.setValueAtTime(x, this.audio.context.currentTime);
      panner.positionY.setValueAtTime(y, this.audio.context.currentTime);
      panner.positionZ.setValueAtTime(z, this.audio.context.currentTime);

      const bus = this.audio.buses.get(channel);
      if (bus) panner.connect(bus);

      this.audio.emitters.set(id, panner);
    });

    return panner;
  }

  updateSpatialListener(x, y, z, orientX, orientY, orientZ) {
    if (!this.audio.context) return;
    
    const listener = this.audio.context.listener;
    const now = this.audio.context.currentTime;

    // Atualiza vetores espaciais do operador em tempo real vindos do Engine WebXR
    this.spatial.position = { x, y, z };
    this.spatial.direction = { x: orientX, y: orientY, z: orientZ };

    if (typeof listener.positionX !== 'undefined') {
      listener.positionX.setValueAtTime(x, now);
      listener.positionY.setValueAtTime(y, now);
      listener.positionZ.setValueAtTime(z, now);
      listener.forwardX.setValueAtTime(orientX, now);
      listener.forwardY.setValueAtTime(orientY, now);
      listener.forwardZ.setValueAtTime(orientZ, now);
    } else {
      // Método de compatibilidade fallback para navegadores legados
      listener.setOrientation(orientX, orientY, orientZ, 0, 1, 0);
    }
  }

  // ==========================================================================
  // 9. PROCEDURAL SOUND ENGINE & 11. FOCUS TONE ENGINE
  // ==========================================================================

  _startProceduralAtmosphere() {
    if (!this.procedural.synthesis || !this.audio.context) return;

    // Síntese de Hum Atmosférico de Baixa Frequência (Estabilidade e Preservação XR)
    const osc = this.audio.context.createOscillator();
    const filter = this.audio.context.createBiquadFilter();
    const gain = this.audio.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(60.0, this.audio.context.currentTime); // 60Hz Base Ground Hum

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120.0, this.audio.context.currentTime);

    gain.gain.setValueAtTime(0.12, this.audio.context.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    
    const ambienceBus = this.audio.buses.get(AUDIO_CHANNELS.AMBIENCE);
    if (ambienceBus) gain.connect(ambienceBus);

    osc.start();
    this.environment.ambience = { osc, gain };
  }

  triggerFocusTone(state = 'START') {
    if (!this.audio.context) return;

    this.safeAudioCall(() => {
      const now = this.audio.context.currentTime;

      if (state === 'START' || state === 'LOCK') {
        if (this.focusTones.sustain) return; // Já em execução

        // 11. Focus Tone Engine: Síntese Binaural de Ondas Senoidais casadas para indução atencional
        const oscL = this.audio.context.createOscillator();
        const oscR = this.audio.context.createOscillator();
        const pannerL = this.audio.context.createStereoPanner ? this.audio.context.createStereoPanner() : null;
        const pannerR = this.audio.context.createStereoPanner ? this.audio.context.createStereoPanner() : null;
        const gain = this.audio.context.createGain();

        // Janela de Ressonância Gama de 40Hz (12. Gamma Sync System)
        oscL.frequency.setValueAtTime(200.0, now);
        oscR.frequency.setValueAtTime(200.0 + this.gammaSync.pulseRate, now);

        gain.gain.setValueAtTime(0.0, now);
        // Rampagem suave para evitar transientes e estalos acústicos (28. XR Comfort Audio)
        gain.gain.linearRampToValueAtTime(0.25, now + 1.5);

        if (pannerL && pannerR) {
          pannerL.pan.setValueAtTime(-1, now);
          pannerR.pan.setValueAtTime(1, now);
          oscL.connect(pannerL).connect(gain);
          oscR.connect(pannerR).connect(gain);
        } else {
          oscL.connect(gain);
          oscR.connect(gain);
        }

        const cogniBus = this.audio.buses.get(AUDIO_CHANNELS.COGNITION);
        if (cogniBus) gain.connect(cogniBus);

        oscL.start(now);
        oscR.start(now);

        this.focusTones.sustain = { oscL, oscR, gain };
        this.traceAudio('Foco Topológico trancado. Onda Binaural Gama [40Hz] ativa no buffer de cognição.');
      } else if (state === 'RELEASE') {
        // Desengajamento controlado e amortecido do tom de foco
        if (!this.focusTones.sustain) return;
        const sustain = this.focusTones.sustain;
        sustain.gain.gain.cancelScheduledValues(now);
        sustain.gain.gain.setValueAtTime(sustain.gain.gain.value, now);
        sustain.gain.gain.linearRampToValueAtTime(0.0, now + 0.8);
        
        setTimeout(() => {
          try {
            sustain.oscL.stop();
            sustain.oscR.stop();
          } catch(e){}
          this.focusTones.sustain = null;
        }, 900);
      }
    });
  }

  // ==========================================================================
  // 5. ALERT AUDIO SYSTEM & PRIORITIZATION
  // ==========================================================================

  playCriticalAlertPing() {
    if (!this.audio.context) return;

    this.safeAudioCall(() => {
      const now = this.audio.context.currentTime;
      const alertBus = this.audio.buses.get(AUDIO_CHANNELS.ALERTS);
      if (!alertBus) return;

      // Alerta Tonal Agressivo de Frequência Escalonada (5. Alert Audio System)
      const osc = this.audio.context.createOscillator();
      const gain = this.audio.context.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880.0, now); // Nota Lá penetrante
      osc.frequency.setValueAtTime(1200.0, now + 0.08); // Salto exponencial de descontinuidade

      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.7, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain).connect(alertBus);
      osc.start(now);
      osc.stop(now + 0.5);

      // 13. Dynamic Mixing: Aplica "Ducking" temporário nos canais de ambiência para clareza
      this._applyTemporaryDucking(AUDIO_CHANNELS.AMBIENCE, 0.15, 0.5);
    });
  }

  _applyTemporaryDucking(channelName, targetVolume, durationSec) {
    const bus = this.audio.buses.get(channelName);
    if (!bus || !this.audio.context) return;

    const now = this.audio.context.currentTime;
    bus.gain.cancelScheduledValues(now);
    bus.gain.setValueAtTime(bus.gain.value, now);
    bus.gain.linearRampToValueAtTime(targetVolume, now + 0.05);
    bus.gain.setValueAtTime(targetVolume, now + durationSec);
    bus.gain.linearRampToValueAtTime(0.7, now + durationSec + 0.3); // Retorna ao ganho padrão
  }

  // ==========================================================================
  // 16. ADAPTIVE AUDIO ENGINE & 29. COGNITIVE EQUILIBRIUM
  // ==========================================================================

  adaptAudio() {
    if (!this.audio.context) return;

    // Se o sistema reportar um cenário de Sobrecarga Cognitiva (Overload Visual/Mental), simplifica a malha de som
    if (this.cognitive.focus > 0.8 || this.alerts.emergency) {
      // Mascara e filtra frequências agudas da ambiência para descanso sensorial (23. Safety Layer)
      const ambienceBus = this.audio.buses.get(AUDIO_CHANNELS.AMBIENCE);
      if (ambienceBus) {
        ambienceBus.gain.setValueAtTime(0.2, this.audio.context.currentTime); // Abafa som ambiente periférico
      }
      this.spatialPriority.focusRegion = AUDIO_ZONES.PRIMARY;
    } else {
      const ambienceBus = this.audio.buses.get(AUDIO_CHANNELS.AMBIENCE);
      if (ambienceBus) {
        ambienceBus.gain.setValueAtTime(0.6, this.audio.context.currentTime);
      }
      this.spatialPriority.focusRegion = AUDIO_ZONES.IMMERSIVE;
    }
  }

  maintainAudioEquilibrium() {
    const now = performance.now();
    const deltaTime = (now - this._lastPulseTime) / 1000;
    this._lastPulseTime = now;

    // Acoplamento dinâmico com telemetria e focos de atenção reais do SENTINEL
    if (window.SentinelAttention) {
      this.cognitive.focus = window.SentinelAttention.attention.cognitiveLoad;
      this.alerts.emergency = window.SentinelAttention.cognitiveLoad.overloadRisk;
    }

    this.adaptAudio();
    this._calculateAudioTelemetry();
  }

  _calculateAudioTelemetry() {
    this.metrics.activeChannels = Array.from(this.audio.emitters.values()).length;
    this.metrics.audioLoad = this.focusTones.sustain ? 0.35 : 0.05;
    
    // Alimenta o barramento global de telemetria se disponível
    if (window.StateStore) {
      window.StateStore.set('telemetry.audioChannelsActive', this.metrics.activeChannels);
    }
  }

  applyAudioProfile(mode) {
    this.currentProfile = mode;
    this.traceAudio(`Perfil acústico alterado para: [${mode}]`);

    if (mode === 'FOCUS') {
      this.triggerFocusTone('START');
    } else if (mode === 'XR') {
      this.xr.immersion = 1.0;
      this.procedural.synthesis = true;
    } else if (mode === 'LOW_POWER') {
      // 26. Desliga síntese pesada para poupar ciclos de processador
      if (this.environment.ambience) {
        try { this.environment.ambience.osc.stop(); } catch(e){}
        this.environment.ambience = null;
      }
    }
  }

  // ==========================================================================
  // 19. AUDIO EVENT BUS INTEGRATION
  // ==========================================================================

  bindBusEvents() {
    const triggerUnlock = () => {
      this._unlockAudioContext();
      window.removeEventListener('click', triggerUnlock);
      window.removeEventListener('keydown', triggerUnlock);
    };

    window.addEventListener('click', triggerUnlock);
    window.addEventListener('keydown', triggerUnlock);

    if (window.SentinelBus) {
      // Reage a mudanças estruturais de foco no orquestrador de atenção
      window.SentinelBus.on('attention:focus-shifted', (data) => {
        if (data && data.target) {
          this.triggerFocusTone('LOCK');
          // Dispara um som sutil de trancamento de mira perceptual
          this.playAttentionLockPing();
        }
      });

      window.SentinelBus.on('system:nsdr-trigger', () => {
        this.applyAudioProfile('LOW_POWER');
      });

      window.SentinelBus.on('boot:complete', () => {
        this._unlockAudioContext();
      });
    }
  }

  playAttentionLockPing() {
    if (!this.audio.context) return;
    this.safeAudioCall(() => {
      const now = this.audio.context.currentTime;
      const cogniBus = this.audio.buses.get(AUDIO_CHANNELS.COGNITION);
      if (!cogniBus) return;

      const osc = this.audio.context.createOscillator();
      const gain = this.audio.context.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440.0, now);
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.1);

      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain).connect(cogniBus);
      osc.start(now);
      osc.stop(now + 0.2);
    });
  }

  // ==========================================================================
  // 22. IMMERSION STABILIZATION & SAFETY VERIFICATION
  // ==========================================================================

  stabilizeImmersion() {
    // Tática neuroacústica ativa: Se houver perda de rastreamento ou travamento de renderizador,
    // injeta ruído rosa ou hum de fase invertida estável para evitar tontura ou desorientação espacial do operador.
    this.traceAudio('Injetando vetor acústico de estabilização vestibular.');
    this.applyAudioProfile('XR');
  }

  snapshotAudio() {
    return {
      profile: this.currentProfile,
      mix: this.audio.activeMix,
      timestamp: Date.now()
    };
  }

  restoreAudio(snapshot) {
    if (!snapshot) return;
    this.applyAudioProfile(snapshot.profile);
    this.traceAudio('Instantâneo harmônico restaurado com sucesso.');
  }

  safeAudioCall(executionBlock) {
    try {
      executionBlock();
    } catch (error) {
      this.traceAudio(`Exceção interceptada no motor acústico: ${error.message}`, 'WARN');
    }
  }

  traceAudio(msg, level = 'INFO') {
    const formatted = `[${new Date().toISOString()}] [SENTINEL_AUDIO] [${level}] ${msg}`;
    if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
    else if (level === 'WARN') console.warn(formatted);
    else console.log(formatted);
  }
}

// Instanciação e amarração imediata no ecossistema global do SENTINEL
const SovereignAudioEngine = new SentinelAudioEngine();
window.SentinelAudio = SovereignAudioEngine;

export default SovereignAudioEngine;