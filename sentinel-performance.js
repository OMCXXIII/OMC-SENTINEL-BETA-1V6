/**
 * ============================================================================
 * SENTINEL CORE RUNTIME ARCHITECTURE
 * Module: sentinel-performance.js
 * Role: Adaptive Runtime Homeostasis Engine (Operational Nervous System)
 * Design Aesthetic: High-Density Cybernetic Equilibrium & Predictive Diagnostics
 * ============================================================================
 */

// 11. DEGRADATION PROFILES
const PERFORMANCE_PROFILES = {
  NORMAL:    'NORMAL',    // Fidelidade máxima, shaders complexos ativos, sem supressão periférica
  BALANCED:  'BALANCED',  // Redução sutil de efeitos secundários (partículas à metade)
  LOW_POWER: 'LOW_POWER', // viewport a 0.5x, desativação de Bloom/Glow, intervalos de ociosidade CPU
  XR_SAFE:   'XR_SAFE',   // Priorização absoluta de latência ocular, foveation forçado, trava em 72Hz
  EMERGENCY: 'EMERGENCY'  // Suspensão de módulos ambientais, renderização apenas de diagnóstico e HUD crítico
};

class SentinelPerformanceEngine {
  constructor() {
    this.version = '1.0.0';
    this.isActive = true;
    this.currentProfile = PERFORMANCE_PROFILES.NORMAL;

    // 1. RUNTIME METRICS ENGINE
    this.metrics = {
      fps: 60,
      frameTime: 0.0,
      gpuPressure: 0.0,
      cpuLoad: 0.0,
      memoryPressure: 0.0,
      xrLatency: 0.0
    };

    // 3. FRAME TIME ANALYZER
    this.frame = {
      current: 0.0,
      average: 16.666,
      peak: 0.0,
      variance: 0.0,
      pacing: 'STABLE'
    };

    // 4. GPU PRESSURE ANALYZER
    this.gpu = {
      drawCalls: 0,
      shaderCost: 0.0,
      texturePressure: 0.0,
      saturation: 0.0,
      renderCost: 0.0
    };

    // 5. CPU LOAD ANALYZER
    this.cpu = {
      scripting: 0.0,
      schedulerLoad: 0.0,
      updateCost: 0.0,
      eventCost: 0.0
    };

    // 6. MEMORY PRESSURE SYSTEM
    this.memory = {
      heapUsage: 0.0,
      allocationRate: 0.0,
      leakRisk: 0.0,
      gcPressure: 0.0
    };

    // 7. THERMAL ESTIMATION ENGINE
    this.thermal = {
      level: 25.0, // Estimativa em graus Celsius delta sobre temperatura ambiente
      trend: 'STABLE', // STABLE, RISING, FALLING
      risk: 'NOMINAL', // NOMINAL, MITIGATION, CRITICAL
      mitigation: false
    };

    // 8. XR STABILITY MONITOR
    this.xr = {
      latency: 0.0,
      reprojectionRate: 0.0,
      trackingStability: 1.0,
      comfortRisk: 0.0,
      droppedFrames: 0
    };

    // 16. STABILITY SCORE SYSTEM
    this.stability = {
      runtime: 1.0, // Escalas normalizadas de 0.0 a 1.0
      xr: 1.0,
      render: 1.0,
      cognition: 1.0
    };

    // 17. COGNITIVE LOAD METRICS
    this.cognitive = {
      attentionDensity: 0.0,
      focusLoad: 0.0,
      distractionLevel: 0.0,
      immersionPressure: 0.0
    };

    // 19. TELEMETRY PIPELINE (Buffers circulares históricos para análise preditiva)
    this.telemetry = {
      frameHistory: [],
      gpuHistory: [],
      thermalHistory: [],
      xrHistory: [],
      maxBufferSize: 300
    };

    // 21. ALERT SYSTEM
    this.alerts = {
      thermalCritical: false,
      fpsCollapse: false,
      xrRisk: false,
      memoryLeak: false
    };

    // 26. PERFORMANCE DOMAIN SYSTEM
    this.domains = {
      xr: 0.0, renderer: 0.0, scheduler: 0.0, cognition: 0.0, audio: 0.0, telemetry: 0.0
    };

    // 27. WEBGPU METRICS FUTURE
    this.webgpu = { computeCost: 0.0, shaderPipelines: 0, gpuDispatches: 0 };

    this._frameHistoryRaw = [];
    this._lastTimestamp = performance.now();

    this._initializeHomeostaticEngine();
  }

  // ==========================================================================
  // 2. FPS MONITOR & 3. FRAME TIME ANALYZER
  // ==========================================================================

  trackFPS(timestamp) {
    const delta = timestamp - this._lastTimestamp;
    this._lastTimestamp = timestamp;
    
    this.frame.current = delta;
    this._frameHistoryRaw.push(delta);
    
    if (this._frameHistoryRaw.length > 60) {
      this._frameHistoryRaw.shift();
    }

    this.analyzeFramePacing();
    this._calculateAggregates(delta);
  }

  _calculateAggregates(currentDelta) {
    const sum = this._frameHistoryRaw.reduce((a, b) => a + b, 0);
    this.frame.average = sum / this._frameHistoryRaw.length;
    this.metrics.fps = Math.round(1000 / this.frame.average);

    // Identificação analítica de desvios e picos (Jitter)
    this.frame.peak = Math.max(...this._frameHistoryRaw);
    
    const varianceSum = this._frameHistoryRaw.reduce((a, b) => a + Math.pow(b - this.frame.average, 2), 0);
    this.frame.variance = varianceSum / this._frameHistoryRaw.length;

    // 2. Detecção em tempo real de micro-quedas e colapsos estruturais
    this.detectFPSDrop();
  }

  detectFPSDrop() {
    const targetFPS = this.currentProfile === PERFORMANCE_PROFILES.XR_SAFE ? 72 : 60;
    
    // Alerta se a variância dos frames ultrapassar o limite crítico de estabilidade ocular (Microstutter)
    if (this.frame.variance > 12.5 && this.currentProfile === PERFORMANCE_PROFILES.XR_SAFE) {
      this.xr.comfortRisk = Math.min(1.0, this.xr.comfortRisk + 0.2);
      this.traceXR('Instabilidade severa de frame pacing detectada (Alto Risco de Cinetose).', 'WARN');
    }

    if (this.metrics.fps < targetFPS * 0.85) {
      if (!this.alerts.fpsCollapse) {
        this.alerts.fpsCollapse = true;
        this.tracePerformance(`Queda estrutural de FPS ativada: ${this.metrics.fps} frames/s.`, 'CRITICAL');
        this.degrade('FPS_COLLAPSE');
      }
    } else {
      this.alerts.fpsCollapse = false;
    }
  }

  // ==========================================================================
  // 9. FRAME PACING ANALYZER
  // ==========================================================================

  analyzeFramePacing() {
    if (this.frame.variance < 1.5) {
      this.frame.pacing = 'STABLE';
    } else if (this.frame.variance < 5.0) {
      this.frame.pacing = 'JITTER_WARNING';
    } else {
      this.frame.pacing = 'UNSTABLE_CLUSTER';
      this.detectAnomalies('FRAME_CLUSTERING');
    }
  }

  // ==========================================================================
  // 7. THERMAL ESTIMATION ENGINE (Modelo Termodinâmico Preditivo por Software)
  // ==========================================================================

  _updateThermalEstimation() {
    // Fatores de ganho dissipativo vs. carga energética computacional sustentada
    const cpuFactor = this.metrics.cpuLoad * 0.12;
    const gpuFactor = this.gpu.saturation * 0.22;
    const xrFactor = this.currentProfile === PERFORMANCE_PROFILES.XR_SAFE ? 0.15 : 0.02;

    const energyIn = cpuFactor + gpuFactor + xrFactor;
    const coolingOut = (this.thermal.level - 20.0) * 0.005; // Modelo de convecção simples Newtoniana

    const previousLevel = this.thermal.level;
    this.thermal.level += (energyIn - coolingOut);
    this.thermal.trend = this.thermal.level > previousLevel ? 'RISING' : 'FALLING';

    if (this.thermal.level > 42.0) {
      this.thermal.risk = 'CRITICAL';
      this.alerts.thermalCritical = true;
      this.degrade('THERMAL_CRITICAL');
    } else if (this.thermal.level > 35.0) {
      this.thermal.risk = 'MITIGATION';
      this.alerts.thermalCritical = false;
      if (!this.thermal.mitigation) this.degrade('THERMAL_WARNING');
    } else {
      this.thermal.risk = 'NOMINAL';
      this.thermal.mitigation = false;
      this.alerts.thermalCritical = false;
    }
  }

  // ==========================================================================
  // 10. ADAPTIVE DEGRADATION ENGINE & 12. RECOVERY ENGINE
  // ==========================================================================

  degrade(reason) {
    this.safePerformance(() => {
      this.tracePerformance(`Iniciando degradação adaptativa por contenção de barramento: [${reason}]`, 'WARN');

      switch (this.currentProfile) {
        case PERFORMANCE_PROFILES.NORMAL:
          this.applyPerformanceProfile(PERFORMANCE_PROFILES.BALANCED);
          break;
        case PERFORMANCE_PROFILES.BALANCED:
          this.applyPerformanceProfile(PERFORMANCE_PROFILES.LOW_POWER);
          break;
        case PERFORMANCE_PROFILES.LOW_POWER:
        case PERFORMANCE_PROFILES.XR_SAFE:
          if (reason === 'THERMAL_CRITICAL' || reason === 'FPS_COLLAPSE') {
            this.applyPerformanceProfile(PERFORMANCE_PROFILES.EMERGENCY);
          }
          break;
      }

      this.pushDiagnostics();
    });
  }

  recoverPerformance() {
    // Tenta regressar ao equilíbrio de fidelidade caso as métricas retornem à normalidade nominal
    if (this.stability.runtime > 0.92 && !this.alerts.thermalCritical && !this.alerts.fpsCollapse) {
      this.tracePerformance('Estabilidade operacional reatada. Restaurando perfis de processamento originais.');
      
      if (this.currentProfile === PERFORMANCE_PROFILES.EMERGENCY) {
        this.applyPerformanceProfile(PERFORMANCE_PROFILES.LOW_POWER);
      } else if (this.currentProfile === PERFORMANCE_PROFILES.LOW_POWER) {
        this.applyPerformanceProfile(PERFORMANCE_PROFILES.BALANCED);
      } else if (this.currentProfile === PERFORMANCE_PROFILES.BALANCED) {
        this.applyPerformanceProfile(PERFORMANCE_PROFILES.NORMAL);
      }
      this.pushDiagnostics();
    }
  }

  applyPerformanceProfile(mode) {
    this.currentProfile = mode;
    this.tracePerformance(`Perfil homeostático chaveado para: [${mode}]`);

    // Aloca as decisões de hardware e sub-módulos gráficos via barramento reativo
    if (window.SentinelRenderer) {
      if (mode === PERFORMANCE_PROFILES.EMERGENCY) {
        window.SentinelRenderer.applyRenderProfile('SAFE_MODE');
      } else if (mode === PERFORMANCE_PROFILES.LOW_POWER) {
        window.SentinelRenderer.applyRenderProfile('LOW_POWER');
      } else if (mode === PERFORMANCE_PROFILES.XR_SAFE) {
        window.SentinelRenderer.applyRenderProfile('XR');
      } else {
        window.SentinelRenderer.applyRenderProfile('NORMAL');
      }
    }

    // Alinha o barramento de controle espacial do motor XR se aplicável
    if (window.SentinelSpatialEngine && mode === PERFORMANCE_PROFILES.LOW_POWER) {
      window.SentinelSpatialEngine.applyXRProfile('LOW_POWER');
    }
  }

  // ==========================================================================
  // 30. HOMEOSTATIC CONTROL ENGINE (Equilíbrio Cibernético Ativo)
  // ==========================================================================

  maintainEquilibrium() {
    this._updateHardwareTelemetry();
    this._updateThermalEstimation();

    // Cálculo matricial de score consolidado de estabilidade do ecossistema
    this.stability.runtime = Math.max(0.0, 1.0 - (this.frame.variance / 50.0) - (this.alerts.fpsCollapse ? 0.3 : 0.0));
    this.stability.render = Math.max(0.0, 1.0 - this.gpu.saturation);
    this.stability.xr = Math.max(0.0, 1.0 - this.xr.comfortRisk);

    // 18. PREDICTIVE PERFORMANCE: Antecipa falhas e aciona degradação preemptiva antes do colapso
    this.predictLoad();

    // Executa auto-recuperação contínua se o sistema estiver operando de forma folgada
    if (this.stability.runtime > 0.95 && this.currentProfile !== PERFORMANCE_PROFILES.NORMAL) {
      this.recoverPerformance();
    }

    this._pushBuffersToTelemetry();
  }

  predictLoad() {
    if (this.telemetry.frameHistory.length < 10) return;
    
    // Regressão simples linear sobre a tendência dos últimos 10 frames de variância
    const sliced = this.telemetry.frameHistory.slice(-10);
    const trendDelta = sliced[sliced.length - 1] - sliced[0];

    if (trendDelta > 8.0 && this.stability.runtime > 0.6) {
      this.tracePerformance('Análise preditiva detectou aceleração de entropia de frames. Preempting crash loops.', 'WARN');
      this.degrade('PREEMPTIVE_CONGESTION_MITIGATION');
    }
  }

  // ==========================================================================
  // 6. MEMORY PRESSURE SYSTEM & 15. ANOMALY DETECTION
  // ==========================================================================

  _updateHardwareTelemetry() {
    // Coleta dados reais do heap V8 se disponíveis na Engine Javascript
    if (performance && performance.memory) {
      const mem = performance.memory;
      this.memory.heapUsage = mem.usedJSHeapSize / mem.jsHeapSizeLimit;
      
      if (this.memory.heapUsage > 0.85) {
        this.alerts.memoryLeak = true;
        this.detectAnomalies('RUNAWAY_MEMORY_HEAP');
        this.degrade('VRAM_HEAP_OVERFLOW');
      }
    }

    // Sincroniza e capta métricas de barramento do Renderer Ativo
    if (window.SentinelRenderer) {
      const renderMetrics = window.SentinelRenderer.metrics;
      this.gpu.drawCalls = renderMetrics.drawCalls || 0;
      this.gpu.saturation = renderMetrics.gpuPressure || 0.0;
      this.metrics.gpuPressure = this.gpu.saturation;
    }

    // Sincroniza e capta métricas do subsistema XR Espacial
    if (window.SentinelSpatialEngine) {
      const xrMetrics = window.SentinelSpatialEngine.metrics;
      this.xr.latency = xrMetrics.latency || 0.0;
      this.metrics.xrLatency = this.xr.latency;
      if (this.xr.latency > 13.88) { // Teto absoluto estrito de latência ocular WebXR (72Hz)
        this.xr.comfortRisk = Math.min(1.0, this.xr.comfortRisk + 0.1);
      }
    }
  }

  detectAnomalies(type) {
    this.tracePerformance(`[ANOMALIA_DETECTADA] Instabilidade exógena do domínio: ${type}`, 'CRITICAL');
    
    if (type === 'EVENT_STORM' || type === 'FRAME_CLUSTERING') {
      // 15. DETECT EVENT STORM - Purga filas e drena loops recursivos forçadamente
      if (window.SchedulerEngine && typeof window.SchedulerEngine.purgeQueue === 'function') {
        window.SchedulerEngine.purgeQueue();
      }
    }
  }

  // ==========================================================================
  // 19. TELEMETRY PIPELINE & 22. DIAGNOSTICS INTEGRATION
  // ==========================================================================

  _pushBuffersToTelemetry() {
    this.telemetry.frameHistory.push(this.frame.current);
    this.telemetry.gpuHistory.push(this.gpu.saturation);
    this.telemetry.thermalHistory.push(this.thermal.level);

    if (this.telemetry.frameHistory.length > this.telemetry.maxBufferSize) {
      this.telemetry.frameHistory.shift();
      this.telemetry.gpuHistory.shift();
      this.telemetry.thermalHistory.shift();
    }
  }

  pushDiagnostics() {
    const packet = {
      profile: this.currentProfile,
      stabilityIndex: this.stability.runtime.toFixed(2),
      thermalState: `${this.thermal.level.toFixed(1)}°C`,
      fps: this.metrics.fps,
      gpuPressure: `${(this.gpu.saturation * 100).toFixed(0)}%`,
      timestamp: Date.now()
    };

    window.SentinelBus?.emit('performance:diagnostics', packet);
    
    if (typeof window.StateStore !== 'undefined') {
      window.StateStore.set('telemetry.pfcLoad', this.gpu.saturation);
    }
  }

  // ==========================================================================
  // 25. SAFETY PERFORMANCE LAYER & SYNC
  // ==========================================================================

  safePerformance(executionBlock) {
    try {
      executionBlock();
    } catch (e) {
      this.tracePerformance(`Falha crônica interna na camada de homeostase: ${e.message}`, 'CRITICAL');
      // Força reversão atômica para o perfil de emergência absoluto para proteger o hardware
      this.applyPerformanceProfile(PERFORMANCE_PROFILES.EMERGENCY);
    }
  }

  synchronizePerformance() {
    if (typeof window.StateStore !== 'undefined') {
      const activeSystemMode = window.StateStore.get('ui.mode');
      if (activeSystemMode === 'XR' && this.currentProfile !== PERFORMANCE_PROFILES.XR_SAFE && this.currentProfile !== PERFORMANCE_PROFILES.EMERGENCY) {
        this.applyPerformanceProfile(PERFORMANCE_PROFILES.XR_SAFE);
      }
    }
  }

  _initializeHomeostaticEngine() {
    this.tracePerformance('Inicializando Sistema Nervoso Homeostático Operacional...', 'INFO');

    // Acopla o loop reativo de análise contínua ao batimento nativo do RequestAnimationFrame
    const pulseLoop = (ts) => {
      if (!this.isActive) return;
      this.trackFPS(ts);
      this.synchronizePerformance();
      this.maintainEquilibrium();
      requestAnimationFrame(pulseLoop);
    };
    requestAnimationFrame(pulseLoop);

    // Varredura de diagnóstico de telemetria estendida a cada 5 segundos
    setInterval(() => {
      this.pushDiagnostics();
    }, 5000);
  }

  tracePerformance(msg, level = 'INFO') { this.trace(`[HOMEOSTASIS] ${msg}`, level); }
  traceGPU(msg, level = 'INFO')         { this.trace(`[GPU_TELEMETRY] ${msg}`, level); }
  traceXR(msg, level = 'INFO')          { this.trace(`[XR_LATENCY] ${msg}`, level); }

  trace(message, level = 'INFO') {
    const formatted = `[${new Date().toISOString()}] [SENTINEL_PERFORMANCE] [${level}] ${message}`;
    if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
    else if (level === 'WARN') console.warn(formatted);
    else console.log(formatted);
  }
}

// Instanciação e injeção central no ecossistema global do SENTINEL
const AdaptivePerformanceEngine = new SentinelPerformanceEngine();
window.SentinelPerformance = AdaptivePerformanceEngine;

export default AdaptivePerformanceEngine;