/**
 * ============================================================================
 * SENTINEL CORE RUNTIME ARCHITECTURE
 * Module: sentinel-kernel.js
 * Role: Cognitive Runtime Governor
 * Design Aesthetic: Dark Mode Scientific / Cyber Glass Architecture
 * ============================================================================
 */

class SentinelKernel {
  constructor() {
    // 1. Runtime Registry & Dependency Injection Layer
    this.modules = new Map();

    // 4. Runtime Mode Engine & 15. Cognitive Integration Layer
    this.runtime = {
      mode: 'BOOT',
      previousMode: null,
      active: false,
      focus: 'normal',
      
      // 15. Cognitive Integration Layer
      attentionState: 'idle',
      cognitiveLoad: 0.0,
      focusTarget: null,
      contextState: {},

      // 16. XR Governance Layer
      xr: {
        active: false,
        mode: 'IMMERSIVE',
        fps: 72,
        tracking: false,
        comfort: 'stable'
      },

      // 17. Adaptive Energy System
      energy: 1.0,
      energyBudget: 100, // em porcentagem ou mWh normativos
      powerProfile: 'BALANCED', // LOW_POWER, BALANCED, PERFORMANCE, ULTRA_XR
      coolingState: 'NOMINAL'   // NOMINAL, WARNING, CRITICAL
    };

    // 5. Runtime Permission Layer
    this.permissions = {
      scheduler: true,
      renderer: true,
      xr: true,
      telemetry: true,
      audio: true,
      attention: true,
      memory: true
    };

    // 6. Runtime Health System & 17. Adaptive Energy (Thermal tracking)
    this.health = {
      fps: 60,
      gpuPressure: 0,
      memoryUsage: 0,
      thermal: 0, // 0 (Frio) a 100 (Crítico)
      degraded: false
    };

    // 10. Runtime Priority Governance
    this.priorities = {
      critical: [],   // Módulos vitais (não podem sofrer degradação)
      high: [],       // Módulos de performance prioritária (Scheduler, XR)
      normal: [],     // Interface, HUD, Áudio básico
      background: [], // Telemetria, Diagnostics, Sync secundário
      suspended: []   // Módulos temporariamente parados por restrição térmica/energética
    };

    // 12. Kernel Telemetry
    this.telemetry = {
      bootTime: 0,
      frameTime: 0,
      modeHistory: [],
      crashHistory: [],
      recoveryCount: 0
    };

    // Barramento interno de listeners privados do Kernel
    this._events = new Map();
    
    // Marcação inicial de boot
    this._initTime = Date.now();
  }

  // ==========================================================================
  // 1. RUNTIME REGISTRY & 2. DEPENDENCY INJECTION LAYER
  // ==========================================================================
  
  registerModule(name, module) {
    if (!name || typeof name !== 'string') {
      throw new Error('[KERNEL] Nome do módulo inválido para registro.');
    }
    
    // 18. Kernel Security Layer - Validação estrutural básica
    this.validateModule(name, module);

    // Injeta a referência soberana do kernel no módulo antes do armazenamento
    if (typeof module.initKernelContext === 'function') {
      module.initKernelContext(this);
    }

    this.modules.set(name, module);
    this.trace(`Módulo registrado com sucesso: ${name}`);

    // Mapeamento automático de prioridades se definido no módulo
    const priority = module.priority || 'normal';
    if (this.priorities[priority]) {
      this.priorities[priority].push(name);
    } else {
      this.priorities.normal.push(name);
    }
  }

  unregisterModule(name) {
    if (this.modules.has(name)) {
      this.suspendModule(name);
      this.modules.delete(name);
      
      // Remove das listas de prioridade
      Object.keys(this.priorities).forEach(key => {
        this.priorities[key] = this.priorities[key].filter(m => m !== name);
      });

      this.trace(`Módulo removido do ecossistema: ${name}`);
      return true;
    }
    return false;
  }

  getModule(name) {
    const module = this.modules.get(name);
    if (!module) {
      this.trace(`Aviso: Módulo requisitado não encontrado: ${name}`, 'WARN');
    }
    return module;
  }

  hasModule(name) {
    return this.modules.has(name);
  }

  resolve(name) {
    const module = this.getModule(name);
    if (!module) {
      throw new Error(`[KERNEL] Falha crítica de Injeção de Dependência: Módulo '${name}' é requerido mas não está registrado.`);
    }
    return module;
  }

  inject(target) {
    if (target && typeof target.injectDependencies === 'function') {
      target.injectDependencies(this);
      this.trace(`Dependências injetadas no alvo com sucesso.`);
    }
  }

  // ==========================================================================
  // 3. LIFECYCLE SYSTEM & BOOT ORCHESTRATION
  // ==========================================================================

  async boot() {
    this.trace('Iniciando Boot Orchestration Sequence...');
    this.transitionMode('BOOT');
    
    try {
      // 1. Executa ciclo onBoot de todos os módulos registrados na ordem de prioridade
      await this._executeLifecycleStage('onBoot');
      
      // 2. Transiciona para sincronização e ativação do Runtime
      this.runtime.active = true;
      this.telemetry.bootTime = Date.now() - this._initTime;
      
      this.transitionMode('NORMAL');
      await this._executeLifecycleStage('onReady');
      
      this.trace(`Sistema SENTINEL online e estável. Tempo de Boot: ${this.telemetry.bootTime}ms`);
      this.emit('runtime:ready', { bootTime: this.telemetry.bootTime });
    } catch (error) {
      this.trace(`Falha crítica na sequência de boot: ${error.message}`, 'CRITICAL');
      this.enterEmergencyMode('BOOT_FAILURE', error);
    }
  }

  async _executeLifecycleStage(stageName) {
    // Ordem estrita de execução baseada no orçamento de prioridade de governança
    const order = ['critical', 'high', 'normal', 'background'];
    
    for (const tier of order) {
      const moduleNames = this.priorities[tier];
      for (const name of moduleNames) {
        const module = this.modules.get(name);
        if (module && typeof module[stageName] === 'function') {
          try {
            await module[stageName]();
          } catch (err) {
            this.trace(`Erro no ciclo [${stageName}] do módulo [${name}]: ${err.message}`, 'ERROR');
            this.handleModuleFault(name, err);
          }
        }
      }
    }
  }

  async suspend() {
    this.trace('Iniciando suspensão controlada do Runtime...');
    this.transitionMode('LOW_POWER');
    await this._executeLifecycleStage('onSuspend');
    this.emit('runtime:suspended', {});
  }

  async wake() {
    this.trace('Iniciando Wake-up Sequence...');
    this.transitionMode('NORMAL');
    await this._executeLifecycleStage('onWake');
    this.emit('runtime:woken', {});
  }

  async shutdown() {
    this.trace('Desligamento ordenado do sistema solicitado.', 'WARN');
    this.transitionMode('SHUTDOWN');
    await this._executeLifecycleStage('onShutdown');
    this.runtime.active = false;
    this.trace('Runtime encerrado com sucesso.');
    this.emit('runtime:shutdown', {});
  }

  // ==========================================================================
  // 4. RUNTIME MODE ENGINE
  // ==========================================================================

  setMode(mode) {
    if (this.runtime.mode === mode) return;
    this.transitionMode(mode);
  }

  transitionMode(toMode) {
    const fromMode = this.runtime.mode;
    this.runtime.previousMode = fromMode;
    this.runtime.mode = toMode;
    
    this.telemetry.modeHistory.push({
      from: fromMode,
      to: toMode,
      timestamp: Date.now()
    });

    if (this.telemetry.modeHistory.length > 50) {
      this.telemetry.modeHistory.shift(); // Evita estouro de memória na telemetria
    }

    this.trace(`Transição de Estado Operacional: [${fromMode}] ──> [${toMode}]`);
    this.emit('runtime:mode_change', { from: fromMode, to: toMode });
    
    // Sincroniza perfis de energia padrão baseados nos modos soberanos do sistema
    this._adaptEnergyProfileToMode(toMode);
  }

  rollbackMode() {
    if (this.runtime.previousMode) {
      this.transitionMode(this.runtime.previousMode);
    }
  }

  _adaptEnergyProfileToMode(mode) {
    switch (mode) {
      case 'XR':
        this.runtime.powerProfile = 'ULTRA_XR';
        this.runtime.energyBudget = 100;
        break;
      case 'LOW_POWER':
        this.runtime.powerProfile = 'LOW_POWER';
        this.runtime.energyBudget = 40;
        break;
      case 'DEEPFLOW':
      case 'FOCUS':
        this.runtime.powerProfile = 'BALANCED';
        this.runtime.energyBudget = 75;
        break;
      case 'SAFE_MODE':
        this.runtime.powerProfile = 'LOW_POWER';
        this.runtime.energyBudget = 25;
        break;
      default:
        this.runtime.powerProfile = 'BALANCED';
        this.runtime.energyBudget = 100;
    }
  }

  // ==========================================================================
  // 6. RUNTIME HEALTH SYSTEM & 17. ADAPTIVE ENERGY
  // ==========================================================================

  updateHealth(metrics = {}) {
    // Mesclagem de métricas de hardware enviadas pelos subsistemas coletores
    this.health.fps = typeof metrics.fps === 'number' ? metrics.fps : this.health.fps;
    this.health.gpuPressure = typeof metrics.gpuPressure === 'number' ? metrics.gpuPressure : this.health.gpuPressure;
    this.health.memoryUsage = typeof metrics.memoryUsage === 'number' ? metrics.memoryUsage : this.health.memoryUsage;
    this.health.thermal = typeof metrics.thermal === 'number' ? metrics.thermal : this.health.thermal;

    this.evaluateSystemPressure();
  }

  evaluateSystemPressure() {
    // Proteção térmica adaptativa
    if (this.health.thermal > 85) {
      this.runtime.coolingState = 'CRITICAL';
      if (this.runtime.mode !== 'SAFE_MODE' && this.runtime.mode !== 'EMERGENCY') {
        this.trace('Sobrecarga térmica detectada! Forçando degradação adaptativa.', 'CRITICAL');
        this.enterEmergencyMode('THERMAL_OVERLOAD');
      }
    } else if (this.health.thermal > 65) {
      this.runtime.coolingState = 'WARNING';
      this.triggerAdaptiveDegradation('THERMAL_WARNING');
    } else {
      this.runtime.coolingState = 'NOMINAL';
    }

    // Avaliação de frames e saturação de GPU para XR
    if (this.runtime.xr.active && this.health.fps < 60) {
      this.triggerAdaptiveDegradation('XR_PERFORMANCE_DROP');
    }
  }

  triggerAdaptiveDegradation(reason) {
    if (this.health.degraded) return;
    this.health.degraded = true;
    this.trace(`Acionando orçamento em tempo de execução devido a: ${reason}`, 'WARN');
    this.emit('runtime:degradation_triggered', { reason });
    
    // Suspende preventivamente módulos não críticos de background para poupar ciclos
    this.priorities.background.forEach(name => this.suspendModule(name));
  }

  // ==========================================================================
  // 7. FAULT ISOLATION SYSTEM & 11. EMERGENCY RUNTIME LAYER
  // ==========================================================================

  handleModuleFault(name, error) {
    this.trace(`Falha detectada no módulo [${name}]: ${error.message}`, 'ERROR');
    this.telemetry.crashHistory.push({
      module: name,
      error: error.message,
      timestamp: Date.now()
    });

    if (this.priorities.critical.includes(name)) {
      this.trace(`Módulo crítico colapsou [${name}]. Impossível isolar de forma segura. Forçando modo de emergência.`, 'CRITICAL');
      this.enterEmergencyMode('CRITICAL_MODULE_COLLAPSE', error);
    } else {
      this.isolateModule(name);
    }
  }

  isolateModule(name) {
    this.trace(`Isolando comportamento do módulo: ${name}`, 'WARN');
    this.suspendModule(name);
    this.emit('module:isolated', { module: name });
    
    // Tenta recuperação automática supervisionada
    this.restartModule(name);
  }

  async restartModule(name) {
    const module = this.modules.get(name);
    if (!module) return;

    this.trace(`Tentando reinicialização a quente do módulo: ${name}`, 'WARN');
    try {
      if (typeof module.onRecover === 'function') {
        await module.onRecover();
      }
      if (typeof module.onBoot === 'function') {
        await module.onBoot();
      }
      if (typeof module.onReady === 'function') {
        await module.onReady();
      }

      // Move de volta da lista de suspensos para o fluxo normal de execução
      this.priorities.suspended = this.priorities.suspended.filter(m => m !== name);
      this.trace(`Módulo [${name}] recuperado e reintegrado com sucesso.`);
    } catch (err) {
      this.trace(`Falha na autorrecuperação do módulo [${name}]. Suspensão definitiva aplicada.`, 'CRITICAL');
      this.telemetry.crashHistory.push({
        module: name,
        error: `Recovery failed: ${err.message}`,
        timestamp: Date.now()
      });
    }
  }

  suspendModule(name) {
    const module = this.modules.get(name);
    if (module && typeof module.onSuspend === 'function') {
      try {
        module.onSuspend();
      } catch (e) {
        this.trace(`Erro ao suspender módulo ${name}: ${e.message}`, 'ERROR');
      }
    }
    
    // Sincroniza listas de prioridade
    Object.keys(this.priorities).forEach(key => {
      this.priorities[key] = this.priorities[key].filter(m => m !== name);
    });
    if (!this.priorities.suspended.includes(name)) {
      this.priorities.suspended.push(name);
    }
  }

  enterEmergencyMode(reason, rawError = null) {
    this.telemetry.recoveryCount++;
    this.transitionMode('EMERGENCY');
    this.trace(`!!! INSTABILIDADE CRÍTICA DO RUNTIME DE GOVERNANÇA: [${reason}] !!!`, 'CRITICAL');
    
    this._executeLifecycleStage('onEmergency');
    this.emit('runtime:emergency', { reason, error: rawError?.message });

    if (reason === 'BOOT_FAILURE' || reason === 'CRITICAL_MODULE_COLLAPSE') {
      this.safeShutdown();
    }
  }

  async recoverFromEmergency() {
    this.trace('Iniciando protocolo de restauração a partir do Estado de Emergência...');
    try {
      await this._executeLifecycleStage('onRecover');
      this.health.degraded = false;
      this.rollbackMode();
    } catch (error) {
      this.trace(`Falha no rollback de emergência: ${error.message}. Abortando runtime de forma segura.`, 'CRITICAL');
      this.safeShutdown();
    }
  }

  safeShutdown() {
    this.trace('Executando Safe Shutdown emergencial...', 'CRITICAL');
    this.shutdown();
  }

  // ==========================================================================
  // 8. RUNTIME TICK SYSTEM (CENTRALIZED FRAME PACING)
  // ==========================================================================

  tick(delta) {
    if (!this.runtime.active || this.runtime.mode === 'SHUTDOWN') return;

    const startTick = Date.now();

    // Execução sequencial estrita guiada por prioridade técnica eliminando temporal drift/jitter
    const operationalTiers = ['critical', 'high', 'normal', 'background'];
    
    for (const tier of operationalTiers) {
      const activeModules = this.priorities[tier];
      for (const name of activeModules) {
        const module = this.modules.get(name);
        if (module && typeof module.tick === 'function') {
          try {
            // Verifica permissão dinamicamente antes do disparo do loop
            if (this.permissions[name] !== false) {
              module.tick(delta);
            }
          } catch (error) {
            this.handleModuleFault(name, error);
          }
        }
      }
    }

    this.telemetry.frameTime = Date.now() - startTick;
  }

  // ==========================================================================
  // 9. KERNEL EVENT INTEGRATION (EVENT BUS SUPERVISOR)
  // ==========================================================================

  listen(event, callback) {
    if (!this._events.has(event)) {
      this._events.set(event, []);
    }
    this._events.get(event).push(callback);
  }

  emit(event, data = {}) {
    if (this._events.has(event)) {
      this._events.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          this.trace(`Erro ao processar listener de barramento do evento [${event}]: ${err.message}`, 'ERROR');
        }
      });
    }
  }

  trace(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const formattedLog = `[${timestamp}] [KERNEL] [${level}] ${message}`;
    
    // Encaminha para barramento sem poluir a execução técnica principal do Kernel
    if (this.permissions.telemetry) {
      this.emit('kernel:trace', { timestamp, level, message, formattedLog });
    }
    
    // Saída estruturada formatada para depuração
    if (level === 'CRITICAL' || level === 'ERROR') {
      console.error(formattedLog);
    } else if (level === 'WARN') {
      console.warn(formattedLog);
    } else {
      console.log(formattedLog);
    }
  }

  // ==========================================================================
  // 13. RUNTIME SNAPSHOT SYSTEM (COGNITIVE CONTINUITY)
  // ==========================================================================

  createSnapshot() {
    this.trace('Gerando snapshot completo do estado do Runtime...');
    
    const moduleStates = {};
    this.modules.forEach((module, name) => {
      if (typeof module.getStateSnapshot === 'function') {
        try {
          moduleStates[name] = module.getStateSnapshot();
        } catch (e) {
          this.trace(`Falha ao obter snapshot do módulo [${name}]: ${e.message}`, 'WARN');
        }
      }
    });

    return {
      timestamp: Date.now(),
      runtime: JSON.parse(JSON.stringify(this.runtime)),
      health: JSON.parse(JSON.stringify(this.health)),
      permissions: JSON.parse(JSON.stringify(this.permissions)),
      priorities: JSON.parse(JSON.stringify(this.priorities)),
      moduleStates
    };
  }

  restoreSnapshot(snapshot) {
    if (!snapshot || !snapshot.runtime) {
      this.trace('Falha ao restaurar snapshot: Dados inválidos ou corrompidos.', 'ERROR');
      return false;
    }

    this.trace('Iniciando restauração de estado e continuidade cognitiva...');
    
    this.runtime = snapshot.runtime;
    this.health = snapshot.health;
    this.permissions = snapshot.permissions;
    this.priorities = snapshot.priorities;

    // Repassa estados individuais salvos para os módulos nativos compatíveis
    Object.keys(snapshot.moduleStates).forEach(name => {
      const module = this.modules.get(name);
      if (module && typeof module.restoreStateSnapshot === 'function') {
        try {
          module.restoreStateSnapshot(snapshot.moduleStates[name]);
        } catch (e) {
          this.trace(`Erro ao restaurar estado no módulo [${name}]: ${e.message}`, 'ERROR');
        }
      }
    });

    this.trace('Estado do ecossistema sincronizado com sucesso.');
    this.emit('runtime:snapshot_restored', { timestamp: snapshot.timestamp });
    return true;
  }

  // ==========================================================================
  // 18. KERNEL SECURITY LAYER
  // ==========================================================================

  validateModule(name, module) {
    if (!module) {
      throw new Error(`[SECURITY] Assinatura nula de módulo para o registro: ${name}`);
    }

    // 14. Module Capability System - Garantia estrutural de mapeamento de capacidades
    if (!Array.isArray(module.capabilities)) {
      this.trace(`Aviso de Segurança: Módulo [${name}] não declara array de 'capabilities'. Assumindo nulo.`, 'WARN');
      module.capabilities = [];
    }

    // Validação de ciclo de vida básico estrutural exigido para coexistência no ecossistema
    const validInterfaces = ['onBoot', 'onReady', 'onSuspend', 'onWake', 'onShutdown', 'onEmergency', 'onRecover', 'tick'];
    const implementationCount = validInterfaces.filter(method => typeof module[method] === 'function').length;

    if (implementationCount === 0) {
      throw new Error(`[SECURITY] Violação de Arquitetura: Módulo [${name}] não implementa nenhuma interface de ciclo de vida SENTINEL.`);
    }
  }

  verifyRuntimeIntegrity() {
    this.trace('Iniciando verificação de integridade operacional criptográfica...');
    let healthy = true;

    this.modules.forEach((module, name) => {
      if (typeof module.verifyIntegrity === 'function') {
        if (!module.verifyIntegrity()) {
          this.trace(`Módulo falhou no teste de integridade em tempo de execução: ${name}`, 'ERROR');
          this.handleModuleFault(name, new Error('Integrity check failed.'));
          healthy = false;
        }
      }
    });

    this.emit('security:integrity_checked', { healthy });
    return healthy;
  }
}

// Exportação nativa e única do ecossistema do Runtime
export default new SentinelKernel();