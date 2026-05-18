/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE TEMPORAL RUNTIME OPERATING SCHEDULER
 * Arquivo: sentinel-scheduler.js
 * Papel: Sistema Operacional Temporal, Controle de Frame-Budget e Escalonamento
 * Governança: Subordinado ao SovereignKernel; governa o batimento do SentinelBus.
 * Fix: Implementação de Priority Queues Estritas, Frame Budgets Dinâmicos,
 * Execução Térmica Adaptativa, Tarefas com Deadline e XR Frame Safe Clocks.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// A) PRIORITY EXECUTION: Enumeração Estrita e Congelada de Prioridades Temporais
export const TASK_PRIORITIES = Object.freeze({
    CRITICAL:   'CRITICAL',   // Rastreamento Inercial XR, Predição de Pose Ocular (Imediato, Hard RT)
    FOCUS:      'FOCUS',      // Atualizações foveais, Geometrias de Atenção do HUD Principal
    BACKGROUND: 'BACKGROUND', // Flush de Memória L1/L2, Coleta de Telemetria Passiva
    IDLE:       'IDLE'        // Efeitos visuais secundários, manutenção de cache de partículas
});

class SentinelTemporalScheduler {
    constructor() {
        this.version = "9.0-TEMPORAL-OS";
        this.isActive = false;
        
        // H) QUEUE SEGMENTATION (Isolamento Estanque por Filas Dedicadas)
        this._queues = {
            [TASK_PRIORITIES.CRITICAL]:   new Map(),
            [TASK_PRIORITIES.FOCUS]:      new Map(),
            [TASK_PRIORITIES.BACKGROUND]: new Map(),
            [TASK_PRIORITIES.IDLE]:       new Map()
        };

        // D) TASK SUSPENSION (Coleção de IDs temporariamente congelados)
        this._suspendedTasks = new Set();

        // B) FRAME BUDGET CONTROLLER & G) XR FRAME SAFE CONFIGURATION
        this.budget = {
            targetFPS: 90,                  // Alvo normativo estável para evitar cinetose em XR
            nominalFrameTimeMs: 11.11,      // Janela estrita por quadro (1000ms / 90)
            allocatedCpuBudgetMs: 5.5,      // Teto máximo de CPU reservado estritamente para o Scheduler
            lastFrameTimestamp: performance.now(),
            currentFrameDelta: 0.0
        };

        // F) THERMAL AWARE EXECUTION METRICS
        this.thermalProfile = {
            state: 'NOMINAL',               // NOMINAL, ELEVATED, CRITICAL
            throttlingMultiplier: 1.0       // Fator de compressão do tempo alocado por quadro
        };

        this.bus = null;
        this._rafId = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // NOVO CORE MANAGEMENT DA INFRAESTRUTURA DE TAREFAS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Insere ou atualiza um contrato de execução temporal (Task) no Ecossistema
     */
    registerTask(id, config = {}) {
        const priority = config.priority || TASK_PRIORITIES.FOCUS;
        if (!this._queues[priority]) {
            throw new Error(`[SCHEDULER] Prioridade de tarefa ilegal fornecida: ${priority}`);
        }

        const taskEntry = {
            id,
            execute: config.execute,
            priority,
            // E) DEADLINE EXECUTION (Tempo máximo em ms tolerado antes do estouro de contrato)
            deadline: config.deadline || null,
            registeredAt: performance.now(),
            lastExecutedAt: 0,
            executionCount: 0,
            executionTimeHistory: [] // Telemetria de custo em microssegundos para análise preditiva
        };

        this._queues[priority].set(id, taskEntry);
        this._trace('REGISTRY', `Tarefa alocada com sucesso: [${id}] na fila [${priority}]`);
    }

    unregisterTask(id) {
        for (const priority of Object.keys(this._queues)) {
            if (this._queues[priority].has(id)) {
                this._queues[priority].delete(id);
                this._suspendedTasks.delete(id);
                return true;
            }
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // D) TASK SUSPENSION & RECOVERY CONTRACTS
    // ═══════════════════════════════════════════════════════════════════════
    suspendTask(id) {
        this._suspendedTasks.add(id);
        this._trace('SUSPENSION', `Tarefa temporariamente retirada da thread ativa: [${id}]`);
    }

    resumeTask(id) {
        this._suspendedTasks.delete(id);
        this._trace('SUSPENSION', `Tarefa reintroduzida no pipeline de despacho: [${id}]`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // B) MOTOR DE LOOP PRINCIPAL E EXECUÇÃO DO FRAME BUDGET
    // ═══════════════════════════════════════════════════════════════════════
    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.budget.lastFrameTimestamp = performance.now();
        
        // Acopla o loop temporal ao batimento nativo do ciclo de quadros
        const loop = (timestamp) => {
            if (!this.isActive) return;
            this._processFrame(timestamp);
            this._rafId = requestAnimationFrame(loop);
        };
        this._rafId = requestAnimationFrame(loop);
        this._trace('LIFECYCLE', 'Clock de processamento cooperativo ativado em 90Hz.');
    }

    stop() {
        this.isActive = false;
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this._trace('LIFECYCLE', 'Clock de processamento cooperativo suspenso de forma limpa.');
    }

    _processFrame(timestamp) {
        const frameStart = performance.now();
        this.budget.currentFrameDelta = frameStart - this.budget.lastFrameTimestamp;
        this.budget.lastFrameTimestamp = frameStart;

        // F) THERMAL AWARE EXECUTION: Adapta dinamicamente o orçamento disponível com base no silício
        const runtimeBudget = this.budget.allocatedCpuBudgetMs * this.thermalProfile.throttlingMultiplier;

        // 1. Execução de Prioridade Absoluta (CRITICAL) - Bypass total de orçamento temporal
        this._exhaustQueue(TASK_PRIORITIES.CRITICAL, frameStart, Number.MAX_SAFE_INTEGER);

        // 2. Execução de Prioridade Foveal (FOCUS) - Consome orçamento até o teto runtimeBudget
        const timeSpentAfterFocus = this._exhaustQueue(TASK_PRIORITIES.FOCUS, frameStart, runtimeBudget);
        
        // 3. Execução de Processos Secundários (BACKGROUND) se ainda houver resíduo de tempo
        const finalCpuTimeSpent = this._exhaustQueue(TASK_PRIORITIES.BACKGROUND, frameStart, runtimeBudget);

        // C) IDLE EXECUTION: Ativa rotinas cosméticas apenas se o frame atual estiver sob folga extrema
        const currentElapsed = performance.now() - frameStart;
        if (currentElapsed < runtimeBudget) {
            const idleDeadline = runtimeBudget - currentElapsed;
            this._executeIdleTasks(idleDeadline);
        }

        // Governa o batimento nervoso do barramento central de forma sincronizada pós-cálculos
        if (window.SentinelBus && typeof window.SentinelBus.dispatchFrame === 'function') {
            window.SentinelBus.dispatchFrame();
        }
    }

    /**
     * Consome de forma ordenada e sequencial as tarefas acopladas a uma fila específica
     */
    _exhaustQueue(priority, frameStart, maxBudgetMs) {
        const queue = this._queues[priority];
        if (queue.size === 0) return performance.now() - frameStart;

        for (const [id, task] of queue.entries()) {
            // Ignora processamento se a tarefa estiver suspensa de forma explícita
            if (this._suspendedTasks.has(id)) continue;

            const now = performance.now();
            const elapsedSinceFrameStart = now - frameStart;

            // Interrompe o processamento da fila imediatamente caso o orçamento estrito expire
            if (elapsedSinceFrameStart >= maxBudgetMs) {
                // E) DEADLINE CHECK: Se uma tarefa estourar seu teto crítico de vida, força bypass de segurança
                if (task.deadline && (now - task.registeredAt) > task.deadline) {
                    this._trace('DEADLINE_VIOLATION', `Tarefa [${task.id}] violou contrato vertical de tempo limite. Forçando injeção paralela.`, 'WARN');
                    this._runTaskSecurely(task);
                }
                break;
            }

            this._runTaskSecurely(task);
        }

        return performance.now() - frameStart;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // C) IDLE EXECUTION SLOTS (INTERVADOS DE OCIOSIDADE DO PROCESSADOR)
    // ═══════════════════════════════════════════════════════════════════════
    _executeIdleTasks(availableTimeMs) {
        const idleQueue = this._queues[TASK_PRIORITIES.IDLE];
        if (idleQueue.size === 0) return;

        const idleStart = performance.now();

        for (const [id, task] of idleQueue.entries()) {
            if (this._suspendedTasks.has(id)) continue;

            // Aborta instantaneamente caso o tempo ocioso alocado expire
            if (performance.now() - idleStart >= availableTimeMs) break;

            this._runTaskSecurely(task);
        }
    }

    _runTaskSecurely(task) {
        const t0 = performance.now();
        try {
            task.execute();
            task.executionCount++;
            task.lastExecutedAt = t0;

            const costUs = (performance.now() - t0) * 1000; // Converte para microsegundos para alta resolução
            task.executionTimeHistory.push(costUs);
            if (task.executionTimeHistory.length > 20) task.executionTimeHistory.shift();

        } catch (err) {
            this._trace('TASK_CRASH', `Falha grave ao computar lógica interna da tarefa [${task.id}]: ${err.message}`, 'ERROR');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // F) THERMAL AWARE EXECUTION INTERFACES (GOVERNANÇA METABÓLICA)
    // ═══════════════════════════════════════════════════════════════════════
    updateThermalState(state) {
        this.thermalProfile.state = state;
        
        switch (state) {
            case 'CRITICAL':
                // Reduz drasticamente a capacidade de processamento para aliviar a CPU em 60%
                this.thermalProfile.throttlingMultiplier = 0.40;
                this._trace('THERMAL', 'PERFIL DE DEGRADAÇÃO MÁXIMA ATIVADO: Reduzindo orçamentos térmicos de CPU por estresse crítico de hardware.', 'CRITICAL');
                break;
            case 'ELEVATED':
                // Aplica estrangulamento preventivo moderado de 20%
                this.thermalProfile.throttlingMultiplier = 0.80;
                this._trace('THERMAL', 'Perfil térmico elevado detectado. Reduzindo ciclos secundários preventivamente.', 'WARN');
                break;
            case 'NOMINAL':
            default:
                this.thermalProfile.throttlingMultiplier = 1.0;
                break;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INFRAESTRUTURA DE ADERÊNCIA AO SISTEMA DE RASTREAMENTO (TRACE ENGINE)
    // ═══════════════════════════════════════════════════════════════════════
    _trace(subsystem, message, level = 'INFO') {
        const formatted = `[${new Date().toISOString()}] [TEMPORAL-OS:${subsystem}] [${level}] ${message}`;
        if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
        else if (level === 'WARN') console.warn(formatted);
        else console.log(formatted);
    }

    _attachSignalBus(busInstance) {
        this.bus = busInstance;
        
        // Escuta o barramento para reajustar dinamicamente o comportamento de quadros
        this.bus.on('performance:diagnostics', (telemetry) => {
            if (telemetry && telemetry.thermalState) {
                this.updateThermalState(telemetry.thermalState);
            }
        });
    }
}

// Instanciação e exposição única na infraestrutura do ecossistema
const SovereignTemporalScheduler = new SentinelTemporalScheduler();
window.SovereignTemporalScheduler = SovereignTemporalScheduler;

export default SovereignTemporalScheduler;
