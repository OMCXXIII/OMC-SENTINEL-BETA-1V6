/**
 * ============================================================================
 * SENTINEL CORE RUNTIME ARCHITECTURE
 * Module: sentinel-scheduler.js
 * Role: Cognitive Temporal Runtime Orchestrator (Temporal Sovereignty Engine)
 * Design Aesthetic: High-Precision Hard Real-Time Determinism
 * ============================================================================
 */

// 2. PRIORITY ENGINE (Enumeração Soberana de Prioridades)
const PRIORITY = {
  CRITICAL:   'CRITICAL',   // XR Tracking, Core Synchronizer (Não degradável)
  REALTIME:   'REALTIME',   // Frame Pacing, Audio Synth, Motion Prediction
  HIGH:       'HIGH',       // Attention Engine, HUD Priority Layouts
  NORMAL:     'NORMAL',     // Default Processing, UI Updates
  BACKGROUND: 'BACKGROUND', // Telemetry Streaming, L2/L3 Memory Synchronization
  IDLE:       'IDLE',       // Ambient FX, Particle Rebuild, Cache Maintenance
  SUSPENDED:  'SUSPENDED'   // Tarefas temporariamente removidas do pipeline ativo
};

class SentinelScheduler {
  constructor() {
    // 1. TASK REGISTRY
    this.tasks = new Map();

    // 3. EXECUTION QUEUES
    this.queues = {
      critical:   [],
      realtime:   [],
      high:       [],
      normal:     [],
      background: [],
      idle:       []
    };

    // 4. FRAME BUDGET SYSTEM (Rígido para 60fps/72fps)
    this.frameBudget = {
      targetFPS: 60,
      frameTime: 16.666, // Milissegundos normativos por frame
      used: 0.0,
      remaining: 16.666
    };

    // 7. XR TIMING LAYER
    this.xr = {
      targetFPS: 72,
      reprojection: false,
      framePacing: true,
      latency: 0.0,
      trackingBudget: 4.0 // Alocação estrita em ms exclusivamente para tracking espacial
    };

    // 11. DEFERRED TASK SYSTEM & 12. IDLE EXECUTION SYSTEM
    this.deferredQueue = [];
    this.idleQueue = [];

    // 14. THERMAL MITIGATION SYSTEM & 15. RESOURCE ARBITRATION
    this.thermalLevel = 0; // 0 (Nominal) a 100 (Crítico)
    this.coolingRequired = false;

    // 16. EXECUTION DOMAINS
    this.domains = {
      xr: [], render: [], cognition: [], telemetry: [], audio: [], diagnostics: []
    };

    // 17. EXECUTION GRAPH (Grafo Relacional de Dependências Técnicas)
    this.executionGraph = new Map();

    // 19. EXECUTION LOCKING
    this.lockedTasks = new Set();

    // 22. TELEMETRY LAYER
    this.metrics = {
      taskExecutionTime: {},
      frameCost: 0.0,
      missedDeadlines: 0,
      suspendedTasks: 0,
      degradedFrames: 0
    };

    // Estado operacional do orquestrador temporal
    this.isActive = true;
    this.currentModeProfile = 'NORMAL';

    // Referência do Kernel (Injetada no ciclo de boot do ecossistema)
    this.kernel = null;

    this._initializeNativeScheduler();
  }

  // ==========================================================================
  // INJEÇÃO DE DEPENDÊNCIA DO KERNEL CENTRAL
  // ==========================================================================
  
  initKernelContext(kernelInstance) {
    this.kernel = kernelInstance;
    this.trace('Contexto do Kernel Central injetado com sucesso no módulo Scheduler.');
  }

  // ==========================================================================
  // MODULE LIFECYCLE INTERFACES (Compatibilidade com SentinelKernel)
  // ==========================================================================

  onBoot() {
    this.isActive = true;
    this.trace('Estágio de Ciclo de Vida: onBoot concluído.');
  }

  onReady() {
    this.applyModeProfile('NORMAL');
    this.trace('Estágio de Ciclo de Vida: onReady concluído. Engine em execução nominal.');
  }

  onSuspend() {
    this.isActive = false;
    this.trace('Estágio de Ciclo de Vida: onSuspend. Pipeline de agendamento paralisado.', 'WARN');
  }

  onWake() {
    this.isActive = true;
    this.trace('Estágio de Ciclo de Vida: onWake. Reativando pipeline.');
  }

  onShutdown() {
    this.isActive = false;
    this.tasks.clear();
    Object.keys(this.queues).forEach(k => this.queues[k] = []);
    this.trace('Estágio de Ciclo de Vida: onShutdown. Estado limpo.');
  }

  onEmergency() {
    this.trace('Estágio de Ciclo de Vida: onEmergency disparado. Forçando contenção de danos.', 'CRITICAL');
    this.applyModeProfile('SAFE_MODE');
  }

  onRecover() {
    this.trace('Estágio de Ciclo de Vida: onRecover executado. Restaurando integridade operacional.');
    return true;
  }

  // ==========================================================================
  // 1. TASK REGISTRY
  // ==========================================================================

  registerTask(name, config) {
    if (!config || typeof config.execute !== 'function') {
      throw new Error(`[SCHEDULER] Violação: Assinatura de execução ausente na tarefa [${name}].`);
    }

    const taskEntry = {
      id:              name,
      priority:        config.priority || PRIORITY.NORMAL,
      budget:          config.budget || 2.0, // Orçamento máximo alvo em ms
      interval:        config.interval || 0, // 0 significa execução contínua a cada tick
      critical:        !!config.critical,
      realtime:        !!config.realtime,
      suspendable:     config.suspendable !== false,
      xrSafe:          !!config.xrSafe,
      domain:          config.domain || 'render',
      execute:         config.execute,
      onSuspend:       config.onSuspend || null,
      onResume:        config.onResume || null,
      onDeadlineMiss:  config.onDeadlineMiss || null,
      _lastExecuted:   0,
      // 10. ATTENTION-AWARE EXECUTION
      attentionWeight: config.attentionWeight || 1.0,
      focusSensitive:  !!config.focusSensitive,
      peripheral:      !!config.peripheral
    };

    this.tasks.set(name, taskEntry);
    
    // Aloca no domínio correspondente
    if (this.domains[taskEntry.domain]) {
      this.domains[taskEntry.domain].push(name);
    }

    this._rebuildPriorityQueues();
    this.traceTask(name, 'REGISTRADA');
  }

  removeTask(name) {
    if (this.tasks.has(name)) {
      this.tasks.delete(name);
      Object.keys(this.domains).forEach(d => this.domains[d] = this.domains[d].filter(t => t !== name));
      this._rebuildPriorityQueues();
      return true;
    }
    return false;
  }

  // ==========================================================================
  // 5. TICK PIPELINE (Coração Temporal)
  // ==========================================================================

  tick(delta) {
    if (!this.isActive) return;

    const frameStart = performance.now();
    this.syncClocks();
    this._calculateFrameBudget();

    // 1. Executa Camada Crítica Absoluta (Sem limites de frame overrun)
    this._executeQueueSequence(this.queues.critical, frameStart, true);

    // 2. Executa Filas de Alta Prioridade e Realtime dentro do Budget Restante
    this._executeQueueSequence(this.queues.realtime, frameStart);
    this._executeQueueSequence(this.queues.high, frameStart);
    this._executeQueueSequence(this.queues.normal, frameStart);

    // 3. Processamento de Background e Deferidos se houver margem de tempo
    if (this._getRemainingBudget(frameStart) > 2.0) {
      this._executeQueueSequence(this.queues.background, frameStart);
      this._processDeferredTasks(frameStart);
    }

    // 4. Executa Ciclo Idle em caso de estabilidade total do Frame
    if (this._getRemainingBudget(frameStart) > 4.0 && !this.coolingRequired) {
      this._executeQueueSequence(this.queues.idle, frameStart);
      this._processIdleQueue(frameStart);
    }

    // 25. FRAME PACING ENGINE - Sincronização e Estabilização Final do Frame
    this.paceFrames(frameStart);
  }

  _executeQueueSequence(queue, frameStart, bypassBudget = false) {
    const now = Date.now();

    for (const taskId of queue) {
      if (this.lockedTasks.has(taskId)) continue;

      const task = this.tasks.get(taskId);
      if (!task) continue;

      // Validação de intervalo temporal por frame rate adaptativo
      if (task.interval > 0 && now - task._lastExecuted < task.interval) {
        continue;
      }

      // 6. DEADLINE SYSTEM & 15. RESOURCE ARBITRATION
      if (!bypassBudget && this._getRemainingBudget(frameStart) <= 0) {
        this.metrics.missedDeadlines++;
        if (typeof task.onDeadlineMiss === 'function') {
          task.onDeadlineMiss();
        }
        this.triggerAdaptiveDegradation();
        break; // Estol de frame detectado. Aborta execução secundária imediatamente.
      }

      // 18. TASK DEPENDENCY RESOLUTION
      if (!this.resolveDependencies(taskId)) {
        continue; // Dependências técnicas pendentes, ignora execução neste passo
      }

      this.safeExecute(taskId);
      task._lastExecuted = now;
    }
  }

  // ==========================================================================
  // 27. SAFETY EXECUTION LAYER (Isolamento Absoluto de Loops)
  // ==========================================================================

  safeExecute(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    this.lockTask(taskId);
    const startExecution = performance.now();

    try {
      task.execute(this.clock);
    } catch (error) {
      this.trace(`Colapso de execução na tarefa [${taskId}]: ${error.message}`, 'ERROR');
      this.recoverScheduler(taskId);
    } finally {
      const executionTime = performance.now() - startExecution;
      this.metrics.taskExecutionTime[taskId] = executionTime;

      // Monitoramento de Task Overrun individual
      if (executionTime > task.budget && task.priority !== PRIORITY.CRITICAL) {
        this.trace(`Tarefa [${taskId}] estourou seu orçamento operacional individual. Gasto: ${executionTime.toFixed(2)}ms / Alocado: ${task.budget}ms`, 'WARN');
      }

      this.unlockTask(taskId);
    }
  }

  // ==========================================================================
  // 13. ADAPTIVE DEGRADATION ENGINE & 14. THERMAL MITIGATION System
  // ==========================================================================

  triggerAdaptiveDegradation() {
    this.metrics.degradedFrames++;
    this.trace('Saturação de orçamento de frame! Iniciando degradação seletiva.', 'WARN');

    // Mitigação Inteligente: Suspende automaticamente o domínio completo de Telemetria e Interface Efêmera
    this.suspendGroup('telemetry');
    this.suspendGroup('audio', true); // Passa flag soft degradation para o domínio de áudio
    
    // Notifica o Kernel Central sobre a perda de performance para orquestração global
    if (this.kernel) {
      this.kernel.updateHealth({ fps: this.frameBudget.targetFPS - 5 });
    }
  }

  updateThermalLevel(level) {
    this.thermalLevel = level;
    this.coolingRequired = level > 75;

    if (this.coolingRequired) {
      this.trace(`Alerta Térmico Avançado [Nível: ${level}%]. Estrangulando intervalos de execução.`, 'WARN');
      // Dobra o intervalo de amostragem de tarefas não críticas para reduzir pressão em CPU/GPU
      this.tasks.forEach(task => {
        if (!task.critical && task.priority !== PRIORITY.REALTIME) {
          task.interval = task.interval === 0 ? 33 : task.interval * 2;
        }
      });
    }

    if (this.kernel) {
      this.kernel.updateHealth({ thermal: level });
    }
  }

  // ==========================================================================
  // 8. TASK SUSPENSION SYSTEM & 9. COGNITIVE PRIORITY LAYER
  // ==========================================================================

  suspendTask(name) {
    const task = this.tasks.get(name);
    if (task && task.suspendable && task.priority !== PRIORITY.SUSPENDED) {
      task.priority = PRIORITY.SUSPENDED;
      this.metrics.suspendedTasks++;
      if (typeof task.onSuspend === 'function') task.onSuspend();
      this._rebuildPriorityQueues();
      this.trace(`Tarefa [${name}] suspensa do pipeline por governança.`, 'WARN');
    }
  }

  resumeTask(name) {
    const task = this.tasks.get(name);
    if (task && task.priority === PRIORITY.SUSPENDED) {
      task.priority = task.critical ? PRIORITY.CRITICAL : PRIORITY.NORMAL;
      if (typeof task.onResume === 'function') task.onResume();
      this._rebuildPriorityQueues();
      this.trace(`Tarefa [${name}] restabelecida e reintegrada.`);
    }
  }

  suspendGroup(domainName, softMode = false) {
    const tasksInDomain = this.domains[domainName] || [];
    tasksInDomain.forEach(taskId => {
      const task = this.tasks.get(taskId);
      if (task && !task.critical) {
        if (softMode) {
          task.interval = task.interval === 0 ? 66 : task.interval * 1.5; // Reduz a frequência sem desligar
        } else {
          this.suspendTask(taskId);
        }
      }
    });
  }

  // 9. COGNITIVE PRIORITY LAYER & 10. ATTENTION-AWARE EXECUTION
  cognitivePriority(taskId, weightFactor) {
    const task = this.tasks.get(taskId);
    if (task && task.focusSensitive) {
      // Ajusta dinamicamente os parâmetros com base na proximidade do alvo de foco cognitivo
      task.attentionWeight = weightFactor;
      task.budget = task.budget * weightFactor;
      if (weightFactor < 0.3 && task.peripheral) {
        this.suspendTask(taskId); // Desliga se estiver completamente na periferia cognitiva
      } else if (weightFactor >= 0.3 && task.priority === PRIORITY.SUSPENDED) {
        this.resumeTask(taskId);
      }
    }
  }

  // ==========================================================================
  // 17. EXECUTION GRAPH & INTER-TASK DEPENDENCY
  // ==========================================================================

  defineDependency(taskName, dependsOnArray) {
    this.executionGraph.set(taskName, dependsOnArray);
  }

  resolveDependencies(taskId) {
    if (!this.executionGraph.has(taskId)) return true;

    const prerequisites = this.executionGraph.get(taskId);
    for (const prereqId of prerequisites) {
      const prereqTask = this.tasks.get(prereqId);
      // Se a dependência direta estiver suspensa ou travada, impede a execução da tarefa dependente
      if (prereqTask && prereqTask.priority === PRIORITY.SUSPENDED) {
        return false;
      }
    }
    return true;
  }

  // ==========================================================================
  // 11. DEFERRED QUEUE & 12. IDLE QUEUE MANAGEMENT
  // ==========================================================================

  deferTask(fn) {
    this.deferredQueue.push(fn);
  }

  addIdleTask(fn) {
    this.idleQueue.push(fn);
  }

  _processDeferredTasks(frameStart) {
    while (this.deferredQueue.length > 0 && this._getRemainingBudget(frameStart) > 1.5) {
      const deferredFn = this.deferredQueue.shift();
      try { deferredFn(); } catch (e) { this.trace(`Erro em bloco diferido: ${e.message}`, 'ERROR'); }
    }
  }

  _processIdleQueue(frameStart) {
    while (this.idleQueue.length > 0 && this._getRemainingBudget(frameStart) > 2.0) {
      const idleFn = this.idleQueue.shift();
      try { idleFn(); } catch (e) { this.trace(`Erro em bloco ocioso (Idle): ${e.message}`, 'ERROR'); }
    }
  }

  // ==========================================================================
  // 24. RECOVERY EXECUTION ENGINE
  // ==========================================================================

  recoverScheduler(taskId) {
    this.trace(`Iniciando protocolo de contenção física para: [${taskId}]`, 'WARN');
    this.unlockTask(taskId);
    
    const task = this.tasks.get(taskId);
    if (task && task.critical) {
      this.trace(`Falha em tarefa crítica sistêmica [${taskId}]. Acionando Failsafe do Core Runtime.`, 'CRITICAL');
      
      // Tenta acionar a recuperação através da instância acoplada do Kernel primeiro
      if (this.kernel) {
        this.kernel.handleModuleFault('sentinel-scheduler', new Error(`Colapso na tarefa crítica: ${taskId}`));
      } else if (typeof window.SentinelCore !== 'undefined' && typeof window.SentinelCore.recover === 'function') {
        window.SentinelCore.recover();
      }
    } else {
      // Isola e desativa a tarefa rebelde para estabilizar o scheduler de forma segura
      this.suspendTask(taskId);
    }
  }

  // ==========================================================================
  // 25. FRAME PACING ENGINE & TIMING ARCHITECTURE
  // ==========================================================================

  _calculateFrameBudget() {
    const isXRActive = typeof window.StateStore !== 'undefined' && window.StateStore.get('ui.mode') === 'XR';
    this.frameBudget.targetFPS = isXRActive ? this.xr.targetFPS : 60;
    this.frameBudget.frameTime = 1000 / this.frameBudget.targetFPS;
  }

  _getRemainingBudget(frameStart) {
    const elapsed = performance.now() - frameStart;
    return this.frameBudget.frameTime - elapsed;
  }

  paceFrames(frameStart) {
    const elapsed = performance.now() - frameStart;
    this.frameBudget.used = elapsed;
    this.frameBudget.remaining = this.frameBudget.frameTime - elapsed;
    this.metrics.frameCost = elapsed;

    // Emite as métricas consolidadas diretamente ao Barramento Central
    if (this.clock.frame % 60 === 0 && typeof window.SentinelBus !== 'undefined') {
      window.SentinelBus.emit('scheduler:metrics', {
        frameCost: `${elapsed.toFixed(2)}ms`,
        remainingBudget: `${this.frameBudget.remaining.toFixed(2)}ms`,
        missedDeadlines: this.metrics.missedDeadlines,
        activeTasks: this.tasks.size - this.metrics.suspendedTasks
      });
    }
  }

  syncClocks() {
    if (typeof window.SentinelCore !== 'undefined' && window.SentinelCore.clock) {
      this.clock = window.SentinelCore.clock;
    } else {
      // Fallback em caso de inicialização desacoplada isolada
      if (!this.clock) this.clock = { delta: 0.016, elapsed: 0, frame: 0 };
      this.clock.frame++;
      this.clock.elapsed += 0.016;
    }
  }

  // ==========================================================================
  // 29. MODE-AWARE SCHEDULING (Perfis Adaptativos Globais)
  // ==========================================================================

  applyModeProfile(mode) {
    this.currentModeProfile = mode;
    this.trace(`Aplicando perfil adaptativo de agendamento: [${mode}]`);

    switch (mode) {
      case 'LOW_POWER':
        this.suspendGroup('telemetry');
        this.suspendGroup('diagnostics');
        break;
      case 'XR':
        this._calculateFrameBudget();
        this.resumeTask('xr-spatial-tracking');
        break;
      case 'SAFE_MODE':
        this.tasks.forEach((task, id) => {
          if (!task.critical) this.suspendTask(id);
        });
        break;
      default:
        // Restaura todas as tarefas suspensas normativas
        this.tasks.forEach((task, id) => {
          if (task.priority === PRIORITY.SUSPENDED && task.critical) this.resumeTask(id);
        });
    }
  }

  // ==========================================================================
  // MODULE SNAPSHOTS (Implementação Sincronizada para o Kernel)
  // ==========================================================================

  getStateSnapshot() {
    return this.snapshotExecutionState();
  }

  restoreStateSnapshot(snapshot) {
    this.restoreExecutionState(snapshot);
  }

  verifyIntegrity() {
    // Verificação de consistência interna das filas estruturais
    return this.tasks instanceof Map && typeof this.queues === 'object';
  }

  // ==========================================================================
  // AUXILIARY UTILITIES & MUTEX LOCKS
  // ==========================================================================

  lockTask(taskId)   { this.lockedTasks.add(taskId); }
  unlockTask(taskId) { this.lockedTasks.delete(taskId); }

  _rebuildPriorityQueues() {
    // Reseta todos os arrays de execução
    Object.keys(this.queues).forEach(k => this.queues[k] = []);

    this.tasks.forEach((task, name) => {
      switch (task.priority) {
        case PRIORITY.CRITICAL:   this.queues.critical.push(name);   break;
        case PRIORITY.REALTIME:   this.queues.realtime.push(name);   break;
        case PRIORITY.HIGH:       this.queues.high.push(name);       break;
        case PRIORITY.NORMAL:     this.queues.normal.push(name);     break;
        case PRIORITY.BACKGROUND: this.queues.background.push(name); break;
        case PRIORITY.IDLE:       this.queues.idle.push(name);       break;
      }
    });
  }

  snapshotExecutionState() {
    const serializedTasks = {};
    this.tasks.forEach((t, id) => {
      serializedTasks[id] = { priority: t.priority, interval: t.interval };
    });
    return {
      currentModeProfile: this.currentModeProfile,
      tasks: serializedTasks,
      timestamp: Date.now()
    };
  }

  restoreExecutionState(snapshot) {
    if (!snapshot || !snapshot.tasks) return;
    this.currentModeProfile = snapshot.currentModeProfile;
    Object.keys(snapshot.tasks).forEach(id => {
      const task = this.tasks.get(id);
      if (task) {
        task.priority = snapshot.tasks[id].priority;
        task.interval = snapshot.tasks[id].interval;
      }
    });
    this._rebuildPriorityQueues();
  }

  traceTask(name, lifecycleStage) {
    this.trace(`[TASK] Módulo [${name}] chaveado para estágio: ${lifecycleStage}`);
  }

  trace(message, level = 'INFO') {
    const formatted = `[${new Date().toISOString()}] [SCHEDULER] [${level}] ${message}`;
    if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
    else if (level === 'WARN') console.warn(formatted);
    else console.log(formatted);
  }

  _initializeNativeScheduler() {
    // Declaração de capacidades para acoplamento seguro com o Kernel
    this.capabilities = ['temporal_orchestration', 'frame_pacing', 'cognitive_priority'];

    // Registra o loop nativo essencial de Tracking Espacial XR (Crítico e Não Degradável)
    this.registerTask('xr-spatial-tracking', {
      priority: PRIORITY.CRITICAL,
      budget: 3.0,
      critical: true,
      realtime: true,
      domain: 'xr',
      execute: () => {
        if (typeof window.StateStore !== 'undefined') {
          window.StateStore.set('telemetry.lastInput', Date.now());
        }
      }
    });

    // Registra a sincronização de estados L1/L2 com o StateStore
    this.registerTask('core-memory-flush', {
      priority: PRIORITY.BACKGROUND,
      budget: 1.5,
      interval: 1000, // Executa rigidamente apenas uma vez por segundo
      domain: 'telemetry',
      execute: () => {
        if (typeof window.StateStore !== 'undefined' && typeof window.StateStore.snapshot === 'function') {
          this.trace('Executando flush preventivo de telemetria em L2...', 'INFO');
        }
      }
    });
  }
}

// Vinculação e instância única na janela de escopo global
const SovereignScheduler = new SentinelScheduler();
window.SentinelScheduler = SovereignScheduler;

export default SovereignScheduler;
