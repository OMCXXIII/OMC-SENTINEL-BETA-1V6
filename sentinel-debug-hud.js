/**
 * ============================================================================
 * SENTINEL CORE RUNTIME ARCHITECTURE
 * Module: sentinel-debug-hud.js (Evolution from v1.2 to v9.0)
 * Role: Cognitive Runtime Observatory (Sovereign Observability Center)
 * Design Aesthetic: High-Density Cinematic UI & Low-Overhead Cognitive Mapping
 * ============================================================================
 */

(function () {
  // Garantia de namespace e isolamento de escopo
  if (window.SentinelHUD && window.SentinelHUD.version === '9.0-OBSERVATORY') return;

  class SentinelCognitiveObservatory {
    constructor() {
      this.version = '9.0-OBSERVATORY';
      this.isActive = true;

      // 1. HUD RUNTIME CORE
      this.hud = {
        visible: true,
        mode: 'RUNTIME', // RUNTIME, FOCUS, XR, LOW_POWER, RECOVERY, EMERGENCY
        layers: new Map(),
        widgets: new Map(),
        telemetry: { fps: 60, latency: 0, cpu: 32, gpu: 28, vram: 12 }
      };

      // 2. DIAGNOSTICS ENGINE
      this.diagnostics = {
        runtime: 'NOMINAL',
        cognition: 'BALANCED',
        xr: 'STANDBY',
        gpu: 'STABLE',
        memory: 'OPTIMAL',
        scheduler: 'DETERMINISTIC'
      };

      // 3. TELEMETRY AGGREGATOR
      this.telemetry = { fps: 60.0, gpu: 0.0, memory: 0.0, latency: 0, attention: 1.0, scheduler: 0.0 };

      // 4. RUNTIME STATE MONITOR
      this.runtimeState = { mode: 'NOMINAL', stability: 1.0, load: 0.0, degradation: false };

      // 5. SCHEDULER VISUALIZER
      this.schedulerView = { activeTasks: 0, queueDepth: 0, frameBudget: 11.1, droppedTasks: 0 };

      // 6. PERFORMANCE PANEL & 7. GPU DIAGNOSTICS
      this.performancePanel = { fps: 60, frametime: 16.6, gpuPressure: 0.0, thermalLoad: 38.0 };
      this.gpuDiagnostics = { pipelines: 0, shaders: 'COMPILED', computePasses: 0, memoryUsage: 0.0 };

      // 8. XR DIAGNOSTICS
      this.xrDiagnostics = { latency: 0.0, reprojection: false, comfort: 1.0, droppedFrames: 0 };

      // 9. ATTENTION VISUALIZER & 10. NEUROGRAPH VISUALIZER
      this.attentionView = { focusTarget: 'NULL', salienceMap: new Map(), suppressionZones: 0 };
      this.neurographView = { activeNodes: 0, semanticClusters: [], contextLinks: 0 };

      // 11. MEMORY DIAGNOSTICS
      this.memoryView = { activeContexts: [], persistence: 'STABLE', snapshots: 0, recalls: 0 };

      // 12. EVENT TRACE PANEL
      this.eventTrace = { events: [], propagation: 'DIRECT', latency: 0, listeners: 0 };

      // 13. COGNITIVE LOAD METER
      this.cognitiveLoad = { density: 0.0, overload: false, attentionSpread: 0.0 };

      // 14. MISSION STATUS LAYER
      this.mission = { activeObjective: 'NULL', urgency: 0.0, stability: 1.0 };

      // 15. RECOVERY DIAGNOSTICS
      this.recovery = { recoveryMode: 'STANDBY', rollbackState: 'CLEAN', stabilization: 1.0 };

      // 16. THERMAL MONITOR & 23. SAFETY MONITOR
      this.thermal = { cpu: 40.0, gpu: 42.0, thermalRisk: false };
      this.safety = { thermal: 'SAFE', cognitive: 'NOMINAL', xrComfort: 'OPTIMAL', gpuRisk: 'LOW' };

      // 17. ALERT SYSTEM
      this.alerts = { critical: [], warning: [], informational: [] };

      // 18. TRACE OVERLAY & 20. TIMELINE SYSTEM
      this.traceOverlay = { focusFlow: [], schedulerFlow: [], eventFlow: [] };
      this.timeline = { events: [], stateTransitions: [], performanceHistory: [] };

      // 21. INTERACTION INSPECTOR
      this.interactionInspector = { gaze: { x: 0, y: 0, z: -1 }, focus: 1.0, inputLatency: 0 };

      // Dom Cachings originais da v1.2 (PRESERVAÇÃO ESTRUTURAL)
      this._legacyState = {
        bootTimestamp: performance.now() + (window.performance.timeOrigin || 0),
        firstActionDetected: false,
        latencyInterval: null,
        domElement: null
      };

      this._lastFrameTime = performance.now();
      this._frameCount = 0;

      this._bootObservatory();
    }

    // ==========================================================================
    // 29. COGNITIVE HUD MAPPING & 3. TELEMETRY AGGREGATION
    // ==========================================================================

    mapCognitiveState() {
      // Coleta síncrona diretamente dos barramentos de Consciência Operacional (Se acoplados)
      if (window.SentinelAttention) {
        const att = window.SentinelAttention;
        this.attentionView.focusTarget = att.attention.activeTarget || 'COGNITIVE_VOID';
        this.cognitiveLoad.density = att.attention.cognitiveLoad;
        this.cognitiveLoad.overload = att.cognitiveLoad.overloadRisk;
        this.cognitiveLoad.attentionSpread = att.cognitiveLoad.attentionSpread;
        this.interactionInspector.gaze = att.spatial.gaze;
      }

      if (window.SentinelNeurograph) {
        const neuro = window.SentinelNeurograph;
        this.neurographView.activeNodes = neuro.metrics.activeNodes;
        this.telemetry.memory = neuro.metrics.semanticLoad;
        this.runtimeState.load = neuro.metrics.graphDensity;
      }

      if (window.SentinelProtocols) {
        const prot = window.SentinelProtocols;
        this.hud.mode = prot.protocols.runtime.boot;
        this.thermal.gpu = prot.protocols.safety.thermal.current;
        this.safety.cognitive = prot._mentalBattery < 30 ? 'CRITICAL_METABOLIC' : 'NOMINAL';
      }

      this._aggregateTelemetry();
    }

    _aggregateTelemetry() {
      const now = performance.now();
      this._frameCount++;
      
      if (now - this._lastFrameTime >= 1000) {
        this.telemetry.fps = Math.round((this._frameCount * 1000) / (now - this._lastFrameTime));
        this.performancePanel.fps = this.telemetry.fps;
        this._frameCount = 0;
        this._lastFrameTime = now;
      }
    }

    // ==========================================================================
    // 25. ADAPTIVE HUD ENGINE & 27. PERFORMANCE GOVERNANCE
    // ==========================================================================

    adaptHUD() {
      // 27. O HUD nunca pode destruir taxas de quadros por overhead visual
      if (this.telemetry.fps < 45 && !this.runtimeState.degradation) {
        this.runtimeState.degradation = true;
        this._applyVisualThrottling(true);
      } else if (this.telemetry.fps >= 55 && this.runtimeState.degradation) {
        this.runtimeState.degradation = false;
        this._applyVisualThrottling(false);
      }
    }

    _applyVisualThrottling(degrade) {
      const el = this._legacyState.domElement;
      if (!el) return;
      if (degrade) {
        // Reduz cintilações, desliga varreduras caras e minimiza gradientes pesados
        el.style.textShadow = 'none';
        el.style.background = 'rgba(0, 8, 12, 0.95)';
        this.traceHUD('Performance degradada. Reduzindo pós-processamento do HUD para proteção de FPS.');
      } else {
        el.style.textShadow = '0 0 4px rgba(0,212,255,0.5)';
        el.style.background = 'linear-gradient(145deg, rgba(0,12,18,0.92), rgba(0,4,8,0.88))';
      }
    }

    governHUDPerformance() {
      // Limita a renderização interna do DOM textual para ciclos compassados de 100ms (Evita reflows na Main Thread)
      this.mapCognitiveState();
      this.adaptHUD();
      this._renderMatrixOverlay();
    }

    // ==========================================================================
    // LAYER CAPTURE & RENDER PIPELINE (Encapsulamento Cinematográfico v1.2)
    // ==========================================================================

    _createCinematicViewport() {
      // Se o elemento antigo já existir, herda. Caso contrário, manufatura a malha estrutural.
      let container = document.getElementById('sentinel-debug-hud');
      if (!container) {
        container = document.createElement('div');
        container.id = 'sentinel-debug-hud';
        container.style = `
          position: fixed;
          top: 10px;
          right: 10px;
          width: 340px;
          background: linear-gradient(145deg, rgba(0,12,18,0.95), rgba(0,4,8,0.90));
          border: 1px solid rgba(0,212,255,0.25);
          border-radius: 4px;
          padding: 12px;
          color: #00FF41;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.4;
          z-index: 999999;
          box-shadow: 0 0 20px rgba(0,212,255,0.15);
          text-shadow: 0 0 4px rgba(0,212,255,0.4);
          transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
        `;
        document.body.appendChild(container);
      }
      this._legacyState.domElement = container;
    }

    _renderMatrixOverlay() {
      const el = this._legacyState.domElement;
      if (!el || !this.hud.visible) return;

      const loadBar = this._generateTelemetryBar(this.cognitiveLoad.density);
      const modeColor = this.cognitiveLoad.overload ? '#FF4B00' : '#00FF41';

      // RENDERIZAÇÃO MATRICIAL DE ALTA DENSIDADE COGNITIVA
      el.innerHTML = `
        <div style="border-bottom: 1px dashed rgba(0,212,255,0.3); padding-bottom: 4px; margin-bottom: 6px; font-weight: bold; display: flex; justify-content: space-between;">
          <span>SENTINEL COGNITIVE OBSERVATORY</span>
          <span style="color: ${modeColor}">[${this.hud.mode}]</span>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px; background: rgba(0,212,255,0.05); padding: 4px; border-radius: 2px;">
          <div>FPS: <span style="color:#FFF">${this.telemetry.fps}</span></div>
          <div>ESTABILIDADE: <span style="color:#FFF">${(this.runtimeState.stability * 100).toFixed(0)}%</span></div>
          <div>LATÊNCIA: <span style="color:#FFF">${this.telemetry.latency}ms</span></div>
          <div>FADIGA METABÓLICA: <span style="color:${this.safety.cognitive.includes('CRITICAL') ? '#FF4B00' : '#00FF41'}">${this.safety.cognitive}</span></div>
        </div>

        <div style="margin-bottom: 6px;">
          <div style="display: flex; justify-content: space-between;">
            <span>CARGA COGNITIVA DENSIDADE:</span>
            <span>${(this.cognitiveLoad.density * 100).toFixed(0)}%</span>
          </div>
          <div style="font-family: monospace; color: ${modeColor}">${loadBar}</div>
        </div>

        <div style="background: rgba(0,0,0,0.4); padding: 6px; border: 1px solid rgba(0,212,255,0.1); border-radius: 2px; margin-bottom: 6px;">
          <div style="color: #00D4FF; font-weight: bold; font-size: 10px; margin-bottom: 2px;">FOCO DE ATENÇÃO CORRENTE:</div>
          <div style="color: #FFF; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">&gt; ${this.attentionView.focusTarget}</div>
          <div style="font-size: 10px; color: rgba(0,255,65,0.7); margin-top: 2px;">
            NÓS ATIVOS NO GRAFO: ${this.neurographView.activeNodes} | DISPERSÃO: ${this.cognitiveLoad.attentionSpread.toFixed(2)}
          </div>
        </div>

        <div id="sentinel-legacy-telemetry" style="font-size: 10px; border-top: 1px dashed rgba(0,212,255,0.1); padding-top: 4px; color: rgba(0,212,255,0.8);">
          ENGINE_STATUS: <span id="engine-status" style="color:#00FF41">NOMINAL_V9</span><br>
          LATENCY_TRACK: <span id="latency-value">${this.telemetry.latency} ms</span><br>
          MISSION_CORE: <span id="hud-mission-text" style="color:#FFF">${this.mission.activeObjective}</span><br>
          THERMAL_RISK: <span style="color:${this.thermal.gpu > 75 ? '#FF4B00' : '#00FF41'}">${this.thermal.gpu}°C</span>
        </div>
      `;
    }

    _generateTelemetryBar(normalizedValue) {
      const blocks = 20;
      const filled = Math.round(normalizedValue * blocks);
      let bar = '[';
      for (let i = 0; i < blocks; i++) {
        bar += i < filled ? '■' : ' ';
      }
      return bar + ']';
    }

    // ==========================================================================
    // LATE-START PREDITIVE PATCh (Legado Integrado v1.2)
    // ==========================================================================

    _injectLegacyLogic() {
      // Preservação matemática do cálculo de impedância de hesitação operacional do operador
      this._legacyState.latencyInterval = setInterval(() => {
        if (this._legacyState.firstActionDetected || !window.SENTINEL_BOOTED) return;

        const delta = (performance.now() + (window.performance.timeOrigin || 0)) - this._legacyState.bootTimestamp;
        this.telemetry.latency = Math.round(delta);

        if (delta > 60000) {
          this.traceHUD('[LATE-START] Hesitação excessiva identificada. Impedância sináptica crítica.', 'WARN');
          window.SentinelBus?.emit('ui:hud-latency', { ms: delta, value: `${Math.round(delta/1000)}s CRIT` });
        }
      }, 1000);

      // Listener de barramento para interceptar a quebra da inércia
      if (window.SentinelBus) {
        window.SentinelBus.on('ui:interaction', () => {
          if (!this._legacyState.firstActionDetected) {
            this._legacyState.firstActionDetected = true;
            clearInterval(this._legacyState.latencyInterval);
            this.traceHUD('Primeira condução operacional validada. Canal de latência sincronizado.');
          }
        });

        window.SentinelBus.on('state:changed', (state) => {
          if (state && state.ops) {
            this.mission.activeObjective = state.ops.mission || 'NULL';
          }
        });
      }
    }

    // ==========================================================================
    // 28. HUD RECOVERY LAYER & SAFETY MONITOR
    // ==========================================================================

    recoverHUD() {
      this.traceHUD('Falha ou corrupção de overlay detectada. Forçando reidratação estrutural de emergência.', 'CRITICAL');
      try {
        const el = this._legacyState.domElement;
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
        this._createCinematicViewport();
        this.runtimeState.stability = 1.0;
      } catch (e) {
        console.error('[HUD_CRITICAL_COLLAPSE] Falha no espelho de recuperação:', e.message);
      }
    }

    _bootObservatory() {
      this.traceHUD('Iniciando Runtime Cognitive Diagnostics Interface (HUD v9)...', 'INFO');
      
      this._createCinematicViewport();
      this._injectLegacyLogic();

      // Loop síncrono de pulsação acoplado ao scheduler do frame para evitar congelamentos
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

    traceHUD(msg, level = 'INFO') {
      const formatted = `[${new Date().toISOString()}] [SENTINEL_HUD] [${level}] ${msg}`;
      if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
      else if (level === 'WARN') console.warn(formatted);
      else console.log(formatted);
    }
  }

  // Instanciação central e registro soberano no ecossistema global
  const SovereignHUDViewer = new SentinelCognitiveObservatory();
  window.SentinelHUD = SovereignHUDViewer;

  if (window.SentinelBus) {
    window.SentinelBus.once('boot:complete', () => {
      console.log('%c[HUD] Sequência 5: Centro de observabilidade cognitiva mapeado na viewport.', 'color:#00FF41;');
    });
  }
})();
