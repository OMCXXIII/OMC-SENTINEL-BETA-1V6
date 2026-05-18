/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — AUTHORITATIVE STATE MACHINE (VR-OS TRANSITION ENGINE)
 * Arquivo: sentinel-state-machine.js
 * Papel: Árbitro Formal de Estados, Mudanças Imutáveis e Motor de Rollback
 * Governança: Totalmente subordinado ao SovereignKernel e ao seu Scheduler.
 * Fix: Implementação de Immutable Transitions, Rollback Engine, Validação Estrita,
 * Histórico de Auditoria Linear, Ganchos Assíncronos e Travas de Concorrência.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// A) IMMUTABLE TRANSITIONS: Enumeração Estrita e Congelada de Estados Válidos
export const STATES = Object.freeze({
    BOOT:       'BOOT',       // Inicialização do hardware e barramentos core
    READY:      'READY',      // Sistema nominal, viewport e loops liberados
    IDLE:       'IDLE',       // Prontidão de baixo consumo, ociosidade ativa
    FOCUS:      'FOCUS',      // Concentração foveal, supressão de ruído periférico
    XR:         'XR',         // Modo imersivo estereoscópico ativado (90Hz lock)
    LOW_POWER:  'LOW_POWER',  // Degradação metabólica por estresse térmico/bateria
    RECOVERY:   'RECOVERY',   // Tentativa de saneamento de subsistemas corrompidos
    EMERGENCY:  'EMERGENCY',  // Isolamento extremo por falha iminente ou pânico
    SAFE_MODE:  'SAFE_MODE',  // Estado de segurança estático com módulos desativados
    SHUTDOWN:   'SHUTDOWN'    // Encerramento total e purga de heap de memória
});

class SentinelStateMachine {
    constructor() {
        this.version = "9.0-STATE-ARBITER";
        
        // D) STATE HISTORY (Histórico de Auditoria Linear Protegido)
        this.history = [];
        this.maxHistorySize = 50;

        this.currentState = STATES.SHUTDOWN;
        this.previousState = null;
        
        // F) TRANSITION LOCKS (Prevenção Absoluta contra Transições Simultâneas)
        this._isTransitioning = false;

        // Grafo Direcionado Permissivo de Transições de Estado Estritas
        this._allowedGraph = {
            [STATES.SHUTDOWN]:  [STATES.BOOT],
            [STATES.BOOT]:      [STATES.READY, STATES.SAFE_MODE],
            [STATES.READY]:     [STATES.IDLE, STATES.FOCUS, STATES.XR, STATES.LOW_POWER, STATES.RECOVERY, STATES.SHUTDOWN],
            [STATES.IDLE]:      [STATES.READY, STATES.FOCUS, STATES.LOW_POWER, STATES.SHUTDOWN],
            [STATES.FOCUS]:     [STATES.READY, STATES.IDLE, STATES.XR, STATES.LOW_POWER, STATES.SHUTDOWN],
            [STATES.XR]:        [STATES.READY, STATES.FOCUS, STATES.LOW_POWER, STATES.RECOVERY, STATES.SHUTDOWN],
            [STATES.LOW_POWER]: [STATES.READY, STATES.IDLE, STATES.RECOVERY, STATES.EMERGENCY, STATES.SHUTDOWN],
            [STATES.RECOVERY]:  [STATES.READY, STATES.EMERGENCY, STATES.SAFE_MODE, STATES.SHUTDOWN],
            [STATES.EMERGENCY]: [STATES.SAFE_MODE, STATES.SHUTDOWN],
            [STATES.SAFE_MODE]: [STATES.SHUTDOWN]
        };

        // Dicionário de Callbacks Dinâmicos para Estados Específicos
        this._stateActions = new Map();
        this.bus = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // C) TRANSITION VALIDATION & ARBITRAGEM DE ADJACÊNCIA
    // ═══════════════════════════════════════════════════════════════════════
    canTransition(targetState) {
        if (!STATES[targetState]) {
            this._trace('VALIDATION', 'ERROR', `Estado alvo ilegal ou inexistente: "${targetState}"`);
            return false;
        }

        // Verifica se o vetor de mudança existe e está mapeado no grafo direcionado
        const allowedTargets = this._allowedGraph[this.currentState] || [];
        const isAllowed = allowedTargets.includes(targetState);

        if (!isAllowed) {
            this._trace('VALIDATION', 'WARN', `Veto de Adjacência: Transição direta de [${this.currentState}] para [${targetState}] é ilegal.`);
        }

        return isAllowed;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // A) MOTOR PRINCIPAL DE MUTAÇÃO (IMMUTABLE TRANSITIONS & LOCKS)
    // ═══════════════════════════════════════════════════════════════════════
    async transitionTo(targetState, contextPayload = null) {
        // 1. Barreira Física contra Concorrência e Corridas de Estado (Race Conditions)
        if (this._isTransitioning) {
            this._trace('LOCKS', 'WARN', `Rejeição de Concorrência: Transição para [${targetState}] ignorada. Máquina ocupada migrando para [${this.currentState}].`);
            return false;
        }

        // 2. Validação Formal de Viabilidade contra o Grafo Direcionado
        if (!this.canTransition(targetState)) {
            return false;
        }

        this._isTransitioning = true;
        const originState = this.currentState;
        this._trace('MUTATION', 'INFO', `Iniciando vetor de mutação estável: [${originState}] ➔ [${targetState}]`);

        try {
            // E) GANCHOS DE EXECUÇÃO: beforeTransition
            const allowTransition = await this.beforeTransition(originState, targetState, contextPayload);
            if (allowTransition === false) {
                this._trace('HOOKS', 'WARN', `Veto de Handshake: O gancho beforeTransition abortou a migração para [${targetState}].`);
                this._isTransitioning = false;
                return false;
            }

            // Executa rotina interna vinculada ao estado anterior (Se houver método de saída/leave)
            const currentActionConfig = this._stateActions.get(originState);
            if (currentActionConfig && typeof currentActionConfig.leave === 'function') {
                await currentActionConfig.leave(contextPayload);
            }

            // Efetua a alteração atômica da variável de estado sob isolamento
            this.previousState = originState;
            this.currentState = targetState;

            // Executa rotina interna vinculada ao novo estado (Método de entrada/enter)
            const targetActionConfig = this._stateActions.get(targetState);
            if (targetActionConfig && typeof targetActionConfig.enter === 'function') {
                await targetActionConfig.enter(contextPayload);
            }

            // Atualiza o histórico linear de auditoria
            this._pushToHistory(originState, targetState, contextPayload);

            // E) GANCHOS DE EXECUÇÃO: afterTransition
            await this.afterTransition(originState, targetState, contextPayload);

            // Emite notificação unificada para o barramento nervoso
            if (this.bus) {
                this.bus.emit('system:state_changed', {
                    from: originState,
                    to: targetState,
                    timestamp: performance.now(),
                    payload: contextPayload
                });
            }

            this._isTransitioning = false;
            this._trace('MUTATION', 'INFO', `Transição concluída com sucesso. Estado estável atual: [${this.currentState}]`);
            return true;

        } catch (error) {
            this._trace('MUTATION', 'CRITICAL', `Colapso durante processamento de transição de fase: ${error.message}`);
            this._isTransitioning = false;
            
            // Força acionamento do motor de proteção contra travamento cego
            await this.rollback(originState, error.message);
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // B) MOTOR DE REVERSÃO E MITIGAÇÃO DE DESENCONTROS (ROLLBACK ENGINE)
    // ═══════════════════════════════════════════════════════════════════════
    async rollback(fallbackState = null, reason = "Unknown Transition Failure") {
        this._trace('ROLLBACK_ENGINE', 'CRITICAL', `!!! INICIANDO PROCEDIMENTO DE EMERGENCY ROLLBACK !!! Motivo: ${reason}`);
        
        // Se nenhum estado seguro foi fornecido ou se o estado anterior quebrou, busca o último ponto nominal do histórico
        let targetFallback = fallbackState || this.previousState || STATES.READY;
        
        // Garante que o ponto de recuo não cause um loop infinito de falhas
        if (this.currentState === targetFallback) {
            targetFallback = STATES.SAFE_MODE;
        }

        this._trace('ROLLBACK_ENGINE', 'WARN', `Forçando recuo tático de hardware para o estado de segurança: [${targetFallback}]`);
        
        // Limpa o lock físico de concorrência de forma soberana para desatar rastejos de thread
        this._isTransitioning = false;
        
        // Força bypass de validação comum para garantir pouso seguro do sistema operacional
        this.currentState = targetFallback;
        
        if (this.bus) {
            this.bus.emit('system:state_rollback', {
                collapsedState: this.currentState,
                restoredState: targetFallback,
                reason: reason,
                ts: performance.now()
            });
            
            // Dispara sinal de atenuação imediata visual para diminuir a pressão na thread
            this.bus.emit('nexus:command', { command: 'APPLY_DEGRADATION_PROFILE', payload: { profile: 'EMERGENCY' } });
        }

        this._pushToHistory(STATES.RECOVERY, targetFallback, { rollbackReason: reason });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // E) DEFINIÇÃO DE INTERFACES VIRTUAIS DE HOOKS ASYNC
    // ═══════════════════════════════════════════════════════════════════════
    async beforeTransition(from, to, payload) {
        // Pode ser customizado dinamicamente por injeção do desenvolvedor ou pelo Kernel
        this._trace('HOOKS', 'INFO', `Hook [beforeTransition]: Avaliando pré-condições para migrar de ${from} para ${to}.`);
        return true; 
    }

    async afterTransition(from, to, payload) {
        // Executado pós alteração linear da variável e antes da liberação do trinco físico
        this._trace('HOOKS', 'INFO', `Hook [afterTransition]: Sincronização pós-mutação concluída de ${from} para ${to}.`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MÉTODOS DE REGISTRO E UTILITÁRIOS INTERNOS
    // ═══════════════════════════════════════════════════════════════════════
    registerState(state, configuration = {}) {
        if (!STATES[state]) {
            throw new Error(`[STATE-MACHINE] Tentativa de registrar estado inválido: ${state}`);
        }
        this._stateActions.set(state, configuration);
        this._trace('REGISTRY', 'INFO', `Logica comportamental de ciclo acoplada ao estado: [${state}]`);
    }

    _pushToHistory(from, to, payload) {
        this.history.push({
            from,
            to,
            timestamp: performance.now(),
            date: new Date().toISOString(),
            payload: payload ? JSON.parse(JSON.stringify(payload)) : null
        });

        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    _trace(subsystem, level, message) {
        const formatted = `[${new Date().toISOString()}] [STATE-MACHINE:${subsystem}] [${level}] ${message}`;
        if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
        else if (level === 'WARN') console.warn(formatted);
        else console.log(formatted);
    }

    // Acoplamento seguro de infraestrutura provido pelo validador do Kernel
    _attachSignalBus(busInstance) {
        this.bus = busInstance;
        this._trace('REGISTRY', 'INFO', 'Barramento centralizado de alta precisão acoplado com sucesso.');
    }
}

// Instanciação e exposição única na infraestrutura do ecossistema
const SovereignStateGovernor = new SentinelStateMachine();
window.SovereignStateGovernor = SovereignStateGovernor;

export default SovereignStateGovernor;
