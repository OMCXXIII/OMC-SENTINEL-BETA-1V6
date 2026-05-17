/**
 * ============================================================================
 * SENTINEL CORE INTERFACE ARCHITECTURE
 * File: interface/hud/core/hud-runtime.js
 * Role: Cognitive Operational Interface Runtime (Sovereign HUD Core)
 * ============================================================================
 */

import { SentinelHUDCompositor } from './hud-compositor.js';

class SentinelHUDRuntime {
  constructor() {
    this.version = '9.0-HUD-RUNTIME';
    this.isBooted = false;

    // 1. HUD RUNTIME CORE DATA STRUCTURE
    this.hud = {
      active: true,
      mode: 'FLOW', // FOCUS, FLOW, XR, LOW_POWER, RECOVERY, EMERGENCY
      layers: new Map(),
      widgets: new Map(),
      overlays: new Map(),
      metrics: { visualDensity: 0.0, cognitiveStrain: 0.0, activeEmitters: 0 }
    };

    this._lastFrameTime = performance.now();
    this.compositor = null;
  }

  boot() {
    if (this.isBooted) return;
    console.log('%c[HUD RUNTIME] Inicializando Sistema Perceptivo Operacional...', 'color:#00D4FF; font-weight:bold;');

    // Inicializa o Compositor Estrutural de Camadas
    this.compositor = new SentinelHUDCompositor(this);
    this.compositor.initializePipelines();

    this._bindEventBridge();
    this._startUpdateLoop();

    this.isBooted = true;
    window.SENTINEL_HUD_ONLINE = true;
    
    if (window.SentinelBus) {
      window.SentinelBus.emit('hud:boot-complete', { version: this.version });
    }
  }

  // 24. HUD UPDATE LOOP (Separado e compassado deterministicamente)
  _startUpdateLoop() {
    const loop = () => {
      if (!this.hud.active) return;

      try {
        this._updateTelemetrySync();
        this._applyAdaptiveModulation();
        this.compositor.composeFrame();
      } catch (error) {
        console.error('[HUD_RUNTIME_EXCEPTION] Colapso no ciclo de atualização visual:', error.message);
        this.triggerEmergencyRecovery();
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  _updateTelemetrySync() {
    // Captura síncrona dos estados dos barramentos centrais de cognição
    if (window.SentinelAttention) {
      this.hud.metrics.cognitiveStrain = window.SentinelAttention.attention.cognitiveLoad;
    }
    if (window.SentinelHUD && window.SentinelHUD.telemetry) {
      this.hud.metrics.fps = window.SentinelHUD.telemetry.fps;
    }
  }

  // 27. HUD ADAPTIVE SYSTEM (Modulação Dinâmica por Estresse de Hardware e Atenção)
  _applyAdaptiveModulation() {
    // Cenário: GPU Sobrecarregada ou FPS Crítico -> Reduz densidade visual preventivamente
    if (this.hud.metrics.fps < 45) {
      if (this.hud.mode !== 'LOW_POWER') {
        this.setOperationalMode('LOW_POWER');
      }
    }

    // Cenário: Carga Cognitiva em Overload -> Ativa proteção de fadiga e simplifica overlays
    if (this.hud.metrics.cognitiveStrain > 0.85) {
      if (this.hud.mode !== 'FOCUS' && this.hud.mode !== 'EMERGENCY') {
        this.setOperationalMode('FOCUS');
      }
    }
  }

  // 12. HUD MODE OVERLAY MANAGER
  setOperationalMode(mode) {
    const previousMode = this.hud.mode;
    this.hud.mode = mode;
    console.log(`[HUD_MODE] Transição de Perfil Operacional: [${previousMode} -> ${mode}]`);

    if (window.SentinelBus) {
      window.SentinelBus.emit('hud:mode-changed', { current: mode, previous: previousMode });
    }

    // Altera propriedades globais de renderização no compositor de forma graciosa
    const rootContainer = document.getElementById('sentinel-debug-hud');
    if (rootContainer) {
      rootContainer.setAttribute('data-hud-mode', mode);
    }
  }

  _bindEventBridge() {
    if (!window.SentinelBus) return;

    window.SentinelBus.on('system:nsdr-trigger', () => {
      this.setOperationalMode('LOW_POWER');
    });

    window.SentinelBus.on('state:changed', (state) => {
      if (state?.ui?.isEmergency) {
        this.setOperationalMode('EMERGENCY');
      }
    });
  }

  // 23. HUD SNAPSHOT & RECOVERY LAYER
  triggerEmergencyRecovery() {
    console.warn('[HUD_RECOVERY] Iniciando reidratação visual e purga de overlays corrompidas.');
    this.setOperationalMode('RECOVERY');
    
    if (this.compositor) {
      this.compositor.resetDOMContainer();
    }
    
    setTimeout(() => {
      this.setOperationalMode('FLOW');
    }, 1500);
  }
}

// Instanciação automática segura
const HUDRuntimeInstance = new SentinelHUDRuntime();
window.SentinelHUDRuntime = HUDRuntimeInstance;
export default HUDRuntimeInstance;