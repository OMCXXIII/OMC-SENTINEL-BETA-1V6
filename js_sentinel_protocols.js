/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — SOVEREIGN SECURITY & COMPLIANCE INFRASTRUCTURE (FIREWALL)
 * Arquivo: js_sentinel_protocols.js
 * Papel: Firewall Formal do Runtime, Auditoria de Ciclo de Vida e Validador de Contratos
 * Governança: Totalmente subordinado ao SovereignKernel; dita regras de integridade.
 * Fix: Refatoração para ESM nativo. Implementação de Contratos de Governança,
 * Validação de Módulos, Validação de Estados, Domínios de Segurança, Contratos XR e Performance.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// D) SECURITY DOMAINS: Fronteiras rígidas de privilégios de isolamento (Sandbox)
export const SECURITY_DOMAINS = Object.freeze({
    KERNEL:      'KERNEL',      // Controle absoluto sobre a memória L1/L2 e ciclo de vida macro
    PERCEPTION:  'PERCEPTION',  // Subsistemas de atenção ocular, fóvea e neuro-grafo
    GRAPHICS:    'GRAPHICS',    // Pipelines de renderização WebGL2 e injeção de shaders
    SPATIAL_XR:  'SPATIAL_XR',  // Matrizes tridimensionais, eyetracking e inputs inerciais
    DIAGNOSTICS: 'DIAGNOSTICS'  // Telemetria secundária e HUD operacional externo
});

class SentinelProtocolsEngine {
    constructor() {
        this.version = "9.0-FORMAL-FIREWALL";
        this.isActive = false;

        // A) GOVERNANCE CONTRACTS: Banco de regras matemáticas imutáveis
        this.contracts = new Map();
        
        // Histórico detalhado de violações interceptadas para auditoria pós-falha
        this.violationLog = [];
        this.maxLogBuffer = 50;

        this.bus = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // A) GOVERNANCE CONTRACTS CORE ARBITRATION
    // ═══════════════════════════════════════════════════════════════════════
    registerContract(contractId, domain, validationFn) {
        if (!SECURITY_DOMAINS[domain]) {
            this._trace('GOVERNANCE', `Tentativa de registrar contrato em domínio inválido: [${domain}]`, 'WARN');
            return false;
        }
        this.contracts.set(contractId, { domain, validate: validationFn, active: true });
        return true;
    }

    evaluateContract(contractId, dataContext) {
        const contract = this.contracts.get(contractId);
        if (!contract || !contract.active) return true; // Contratos ausentes ou suspensos passam por omissão

        try {
            const success = contract.validate(dataContext);
            if (!success) {
                this._logViolation(contractId, contract.domain, dataContext, 'REJECTED');
                return false;
            }
            return true;
        } catch (err) {
            this._logViolation(contractId, contract.domain, { error: err.message, context: dataContext }, 'CRASH');
            return false; // Bloqueio preventivo total se a função de validação quebrar
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // B) MODULE VALIDATION CONTRACTS
    // ═══════════════════════════════════════════════════════════════════════
    validateModuleIntegrity(moduleName, moduleInstance) {
        if (!moduleInstance) {
            this._trace('INTEGRITY', `Módulo [${moduleName}] nulo ou indefinido capturado.`, 'ERROR');
            return false;
        }

        // Contrato Formal: Todo módulo homologado deve possuir assinatura de versão e métodos vitais de barramento
        const hasLifecycleHooks = typeof moduleInstance._attachSignalBus === 'function' || typeof moduleInstance.initializeEngine === 'function';
        const hasIdentity = typeof moduleInstance.version === 'string';

        if (!hasLifecycleHooks || !hasIdentity) {
            this._trace('INTEGRITY', `Módulo [${moduleName}] rejeitado no handshake por quebra de contrato estrutural.`, 'CRITICAL');
            this._logViolation('MODULE_CONTRACT_FAIL', SECURITY_DOMAINS.KERNEL, { module: moduleName }, 'BLOCKED');
            return false;
        }

        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // C) STATE VALIDATION CONTRACTS
    // ═══════════════════════════════════════════════════════════════════════
    validateStateTransition(currentPhase, targetPhase) {
        // Matriz Determinística de Transições de Fase do Kernel Permitidas
        // Impede estados impossíveis ou retrocessos ilegais (Ex: SHUTDOWN -> READY sem passar por BOOT)
        const LEGAL_TRANSITIONS = {
            'SHUTDOWN':  ['BOOT'],
            'BOOT':      ['INIT', 'EMERGENCY', 'SAFE_MODE'],
            'INIT':      ['READY', 'EMERGENCY', 'SAFE_MODE'],
            'READY':     ['ACTIVE', 'EMERGENCY', 'SAFE_MODE', 'SHUTDOWN'],
            'ACTIVE':    ['EMERGENCY', 'SAFE_MODE', 'READY', 'SHUTDOWN'],
            'SAFE_MODE': ['READY', 'SHUTDOWN'],
            'EMERGENCY': ['SAFE_MODE', 'SHUTDOWN']
        };

        const allowedTargets = LEGAL_TRANSITIONS[currentPhase] || [];
        if (!allowedTargets.includes(targetPhase)) {
            this._trace('SECURITY', `Transição de fase ilegal barrada: [${currentPhase} ➔ ${targetPhase}]`, 'CRITICAL');
            this._logViolation('ILLEGAL_PHASE_TRANSITION', SECURITY_DOMAINS.KERNEL, { from: currentPhase, to: targetPhase }, 'INTERCEPTED');
            return false;
        }

        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // E) XR SAFETY CONTRACTS (BLINDAGEM VESTIBULAR BIOLÓGICA)
    // ═══════════════════════════════════════════════════════════════════════
    _establishXrSafetyContracts() {
        // Contrato de Escala de Resolução: Impede distorções ópticas agressivas na viewport imersiva
        this.registerContract('XR_RESOLUTION_BOUNDS', SECURITY_DOMAINS.SPATIAL_XR, (ctx) => {
            if (ctx && ctx.scale) {
                return ctx.scale >= 0.5 && ctx.scale <= 2.0;
            }
            return false;
        });

        // Contrato Vestibular Ocular: Evita cinetose forçando taxas de atualização compatíveis
        this.registerContract('XR_VESTIBULAR_INTEGRITY', SECURITY_DOMAINS.SPATIAL_XR, (ctx) => {
            if (ctx && ctx.fps) {
                // Alerta crítico se o frame rate imersivo cair abaixo do limiar de segurança vestibular (45Hz)
                return ctx.fps >= 45.0;
            }
            return true;
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // F) PERFORMANCE CONTRACTS (CONTRATOS DE BUDGET POR FRAME)
    // ═══════════════════════════════════════════════════════════════════════
    _establishPerformanceContracts() {
        // Limite de tempo de execução alocado exclusivamente para processamento de Shaders Cognitivos
        this.registerContract('GPU_SHADER_BUDGET', SECURITY_DOMAINS.GRAPHICS, (ctx) => {
            if (ctx && ctx.executionMs) {
                return ctx.executionMs <= 4.5; // Teto rígido em milissegundos
            }
            return true;
        });

        // Limite de tarefas simultâneas no Scheduler temporário para mitigar estouros de pilha
        this.registerContract('SCHEDULER_QUEUE_SATURATION', SECURITY_DOMAINS.KERNEL, (ctx) => {
            if (ctx && ctx.pendingTasks) {
                return ctx.pendingTasks < 150; 
            }
            return true;
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INTERRUPÇÕES E EVENTOS DE VIOLAÇÃO
    // ═══════════════════════════════════════════════════════════════════════
    _logViolation(contractId, domain, context, actionTaken) {
        const violation = {
            timestamp: performance.now(),
            contractId,
            domain,
            context: JSON.parse(JSON.stringify(context || {})),
            action: actionTaken
        };

        this.violationLog.unshift(violation);
        if (this.violationLog.length > this.maxLogBuffer) {
            this.violationLog.pop();
        }

        this._trace('FIREWALL', `VIOLAÇÃO: [${contractId}] no domínio [${domain}]. Ação aplicada: [${actionTaken}]`, 'CRITICAL');

        // Emite interrupção síncrona imediata no barramento global de sinais
        if (this.bus) {
            this.bus.emit('firewall:contract_violation', violation);
            
            // Se o contrato violado for crítico do Kernel ou Espacial, força recuo para Modo de Segurança
            if (domain === SECURITY_DOMAINS.KERNEL || contractId === 'XR_VESTIBULAR_INTEGRITY') {
                this.bus.emit('kernel:force_emergency_panic', { reason: `CONTRACT_VIOLATION:${contractId}` });
            }
        }
    }

    maintainProtocolEquilibrium() {
        // Auditoria passiva contínua de telemetria cruzada injetada na janela
        if (!this.isActive) return;

        if (window.SentinelShaderRuntime?.budget) {
            this.evaluateContract('GPU_SHADER_BUDGET', { executionMs: window.SentinelShaderRuntime.budget.currentLoadMs });
        }
        
        if (window.SentinelHUD?.panels?.fps) {
            this.evaluateContract('XR_VESTIBULAR_INTEGRITY', { fps: window.SentinelHUD.panels.fps.current });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LIFECYCLE E HANDSHAKES DO BARRAMENTO
    // ═══════════════════════════════════════════════════════════════════════
    initializeEngine() {
        this.isActive = true;
        this._establishXrSafetyContracts();
        this._establishPerformanceContracts();
        this._trace('LIFECYCLE', 'Firewall formal ativado. Contratos de conformidade de hardware selados.');
    }

    shutdownEngine() {
        this.isActive = false;
        this.contracts.clear();
        this.violationLog = [];
    }

    _trace(subsystem, message, level = 'INFO') {
        const formatted = `[${new Date().toISOString()}] [PROTOCOLS-FIREWALL:${subsystem}] [${level}] ${message}`;
        if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
        else if (level === 'WARN') console.warn(formatted);
        else console.log(formatted);
    }

    _attachSignalBus(busInstance) {
        this.bus = busInstance;

        // Escuta o sincronizador de fases para interceptar e validar transições antes de sua efetivação
        this.bus.on('kernel:phase-request-authorize', (transitionData) => {
            if (transitionData && transitionData.from && transitionData.to) {
                const isLegal = this.validateStateTransition(transitionData.from, transitionData.to);
                this.bus.emit('kernel:phase-response-authorize', { 
                    transactionId: transitionData.transactionId, 
                    approved: isLegal 
                });
            }
        });
    }
}

// Instanciação e exposição única em total conformidade com o ecossistema v9.0
const SovereignFirewall = new SentinelProtocolsEngine();
window.SentinelProtocols = SovereignFirewall;

export default SovereignFirewall;
