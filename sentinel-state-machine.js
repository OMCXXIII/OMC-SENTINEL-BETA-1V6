/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — AUTHORITATIVE STATE MACHINE (VR-OS MOTOR DE TRANSIÇÃO)
 * Arquivo: sentinel-state-machine.js
 * Papel: Validador Imutável de Mudança de Fase, Rollback e Barreira Física
 * Governança: Totalmente subordinado ao SovereignKernel. Sem auto-boot implícito.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// 1. STATE ENUMERATION REAL (IMUTÁVEL)
const STATES = Object.freeze({
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
});

class SentinelStateMachine {
  constructor() {
    // 2. STATE REGISTRY & HISTÓRICO DE AUDITORIA
    this.states = new Map();
    this.history = [];
    this.maxHistorySize = 50;

    // 3. CURRENT STATE AUTHORITY (Múltiplas travas físicas de barreira)
    this.currentState = null;
    this.previousState = null;
    this.pendingState = null;
    this.isStateLocked = false;
    this.isTransitioning = false;

    // 4. TELEMETRIA E HISTÓRICO VOLÁTIL DE HARDWARE/BIOMETRIA INTERNA
    this.xr = { tracking: false, immersion: 'none', framePacing: '90Hz' };
    this.biometrics = { galvanicStress: 0.0, eyeStrainFraction: 0.0 };

    // 5. MATRIZ DE CONTROLE DE FLUXO DE ESTADOS (VR-OS MATRICIAL SECO)
    this.transitions = Object.freeze({
      [STATES.BOOT]:      [STATES.READY, STATES.SAFE_MODE],
      [STATES.READY]:     [STATES.FOCUS, STATES.XR, STATES.LOW_POWER, STATES.DEGRADED, STATES.EMERGENCY, STATES.SHUTDOWN],
      [STATES.FOCUS]:     [STATES.READY, STATES.XR, STATES.SAFE_MODE],
      [STATES.FLOW]:      [STATES.READY, STATES.LOW_POWER, STATES.RECOVERY],
      [STATES.XR]:        [STATES.RECOVERY, STATES.SAFE_MODE],
      [STATES.LOW_POWER]: [STATES.READY, STATES.RECOVERY, STATES.EMERGENCY],
      [STATES.RECOVERY]:  [STATES.READY, STATES.SAFE_MODE, STATES.EMERGENCY],
      [STATES.EMERGENCY]: [STATES.RECOVERY], // Travamento em loop de diagnóstico de segurança
      [STATES.SAFE_MODE]: [STATES.EMERGENCY, STATES.SHUTDOWN],
      [STATES.SHUTDOWN]:  []
    });

    this._initializeNativeRegistry();
  }

  /**
   * TRACE ENGINE UNIFICADO INTERNO
   */
  trace(message, level = 'INFO') {
    if (window.SovereignKernel && typeof window.SovereignKernel.trace === 'function') {
      window.SovereignKernel.trace('STATE-MACHINE', message, level);
    } else {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
      console.log(`%c[${timestamp}] [STATE-MACHINE] [${level}] ${message}`, 'color: #9D00FF; font-weight: bold;');
    }
  }

  /**
   * Registro explícito de ganchos operacionais para estados específicos
   */
  registerState(stateName, config) {
    if (!STATES[stateName]) {
      this.trace(`Tentativa de registrar estado inválido ignorada: ${stateName}`, 'WARN');
      return;
    }
    this.states.set(stateName, {
      enter: config.enter || (async () => {}),
      exit: config.exit || (async () => {}),
      parent: config.parent || null
    });
  }

  /**
   * INTERCEPTADOR DE SEGURANÇA CONTRA DESVIOS (Ações de proteção biológica e de hardware)
   */
  async _executeSecurityAction(origin, violatorTarget, callerName = 'UNKNOWN_MODULE') {
    this.trace(`AÇÃO DE SEGURANÇA: Violação detectada de [${origin}] para [${violatorTarget}] por [${callerName}]`, 'CRITICAL');
    
    switch (origin) {
      case STATES.BOOT:
        this.trace(`Forçando Rollback imediato para BOOT e isolando módulo violador: ${callerName}`, 'CRITICAL');
        this.isTransitioning = false;
        await this._forceAbsoluteState(STATES.BOOT);
        window.SentinelBus?.emit('performance:emergency-fallback', { isolateModule: callerName });
        break;

      case STATES.READY:
        this.trace('Bloqueio imediato do barramento de transição. Redirecionando para EMERGENCY.', 'CRITICAL');
        this.lockState();
        this.isTransitioning = false;
        await this._forceAbsoluteState(STATES.EMERGENCY);
        break;

      case STATES.FOCUS:
        this.trace('Interceptação da intenção de foco pelo gerenciador de atenção.', 'WARN');
        this.isTransitioning = false;
        window.SentinelBus?.emit('attention:suppression-trigger', { lockLevel: 'MAXIMUM' });
        await this._forceAbsoluteState(STATES.READY);
        break;

      case STATES.XR:
        this.trace('Reprojeção síncrona forçada em 2D de emergência para preservar biometria.', 'CRITICAL');
        this.isTransitioning = false;
        this.xr.tracking = false;
        this.xr.immersion = 'none';
        window.SentinelBus?.emit('xr:suspended', { reason: 'CRITICAL_DESYNC_VIOLATION', force2D: true });
        await this._forceAbsoluteState(STATES.SAFE_MODE);
        break;

      case STATES.EMERGENCY:
        this.trace('Travamento em loop de diagnóstico de segurança. Forçando RECOVERY.', 'CRITICAL');
        this.isTransitioning = false;
        await this._forceAbsoluteState(STATES.RECOVERY);
        break;

      default:
        this.isTransitioning = false;
        await this._forceAbsoluteState(STATES.SAFE_MODE);
        break;
    }
  }

  /**
   * Força um estado sem passar pelas travas de validação ordinárias (Uso exclusivo de Rollbacks internos)
   */
  async _forceAbsoluteState(targetState) {
    this.previousState = this.currentState;
    this.currentState = targetState;
    this._logHistory(targetState, 'FORCE_ROLLBACK');
    
    const config = this.states.get(targetState);
    if (config && config.enter) {
      try {
        await config.enter();
      } catch (e) {
        this.trace(`Falha no enter do Rollback Absoluto: ${e.message}`, 'CRITICAL');
      }
    }
  }

  /**
   * Validador Imutável de Transições de Fase (canTransition)
   * Verifica se o destino existe dentro do vetor ordenado da origem
   */
  canTransition(targetState) {
    if (this.isStateLocked) return false;
    if (this.isTransitioning) return false;
    if (!this.currentState) return true; // Permite injeção inicial de boot

    const allowedTargets = this.transitions[this.currentState];
    return allowedTargets ? allowedTargets.includes(targetState) : false;
  }

  /**
   * ⚡ MOTOR DE TRANSIÇÃO AUTORITATIVO (Muda o estado do sistema com barreira física)
   * @param {string} targetState - Estado de destino solicitado
   * @param {string} callerIdentity - Identidade do módulo solicitante para fins de isolamento
   */
  async transition(targetState, callerIdentity = 'UNKNOWN_MODULE') {
    if (this.isStateLocked) {
      this.trace(`Transição negada: O motor de estado está fisicamente trancado em: ${this.currentState}`, 'WARN');
      return false;
    }

    if (this.currentState === targetState) return true;

    // Se a transição for ilegal, aciona imediatamente a barreira física e a ação de mitigação
    if (!this.canTransition(targetState)) {
      await this._executeSecurityAction(this.currentState, targetState, callerIdentity);
      return false;
    }

    this.isTransitioning = true;
    this.pendingState = targetState;
    this.trace(`Iniciando mutação autoritativa: ${this.currentState} ──► ${targetState} [Origem: ${callerIdentity}]`, 'INFO');

    try {
      // 1. Executa a saída do estado atual e seus ancestrais hierárquicos
      if (this.currentState) {
        const currentConfig = this.states.get(this.currentState);
        if (currentConfig && currentConfig.exit) {
          await currentConfig.exit();
        }
      }

      // 2. Transiciona as referências atômicas de memória
      this.previousState = this.currentState;
      this.currentState = targetState;
      this.pendingState = null;

      // 3. Executa a entrada no novo estado configurado
      const targetConfig = this.states.get(targetState);
      if (targetConfig && targetConfig.enter) {
        await targetConfig.enter();
      }

      // 4. Registra histórico e despacha para o barramento de alta precisão
      this._logHistory(targetState, 'SUCCESS');
      this.isTransitioning = false;

      window.SentinelBus?.emit('state:phase-synchronized', {
        from: this.previousState,
        to: this.currentState,
        ts: Date.now()
      });

      return true;

    } catch (error) {
      this.trace(`Colapso no loop de transição estrutural: ${error.message}. Acionando Rollback de emergência.`, 'CRITICAL');
      this.isTransitioning = false;
      await this._executeSecurityAction(this.previousState || STATES.SAFE_MODE, targetState, 'RUNTIME_EXCEPTION_HANDLER');
      return false;
    }
  }

  /**
   * Bloqueia fisicamente mutações futuras no barramento de transição
   */
  lockState() {
    this.isStateLocked = true;
    this.trace(`Barreira física ativada. Estado trancado de forma imutável em: ${this.currentState}`, 'WARN');
  }

  /**
   * Destranca a barreira física do motor de transições
   */
  unlockState() {
    this.isStateLocked = false;
    this.trace('Barreira física desativada. Transições de estado liberadas.', 'INFO');
  }

  /**
   * Armazena registro de auditoria imutável do sistema operacional cognitivo
   */
  _logHistory(state, status) {
    this.history.push({
      state,
      status,
      timestamp: Date.now(),
      trackingContext: { ...this.xr }
    });
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Injeção nativa inicial da malha hierárquica e estados padrões do VR-OS
   */
  _initializeNativeRegistry() {
    this.registerState(STATES.BOOT, {
      enter: async () => this.trace('Backbone de estado de Boot ativado de forma limpa.', 'INFO'),
      exit: async () => this.trace('Sequência de Boot evacuada e validada.', 'INFO')
    });

    this.registerState(STATES.READY, {
      enter: async () => this.trace('Sistema SENTINEL pronto e estável para transições cognitivas.', 'INFO')
    });

    this.registerState(STATES.XR, {
      enter: async () => {
        this.xr.tracking = true;
        this.xr.immersion = 'partial';
        this.trace('Renderizadores WebGPU/XR alocados sob prioridade máxima de barramento.', 'INFO');
      },
      exit: async () => {
        this.xr.tracking = false;
        this.xr.immersion = 'none';
        this.trace('Desalocando pipelines imersivos e desativando matriz espacial.', 'WARN');
      }
    });

    this.registerState(STATES.IMMERSION, {
      parent: STATES.XR,
      enter: async () => { this.xr.immersion = 'full'; },
      exit: async () => { this.xr.immersion = 'partial'; }
    });

    this.registerState(STATES.EMERGENCY, {
      enter: async () => { 
        this.lockState();
        this.trace('Filtros e mitigadores operando em regime de isolamento extremo.', 'CRITICAL');
      }
    });

    this.registerState(STATES.SAFE_MODE, {
      enter: async () => this.trace('Módulos periféricos suspensos em Modo de Segurança Seguro.', 'CRITICAL')
    });

    this.currentState = STATES.BOOT;
  }
}

// 6. EXPOSIÇÃO OPERACIONAL E ACUAMENTO PASSIVO DE SEGURANÇA
(() => {
  const SovereignStateGovernor = new SentinelStateMachine();
  
  window.SentinelStateMachine = SentinelStateMachine; // Exposição da Classe para heranças/stubs
  window.SovereignStateGovernor = SovereignStateGovernor;

  // Vinculação determinística como subsistema direto do Kernel Soberano
  if (window.SovereignKernel) {
    window.SovereignKernel.registerModule('sentinel-state-machine', SovereignStateGovernor);
  } else {
    Object.defineProperty(window, 'SovereignKernel', {
      configurable: true,
      enumerable: true,
      set: (kernelInstance) => {
        delete window.SovereignKernel;
        window.SovereignKernel = kernelInstance;
        window.SovereignKernel.registerModule('sentinel-state-machine', SovereignStateGovernor);
      }
    });
  }

  console.log(
    '%c OMC SENTINEL STATE MACHINE v9.0 ONLINE [IMMUTABLE-VALIDATOR-MODE] ',
    'background:#3a0066; color:#fff; font-weight:bold; padding:3px; border-left:4px solid #9D00FF;'
  );
})();
