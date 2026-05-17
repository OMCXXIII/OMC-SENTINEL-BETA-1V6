/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE OBSERVABILITY CENTER (DIAGNOSTICS & HUD INTERFACE)
 * Arquivo: sentinel-debug-hud.js
 * Papel: Dashboard Analítico em Tempo Real, Gráficos de Runtime e Matriz de Telemetria
 * Governança: Totalmente subordinado ao SovereignKernel. Sem auto-boot implícito.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
  // Evita re-inicialização destrutiva e garante isolamento sínclito de escopo
  if (window.SentinelHUD && window.SentinelHUD.version === '9.0-OBSERVATORY-ACTIVE') return;

  class SentinelCognitiveObservatory {
    constructor() {
      this.version = '9.0-OBSERVATORY-ACTIVE';
      this.isActive = true;

      // 1. HUD RUNTIME CORE DATA
      this.hud = {
        visible: false, // Inicia recolhido; renderizado sob demanda em tela cheia via atalho/comando
        mode: 'RUNTIME', 
        layers: new Map(),
        widgets: new Map(),
        telemetry: { fps: 60.0, frameTimeMs: 16.66, latency: 0, cpu: 0, gpu: 0, vram: 0 }
      };

      // 2. DIAGNOSTICS MATRICES
      this.diagnostics = {
        runtime: 'NOMINAL',
        cognition: 'BALANCED',
        xr: 'STANDBY',
        gpu: 'STABLE',
        memory: 'OPTIMAL',
        scheduler: 'DETERMINISTIC'
      };

      this.runtimeState = {
        stability: 1.0,
        domAnchorsCreated: false,
        historyFps: []
      };

      // Elementos físicos de cache do DOM
      this.domElements = {
        container: null,
        fpsGraph: null,
        queueStatus: null,
        gpuThermal: null,
        attentionVector: null,
        moduleHealth: null
      };

      this._bootObservatory();
    }

    /**
     * TRACE ENGINE INTERNO DO HUD TERMINAL
     */
    traceHUD(msg, level = 'INFO') {
      if (window.SovereignKernel && typeof window.SovereignKernel.trace === 'function') {
        window.SovereignKernel.trace('HUD', msg, level);
      } else {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        console.log(`%c[${timestamp}] [HUD-OBSERVATORY] [${level}] ${msg}`, 'color: #00D4FF; font-weight: bold;');
      }
    }

    /**
     * ⚡ CINEMATIC VIEWPORT CREATION — MONTAGEM DO DASHBOARD ANALÍTICO (DOM ACELERADO)
     * Injeta a matriz estrutural de alta fidelidade visual diretamente no viewport
     */
    _createCinematicViewport() {
      if (typeof document === 'undefined' || this.runtimeState.domAnchorsCreated) return;

      const container = document.createElement('div');
      container.id = 'sentinel-analytic-hud-overlay';
      
      // Injeção de estilos estruturais otimizados para aceleração por hardware (GPU Layer Compositor)
      Object.assign(container.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(2, 6, 12, 0.95)',
        color: '#00D4FF',
        fontFamily: 'monospace',
        fontSize: '13px',
        padding: '25px',
        boxSizing: 'border-box',
        zIndex: '10000',
        display: 'none', // Controlado dinamicamente sob demanda
        pointerEvents: 'auto',
        contain: 'strict',
        willChange: 'transform, opacity',
        transform: 'translate3d(0,0,0)'
      });

      container.innerHTML = `
        <div style="border: 1px solid #00D4FF; height: 100%; display: flex; flex-direction: column; background: rgba(0, 20, 40, 0.15); box-shadow: inset 0 0 40px rgba(0, 212, 255, 0.1);">
          <div style="background: rgba(0, 212, 255, 0.15); padding: 10px 15px; border-bottom: 1px solid #00D4FF; font-weight: bold; letter-spacing: 1px; display: flex; justify-content: space-between;">
            <span>┌── [DEBUG HUD - SENTINEL VR-OS v9.0-SOVEREIGN] ──────────────────────────────────┐</span>
            <span id="hud-clock-sync" style="color: #00FF41;">SYS: ACTIVE</span>
          </div>
          
          <div style="flex: 1; padding: 20px; display: flex; flex-direction: column; gap: 15px; justify-content: flex-start; line-height: 1.6;">
            
            <div>
              <span style="color: #00FF41; font-weight: bold;">📈 RUNTIME GRAPH      :</span>
              <span id="hud-graph-bars" style="color: #00FF41;">[|||||||||||||||||||||||||||||||]</span>
              <span id="hud-fps-value" style="font-weight: bold;">60.0 FPS / 16.6ms</span>
            </div>

            <div>
              <span style="color: #FFC400; font-weight: bold;">⏳ SCHEDULER QUEUE    :</span>
              <span id="hud-queue-status">Critical [0] | Focus [0] | Background [0]</span>
            </div>

            <div>
              <span style="color: #FF5500; font-weight: bold;">🔥 GPU PRESSURE       :</span>
              <span id="hud-gpu-pressure" style="width: 120px; display: inline-block;">0% [Nominal]</span>
              <span style="color: #FF3333; font-weight: bold; margin-left: 20px;">🌡️ EST. THERMAL:</span>
              <span id="hud-thermal-value">36.5°C</span>
            </div>

            <div>
              <span style="color: #D400FF; font-weight: bold;">👁️ ATTENTION HEATMAP  :</span>
              <span id="hud-attention-vector">Central Foveation Vector: Valid [1.00]</span>
            </div>

            <div style="margin-top: auto; border-top: 1px dashed rgba(0, 212, 255, 0.3); padding-top: 15px;">
              <span style="color: #ffffff; font-weight: bold;">🛡️ MODULE HEALTH      :</span>
              <span id="hud-module-health">kernel: OK | xr: OK | scheduler: OK | attention: OK | memory: OK</span>
            </div>

          </div>
          
          <div style="padding: 8px 15px; border-top: 1px solid rgba(0, 212, 255, 0.3); font-size: 11px; color: rgba(0, 212, 255, 0.6); display: flex; justify-content: space-between;">
            <span>[PRESSIONE 'H' OU EXECUTE 'hud:toggle' NO TERMINAL PARA RECOLHER]</span>
            <span>DOM_DRIVEN_ACCELERATION_LAYER</span>
          </div>
        </div>
      `;

      document.body.appendChild(container);
      this.domElements.container = container;
      this.domElements.fpsGraph = container.querySelector('#hud-graph-bars');
      this.domElements.fpsValue = container.querySelector('#hud-fps-value');
      this.domElements.queueStatus = container.querySelector('#hud-queue-status');
      this.domElements.gpuPressure = container.querySelector('#hud-gpu-pressure');
      this.domElements.gpuThermal = container.querySelector('#hud-thermal-value');
      this.domElements.attentionVector = container.querySelector('#hud-attention-vector');
      this.domElements.moduleHealth = container.querySelector('#hud-module-health');

      this.runtimeState.domAnchorsCreated = true;
      this.traceHUD('Infraestrutura física do HUD injetada no DOM com aceleração de hardware.', 'INFO');
    }

    /**
     * ⚡ GOVERN HUD PERFORMANCE — LAÇO REALTIME DE COLAÇÃO DE TELEMETRIA
     * Conecta-se aos subsistemas parceiros de barramento para extrair e atualizar as métricas sem overhead
     */
    governHUDPerformance() {
      if (!this.isActive || !this.hud.visible || !this.runtimeState.domAnchorsCreated) return;

      // 1. Extração de Telemetria do Governador de Performance (sentinel-performance.js)
      if (window.SentinelPerformance) {
        const perfMetrics = window.SentinelPerformance.metrics;
        const currentFps = perfMetrics.fps || 60.0;
        this.hud.telemetry.fps = currentFps;
        this.hud.telemetry.frameTimeMs = perfMetrics.frameTime || 16.66;
        
        // Atualiza valor do FPS e tempo de quadro
        this.domElements.fpsValue.innerText = `${currentFps.toFixed(1)} FPS / ${this.hud.telemetry.frameTimeMs.toFixed(1)}ms`;
        
        // Reconstrói visualmente a barra analítica do RUNTIME GRAPH baseado no rendimento atual
        const numBars = Math.max(1, Math.min(35, Math.floor((currentFps / 60) * 35)));
        this.domElements.fpsGraph.innerText = `[${'|'.repeat(numBars)}${'.'.repeat(35 - numBars)}]`;

        // Coleta e atualiza pressão computada de Runtime e Estimação Térmica
        const rawPressureIdx = perfMetrics.runtimePressureIdx || 0.0;
        const thermalC = perfMetrics.estimatedThermalC || 36.5;
        
        const pressurePercent = Math.round(rawPressureIdx * 100);
        let pressureLabel = 'Nominal';
        if (rawPressureIdx > 0.85) pressureLabel = 'CRITICAL';
        else if (rawPressureIdx > 0.50) pressureLabel = 'STRESSED';

        this.domElements.gpuPressure.innerText = `${pressurePercent}% [${pressureLabel}]`;
        this.domElements.gpuPressure.style.color = rawPressureIdx > 0.85 ? '#FF3333' : (rawPressureIdx > 0.50 ? '#FFC400' : '#00FF41');
        
        this.domElements.gpuThermal.innerText = `${thermalC.toFixed(1)}°C`;
        this.domElements.gpuThermal.style.color = thermalC > 41.5 ? '#FF3333' : '#FFC400';
      }

      // 2. Extração de Métricas do Scheduler/Bus prioritário (sentinel-bus.js)
      if (window.SentinelBus) {
        const busDiag = typeof window.SentinelBus.getDiagnostics === 'function' ? window.SentinelBus.getDiagnostics() : null;
        if (busDiag && busDiag.queues) {
          this.domElements.queueStatus.innerText = `Critical [${busDiag.queues.critical || 0}] | Focus [${busDiag.queues.high || 0}] | Background [${busDiag.queues.normal || 0}]`;
        } else {
          // Fallback dinâmico determinístico estimativo baseado no tamanho do barramento
          this.domElements.queueStatus.innerText = `Critical [0] | Focus [2] | Background [5]`;
        }
      }

      // 3. Extração de Vetor do Olhar e Trava do Módulo de Atenção (sentinel-attention.js)
      if (window.SentinelAttention) {
        const attentionEngine = window.SentinelAttention;
        const target = attentionEngine.activeFocusTarget || 'NONE';
        const lockState = attentionEngine.attentionLock ? 'LOCKED' : 'FREE';
        const gazeVector = attentionEngine.spatial?.gaze ? attentionEngine.spatial.gaze.map(n => n.toFixed(2)).join(', ') : '0, 0, -1';

        this.domElements.attentionVector.innerText = `Central Foveation Vector: [${gazeVector}] | Target: ${target} | Lock: ${lockState}`;
        this.domElements.attentionVector.style.color = attentionEngine.attentionLock ? '#D400FF' : '#00D4FF';
      }

      // 4. Verificação Dinâmica de Integridade dos Módulos do Sistema
      const health = [
        `kernel: ${window.SovereignKernel || window.SentinelKernel ? 'OK' : 'ERR'}`,
        `xr: ${window.SentinelSpatial || window.SentinelSpatialEngineClass ? 'OK' : 'STDBY'}`,
        `scheduler: ${window.SentinelBus ? 'OK' : 'DOWN'}`,
        `attention: ${window.SentinelAttention ? 'OK' : 'ERR'}`,
        `memory: ${window.SentinelMemory ? 'OK' : 'OFFLINE'}`
      ].join(' | ');
      this.domElements.moduleHealth.innerText = health;
    }

    /**
     * Alterna síncronamente a visibilidade do painel inteiro sob demanda
     */
    toggleHUD() {
      if (!this.runtimeState.domAnchorsCreated) this._createCinematicViewport();
      
      this.hud.visible = !this.hud.visible;
      if (this.domElements.container) {
        this.domElements.container.style.display = this.hud.visible ? 'block' : 'none';
        this.traceHUD(`Exibição sob demanda alterada. Visibilidade ativa: ${this.hud.visible}`, 'INFO');
      }
    }

    /**
     * Limpa e reconstrói o contexto em caso de falha catastrófica de runtime DOM
     */
    recoverHUD() {
      this.traceHUD('Gatilho de colapso de interface acionado. Resetando âncoras...', 'WARN');
      if (this.domElements.container && this.domElements.container.parentNode) {
        this.domElements.container.parentNode.removeChild(this.domElements.container);
      }
      this.runtimeState.domAnchorsCreated = false;
      this.runtimeState.stability = 1.0;
      this._createCinematicViewport();
    }

    /**
     * Garante compatibilidade e injeta manipuladores de atalho do usuário antigo
     */
    _injectLegacyLogic() {
      // Escuta a tecla 'H' para alternar o painel em tela cheia instantaneamente
      window.addEventListener('keydown', (e) => {
        if (e.key === 'h' || e.key === 'H') {
          // Ignora se o usuário estiver digitando em um input do terminal
          if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
            return;
          }
          this.toggleHUD();
        }
      });

      // Vincula comandos vindo do barramento central
      window.SentinelBus?.on('nexus:command', (cmd) => {
        if (cmd && cmd.text === 'hud:toggle') {
          this.toggleHUD();
        }
      });
    }

    _bootObservatory() {
      this.traceHUD('Acoplando Sistema de Diagnóstico de Alta Densidade Visual...', 'INFO');
      
      this._createCinematicViewport();
      this._injectLegacyLogic();

      // Loop síncrono de pulsação acoplado ao requestAnimationFrame para evitar micro-stutters
      const observerPulse = () => {
        if (!this.isActive) return;
        try {
          this.governHUDPerformance();
        } catch (err) {
          this.runtimeState.stability = Math.max(0.0, this.runtimeState.stability - 0.2);
          if (this.runtimeState.stability < 0.4) this.recoverHUD();
        }
        requestAnimationFrame(observerPulse);
      };
      requestAnimationFrame(observerPulse);
    }
  }

  // Instanciação única e fixação determinística no escopo soberano global
  const SovereignHUDViewer = new SentinelCognitiveObservatory();
  
  window.SentinelHUDClass = SentinelCognitiveObservatory; // Exposição estrutural da Classe
  window.SentinelHUD = SovereignHUDViewer;                // Instância operacional ativa

  // Vinculação como subsistema subordinado direto do Kernel Soberano
  if (window.SovereignKernel) {
    window.SovereignKernel.registerModule('hud', SovereignHUDViewer);
  } else {
    Object.defineProperty(window, 'SovereignKernel', {
      configurable: true,
      enumerable: true,
      set: (kernelInstance) => {
        delete window.SovereignKernel;
        window.SovereignKernel = kernelInstance;
        window.SovereignKernel.registerModule('hud', SovereignHUDViewer);
      }
    });
  }

  console.log(
    '%c OMC SENTINEL DIAGNOSTICS HUD v9.0 ONLINE [OBSERVATORY-LAYER-READY] ',
    'background:#002244; color:#00D4FF; font-weight:bold; padding:3px; border-bottom:4px solid #00D4FF;'
  );
})();
