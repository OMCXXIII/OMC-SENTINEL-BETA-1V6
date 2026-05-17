/**
 * ============================================================================
 * SENTINEL CORE RUNTIME ARCHITECTURE
 * Module: sentinel-protocols.js (Evolution from v6.1 to v9.0)
 * Role: Cognitive Runtime Governance Layer (Sovereign Governance Engine)
 * Design Aesthetic: Strict Contract Verification & Adaptive Operational Equilibrium
 * ============================================================================
 */

// 4. PRIORITY GOVERNANCE LEVELS
const PRIORITY_LEVELS = {
  CRITICAL:   'CRITICAL',   // Emergência de hardware, colapso de GPU ou pânico de memória
  HIGH:       'HIGH',       // Missões ativas, isolamento de atenção, alertas biométricos
  NORMAL:     'NORMAL',     // Fluxos operacionais nominais e telemetria padrão
  BACKGROUND: 'BACKGROUND', // Loops metabólicos, indexação de histórico L2/L3
  SUPPRESSED: 'SUPPRESSED'  // Saturação semântica mitigada ou contextos silenciados
};

// 18. DOMAIN ISOLATION DEFINITIONS
const PROTOCOL_DOMAINS = {
  COGNITION:   'COGNITION',
  RENDERING:   'RENDERING',
  DIAGNOSTICS: 'DIAGNOSTICS',
  MEMORY:      'MEMORY',
  XR:          'XR'
};

class SentinelProtocolsEngine {
  constructor() {
    this.version = '9.0-GOVERNANCE';
    this.isActive = true;

    // 1. PROTOCOL CORE STRUCTURE
    this.protocols = {
      runtime: {
        boot: 'INITIALIZING',
        suspend: 'ALLOWED',
        wake: 'RESTRICTED',
        shutdown: 'PROTECTED',
        recovery: 'READY'
      },
      cognition: {
        relevancePropagation: true,
        focusPersistence: 0.85,
        semanticSuppression: 0.3
      },
      xr: {
        comfortRules: 'STRICT',
        densityLimits: 150, // Limite máximo de nós por metro cúbico virtual
        spatialAttention: true,
        latencyThreshold: 11.1 // ms (Janela rígida para 90Hz estáveis)
      },
      safety: {
        thermal: { limit: 85, current: 42 },
        cognitive: { minBattery: 20 },
        gpu: { minFps: 45 },
        xr: { trackingLossTimeout: 500 },
        memory: { maxL1Lease: 25 * 1024 * 1024 } // 25MB Max State Payload
      },
      synchronization: {
        renderer: 'STABLE',
        xr: 'STABLE',
        scheduler: 'STABLE',
        attention: 'STABLE',
        memory: 'STABLE'
      }
    };

    // 3. EVENT GOVERNANCE & POLICIES
    this.events = {
      priorityRules: new Map(),
      propagationRules: new Map(),
      suppressionRules: new Set(['ui:pulse']), // Filtros de inundação nativos
      replayRules: new Map()
    };

    // 27. CROSS-MODULE CONTRACTS
    this.contracts = {
      rendererPerformance: { active: true, minGpuLoadAllowed: 0.15 },
      attentionRenderer: { active: true, peripheralSuppressionFactor: 0.2 },
      memoryNeurograph: { active: true, enforceAtomicSnapshots: true }
    };

    // Cache interno de referências do DOM legado (v6.1 Preservado)
    this._domCache = { clock: null, latency: null, battery: null };
    this._mentalBattery = 100.0;
    this._lastGovernancePulse = performance.now();

    this._initializeGovernanceLayer();
  }

  // ==========================================================================
  // 13. VALIDATION ENGINE & 12. STATE CONSISTENCY LAYER
  // ==========================================================================

  validateProtocol(protocolPath, ruleCondition) {
    let isValid = false;
    this.safeProtocolExecution(() => {
      const parts = protocolPath.split('.');
      let current = this.protocols;
      for (const part of parts) {
        if (current[part] === undefined) return;
        current = current[part];
      }
      isValid = ruleCondition(current);
    });
    return isValid;
  }

  validateTransition(currentStatus, nextStatus) {
    const validTransitions = {
      'INITIALIZING': ['NOMINAL', 'OVERRIDE_ENABLED'],
      'NOMINAL': ['SUSPENDED', 'EMERGENCY', 'CRITICAL_COLLAPSE'],
      'SUSPENDED': ['NOMINAL', 'SHUTTING_DOWN'],
      'EMERGENCY': ['NOMINAL', 'RECOVERING'],
      'RECOVERING': ['NOMINAL', 'CRITICAL_COLLAPSE']
    };

    const allowed = validTransitions[currentStatus]?.includes(nextStatus) || false;
    if (!allowed) {
      this.traceViolation(`Transição inválida de estado rejeitada: [${currentStatus} -> ${nextStatus}]`);
    }
    return allowed;
  }

  validateContext(contextId, actorDomain) {
    // 18. Impede vazamento transversal e acoplamento caótico de domínios
    if (!PROTOCOL_DOMAINS[actorDomain]) {
      this.traceViolation(`Domínio de acesso desconhecido ou não homologado: [${actorDomain}]`);
      return false;
    }
    if (actorDomain === PROTOCOL_DOMAINS.RENDERING && contextId === 'CORE_VAULT_MUTATION') {
      this.traceViolation(`Tentativa ilegal de mutação de memória a partir do pipeline de Renderização.`);
      return false;
    }
    return true;
  }

  // ==========================================================================
  // 17. PERMISSION PROTOCOLS & EVENT AUTHORIZATION
  // ==========================================================================

  authorizeEventEmission(event, data, emitterModule = 'UNKNOWN') {
    // Regra de supressão atencional ativa: cancela propagação se o evento estiver na lista negra
    if (this.events.suppressionRules.has(event) && this.protocols.cognition.semanticSuppression > 0.5) {
      return false;
    }

    // Contrato de permissões explícitas por criticidade
    const priority = this._getEventPriority(event);
    if (priority === PRIORITY_LEVELS.CRITICAL && emitterModule === 'UI_UX_VIEW') {
      this.traceViolation(`Módulo de interface tentou forçar um evento de prioridade de hardware CRITICAL. Abortando.`);
      return false;
    }

    return true;
  }

  _getEventPriority(event) {
    if (event.includes('critical') || event.includes('collapse') || event.includes('nsdr-trigger')) {
      return PRIORITY_LEVELS.CRITICAL;
    }
    if (event.includes('mission') || event.includes('focus')) {
      return PRIORITY_LEVELS.HIGH;
    }
    return PRIORITY_LEVELS.NORMAL;
  }

  // ==========================================================================
  // 9. RENDERER DEGRADATION & 8. XR ENGINE COMFORT PROTOCOLS
  // ==========================================================================

  enforceRendererPolicy(currentFps, gpuCompilationTimeMs) {
    this.safeProtocolExecution(() => {
      // 9. Quality Rules & Degradation Thresholds
      if (currentFps < this.protocols.safety.gpu.minFps || gpuCompilationTimeMs > this.protocols.xr.latencyThreshold) {
        this.traceProtocol('GPU overload interceptada. Aplicando protocolo de degradação estrutural.');
        
        // Emite ordem para que o Engine XR mude comportamento sem quebrar
        window.SentinelBus?.emit('renderer:degrade-quality', {
          reductionFactor: 0.5,
          disableAntiAliasing: true,
          ts: Date.now()
        });

        // Altera parâmetros de imersão para mitigar enjoo cinetótico (VR Comfort Protection)
        this.protocols.xr.comfortRules = 'MAXIMUM_SAFETY';
        this.protocols.xr.densityLimits = 50; // Contrai densidade tridimensional
      }
    });
  }

  // ==========================================================================
  // LEGACY SYNC: BIOMETRIA, CLOCK ATC E LOOP METABÓLICO (v6.1 Incorporado)
  // ==========================================================================

  _registerLegacyBinds() {
    if (!window.SentinelBus) return;

    // Sincronização do Relógio ATC Operacional
    window.SentinelBus.on('ui:clock-tick', (data) => {
      if (!window.SENTINEL_BOOTED) return;
      
      this._domCache.clock = this._domCache.clock || document.getElementById('clock-display');
      if (!this._domCache.clock) return;

      if (this._domCache.clock.tagName.toLowerCase().startsWith('a-')) {
        this._domCache.clock.setAttribute('value', `CLOCK_ATC\n${data.time}\nSESSÃO: ${data.elapsed}s`);
      } else {
        this._domCache.clock.textContent = `${data.time} | ${data.elapsed}s`;
      }
    });

    // Monitoramento de Hiato Operacional / Latência Crítica
    window.SentinelBus.on('ui:hud-latency', (data) => {
      this._domCache.latency = this._domCache.latency || document.getElementById('latency-value');
      if (this._domCache.latency) this._domCache.latency.textContent = data.value;

      if (data.ms > 600000) {
        this._domCache.latency?.classList.add('latency-critical');
        this.traceViolation('Hiato operacional ultrapassou limite tolerável. Disparando auto-injeção.');
        window.SentinelBus.emit('system:late-start', { patch: '[PREDEF-ALL]' });
      }
    });

    // Listener de Bateria Mental & Salvaguarda Metabólica do Córtex Pré-Frontal (PFC-BRUT)
    window.SentinelBus.on('system:mental-battery', (data) => {
      if (typeof data.level !== 'number') return;
      this._mentalBattery = data.level;

      this._domCache.battery = this._domCache.battery || document.getElementById('mental-battery');
      if (this._domCache.battery) {
        const safeLevel = Math.max(0, Math.min(this._mentalBattery, 100));
        this._domCache.battery.textContent = `${safeLevel}%`;
        this._domCache.battery.classList.remove('battery-warning', 'battery-critical');
        
        if (safeLevel <= 20) this._domCache.battery.classList.add('battery-critical');
        else if (safeLevel <= 45) this._domCache.battery.classList.add('battery-warning');
      }

      if (this._mentalBattery <= this.protocols.safety.cognitive.minBattery) {
        this.traceProtocol('[PFC-BRUT] Exaustão metabólica iminente detectada. Forçando freio sensorial.', 'WARN');
        window.SentinelBus.emit('system:nsdr-trigger', { duration: 600, reason: 'low-metabolic-voltage' });
      }
    });

    // Automação Non-Sleep Deep Rest (NSDR Cooling)
    window.SentinelBus.on('system:nsdr-trigger', (data) => {
      this._executeNSDRCoolingEngine(data);
    });

    // Loop de Degradação de Glicose e Carga de Atenção Estável
    setInterval(() => {
      if (!window.SENTINEL_BOOTED) return;
      this._mentalBattery = Math.max(0, this._mentalBattery - 0.15);
      window.SentinelBus.emit('system:mental-battery', { level: Math.round(this._mentalBattery) });
    }, 45000);
  }

  _executeNSDRCoolingEngine(data) {
    document.body.classList.add('nsdr-cooling');
    this.traceProtocol('Protocolo NSDR ativado: Mitigando poluição visual e reduzindo saturação.');

    document.querySelectorAll('.hud-corner, .glass-panel, .cyber-glass').forEach(node => {
      node.style.filter = 'saturate(0.45) brightness(0.82)';
      node.style.transition = 'filter 1.2s ease';
    });

    window.SentinelBus?.emit('ui:notification', {
      type: 'NSDR',
      message: 'Resfriamento metabólico recomendado por 10 minutos.'
    });

    setTimeout(() => {
      document.body.classList.remove('nsdr-cooling');
      document.querySelectorAll('.hud-corner, .glass-panel, .cyber-glass').forEach(node => {
        node.style.filter = '';
      });
      this.traceProtocol('Ciclo de resfriamento NSDR concluído. Córtex restaurado ao modo nominal.');
    }, (data.duration || 600) * 1000);
  }

  // ==========================================================================
  // 22. ADAPTIVE GOVERNANCE & 29. COGNITIVE EQUILIBRIUM ENGINE
  // ==========================================================================

  adaptProtocols() {
    // Se o estado geral estiver em modo de emergência, eleva agressividade de supressão
    const stateSnapshot = window.StateStore?.get();
    if (stateSnapshot?.ui?.isEmergency || stateSnapshot?.ui?.isFocusMode) {
      this.protocols.cognition.semanticSuppression = 0.8;
      this.protocols.cognition.focusPersistence = 0.95;
      this.events.suppressionRules.add('ui:hud-latency'); // Calma no barramento
    } else {
      this.protocols.cognition.semanticSuppression = 0.3;
      this.protocols.cognition.focusPersistence = 0.85;
      this.events.suppressionRules.delete('ui:hud-latency');
    }
  }

  maintainProtocolEquilibrium() {
    const now = performance.now();
    const deltaTime = (now - this._lastGovernancePulse) / 1000;
    this._lastGovernancePulse = now;

    // 22. Modula dinamicamente thresholds e filtros baseado na carga atual do sistema
    this.adaptProtocols();

    // 30. GOVERN RUNTIME — Árbito de consistência cruzada
    this.governRuntime();
  }

  governRuntime() {
    // Validação preventiva: Se houver colapso tridimensional mas o barramento insistir em manter imersão
    if (window.StateStore) {
      const isEmergency = window.StateStore.get('ui.isEmergency');
      if (isEmergency && this.protocols.runtime.boot !== 'EMERGENCY') {
        this.protocols.runtime.boot = 'EMERGENCY';
        this.applyEmergencyFallbackChain('STATE_STORE_EMERGENCY_FORCE');
      }
    }
  }

  // ==========================================================================
  // 15. RECOVERY PROTOCOLS & FALLBACK HIERARCHY
  // ==========================================================================

  applyEmergencyFallbackChain(reason) {
    this.traceRecovery(`Iniciando cadeia hierárquica de recuperação ordenada. Motivo: ${reason}`, 'CRITICAL');
    
    // 25. Emergency Sequence Order: 1. XR -> 2. GPU -> 3. Memory -> 4. Core State
    this.safeProtocolExecution(() => {
      this.protocols.synchronization.xr = 'DEGRADED';
      window.SentinelBus?.emit('xr:emergency-collapse', { preserveState: true });

      this.protocols.synchronization.renderer = 'SAFE_MINIMAL';
      window.SentinelBus?.emit('renderer:force-2d-fallback', { structuralReset: true });

      if (window.StateStore && typeof window.StateStore.recover === 'function') {
        this.traceRecovery('Invocando reidratação atômica L3 no StateStore.');
        window.StateStore.recover();
      }

      this.protocols.runtime.boot = 'NOMINAL';
      this.traceRecovery('Estabilização do runtime concluída com sucesso.');
    });
  }

  snapshotProtocols() {
    return JSON.parse(JSON.stringify(this.protocols));
  }

  restoreProtocols(snapshot) {
    if (snapshot) {
      this.protocols = snapshot;
      this.traceProtocol('Instantâneo estrutural de governança re-injetado.');
    }
  }

  safeProtocolExecution(executionBlock) {
    try {
      executionBlock();
    } catch (error) {
      this.traceViolation(`Falha crítica na camada de governança: ${error.message}. Acionando reset.`);
      this.applyEmergencyFallbackChain('GOVERNANCE_SYSTEM_VIOLATION_EXCEPTION');
    }
  }

  _initializeGovernanceLayer() {
    this.traceProtocol('Iniciando Cognitive Runtime Governance Layer...', 'INFO');

    // Interceptador acoplado no barramento para governar a segurança operacional de emissões (Contrato de Saída)
    if (window.SentinelBus && typeof window.SentinelBus.emit === 'function') {
      const originalEmit = window.SentinelBus.emit;
      const self = this;
      
      window.SentinelBus.emit = function (event, data) {
        if (!self.authorizeEventEmission(event, data, 'INTERCEPTED_RUNTIME')) {
          return this; // Drop silencioso do evento sob violação de protocolo
        }
        return originalEmit.apply(this, arguments);
      };
    }

    // Vincula o ciclo de arbitragem contínua ao batimento de renderização do sistema
    const governancePulse = () => {
      if (!this.isActive) return;
      this.maintainProtocolEquilibrium();
      requestAnimationFrame(governancePulse);
    };
    requestAnimationFrame(governancePulse);

    // Registra ganchos de eventos herdados do v6.1 e handshakes de boot
    this._registerLegacyBinds();
  }

  traceProtocol(msg, level = 'INFO')  { this.trace(`[GOVERNANCE] ${msg}`, level); }
  traceViolation(msg, level = 'WARN') { this.trace(`[VIOLATION] ${msg}`, level); }
  traceRecovery(msg, level = 'INFO')  { this.trace(`[RECOVERY_CHAIN] ${msg}`, level); }

  trace(message, level = 'INFO') {
    const formatted = `[${new Date().toISOString()}] [SENTINEL_PROTOCOLS] [${level}] ${message}`;
    if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
    else if (level === 'WARN') console.warn(formatted);
    else console.log(formatted);
  }
}

// Instanciação automática e acoplamento soberano no escopo global do SENTINEL
const SovereignProtocolsEngine = new SentinelProtocolsEngine();
window.SentinelProtocols = SovereignProtocolsEngine;

// Acoplamento seguro de boot com o barramento centralizado
if (window.SentinelBus) {
  window.SentinelBus.once('boot:complete', () => {
    console.log('%c[PROTOCOLS] Sequência 4: Governança cognitiva e controle de transições ativos.', 'color:#00FF41;');
  });
}
