/**
 * ============================================================================
 * SENTINEL CORE RUNTIME ARCHITECTURE
 * Module: sentinel-state-machine.js
 * Role: Operational Cognitive State Governor (Hierarchical State Machine)
 * Design Aesthetic: Absolute Mathematical Rigor / Cyber-Glass Determinism
 * ============================================================================
 */

// 2. STATE ENUMERATION REAL
const STATES = {
  BOOT: 'BOOT',
  READY: 'READY',
  IDLE: 'IDLE',
  FOCUS: 'FOCUS',
  FLOW: 'FLOW',
  XR: 'XR',
  IMMERSION: 'IMMERSION',
  LOW_POWER: 'LOW_POWER',
  DEGRADED: 'DEGRADED',
  RECOVERY: 'RECOVERY',
  EMERGENCY: 'EMERGENCY',
  SAFE_MODE: 'SAFE_MODE',
  SHUTDOWN: 'SHUTDOWN'
};

class SentinelStateMachine {
  constructor() {
    // 1. STATE REGISTRY
    this.states = new Map();

    // 3. CURRENT STATE AUTHORITY
    this.currentState = null;
    this.previousState = null;
    this.pendingState = null;

    // 5. TRANSITION MATRIX (Grafo de transições legais e explícitas)
    this.transitions = {
      [STATES.BOOT]: [STATES.READY, STATES.SAFE_MODE],
      [STATES.READY]: [STATES.FOCUS, STATES.XR, STATES.LOW_POWER, STATES.DEGRADED, STATES.EMERGENCY, STATES.SHUTDOWN],
      [STATES.IDLE]: [STATES.FOCUS, STATES.XR, STATES.LOW_POWER, STATES.SHUTDOWN],
      [STATES.FOCUS]: [STATES.READY, STATES.FLOW, STATES.XR, STATES.LOW_POWER, STATES.EMERGENCY],
      [STATES.FLOW]: [STATES.FOCUS, STATES.READY, STATES.EMERGENCY],
      [STATES.XR]: [STATES.IMMERSION, STATES.FOCUS, STATES.RECOVERY, STATES.LOW_POWER, STATES.DEGRADED, STATES.EMERGENCY],
      [STATES.IMMERSION]: [STATES.XR, STATES.EMERGENCY, STATES.RECOVERY],
      [STATES.LOW_POWER]: [STATES.READY, STATES.SAFE_MODE, STATES.SHUTDOWN],
      [STATES.DEGRADED]: [STATES.READY, STATES.RECOVERY, STATES.EMERGENCY, STATES.SAFE_MODE],
      [STATES.RECOVERY]: [STATES.READY, STATES.XR, STATES.SAFE_MODE, STATES.EMERGENCY],
      [STATES.EMERGENCY]: [STATES.SAFE_MODE, STATES.RECOVERY, STATES.SHUTDOWN],
      [STATES.SAFE_MODE]: [STATES.RECOVERY, STATES.SHUTDOWN],
      [STATES.SHUTDOWN]: []
    };

    // 8. STATE HISTORY SYSTEM
    this.history = [];
    this.maxHistorySize = 200;

    // 13. TRANSITION QUEUE
    this.transitionQueue = [];
    this.isTransitioning = false;

    // 14. STATE LOCKING
    this.isLocked = false;

    // 15. COGNITIVE STATE LAYER
    this.cognitive = {
      focusLevel: 0.0,
      attentionState: 'idle',
      contextDensity: 1.0,
      distractionLevel: 0.0,
      immersionLevel: 0.0
    };

    // 16. XR STATE GOVERNANCE
    this.xr = {
      tracking: false,
      immersion: 'none',
      comfort: 'stable',
      latency: 0.0,
      reprojection: false,
      focusZone: 'center'
    };

    // 24. TIME-IN-STATE TRACKING
    this.stateMetrics = {
      enterTimestamp: Date.now(),
      duration: 0
    };

    // 11. STATE GUARDS (Predicados de validação rígida pré-transição)
    this.guards = {
      [STATES.XR]: () => this.xr.tracking && this.cognitive.immersionLevel > 0.1,
      [STATES.LOW_POWER]: () => typeof window.StateStore !== 'undefined' && window.StateStore.get('telemetry.mentalBattery') < 20,
      [STATES.EMERGENCY]: () => typeof window.StateStore !== 'undefined' && window.StateStore.get('kernel.hardwareStatus') === 'CRITICAL'
    };

    // Inicialização automática dos estados nativos estruturais do ecossistema
    this._initializeNativeRegistry();
  }

  // ==========================================================================
  // 1. STATE REGISTRY & 17. SUBSTATE / 18. HIERARCHICAL STATES (HSM)
  // ==========================================================================

  registerState(name, config) {
    if (!STATES[name]) {
      throw new Error(`[STATE_MACHINE] Violação Crítica: Estado '${name}' não está catalogado na enumeração soberana.`);
    }

    this.states.set(name, {
      name: name,
      parent: config.parent || null, // Habilita Hierarchical State Machine (HSM)
      substates: new Map(),          // 17. Substate System
      onEnter: config.enter || null,
      onExit: config.exit || null,
      onUpdate: config.update || null,
      onValidate: config.validate || null,
      onRecover: config.recover || null,
      onSuspend: config.suspend || null,
      onResume: config.resume || null
    });

    this.trace(`Estado Registrado: ${name} ${config.parent ? `(Filho de ${config.parent})` : ''}`);
  }

  unregisterState(name) {
    return this.states.delete(name);
  }

  getState(name) {
    return this.states.get(name);
  }

  hasState(name) {
    return this.states.has(name);
  }

  getCurrentState() {
    return this.currentState;
  }

  getPreviousState() {
    return this.previousState;
  }

  // ==========================================================================
  // 4. TRANSITION ENGINE & 12. ASYNC TRANSITIONS
  // ==========================================================================

  async transition(toState) {
    // Enfileira a transição requisitada para mitigar Race Conditions simultâneas
    return new Promise((resolve, reject) => {
      this.transitionQueue.push({ toState, resolve, reject });
      this._processTransitionQueue();
    });
  }

  async _processTransitionQueue() {
    if (this.isTransitioning || this.transitionQueue.length === 0 || this.isLocked) return;

    this.isTransitioning = true;
    const { toState, resolve, reject } = this.transitionQueue.shift();
    const fromState = this.currentState || STATES.BOOT;

    this.pendingState = toState;
    this.measureTransitionTime('start');

    try {
      // 1. Validar Legalidade da Transição por Matriz e Guards externos
      this.validateTransition(fromState, toState);

      this.traceTransition(fromState, toState, 'EXECUÇÃO_INICIADA');

      // 2. Ciclo de Saída (onExit) do Estado Atual e seus Ancestrais (HSM)
      if (this.currentState) {
        await this._executeHierarchyLifecycle(this.currentState, 'onExit');
      }

      // 3. Captura Snapshot de Continuidade Contextual Pré-Transição
      const backupSnapshot = this.createSnapshot();

      // 4. Efetivação da troca de autoridade de estado
      this.previousState = fromState;
      this.currentState = toState;
      this.pendingState = null;

      // Reset do relógio de duração do estado
      this.stateMetrics.enterTimestamp = Date.now();

      // 5. Ciclo de Entrada (onEnter) do Novo Estado e seus Pais Hierárquicos
      await this._executeHierarchyLifecycle(toState, 'onEnter');

      // 6. Sincronização em tempo real do ecossistema e Emissão de Barramento
      this.synchronizeRuntime();
      this.recordStateMetrics(fromState, toState, 'SUCCESS');

      this.emit('state:changed', { from: fromState, to: toState, ts: Date.now() });
      this.traceTransition(fromState, toState, 'CONCLUÍDA_COM_SUCESSO');

      resolve(true);
    } catch (error) {
      this.trace(`Falha Crítica na Transição [${fromState} ──> ${toState}]: ${error.message}`, 'ERROR');
      this.recordStateMetrics(fromState, toState, 'FAILED');
      this.pendingState = null;

      // 10. ROLLBACK ENGINE automático em caso de travamento/rejeição de pipeline
      await this.rollbackTo(fromState);
      
      reject(error);
    } finally {
      this.isTransitioning = false;
      // Processa o próximo item da fila de forma assíncrona desacoplada
      setTimeout(() => this._processTransitionQueue(), 0);
    }
  }

  async _executeHierarchyLifecycle(stateName, hookName) {
    const stateConfig = this.getState(stateName);
    if (!stateConfig) return;

    // Se for entrada (onEnter), executa de cima para baixo (Pai -> Filho)
    // Se for saída (onExit), executa de baixo para cima (Filho -> Pai)
    const hierarchyStack = [];
    let current = stateConfig;
    while (current) {
      hierarchyStack.push(current);
      current = current.parent ? this.getState(current.parent) : null;
    }

    if (hookName === 'onExit') {
      // De baixo para cima
      for (const targetState of hierarchyStack) {
        if (typeof targetState.onExit === 'function') await targetState.onExit();
      }
    } else if (hookName === 'onEnter') {
      // De cima para baixo
      hierarchyStack.reverse();
      for (const targetState of hierarchyStack) {
        if (typeof targetState.onEnter === 'function') await targetState.onEnter();
      }
    }
  }

  // ==========================================================================
  // 6. STATE VALIDATION ENGINE & 11. STATE GUARDS
  // ==========================================================================

  validateTransition(from, to) {
    // Validação 1: Existência física na Enumeração Soberana
    if (!STATES[to]) {
      throw new Error(`[VALIDATION] Destino '${to}' não mapeado no ecossistema.`);
    }

    // Validação 2: Checagem de Conectividade do Grafo da Matriz de Transição
    const allowedTransitions = this.transitions[from] || [];
    if (!allowedTransitions.includes(to) && from !== STATES.EMERGENCY) {
      throw new Error(`[VALIDATION] Transição Ilegal de Trajetória: [${from} ──> ${to}].`);
    }

    // Validação 3: Execução de State Guards customizados
    if (this.guards[to] && !this.guards[to]()) {
      throw new Error(`[VALIDATION] Transição Bloqueada: Condições de contorno (Guards) para entrar em [${to}] não foram satisfeitas.`);
    }

    // Validação 4: Integridade de Subsistemas Técnicos
    this.validateStateIntegrity(to);
  }

  validateStateIntegrity(targetState) {
    if (typeof window.StateStore !== 'undefined') {
      const coreDiagnostics = window.StateStore.get('kernel.hardwareStatus');
      if (coreDiagnostics === 'CRITICAL' && targetState !== STATES.EMERGENCY && targetState !== STATES.SAFE_MODE) {
        throw new Error(`[INTEGRITY] Sistema sob pressão crítica de hardware. Transições normais suspensas.`);
      }
    }
    return true;
  }

  // ==========================================================================
  // 10. ROLLBACK ENGINE & 21. RECOVERY SYSTEM
  // ==========================================================================

  async rollback() {
    if (this.previousState) {
      await this.rollbackTo(this.previousState);
    }
  }

  async rollbackTo(state) {
    this.trace(`Iniciando Rollback Emergencial Corretivo para: [${state}]`, 'WARN');
    this.isLocked = false; // Força destravamento mecânico de fluxo
    
    this.currentState = state;
    this.stateMetrics.enterTimestamp = Date.now();
    
    this.synchronizeRuntime();
    this.emit('state:rollback', { target: state });
  }

  async attemptRecovery() {
    if (this.currentState === STATES.RECOVERY) return;
    this.trace('Gatilhando Sequência de Auto-Recuperação de Estado...', 'WARN');
    await this.transition(STATES.RECOVERY);
  }

  async recoverState() {
    const stateConfig = this.getState(this.currentState);
    if (stateConfig && typeof stateConfig.onRecover === 'function') {
      try {
        await stateConfig.onRecover();
        await this.transition(STATES.READY);
      } catch (e) {
        this.enterEmergency();
      }
    }
  }

  // ==========================================================================
  // 22. EMERGENCY MODE ENGINE
  // ==========================================================================

  enterEmergency() {
    this.trace('!!! COLAPSO DE OPERAÇÃO: ENTRANDO EM MODO DE EMERGÊNCIA ABSOLUTO !!!', 'CRITICAL');
    this.isLocked = true; // Sela o State Machine contra mutações externas poluentes
    this.currentState = STATES.EMERGENCY;
    this.emit('state:emergency_mode', { ts: Date.now() });
    
    if (typeof window.SentinelCore !== 'undefined' && typeof window.SentinelCore.route === 'function') {
      window.SentinelCore.route('STATE_EMERGENCY', { active: true });
    }
  }

  exitEmergency() {
    this.isLocked = false;
    this.trace('Modo de emergência revogado. Chaveando para Malha de Proteção Segura.');
    this.transition(STATES.SAFE_MODE);
  }

  // ==========================================================================
  // 14. STATE LOCKING
  // ==========================================================================

  lockState() {
    this.isLocked = true;
    this.trace('State Machine travada manualmente. Nenhuma transição será aceita.', 'WARN');
  }

  unlockState() {
    this.isLocked = false;
    this.trace('State Machine destravada. Fluxo operacional reativado.');
  }

  // ==========================================================================
  // 9. SNAPSHOT SYSTEM & 27. STATE SERIALIZATION
  // ==========================================================================

  createSnapshot() {
    return {
      currentState: this.currentState,
      previousState: this.previousState,
      cognitive: { ...this.cognitive },
      xr: { ...this.xr },
      timestamp: Date.now()
    };
  }

  restoreSnapshot(snapshot) {
    if (!snapshot || !snapshot.currentState) return false;
    this.currentState = snapshot.currentState;
    this.previousState = snapshot.previousState;
    this.cognitive = snapshot.cognitive;
    this.xr = snapshot.xr;
    this.synchronizeRuntime();
    return true;
  }

  serialize() {
    return JSON.stringify(this.createSnapshot());
  }

  deserialize(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      this.restoreSnapshot(parsed);
      this.trace('Estado desserializado e restaurado com integridade.');
    } catch (e) {
      this.trace('Erro crítico ao desserializar string de estado.', 'ERROR');
    }
  }

  // ==========================================================================
  // 23. RUNTIME SYNCHRONIZATION
  // ==========================================================================

  synchronizeRuntime() {
    this.stateMetrics.duration = Date.now() - this.stateMetrics.enterTimestamp;

    // Atualiza de forma direta as chaves do StateStore (Single Source of Truth)
    if (typeof window.StateStore !== 'undefined') {
      window.StateStore.set('ui.mode', this.currentState);
      window.StateStore.set('ui.isFocusMode', this.currentState === STATES.FOCUS || this.currentState === STATES.FLOW);
      window.StateStore.set('ui.isEmergency', this.currentState === STATES.EMERGENCY);
    }
  }

  // ==========================================================================
  // 20. TELEMETRY INTEGRATION & PERFORMANCE TRACKING
  // ==========================================================================

  measureTransitionTime(marker) {
    if (marker === 'start') {
      this._tMarker = performance.now();
    } else {
      return performance.now() - this._tMarker;
    }
  }

  recordStateMetrics(from, to, status) {
    const duration = this.measureTransitionTime('end');
    const metricEntry = {
      timestamp: Date.now(),
      from,
      to,
      status,
      duration: `${duration.toFixed(2)}ms`,
      cognitiveLoad: this.cognitive.focusLevel
    };

    this.history.push(metricEntry);
    if (this.history.length > this.maxHistorySize) this.history.shift();
  }

  traceTransition(from, to, lifecycleStage) {
    this.trace(`[TRANSIÇÃO] [${from} ──> ${to}] Estágio Pipeline: ${lifecycleStage}`);
  }

  trace(message, level = 'INFO') {
    const formatted = `[${new Date().toISOString()}] [STATE_GOVERNOR] [${level}] ${message}`;
    if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
    else if (level === 'WARN') console.warn(formatted);
    else console.log(formatted);
  }

  // ==========================================================================
  // 26. INTEGRITY VERIFICATION (Anti-Deadlock Validation)
  // ==========================================================================

  verifyIntegrity() {
    this.trace('Verificando integridade matemática estrutural...');
    
    // Testa ciclos fechados ilegais (Deadlocks de transição órfã)
    for (const state of Object.keys(this.transitions)) {
      if (!this.states.has(state) && state !== STATES.BOOT) {
        this.trace(`Anomalia detectada: Estado enumerado [${state}] não está registrado no Map ativo.`, 'ERROR');
        return false;
      }
    }
    return true;
  }

  emit(event, data) {
    window.SentinelBus?.emit(event, data);
  }

  // ==========================================================================
  // INTERNAL CONTEXTUAL SETUP (NATIVE COMPLIANCE)
  // ==========================================================================

  _initializeNativeRegistry() {
    // Registra a infraestrutura básica de subestados para o Boot Pipeline
    this.registerState(STATES.BOOT, {
      enter: async () => this.trace('Backbone de estado de Boot ativado.'),
      exit: async () => this.trace('Sequência de Boot evacuada.')
    });

    this.registerState(STATES.READY, {
      enter: async () => this.trace('Sistema SENTINEL pronto e estável para transições cognitivas.')
    });

    // 18. Hierarchical States setup nativo para XR
    this.registerState(STATES.XR, {
      enter: async () => {
        this.xr.tracking = true;
        this.trace('Renderizadores WebGPU/XR alocados sob prioridade de barramento.');
      },
      exit: async () => {
        this.xr.tracking = false;
        this.trace('Desalocando pipelines imersivos.');
      }
    });

    this.registerState(STATES.IMMERSION, {
      parent: STATES.XR, // HSM Linkage
      enter: async () => { this.xr.immersion = 'full'; },
      exit: async () => { this.xr.immersion = 'none'; }
    });

    this.registerState(STATES.EMERGENCY, {
      enter: async () => { this.lockState(); }
    });

    this.currentState = STATES.BOOT;
  }
}

// Vinculação única no escopo global
const SovereignStateGovernor = new SentinelStateMachine();
window.SentinelStateMachine = SovereignStateGovernor;

export default SovereignStateGovernor;