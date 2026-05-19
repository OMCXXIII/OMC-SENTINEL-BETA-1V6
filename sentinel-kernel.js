/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — SOVEREIGN CORE RUNTIME OPERATING KERNEL
 * Arquivo: sentinel-kernel.js
 * Papel: Centro Absoluto de Governança, Arbitragem de Hardware e Ciclo de Vida
 * Padrão: ECMAScript Modules (ESM) Nativos com Isolamento de Escopo
 * Fix: Implementação completa do Registry, Grafo de Dependências, Health Matrix,
 * Ciclo de Vida Síncrono/Assíncrono e Motores de Recuperação Térmica/GPU.
 * ═══════════════════════════════════════════════════════════════════════
 */

class SentinelKernel {
    constructor() {
        this.version = "9.0-SOVEREIGN";
        this.activePhase = "SHUTDOWN"; // SHUTDOWN, BOOT, INIT, READY, SUSPENDED, SAFE_MODE
        
        // A) RUNTIME REGISTRY & D) MODULE HEALTH
        this._registry = new Map();
        this._moduleHealth = new Map();
        
        // B) DEPENDENCY GRAPH (Árvore Hierárquica Estrita de Resolução)
        this.dependencies = {
            'sentinel-bus': [],
            'sentinel-core':          ['sentinel-bus'],
            'sentinel-performance':   ['sentinel-core'],
            'sentinel-renderer':      ['sentinel-core'],
            'attention-manager':      ['sentinel-core'],
            'memory-vault':           ['sentinel-core'],
            'engine-xr':              ['sentinel-renderer', 'sentinel-performance'],
            'sentinel-hud':           ['engine-xr', 'attention-manager']
        };

        // G) HARDWARE GOVERNANCE (Estruturas de Controle Metabolic)
        this.hardwareGovernance = {
            gpuBudgetMs: 11.11,        // Meta estrita para travar em 90Hz estáveis
            currentGpuLoadMs: 0.0,
            thermalState: 'NOMINAL',   // NOMINAL, ELEVATED, CRITICAL, THROTTLED
            xrLatencyMs: 0.0,
            schedulerPriority: 'DETERMINISTIC'
        };

        this._bootLock = false;
        this.bus = null;
        this.watchdogInterval = null; // Injetado para monitoria ativa de threads
    }

    // ═══════════════════════════════════════════════════════════════════════
    // A) INTERFACE PÚBLICA DO RUNTIME REGISTRY & HEARTBEAT SYSTEM
    // ═══════════════════════════════════════════════════════════════════════
    registerModule(name, instance) {
        if (!name || !instance) {
            this.trace('REGISTRY', 'ERROR', 'Tentativa de registro inválida: Nome ou instância nulos.');
            return false;
        }
        this._registry.set(name, instance);
        this._moduleHealth.set(name, {
            status: 'REGISTERED',
            failureCount: 0,
            lastHeartbeat: performance.now(),
            recoveryAttempts: 0
        });
        this.trace('REGISTRY', 'INFO', `Módulo operacional catalogado com sucesso: [${name}]`);
        return true;
    }

    getModule(name) {
        return this._registry.get(name);
    }

    hasModule(name) {
        return this._registry.has(name);
    }

    getModuleStatus(name) {
        return this._moduleHealth.get(name) || null;
    }

    heartbeat(name) {
        const moduleMeta = this._moduleHealth.get(name);
        if (!moduleMeta) return false;

        moduleMeta.lastHeartbeat = performance.now();
        if (moduleMeta.status === 'STALE' || moduleMeta.status === 'REGISTERED') {
            moduleMeta.status = 'INITIALIZED';
        }
        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // C) ORQUESTRADOR DO CICLO DE VIDA (BOOT ORCHESTRATION)
    // ═══════════════════════════════════════════════════════════════════════
    async boot() {
        if (this._bootLock) {
            this.trace('BOOT', 'WARN', 'Ignorando chamada de inicialização duplicada. Kernel já em execução.');
            return false;
        }
        this._bootLock = true;
        this.trace('KERNEL', 'INFO', '=== INICIANDO HANDSHAKE DE TRANSIÇÃO DA ORDEM SOBERANA v9.0 ===');

        try {
            // Fase 1: BOOT (Montagem e verificação estrutural primária)
            await this.bootPhase('BOOT');
            this.bus = window.SentinelBus || this.getModule('sentinel-bus');

            // Fase 2: INIT (Injeção de dependências e links de hardware)
            await this.bootPhase('INIT');
            this._bindCoreEvents();

            // Fase 3: READY (Abertura da Viewport e desbloqueio do loop de renderização)
            await this.bootPhase('READY');
            
            // Inicialização do Watchdog de Proteção Ativa antes de liberar a thread principal
            this.startWatchdog();
            return true;
        } catch (fatalError) {
            this.trace('KERNEL', 'CRITICAL', `Colapso crítico durante boot de sistemas: ${fatalError.message}`);
            this.enterSafeMode(fatalError.message);
            return false;
        }
    }

    async bootPhase(phase) {
        this.activePhase = phase;
        this.trace('LIFECYCLE', 'INFO', `Transicionado para fase macro de execução: [${phase}]`);

        // Execução sínclita de gatilhos acoplados por hardware
        switch(phase) {
            case 'BOOT':  this.onBoot(); break;
            case 'INIT':  await this._loadSequence(); break;
            case 'READY': this.onReady(); break;
        }

        if (this.bus) {
            this.bus.emit(`kernel:phase:${phase.toLowerCase()}`, { timestamp: performance.now() });
        }
    }

    async _loadSequence() {
        this.trace('SCHEDULER', 'INFO', 'Iniciando varredura e resolução ordenada do Grafo de Dependências.');
        
        // Carrega sequencialmente garantindo que dependências precedam os módulos filhos
        for (const moduleName of Object.keys(this.dependencies)) {
            await this.loadModule(moduleName);
        }
    }

    async loadModule(name) {
        const health = this._moduleHealth.get(name);
        if (!health) {
            this.trace('SCHEDULER', 'WARN', `Aviso de resolução: [${name}] não possui pré-registro físico no Registry.`);
            return;
        }

        // Verifica integridade das dependências declaradas antes de inicializar o nó
        const deps = this.dependencies[name] || [];
        for (const dep of deps) {
            const depHealth = this._moduleHealth.get(dep);
            if (!depHealth || (depHealth.status !== 'INITIALIZED' && depHealth.status !== 'REGISTERED')) {
                this.trace('SCHEDULER', 'ERROR', `Bloqueio de Inicialização: [${name}] depende do nó falho ou ausente: [${dep}]`);
                throw new Error(`Quebra de integridade de grafo para o módulo: ${name}`);
            }
        }

        try {
            const instance = this._registry.get(name);
            // Executa inicialização base interna se exposta pelo módulo corporativo
            if (instance && typeof instance._initializeMemorySystem === 'function') instance._initializeMemorySystem();
            if (instance && typeof instance._initializeHomeostaticEngine === 'function') instance._initializeHomeostaticEngine();
            if (instance && typeof instance._bootObservatory === 'function') instance._bootObservatory();

            health.status = 'INITIALIZED';
            health.lastHeartbeat = performance.now();
            this.trace('SCHEDULER', 'INFO', `Nó de runtime estabilizado com sucesso: [${name}]`);
        } catch (err) {
            health.status = 'FAULTY';
            health.failureCount++;
            this.trace('SCHEDULER', 'ERROR', `Falha ao acionar rotina de ativação no nó [${name}]: ${err.message}`);
            this.recoverModule(name);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // D) WATCHDOG THREAD ENGINE
    // ═══════════════════════════════════════════════════════════════════════
    startWatchdog() {
        if (this.watchdogInterval) return;

        this.watchdogInterval = setInterval(() => {
            const now = performance.now();
            this._moduleHealth.forEach((meta, name) => {
                // Previne checar módulos que ainda não completaram o handshake inicial de boot
                if (meta.status === 'REGISTERED') return;

                const delta = now - meta.lastHeartbeat;
                if (delta > 5000) { // Janela limite de 5 segundos de dessincronização
                    this.trace('WATCHDOG', 'WARN', `Heartbeat perdido do módulo [${name}]. Delta: ${delta.toFixed(2)}ms`);
                    meta.status = 'STALE';
                    this.recoverModule(name);
                }
            });
        }, 2000); // Varredura a cada 2 segundos
    }

    // ═══════════════════════════════════════════════════════════════════════
    // E) HOOKS EXCLUSIVOS DE GOVERNANÇA DE CICLO DE VIDA (LIFECYCLE GOVERNANCE)
    // ═══════════════════════════════════════════════════════════════════════
    onBoot() {
        this.trace('LIFECYCLE', 'INFO', 'Contratos de Boot assinados. Alocando buffers e canais latentes.');
    }

    onReady() {
        this.trace('LIFECYCLE', 'INFO', 'Sistema totalmente síncrono. Lock de performance liberado para exibição WebXR.');
        if (this.bus) this.bus.emit('system:boot-complete');
    }

    suspend() {
        if (this.activePhase === 'SUSPENDED') return;
        this.activePhase = 'SUSPENDED';
        this.onSuspend();
    }

    onSuspend() {
        this.trace('LIFECYCLE', 'WARN', 'Metabolismo em modo passivo. Loops secundários e shaders complexos suprimidos.');
        if (this.bus) this.bus.emit('kernel:suspended');
    }

    shutdown() {
        if (this.watchdogInterval) {
            clearInterval(this.watchdogInterval);
            this.watchdogInterval = null;
        }
        this.activePhase = 'SHUTDOWN';
        this.onShutdown();
    }

    onShutdown() {
        this.trace('LIFECYCLE', 'CRITICAL', 'Ordem de encerramento recebida. Purgando alocações dinâmicas de heap.');
        this._registry.clear();
        this._moduleHealth.clear();
        this._bootLock = false;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // F) MOTOR DE MITIGAÇÃO E AUTO-RECUPERAÇÃO (RECOVERY ENGINE)
    // ═══════════════════════════════════════════════════════════════════════
    recoverModule(name) {
        const health = this._moduleHealth.get(name);
        if (!health) return;

        if (health.recoveryAttempts >= 3) {
            this.trace('RECOVERY', 'CRITICAL', `Módulo [${name}] excedeu o teto de tolerância. Forçando isolamento do ecossistema.`);
            this.recoverRuntime();
            return;
        }

        health.recoveryAttempts++;
        this.trace('RECOVERY', 'WARN', `Tentativa de auto-recuperação cirúrgica [${health.recoveryAttempts}/3] no nó: [${name}]`);
        
        setTimeout(() => {
            this.loadModule(name);
        }, 150 * health.recoveryAttempts);
    }

    recoverRuntime() {
        this.trace('RECOVERY', 'CRITICAL', 'Instabilidade sistêmica detectada. Acionando varredura geral de integridade de hardware.');
        let absoluteCollapse = false;

        this._moduleHealth.forEach((meta, name) => {
            if (meta.status === 'FAULTY' || meta.status === 'STALE') {
                this.trace('RECOVERY', 'WARN', `Purgando nó instável para tentar reinicialização a frio: [${name}]`);
                if (this.dependencies[name] && this.dependencies[name].length === 0) {
                    this.loadModule(name);
                } else {
                    absoluteCollapse = true;
                }
            }
        });

        if (absoluteCollapse) {
            this.enterSafeMode('Cascata incontrolável de quebras no Grafo de Dependências.');
        }
    }

    enterSafeMode(reason) {
        this.activePhase = "SAFE_MODE";
        this.hardwareGovernance.schedulerPriority = 'RECOVERY_CRITICAL';
        this.trace('KERNEL', 'CRITICAL', `[MODO SEGURO ATIVADO] Motivo: ${reason}`);
        
        if (this.bus) {
            this.bus.emit('kernel:emergency_fallback', { reason: reason, ts: performance.now() });
            this.bus.emit('system:nsdr-trigger'); 
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // G) ARBITRAGEM DE HARDWARE (HARDWARE GOVERNANCE)
    // ═══════════════════════════════════════════════════════════════════════
    updateHardwareTelemetry(metrics) {
        if (!metrics) return;

        // 1. Monitoramento Térmico Estrito
        if (metrics.thermalTemperature) {
            if (metrics.thermalTemperature > 75) {
                this.hardwareGovernance.thermalState = 'CRITICAL';
                this.enforceThermalThrottling();
            } else if (metrics.thermalTemperature > 60) {
                this.hardwareGovernance.thermalState = 'ELEVATED';
            } else {
                this.hardwareGovernance.thermalState = 'NOMINAL';
            }
        }

        // 2. Orçamento e Governança de GPU / XR Frame Latency
        if (metrics.frameExecutionTimeMs) {
            this.hardwareGovernance.currentGpuLoadMs = metrics.frameExecutionTimeMs;
            if (this.hardwareGovernance.currentGpuLoadMs > this.hardwareGovernance.gpuBudgetMs) {
                this.trace('GPU_GOVERNANCE', 'WARN', `Estouro de Frame-Budget detectado: ${metrics.frameExecutionTimeMs.toFixed(2)}ms / Max: ${this.hardwareGovernance.gpuBudgetMs}ms`);
                if (this.bus) this.bus.emit('performance:drop', { fps: metrics.fps || 45 });
            }
        }
    }

    enforceThermalThrottling() {
        this.trace('THERMAL_GOVERNANCE', 'CRITICAL', 'Proteção de silício ativada. Comprimindo ciclos do Scheduler e desativando shaders secundários.');
        if (this.bus) {
            this.bus.emit('nexus:command', {
                command: 'APPLY_DEGRADATION_PROFILE',
                payload: { profile: 'LOW_POWER' },
                source: 'KERNEL_THERMAL_GOVERNOR'
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // H) MOTOR DE RASTREAMENTO E TELEMETRIA (TRACE ENGINE & SNAPSHOT)
    // ═══════════════════════════════════════════════════════════════════════
    trace(namespace, level, message) {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [KERNEL:${namespace}] [${level}] ${message}`;

        switch (level) {
            case 'CRITICAL':
            case 'ERROR':
                console.error(formattedMessage);
                break;
            case 'WARN':
                console.warn(formattedMessage);
                break;
            case 'INFO':
            default:
                console.log(formattedMessage);
                break;
        }
    }

    exportRegistrySnapshot() {
        const snapshot = {};
        this._moduleHealth.forEach((meta, name) => {
            snapshot[name] = { ...meta };
        });
        return snapshot;
    }

    _bindCoreEvents() {
        if (!this.bus) return;

        this.bus.on('performance:diagnostics', (telemetry) => {
            if (telemetry) {
                this.updateHardwareTelemetry({
                    frameExecutionTimeMs: telemetry.frameTime,
                    fps: telemetry.fps,
                    thermalTemperature: telemetry.cpuLoad ? telemetry.cpuLoad * 0.8 : 35
                });
            }
        });

        this.trace('KERNEL', 'INFO', 'Conexões bidirecionais de telemetria acopladas ao SentinelBus.');
    }
}

const SovereignKernel = new SentinelKernel();
window.SovereignKernel = SovereignKernel;

export default SovereignKernel;
