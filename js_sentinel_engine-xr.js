/**
 * ============================================================================
 * SENTINEL CORE RUNTIME ARCHITECTURE
 * Module: sentinel-engine-xr.js
 * Version: 8.5-SOVEREIGN (Spatial Cognitive Operating Runtime)
 * Design Aesthetic: Ultra-Low Latency Spatial Governance & Cognitive Foveation
 * ============================================================================
 */

// 8. XR ZONES SYSTEM - Geografia Cognitiva Espacial Estrita
const XR_ZONES = {
  SAFE_ZONE:       'SAFE_ZONE',       // HUD estável ancorado ao espaço de cabeça (Head-locked)
  FOCUS_ZONE:      'FOCUS_ZONE',      // Interação crítica tridimensional e matriz tátil
  IMMERSION_ZONE:  'IMMERSION_ZONE',  // Presença ambiental volumétrica de fundo
  ALERT_ZONE:      'ALERT_ZONE',      // Overlays de avisos e interrupções síncronas do Kernel
  PERIPHERAL_ZONE: 'PERIPHERAL_ZONE'  // Zona suprimida de baixa prioridade visual e atualização
};

// 25. MULTI-LAYER XR RENDERING MAPPING
const XR_LAYERS = {
  WORLD:       0,
  FOCUS:       1,
  HUD:         2,
  DIAGNOSTICS: 3,
  OVERLAY:     4
};

class SentinelSpatialEngine {
  constructor() {
    this.version = '8.5-SOVEREIGN';
    
    // 1. XR RUNTIME CORE STATE
    this.xr = {
      active: false,
      session: null,
      mode: '2D_STABLE',
      supported: false
    };

    // 2. XR SESSION GOVERNANCE
    this.session = {
      immersive: false,
      inline: true,
      visibility: 'hidden',
      referenceSpace: null,
      frameRate: 60,
      latency: 0.0
    };

    // 3. SPATIAL SCENE GRAPH
    this.spatialSceneGraph = new Map();

    // 4. XR CAMERA SYSTEM
    this.camera = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      projection: null,
      eyeOffset: 0.063, // IPD médio normatizado (63mm)
      frustum: null
    };

    // 5. TRACKING ENGINE
    this.tracking = {
      head: { position: { x: 0, y: 0, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 }, velocity: { x: 0, y: 0, z: 0 } },
      hands: new Map(),
      controllers: new Map(),
      gaze: { direction: { x: 0, y: 0, z: -1 }, origin: { x: 0, y: 0, z: 0 } },
      anchors: new Map()
    };

    // 6. INPUT MAPPING SYSTEM
    this.input = {
      gestures: [],
      gaze: null,
      controllers: [],
      voice: null,
      touch: null
    };

    // 7. XR INTERACTION LAYER
    this.interactions = {
      focus: null,
      grab: null,
      activate: null,
      navigate: null,
      manipulate: null
    };

    // 9. ATTENTION SPACE ENGINE
    this.attention = {
      gazeTarget: null,
      focusStrength: 1.0,
      peripheralSuppression: true,
      cognitiveWeight: 1.0
    };

    // 10. PRESENCE ENGINE & 11. COMFORT ENGINE
    this.presence = {
      immersion: 1.0,
      comfort: 1.0,
      embodiment: 1.0,
      spatialStability: 1.0
    };

    this.comfort = {
      motionSicknessRisk: 0.0,
      accelerationLimit: 4.5, // m/s² max para blindagem vestibular
      rotationalSmoothing: 0.85,
      tunnelVision: 0.0 // Intensidade de vinheta dinâmica em giros bruscos
    };

    // 12. XR PERFORMANCE LAYER & 13. FOVEATED RENDERING
    this.performance = {
      fps: 60,
      frameTime: 0.0,
      reprojection: false,
      droppedFrames: 0,
      latency: 0.0
    };

    this.foveation = {
      enabled: true,
      centerQuality: 1.0,
      peripheralQuality: 0.15
    };

    // 15. IMMERSION ENGINE & 16. SPATIAL AUDIO SYNCHRONIZATION
    this.immersion = {
      density: 1.0,
      atmosphere: 'NOMINAL',
      environmentalWeight: 1.0,
      sensoryLoad: 0.0
    };

    this.audio = {
      spatial: true,
      directionality: true,
      environmentalReverb: 'CHAMBER_DEFAULT'
    };

    // 17. COGNITIVE XR LAYER
    this.cognitive = {
      missionPriority: 'HIGH',
      focusDensity: 1.0,
      distractionSuppression: true,
      urgency: 0.0
    };

    // 20. XR TELEMETRY SYSTEM
    this.metrics = {
      fps: 60,
      latency: 0.0,
      trackingQuality: 1.0,
      immersionLevel: 1.0,
      comfortScore: 1.0
    };

    // 27. WEBGPU XR FUTURE LAYER
    this.webgpu = {
      enabled: false,
      computePasses: [],
      volumetrics: false,
      neuralFX: false
    };

    this._initializeSpatialEngine();
  }

  // ==========================================================================
  // 1. XR RUNTIME CORE & SESSION GOVERNANCE
  // ==========================================================================

  async _initializeSpatialEngine() {
    this.traceXR('Invocando varredura profunda de hardware gráfico...', 'INFO');
    
    // Teste de alocação ativa profunda de buffer (Deep GPU Validation)
    this.xr.supported = this._performDeepGPUValidation();

    if (this.xr.supported && navigator.xr) {
      try {
        const isSupported = await navigator.xr.isSessionSupported('immersive-vr');
        if (isSupported) {
          this.xr.mode = 'XR_READY';
          this.traceXR('Subsistema WebXR mapeado com suporte Imersivo.');
        }
      } catch (e) {
        this.traceXR(`Falha na verificação de recursos WebXR: ${e.message}`, 'WARN');
      }
    }

    this._bindCoreCommunication();
    this._injectSpatialLayers();
  }

  _performDeepGPUValidation() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2', { alpha: false, antialias: true }) ||
                 canvas.getContext('experimental-webgl');
      if (!gl) return false;
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      if (gl.isContextLost && gl.isContextLost()) return false;
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
      return true;
    } catch (_) {
      return false;
    }
  }

  async startXRSession() {
    if (!this.xr.supported || !navigator.xr) {
      this.traceXR('Abortando inicialização: WebXR não suportado no hardware nativo.', 'ERROR');
      this.degradeXR('HARDWARE_MISSING');
      return false;
    }

    this.safeXR(async () => {
      const session = await navigator.xr.requestSession('immersive-vr', {
        requiredFeatures: ['local-floor', 'bounded-floor'],
        optionalFeatures: ['hand-tracking', 'layers']
      });

      this.xr.active = true;
      this.xr.session = session;
      this.xr.mode = 'IMMERSIVE_VR';

      // 2. Hydrate Session Governance Properties
      this.session.immersive = true;
      this.session.inline = false;
      this.session.visibility = session.visibilityState;

      const refSpace = await session.requestReferenceSpace('local-floor');
      this.session.referenceSpace = refSpace;

      session.addEventListener('visibilitychange', (e) => this._handleVisibilityChange(e));
      session.addEventListener('end', () => this.stopXRSession());

      // Ativa o loop frame pacing espacial soberano
      session.requestAnimationFrame((t, f) => this.paceXRFrames(t, f));
      
      window.SentinelBus?.emit('xr:activated', { sessionID: `XR_${Date.now()}` });
      this.rememberSpatialState();
    });
  }

  async stopXRSession() {
    if (this.xr.session) {
      await this.xr.session.end();
      this.xr.session = null;
    }
    this.xr.active = false;
    this.xr.mode = '2D_STABLE';
    this.session.immersive = false;
    window.SentinelBus?.emit('xr:deactivated', { ts: Date.now() });
  }

  // ==========================================================================
  // 3. SPATIAL SCENE GRAPH ENGINE
  // ==========================================================================

  registerSpatialNode(id, nodeConfig) {
    const node = {
      id,
      type: nodeConfig.type || 'spatial-matrix',
      transform: nodeConfig.transform || { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
      visibility: nodeConfig.visibility !== false,
      xrLayer: nodeConfig.xrLayer || XR_LAYERS.WORLD,
      focusWeight: nodeConfig.focusWeight || 1.0,
      interaction: nodeConfig.interaction || null,
      occludable: nodeConfig.occludable !== false,
      immersive: nodeConfig.immersive !== false,
      update: nodeConfig.update || null
    };

    this.spatialSceneGraph.set(id, node);
  }

  // ==========================================================================
  // 5. TRACKING ENGINE & 19. XR FRAME PACING
  // ==========================================================================

  paceXRFrames(timestamp, xrFrame) {
    if (!this.xr.active || !this.xr.session) return;

    const frameStart = performance.now();
    this.synchronizeXR();

    this.safeXR(() => {
      const pose = xrFrame.getViewerPose(this.session.referenceSpace);
      if (pose) {
        // 4. XR Camera System - Captura matrizes estéreo oculares direct drivers
        this.camera.position = pose.transform.position;
        this.camera.rotation = pose.transform.orientation;
        
        // Atualiza e estabiliza o rastreamento posicional
        this.updateTracking(pose, xrFrame);
        this.stabilizeTracking();

        // 14. Perform Spatial Occlusion Culling Pass para purgar chamadas GPU invisíveis
        this.performSpatialOcclusion(pose);

        // Executa processamento lógico de nós espaciais mapeados
        this.spatialSceneGraph.forEach(node => {
          if (node.visibility && typeof node.update === 'function') {
            node.update(timestamp, xrFrame);
          }
        });
      }
    });

    this.stabilizeXRLatency(frameStart);
    this.xr.session.requestAnimationFrame((t, f) => this.paceXRFrames(t, f));
  }

  updateTracking(pose, xrFrame) {
    // 5. Head Tracking Engine + Predict Tracking Gaze Core
    this.tracking.head.position = pose.transform.position;
    this.tracking.head.orientation = pose.transform.orientation;

    // Alimenta dinamicamente os alvos de interação preditivos da camada de entrada
    this.mapInput(xrFrame);
  }

  predictTracking() {
    // Interpolação preditiva baseada em vetor de velocidade linear para eliminar jitter
    const headVelocity = this.tracking.head.velocity;
    return {
      x: this.tracking.head.position.x + (headVelocity.x * 0.011), // 11ms Lookahead predict window
      y: this.tracking.head.position.y + (headVelocity.y * 0.011),
      z: this.tracking.head.position.z + (headVelocity.z * 0.011)
    };
  }

  stabilizeTracking() {
    // Aplica matrizes de filtro passa-baixa e suavização rotacional atencional
    if (this.presence.spatialStability < 0.9) {
      this.comfort.rotationalSmoothing = 0.95; // Amortece movimentos da câmera se houver instabilidade
    }
  }

  // ==========================================================================
  // 6. INPUT MAPPING SYSTEM & 7. XR INTERACTION LAYER
  // ==========================================================================

  mapInput(xrFrame) {
    const inputSources = this.xr.session.inputSources;
    this.input.controllers = [];

    inputSources.forEach(source => {
      if (source.gamepad) {
        const controllerData = {
          handedness: source.handedness,
          axes: [...source.gamepad.axes],
          buttons: source.gamepad.buttons.map(b => b.value)
        };
        this.input.controllers.push(controllerData);
        this.resolveInteraction(source, xrFrame);
      }
    });
  }

  resolveInteraction(source, xrFrame) {
    // Processamento de proximidade tridimensional baseado em zonas espaciais cognitivas
    const inputPose = xrFrame.getPose(source.targetRaySpace, this.session.referenceSpace);
    if (!inputPose) return;

    this.spatialSceneGraph.forEach(node => {
      if (!node.visibility || !node.interaction) return;
      
      // Cálculo analítico de distância euclidiana simples entre o feixe de input e o nó espacial
      const dx = node.transform.position.x - inputPose.transform.position.x;
      const dy = node.transform.position.y - inputPose.transform.position.y;
      const dz = node.transform.position.z - inputPose.transform.position.z;
      const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

      if (distance < 0.35) { // Esfera tátil de ativação (35cm)
        this.interactions.focus = node.id;
        this.attention.gazeTarget = node.id;
        
        // 17. Adapta o espaço baseado em relevância cognitiva imediata
        if (this.cognitive.distractionSuppression) {
          this._applySpatialFoveation(node.id);
        }
      }
    });
  }

  // ==========================================================================
  // 13. FOVEATED RENDERING & 14. OCCLUSION SYSTEM
  // ==========================================================================

  _applySpatialFoveation(focusedNodeID) {
    this.spatialSceneGraph.forEach(node => {
      if (node.id === focusedNodeID) {
        node.focusWeight = this.attention.focusStrength * 2.0; // Ganho de fidelidade
      } else if (node.xrLayer === XR_LAYERS.WORLD) {
        // 9. Peripheral Suppression ativo: reduz custos de renderização periférica drásticos
        node.focusWeight = this.foveation.peripheralQuality;
      }
    });
  }

  performSpatialOcclusion(pose) {
    this.spatialSceneGraph.forEach(node => {
      if (!node.occludable || node.xrLayer === XR_LAYERS.HUD) return;

      // Frustum Culling rudimentar baseado em vetor de olhar reverso
      const nodeVecZ = node.transform.position.z - pose.transform.position.z;
      if (nodeVecZ > 0) { 
        // Objeto localizado atrás do plano focal da câmera espacial -> desliga chamadas
        node.visibility = false;
      } else {
        node.visibility = true;
      }
    });
  }

  // ==========================================================================
  // 11. COMFORT ENGINE & VESTIBULAR SHIELDING
  // ==========================================================================

  stabilizeComfort(angularVelocity) {
    if (angularVelocity > this.comfort.accelerationLimit) {
      this.comfort.motionSicknessRisk = 0.85;
      this.comfort.tunnelVision = Math.min(1.0, this.comfort.tunnelVision + 0.15); // Injeta vinheta via pulvinar-shield
      this.adaptComfort();
    } else {
      this.comfort.tunnelVision = Math.max(0.0, this.comfort.tunnelVision - 0.05);
    }
  }

  adaptComfort() {
    const shield = document.getElementById('pulvinar-shield');
    if (shield) {
      // Modula o gradiente 2D overlay dinamicamente para contrair o campo de visão do usuário durante giros
      shield.style.background = `radial-gradient(circle, transparent ${100 - (this.comfort.tunnelVision * 50)}%, rgba(0,0,0,0.95) 100%)`;
      shield.style.opacity = this.comfort.tunnelVision > 0 ? '1' : '0';
    }
  }

  // ==========================================================================
  // 18. ADAPTIVE XR DEGRADATION & 22. RECOVERY SYSTEM
  // ==========================================================================

  degradeXR(reason) {
    this.traceXR(`Acionando degradação adaptativa espacial imediata. Causa: ${reason}`, 'WARN');
    
    this.performance.reprojection = true;
    this.foveation.peripheralQuality = 0.05; // Estrola periferia visual para alívio de GPU
    
    // Perfil de baixo consumo forçado
    this.applyXRProfile('LOW_POWER');
    
    window.SentinelBus?.emit('telemetry:graphics-low', {
      reason,
      mode: this.xr.mode,
      ts: Date.now()
    });
  }

  recoverXR() {
    this.traceXR('Iniciando protocolo de restauração atômica de tracking e sessão...', 'WARN');
    this.safeXR(() => {
      this.restoreTracking();
      this.restoreSpatialContext();
    });
  }

  restoreTracking() {
    this.traceXR('Limpando buffers de âncoras espaciais corrompidos e re-sincronizando poses primárias.');
    this.tracking.hands.clear();
    this.tracking.controllers.clear();
    this.presence.spatialStability = 1.0;
  }

  // ==========================================================================
  // 24. MODE-AWARE XR PROFILES
  // ==========================================================================

  applyXRProfile(mode) {
    this.traceXR(`Aplicando perfil operacional espacial: [${mode}]`);
    switch (mode) {
      case 'LOW_POWER':
        this.foveation.enabled = true;
        this.foveation.peripheralQuality = 0.0,
        this.spatialSceneGraph.forEach(node => {
          if (node.xrLayer === XR_LAYERS.WORLD && !node.immersive) node.visibility = false;
        });
        break;
      case 'FOCUS':
        this.comfort.accelerationLimit = 6.0;
        this.attention.peripheralSuppression = true;
        this.cognitive.distractionSuppression = true;
        break;
      default:
        this.foveation.peripheralQuality = 0.15;
        this.comfort.accelerationLimit = 4.5;
    }
  }

  // ==========================================================================
  // 23. XR SNAPSHOT SYSTEM & 29. SPATIAL MEMORY INTEGRATION
  // ==========================================================================

  snapshotXR() {
    return {
      pose: { position: { ...this.camera.position }, rotation: { ...this.camera.rotation } },
      mode: this.xr.mode,
      activeScene: 'CORE_NEXUS_ROOT',
      focusZone: this.interactions.focus,
      immersionState: this.immersion.atmosphere,
      timestamp: Date.now()
    };
  }

  restoreSpatialContext() {
    // Solicita hidratação persistente direta da camada L2/L3 via SentinelMemory
    if (typeof window.SentinelMemory !== 'undefined') {
      const savedXRState = window.SentinelMemory.retrieve('xr_spatial_snapshot');
      if (savedXRState) {
        this.camera.position = savedXRState.pose?.position || this.camera.position;
        this.traceXR('Contexto espacial ressuscitado estavelmente via barramento de persistência viva.');
      }
    }
  }

  rememberSpatialState() {
    if (typeof window.SentinelMemory !== 'undefined') {
      window.SentinelMemory.store('xr_spatial_snapshot', this.snapshotXR(), 'xr', 'SESSION', 'IMPORTANT');
    }
  }

  // ==========================================================================
  // 30. XR SYNCHRONIZATION ENGINE & INTERNAL TELEMETRY
  // ==========================================================================

  synchronizeXR() {
    if (typeof window.StateStore !== 'undefined') {
      // Coleta dados atencionais e de carga cognitiva diretamente do Kernel Central
      const activeMission = window.StateStore.get('ops.activeMission');
      this.cognitive.missionPriority = activeMission ? 'CRITICAL' : 'HIGH';
      this.cognitive.urgency = window.StateStore.get('telemetry.pfcLoad') || 0.0;
    }
  }

  stabilizeXRLatency(frameStart) {
    const frameElapsed = performance.now() - frameStart;
    this.performance.frameTime = frameElapsed;
    this.performance.fps = Math.min(this.session.frameRate, Math.round(1000 / frameElapsed));
    
    // Alimenta estruturas de métricas consolidadas do runtime
    this.metrics.fps = this.performance.fps;
    this.metrics.latency = frameElapsed;
    this.metrics.comfortScore = 1.0 - (this.comfort.motionSicknessRisk * 0.5);

    if (this.performance.fps < (this.session.frameRate - 5)) {
      this.performance.droppedFrames++;
      if (this.performance.droppedFrames > 15) {
        this.degradeXR('FRAME_RATE_COLLAPSE');
        this.performance.droppedFrames = 0;
      }
    }
  }

  _handleVisibilityChange() {
    if (this.xr.session) {
      this.session.visibility = this.xr.session.visibilityState;
      this.traceXR(`Mudança de estado de visibilidade da sessão WebXR: [${this.session.visibility}]`);
    }
  }

  _bindCoreCommunication() {
    if (window.SentinelBus) {
      window.SentinelBus.once('boot:complete', () => {
        this.traceXR('Sinal boot:complete interceptado via Bus. Elevando presença espacial.');
        this.startXRSession();
      });

      // Hook de escuta nativa para reajustes térmicos delegados pelo Renderer principal
      window.SentinelBus.on('renderer:thermal_load', (data) => {
        if (data?.level) this.stabilizeComfort(data.level / 10);
      });
    }
  }

  _injectSpatialLayers() {
    if (document.getElementById('pulvinar-shield')) return;
    const overlay = document.createElement('div');
    overlay.id = 'pulvinar-shield';
    Object.assign(overlay.style, {
      position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '9999', opacity: '0',
      transition: 'opacity 0.3s ease',
      background: 'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.85) 150%)'
    });
    document.body.appendChild(overlay);
  }

  // ==========================================================================
  // 28. SAFETY XR LAYER BARRIER
  // ==========================================================================
  safeXR(executionBlock) {
    try {
      executionBlock();
    } catch (e) {
      this.traceXR(`Exceção interceptada na barreira espacial de segurança: ${e.message}`, 'CRITICAL');
      this.recoverXR();
    }
  }

  traceXR(msg, level = 'INFO')        { this.trace(`[CORE] ${msg}`, level); }
  traceTracking(msg, level = 'INFO') { this.trace(`[TRACKING] ${msg}`, level); }
  traceImmersion(msg, level = 'INFO') { this.trace(`[IMMERSION] ${msg}`, level); }

  trace(message, level = 'INFO') {
    const formatted = `[${new Date().toISOString()}] [SPATIAL_ENGINE_XR] [${level}] ${message}`;
    if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
    else if (level === 'WARN') console.warn(formatted);
    else console.log(formatted);
  }
}

// Inicialização e ancoragem formal no ecossistema global do SENTINEL
const SovereignSpatialEngine = new SentinelSpatialEngine();
window.SentinelSpatialEngine = SovereignSpatialEngine;

export default SovereignSpatialEngine;
