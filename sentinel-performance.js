/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — ADAPTATIVE HOMEOSYTASIS ENGINE (PERFORMANCE GOVERNOR)
 * Arquivo: sentinel-performance.js
 * Papel: Análise Analítica, Cálculo de Pressão de Frame e Degradação Preventiva
 * Governança: Totalmente subordinado ao SovereignKernel. Sem auto-boot implícito.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// 1. DEGRADATION PROFILES — Perfis Homeostáticos de Sobrevivência de Hardware
const PERFORMANCE_PROFILES = Object.freeze({
  NORMAL:    'NORMAL',    // Fidelidade máxima, shaders complexos ativos, sem supressão periférica
  BALANCED:  'BALANCED',  // Redução sutil de efeitos secundários (partículas à metade)
  LOW_POWER: 'LOW_POWER', // Viewport reduzida, desativação de Bloom/Glow, intervalos de ociosidade CPU
  XR_SAFE:   'XR_SAFE',   // Priorização absoluta de latência ocular, foveation forçado, trava em 72Hz
  EMERGENCY: 'EMERGENCY'  // Suspensão de módulos ambientais, renderização apenas de diagnóstico e HUD crítico
});

class SentinelPerformanceEngine {
  constructor() {
    this.version = '9.0.0-SOVEREIGN';
    this.isActive = true;
    this.currentProfile = PERFORMANCE_PROFILES.NORMAL;

    // 2. MÉTRICAS DE TELEMETRIA DE PRECISÃO REALTIME
    this.metrics = {
      fps: 60.0,
      frameTime: 16.66,
      gpuPressure: 0.0,
      cpuLoad: 0.0,
      memoryPressure: 0.0,
      xrLatency: 0.0,
      
      // Expansões de Precisão Analítica
      microStutterProbability: 0.0, // Predição de engasgos baseada em derivadas adjacentes
      estimatedThermalC: 36.5,       // Curva preditiva de dissipação calórica por saturação
      runtimePressureIdx: 0.0        // Razão matemática: Tempo restante / Tamanho da Fila
    };

    // Históricos voláteis de amostragem matemática curta
    this.frame = {
      current: 0,
      lastTimestamp: 0,
      deltaHistory: [],
      maxHistorySize: 10,
      cumulativeSaturationTime: 0
    };

    this._initializeHomeostaticEngine();
  }

  /**
   * TRACE ENGINE UNIFICADO INTERNO DA HOMEOSTASE
   */
  trace(message, level = 'INFO') {
    if (window.SovereignKernel && typeof window.SovereignKernel.trace === 'function') {
      window.SovereignKernel.trace('PERFORMANCE', message, level);
    } else {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
      console.log(`%c[${timestamp}] [PERFORMANCE] [${level}] ${message}`, 'color: #FF5500; font-weight: bold;');
    }
  }

  tracePerformance(msg, level = 'INFO') { this.trace(`[HOMEOSTASIS] ${msg}`, level); }
  traceGPU(msg, level = 'INFO')         { this.trace(`[GPU_TELEMETRY] ${msg}`, level); }
  traceXR(msg, level = 'INFO')          { this.trace(`[XR_LATENCY] ${msg}`, level); }

  /**
   * ⚡ FPS TRACKING AVANÇADO — PREDIÇÃO DE MICRO-STUTTERING
   * Analisa a variação abrupta da derivada temporal entre deltas adjacentes (Jitter de Frame)
   */
  trackFPS(timestamp) {
    if (!this.frame.lastTimestamp) {
      this.frame.lastTimestamp = timestamp;
      return;
    }

    const currentDelta = timestamp - this.frame.lastTimestamp;
    this.frame.lastTimestamp = timestamp;

    this.metrics.frameTime = currentDelta;
    this.metrics.fps = currentDelta > 0 ? 1000 / currentDelta : 60.0;

    const history = this.frame.deltaHistory;
    history.push(currentDelta);

    if (history.length > this.frame.maxHistorySize) {
      const previousDelta = history[history.length - 2];
      
      // Derivada de primeira ordem do tempo de quadro (Variação de aceleração do frame)
      const frameAccelerationJitter = Math.abs(currentDelta - previousDelta);
      
      // Se a variação do frame tempo ultrapassar 4.5ms entre dois quadros, a probabilidade de stutter escala
      this.metrics.microStutterProbability = frameAccelerationJitter > 4.5 ? 0.88 : 0.05;

      history.shift();
    }

    this.frame.current++;
  }

  /**
   * ⚡ THERMAL ESTIMATION — CURVA PREDITIVA DE DISSIPAÇÃO CALÓRICA
   * Computa o estresse térmico baseado no tempo cumulativo de saturação ininterrupta do laço
   */
  _computeThermalDissipationModel() {
    const ambientTemp = 36.5;
    const maxThermalCap = 45.0;

    // Se o frame atual gasta mais de 12.0ms, o silício está operando em regime de saturação contínua
    if (this.metrics.frameTime > 12.0) {
      this.frame.cumulativeSaturationTime += 0.016; // Incrementa peso cronométrico cumulativo
    } else {
      this.frame.cumulativeSaturationTime = Math.max(0, this.frame.cumulativeSaturationTime - 0.032); // Resfria o dobro
    }

    // Curva logística exponencial assintótica
    const thermalRise = (maxThermalCap - ambientTemp) * (1 - Math.exp(-0.05 * this.frame.cumulativeSaturationTime));
    this.metrics.estimatedThermalC = ambientTemp + thermalRise;
  }

  /**
   * ⚡ RUNTIME PRESSURE LAYER — CÁLCULO REALTIME DA RAZÃO DO SCHEDULER
   * Computa a folga matemática do Time Budget contra a fila de mensagens do Barramento (SentinelBus)
   */
  _calculateRuntimePressure() {
    const totalAllocatedBudget = window.SovereignKernel?.isXRActive ? 13.88 : 16.66;
    const timeRemaining = Math.max(0.1, totalAllocatedBudget - this.metrics.frameTime);
    
    // Obtém o tamanho da fila pendente do Barramento prioritário
    const busDiagnostics = window.SentinelBus?.getDiagnostics();
    const activeQueueSize = busDiagnostics ? 
      (busDiagnostics.queues.critical + busDiagnostics.queues.high + busDiagnostics.queues.normal) : 0;

    // Fórmula Operacional: Razão entre o tamanho da carga e a folga cronométrica
    // Se a folga encolhe ou a fila infla, o índice de pressão escala assintoticamente
    const rawPressure = (activeQueueSize * 0.15) / timeRemaining;
    this.metrics.runtimePressureIdx = Math.min(1.0, Math.max(0.0, rawPressure));
  }

  /**
   * SINCRONIZAÇÃO E DISPARO DA TELEMETRIA PARA A PONTE DE SERVIÇOS DO BACKBONE
   */
  synchronizePerformance() {
    this._computeThermalDissipationModel();
    this._calculateRuntimePressure();

    // Despacha pacote homeostático unificado para o barramento com limite controlado (Throttling do Bus ativo)
    window.SentinelBus?.emit('performance:telemetry-sync', {
      fps: Math.round(this.metrics.fps),
      frameTimeMs: this.metrics.frameTime,
      temperatureC: this.metrics.estimatedThermalC,
      pressureIndex: this.metrics.runtimePressureIdx,
      stutterAlert: this.metrics.microStutterProbability > 0.5
    });
  }

  /**
   * ⚡ LÓGICA DE DEGRADAÇÃO PREVENTIVA (MAINTAIN EQUILIBRIUM)
   * Avalia a integridade e força alterações em cascata caso os limites de colapso sejam violados
   */
  maintainEquilibrium() {
    const CRITICAL_PRESSURE_THRESHOLD = 0.85;

    // 1. VERIFICAÇÃO DA AUTORIDADE HOMEOSTÁTICA CONTRA COLAPSO GRÁFICO/TÉRMICO
    if (this.metrics.runtimePressureIdx >= CRITICAL_PRESSURE_THRESHOLD || this.metrics.estimatedThermalC > 41.5) {
      if (this.currentProfile !== PERFORMANCE_PROFILES.EMERGENCY && this.currentProfile !== PERFORMANCE_PROFILES.LOW_POWER) {
        
        this.currentProfile = PERFORMANCE_PROFILES.LOW_POWER;
        this.tracePerformance(`💥 LIMITE CRÍTICO VIOLADO (${this.metrics.runtimePressureIdx.toFixed(2)}). Forçando Degradação Preventiva!`, 'CRITICAL');
        
        // Sinalização direta de autoridade sobre os módulos de infraestrutura
        if (window.SentinelRenderer) {
          // Desativação síncrona imediata de sombras e efeitos visuais secundários
          window.SentinelRenderer.currentFxLevel = 'LOW';
          window.SentinelRenderer.performanceMetrics.samplingScale = 0.70;
          this.traceGPU('Autoridade de barramento exercida: Sombras suprimidas e efeitos visuais secundários desativados.', 'WARN');
        }

        window.SentinelBus?.emit('performance:profile-degraded', { profile: PERFORMANCE_PROFILES.LOW_POWER, reason: 'PRESSURE_THRESHOLD_VIOLATION' });
      }
    } 
    // 2. RECUPERAÇÃO GRADUAL DA HOMEOSTASE SE OPERANDO ABAIXO DA MARGEM DE RISCO
    else if (this.metrics.runtimePressureIdx < 0.40 && this.metrics.estimatedThermalC < 38.0) {
      if (this.currentProfile === PERFORMANCE_PROFILES.LOW_POWER) {
        this.currentProfile = PERFORMANCE_PROFILES.NORMAL;
        this.tracePerformance('Estabilidade e equilíbrio homeostático restaurados. Retornando ao perfil NORMAL.', 'INFO');
        
        if (window.SentinelRenderer) {
          window.SentinelRenderer.currentFxLevel = 'HIGH';
          window.SentinelRenderer.performanceMetrics.samplingScale = 1.0;
        }

        window.SentinelBus?.emit('performance:profile-restored', { profile: PERFORMANCE_PROFILES.NORMAL });
      }
    }
  }

  /**
   * Publica relatório formal de integridade técnica a cada ciclo longo do Scheduler
   */
  pushDiagnostics() {
    const diag = {
      engineVersion: this.version,
      activeProfile: this.currentProfile,
      telemetry: { ...this.metrics },
      saturationAccumulator: this.frame.cumulativeSaturationTime.toFixed(2)
    };
    
    this.tracePerformance(`Relatório Homeostático ── FPS: ${diag.telemetry.fps.toFixed(1)} | Térmico: ${diag.telemetry.estimatedThermalC.toFixed(1)}°C | Pressão: ${(diag.telemetry.runtimePressureIdx * 100).toFixed(0)}%`, 'INFO');
    return diag;
  }

  _initializeHomeostaticEngine() {
    this.tracePerformance('Acoplando Motor de Análise Preditiva de Hardware...', 'INFO');
    
    // O Loop reativo é acoplado de forma inerte. Não roda até o Kernel disparar o laço oficial.
    window.SentinelBus?.on('kernel:phase-synchronized', (data) => {
      if (data.to === 'READY') {
        this.tracePerformance('Laço homeostático integrado e liberado para monitoramento ativo.', 'INFO');
      }
    });
  }
}

// 3. EXPOSIÇÃO OPERACIONAL E ANCORAGEM DETERMINÍSTICA NO KERNEL SOBERANO
(() => {
  const PerformanceGovernorInstance = new SentinelPerformanceEngine();
  
  window.SentinelPerformanceClass = SentinelPerformanceEngine; // Exposição estrutural da Classe
  window.SentinelPerformance = PerformanceGovernorInstance;       // Instância operacional ativa

  // Vinculação determinística como subsistema direto do Kernel Soberano
  if (window.SovereignKernel) {
    window.SovereignKernel.registerModule('performance', PerformanceGovernorInstance);
  } else {
    Object.defineProperty(window, 'SovereignKernel', {
      configurable: true,
      enumerable: true,
      set: (kernelInstance) => {
        delete window.SovereignKernel;
        window.SovereignKernel = kernelInstance;
        window.SovereignKernel.registerModule('performance', PerformanceGovernorInstance);
      }
    });
  }

  console.log(
    '%c OMC SENTINEL PERFORMANCE GOVERNOR v9.0 ONLINE [ACTIVE-HOMEOSTASIS] ',
    'background:#3a1c00; color:#ff5500; font-weight:bold; padding:3px; border-left:4px solid #ff5500;'
  );
})();
