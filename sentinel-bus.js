/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — HIGH-PRECISION SIGNAL BUS (OPERATIONAL NERVOUS SYSTEM)
 * Arquivo: sentinel-bus.js
 * Papel: Barramento Assíncrono Verde com Fila de Prioridades e Despacho por Quadros
 * Governança: Totalmente subordinado ao SovereignKernel e ao seu Scheduler.
 * Fix: Implementação de Priority Queues, Anti-Flood, Anti-Cascade, Controle de 
 * Backpressure e Validação Rígida de Namespaces Corporativos.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// D) VALIDAÇÃO RÍGIDA DE EVENT NAMESPACES
const VALID_NAMESPACES = new Set(['kernel', 'xr', 'hud', 'memory', 'attention', 'performance', 'system', 'nexus']);

class SentinelSignalBus {
    constructor() {
        this.version = "9.0-NERVOUS-BUS";
        this._handlers = new Map();
        this._sticky = new Map();
        this._history = [];
        
        // B) FILAS INTERNAS DE EVENTOS POR GRAU DE PRIORIDADE
        this._queues = {
            CRITICAL:   [], // Sinais XR, Estabilização Ocular, Input Inercial (Imediato)
            HIGH:       [], // Mudanças de Foco Atencional, Updates Críticos de HUD
            NORMAL:     [], // Mutações de Estado do Core, Handshakes de Subsistemas
            BACKGROUND: []  // Logs de Depuração, Indexação Histórica de Memória L2/L3
        };

        // F) MÉTRICAS DE CONTROLE DE BACKPRESSURE E ANTI-FLOOD
        this.backpressure = {
            maxHistorySize: 200,
            maxQueueBuffer: 150,
            floodThresholdPerSec: 400,
            eventsInCurrentWindow: 0,
            windowStartTimestamp: performance.now(),
            activeExecutionCascadeDepth: 0,
            maxAllowedCascadeDepth: 8 // Proteção contra estouro de pilha por loops recursivos
        };

        this._bootCompleted = false;
        this.trace('SYSTEM', 'Nervous Core Signal Bus Instanciado com Sucesso.');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // A) MÉTODOS DE ASSINATURA E REGISTRO DE LISTENERS
    // ═══════════════════════════════════════════════════════════════════════
    on(event, handler) {
        this._validateEventName(event);
        if (!this._handlers.has(event)) {
            this._handlers.set(event, new Set());
        }
        this._handlers.get(event).add(handler);

        // Despacha imediatamente se houver um evento pegajoso (Sticky) em cache
        if (this._sticky.has(event)) {
            handler(this._sticky.get(event));
        }
    }

    once(event, handler) {
        const wrapper = (data) => {
            this.off(event, wrapper);
            handler(data);
        };
        this.on(event, wrapper);
    }

    off(event, handler) {
        if (this._handlers.has(event)) {
            this._handlers.get(event).delete(handler);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // B) EMISSÃO CONTROLADA COM TRATAMENTO DE PRIORIDADE (PRIORITY EVENTS)
    // ═══════════════════════════════════════════════════════════════════════
    emit(event, data = null, priority = 'NORMAL') {
        this._validateEventName(event);

        // 1. Mecanismo de Proteção Anti-Flood (Rate Limiting)
        if (this._checkFloodProtection()) {
            this.trace('WARN_FLOOD', `Bloqueio de Anti-Flood ativado para o evento: [${event}]. Taxa de injeção violada.`);
            return false;
        }

        // 2. Encaminhamento direto de Sinais Críticos para Mitigação de Latência
        if (priority === 'CRITICAL') {
            this._executeDispatchImmediately(event, data);
            return true;
        }

        // 3. Injeção na Fila de Prioridades do Scheduler se houver espaço
        const targetQueue = this._queues[priority];
        if (!targetQueue) {
            throw new Error(`[BUS] Nível de prioridade inválido fornecido: ${priority}`);
        }

        if (targetQueue.length >= this.backpressure.maxQueueBuffer) {
            this.trace('BACKPRESSURE', `Saturação detectada na fila [${priority}]. Purgando registro mais antigo.`, 'WARN');
            targetQueue.shift(); // Remove o sinal obsoleto mais antigo da fila para mitigar lag
        }

        targetQueue.push({ event, data, ts: performance.now() });
        return true;
    }

    sticky(event, data) {
        this._sticky.set(event, data);
        this.emit(event, data, 'HIGH');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // C) FRAME DISPATCHER (GOVERNADO EXCLUSIVAMENTE PELO SCHEDULER DO KERNEL)
    // ═══════════════════════════════════════════════════════════════════════
    dispatchFrame() {
        const startTime = performance.now();
        // Orçamento máximo estrito de tempo de CPU alocado para o barramento por frame = 1.5ms
        const timeBudgetMs = 1.5; 

        // Esvazia as filas respeitando a ordem de precedência hierárquica (HIGH -> NORMAL -> BACKGROUND)
        const priorityOrder = ['HIGH', 'NORMAL', 'BACKGROUND'];

        for (const priority of priorityOrder) {
            const queue = this._queues[priority];
            
            while (queue.length > 0) {
                // Interrompe o esvaziamento imediatamente caso o frame-budget expire
                if (performance.now() - startTime > timeBudgetMs) {
                    this.trace('SCHEDULER_LAG', `Esvaziamento suspenso na fila [${priority}]. Orçamento de frame estourado. Volatilidade mitigada.`, 'WARN');
                    return;
                }

                const packet = queue.shift();
                this._executeDispatchImmediately(packet.event, packet.data);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // F) CONTROLE DE BACKPRESSURE E PROTEÇÃO CONTRA CASCATAS (ANTI-CASCADE)
    // ═══════════════════════════════════════════════════════════════════════
    _executeDispatchImmediately(event, data) {
        const listeners = this._handlers.get(event);
        if (!listeners || listeners.size === 0) return;

        // Proteção Anti-Cascade: Previne recursões infinitas geradas por loops cegos de emit
        if (this.backpressure.activeExecutionCascadeDepth >= this.backpressure.maxAllowedCascadeDepth) {
            this.trace('ANTI_CASCADE', `Interrupção estrita de loop infinito evitada para o evento: [${event}]. Profundidade: ${this.backpressure.activeExecutionCascadeDepth}`, 'ERROR');
            return;
        }

        this.backpressure.activeExecutionCascadeDepth++;

        // Execução sínclita de todos os handlers acoplados (Listener Storm Mitigation)
        for (const handler of listeners) {
            try {
                handler(data);
            } catch (err) {
                this.trace('LISTENER_STORM_ERROR', `Falha de execução de callback no evento [${event}]: ${err.message}`, 'ERROR');
            }
        }

        this.backpressure.activeExecutionCascadeDepth--;

        // Registra a ocorrência no histórico unificado do observatório
        this._pushToHistory({ event, data, ts: performance.now() });
    }

    _checkFloodProtection() {
        const now = performance.now();
        if (now - this.backpressure.windowStartTimestamp > 1000) {
            this.backpressure.eventsInCurrentWindow = 0;
            this.backpressure.windowStartTimestamp = now;
        }

        this.backpressure.eventsInCurrentWindow++;
        return this.backpressure.eventsInCurrentWindow > this.backpressure.floodThresholdPerSec;
    }

    _pushToHistory(entry) {
        this._history.push(entry);
        if (this._history.length > this.backpressure.maxHistorySize) {
            this._history.shift();
        }
    }

    _validateEventName(event) {
        if (!event || !event.includes(':')) {
            throw new Error(`[BUS] Assinatura de evento inválida. Formato exigido: namespace:nome_evento. Fornecido: "${event}"`);
        }
        const namespace = event.split(':')[0];
        if (!VALID_NAMESPACES.has(namespace)) {
            throw new Error(`[BUS] Namespace corporativo ilegal detectado: "${namespace}". Utilize apenas: ${Array.from(VALID_NAMESPACES).join(', ')}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // E) TRACE SYSTEM EM TEMPO REAL
    // ═══════════════════════════════════════════════════════════════════════
    trace(subsystem, message, level = 'INFO') {
        const formatted = `[${new Date().toISOString()}] [BUS:${subsystem}] [${level}] ${message}`;
        if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
        else if (level === 'WARN') console.warn(formatted);
        else console.log(formatted);
    }

    getDiagnostics() {
        return {
            queues: {
                high: this._queues.HIGH.length,
                normal: this._queues.NORMAL.length,
                background: this._queues.BACKGROUND.length
            },
            historyCount: this._history.length,
            currentWindowLoad: this.backpressure.eventsInCurrentWindow,
            isFailing: this.backpressure.eventsInCurrentWindow > this.backpressure.floodThresholdPerSec
        };
    }
}

// Instanciação e exposição única na infraestrutura do ecossistema
const SentinelBus = new SentinelSignalBus();
window.SentinelBus = SentinelBus;

export default SentinelBus;
