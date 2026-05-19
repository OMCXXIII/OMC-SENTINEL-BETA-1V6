/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.5 — SOVEREIGN AUTONOMOUS RUNTIME OPERATING KERNEL (REVISED)
 * Arquivo: sentinel-kernel.js
 * Papel: Centro Absoluto de Governança, Arbitragem de Hardware e Ciclo de Vida
 * Padrão: ECMAScript Modules (ESM) Nativos com Isolamento de Escopo
 * ═══════════════════════════════════════════════════════════════════════════
 */

class SentinelKernel {
    constructor() {
        this.version = "9.5-SOVEREIGN";
        this.activePhase = "SHUTDOWN"; // SHUTDOWN, BOOT, INIT, READY, SUSPENDED, SAFE_MODE
        
        // A) RUNTIME REGISTRY & MODULE HEALTH
        this._registry = new Map();
        this._moduleHealth = new Map();
        
        // B) DEPENDENCY GRAPH
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

        // C) PRIORITY SCHEDULER QUEUES
        this.priorityQueues = {
            CRITICAL: new Set(['sentinel-bus', 'sentinel-core']),
            HIGH:     new Set(['sentinel-performance', 'sentinel-renderer', 'engine-xr']),
            NORMAL:   new Set(['attention-manager', 'sentinel-hud']),
            LOW:      new Set(['memory-vault'])
        };

        // D) HARDWARE & FRAME PIPELINE GOVERNANCE
        this.hardwareGovernance = {
            gpuBudgetMs: 11.11, // Alvo estrito para 90Hz estáveis
            currentGpuLoadMs: 0.0,
            thermalState: 'NOMINAL', // NOMINAL, ELEVATED, CRITICAL, THROTTLED
            xrLatencyMs: 0.0,
            schedulerPriority: 'DETERMINISTIC',
            activeGraphicsProfile: 'ULTRA_XR' // ULTRA_XR, MED_XR, LOW_POWER
        };

        // E) SOBERAN KERNEL CLOCK
        this.kernelClock = {
            delta: 0,
            frame: 0,
            tick: 0,
            uptime: 0,
            _lastTime: performance.now()
        };

        // F) XR DEVICE ABSTRACTION LAYER (XR-DAL)
        this.xrProfile = {
            deviceType: 'UNKNOWN', // QUEST, MOBILE_XR, DESKTOP_XR, LINK_MODE
            foveatedRenderingLevel: 0,
            refreshRateTarget: 90
        };

        // G) RUNTIME SECURITY LAYER
        this.securityPolicy = {
            trustedModules: new Set([
                'sentinel-bus', 'sentinel-core', 'sentinel-performance', 
                'sentinel-renderer', 'attention-manager', 'memory-vault', 
                'engine-xr', 'sentinel-hud'
            ]),
            enforceSignatures: true
        };

        // H) LIFECYCLE AND INTERRUPT HANDLES
        this._bootLock = false;
        this.bus = null;
        this.watchdogInterval = null;
        this.memoryMonitorInterval = null;
        this._clockAnimationId = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INTERFACE DE REGISTRO E VALIDAÇÃO DE CONTRATOS ESTREITOS
    // ═══════════════════════════════════════════════════════════════════════
    registerModule(name, instance) {
        if (!name || !instance) {
            this.trace('REGISTRY', 'ERROR', 'Tentativa de registro inválida: Nome ou instância nulos.');
            return false;
        }

        // Validação de Segurança de Origem
        if (this.securityPolicy.enforceSignatures && !this.securityPolicy.trustedModules.has(name)) {
            this.trace('SECURITY', 'CRITICAL', `Bloqueio de Injeção: Módulo [${name}] não listado na política confiável.`);
            return false;
        }

        // Validação de Contrato Estrito (Padrão Unificado)
        if (!this.validateModuleContract(name, instance)) {
            this.trace('REGISTRY', 'ERROR', `Módulo [${name}] rejeitado por violação de contrato de runtime (initialize/heartbeat/shutdown).`);
            return false;
        }

        this._registry.set(name, instance);
        this._moduleHealth.set(name, {
            status: 'REGISTERED',
            failureCount: 0,
            lastHeartbeat: performance.now(),
            recoveryAttempts: 0,
            priority: this._getModulePriority(name)
        });
        this.trace('REGISTRY', 'INFO', `Módulo catalogado com sucesso: [${name}]`);
        return true;
    }

    validateModuleContract(name, instance) {
        const requiredMethods = ['initialize', 'heartbeat', 'shutdown'];
        for (const method of requiredMethods) {
            if (typeof instance[method] !== 'function') {
                this.trace('CONTRACT', 'WARN', `Módulo [${name}] falhou na validação. Método ausente: ${method}()`);
                return false;
            }
        }
        return true;
    }

    _getModulePriority(name) {
        for (const [priority, modules] of Object.entries(this.priorityQueues)) {
            if (modules.has(name)) return priority;
        }
        return 'NORMAL';
    }

    getModule(name) { return this._registry.get(name); }
    hasModule(name) { return this._registry.has(name); }
    getModuleStatus(name) { return this._moduleHealth.get(name) || null; }

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
    // AUTO-DESCOBERTA DE MÓDULOS (MODULE AUTO-DISCOVERY)
    // ═══════════════════════════════════════════════════════════════════════
    discoverModules() {
        this.trace('DISCOVERY', 'INFO', 'Iniciando varredura autônoma no escopo Global e WebXR Runtime.');
        
        const targets = {
            'sentinel-bus': window.SentinelBus,
            'sentinel-core': window.SentinelCore,
            'sentinel-performance': window.SentinelPerformance,
            'sentinel-renderer': window.SentinelRenderer,
            'attention-manager': window.SentinelAttention,
            'memory-vault': window.SentinelMemory,
            'engine-xr': window.XRSceneRuntime,
            'sentinel-hud': window.SentinelHUD
        };

        for (const [name, instance] of Object.entries(targets)) {
            if (instance && !this.hasModule(name)) {
                this.trace('DISCOVERY', 'INFO', `Instância autônoma interceptada no escopo global: [${name}]`);
                this.registerModule(name, instance);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ORQUESTRADOR DO CICLO DE VIDA COM HANDSHAKE ASSÍNCRONO
    // ═══════════════════════════════════════════════════════════════════════
    async boot() {
        if (this._bootLock) {
            this.trace('BOOT', 'WARN', 'Ignorando chamada de inicialização duplicada. Kernel já em execução.');
            return false;
        }
        this._bootLock = true;
        this.trace('KERNEL', 'INFO', '=== INICIANDO HANDSHAKE DE TRANSIÇÃO DA ORDEM SOBERANA v9.5 ===');

        this.discoverModules();
        this.detectXRProfile();

        try {
            await this.bootPhase('BOOT');
            this.bus = window.SentinelBus || this.getModule('sentinel-bus');

            await this.bootPhase('INIT');
            this._bindCoreEvents();

            await this.bootPhase('READY');
            
            this.startWatchdog();
            this._startKernelClock();
            this._setupMemoryPressureEngine();
            
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
        this.trace('SCHEDULER', 'INFO', 'Iniciando execução ordenada por prioridades de fila.');
        const order = ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'];
        
        for (const priority of order) {
            for (const moduleName of Object.keys(this.dependencies)) {
                if (this._getModulePriority(moduleName) === priority) {
                    await this.loadModule(moduleName);
                }
            }
        }
    }

    async loadModule(name) {
        const health = this._moduleHealth.get(name);
        if (!health) {
            this.trace('SCHEDULER', 'WARN', `Aviso: [${name}] ausente do Registry físico durante o sequenciamento.`);
            return;
        }

        const deps = this.dependencies[name] || [];
        for (const dep of deps) {
            const depHealth = this._moduleHealth.get(dep);
            if (!depHealth || (depHealth.status !== 'INITIALIZED' && depHealth.status !== 'REGISTERED')) {
                throw new Error(`Quebra de integridade de grafo para o módulo: ${name} (Falta dep: ${dep})`);
            }
        }

        try {
            const instance = this._registry.get(name);
            
            if (instance && typeof instance.initialize === 'function') {
                await instance.initialize();
            }

            health.status = 'INITIALIZED';
            health.lastHeartbeat = performance.now();
            health.recoveryAttempts = 0; // RESET CRÍTICO: Módulo recuperado limpa seu histórico de falhas
            this.trace('SCHEDULER', 'INFO', `Nó de runtime estabilizado (${health.priority}): [${name}]`);
        } catch (err) {
            health.status = 'FAULTY';
            health.failureCount++;
            this.trace('SCHEDULER', 'ERROR', `Falha ao acionar ativação no nó [${name}]: ${err.message}`);
            this.recoverModule(name);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SOBERAN KERNEL CLOCK ENGINE
    // ═══════════════════════════════════════════════════════════════════════
    _startKernelClock() {
        if (this._clockAnimationId) cancelAnimationFrame(this._clockAnimationId);
        
        const runClock = (now) => {
            this.kernelClock.delta = now - this.kernelClock._lastTime;
            this.kernelClock.uptime = now;
            this.kernelClock.frame++;
            
            if (this.kernelClock.frame % 60 === 0) {
                this.kernelClock.tick++;
            }
            
            this.kernelClock._lastTime = now;
            
            this.beforeFrame();
            this.afterFrame();

            if (this.activePhase !== 'SAFE_MODE' && this.activePhase !== 'SHUTDOWN') {
                this._clockAnimationId = requestAnimationFrame(runClock);
            }
        };
        this._clockAnimationId = requestAnimationFrame(runClock);
    }

    beforeFrame() {}

    afterFrame() {
        this.regulateFrameBudget();
    }

    regulateFrameBudget() {
        if (this.hardwareGovernance.currentGpuLoadMs > this.hardwareGovernance.gpuBudgetMs) {
            if (this.hardwareGovernance.activeGraphicsProfile === 'ULTRA_XR') {
                this.hardwareGovernance.activeGraphicsProfile = 'MED_XR';
                this.trace('FRAME_GOVERNOR', 'WARN', 'Degradação Dinâmica: Perfil gráfico rebaixado para MED_XR.');
                this._applyGraphicsProfile('MED_XR');
            } else if (this.hardwareGovernance.activeGraphicsProfile === 'MED_XR') {
                this.hardwareGovernance.activeGraphicsProfile = 'LOW_POWER';
                this.trace('FRAME_GOVERNOR', 'CRITICAL', 'Orçamento estourado continuamente. Forçando Perfil LOW_POWER.');
                this._applyGraphicsProfile('LOW_POWER');
            }
        }
    }

    _applyGraphicsProfile(profile) {
        if (this.bus) {
            this.bus.emit('renderer:pipeline:degrade', { profile, timestamp: this.kernelClock.uptime });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MEMORY PRESSURE ENGINE (POLÍTICA DE EVICTION)
    // ═══════════════════════════════════════════════════════════════════════
    _setupMemoryPressureEngine() {
        if (this.memoryMonitorInterval) clearInterval(this.memoryMonitorInterval);
        this.memoryMonitorInterval = setInterval(() => {
            this.monitorMemoryPressure();
        }, 4000); 
    }

    monitorMemoryPressure() {
        if (window.performance && window.performance.memory) {
            const memory = window.performance.memory;
            const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

            if (usageRatio > 0.80) {
                this.trace('MEMORY', 'CRITICAL', `Pressão de Heap Crítica: ${(usageRatio * 100).toFixed(2)}%. Forçando purga de texturas.`);
                if (this.bus) this.bus.emit('memory:eviction:purge', { forceGeometryPurge: true });
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // XR DEVICE ABSTRACTION LAYER (XR-DAL)
    // ═══════════════════════════════════════════════════════════════════════
    detectXRProfile() {
        const ua = navigator.userAgent.toLowerCase();
        
        if (ua.includes('oculus') || ua.includes('quest')) {
            this.xrProfile.deviceType = 'QUEST';
            this.xrProfile.foveatedRenderingLevel = 3;
            this.xrProfile.refreshRateTarget = 90;
        } else if (/android|iphone|ipad/.test(ua)) {
            this.xrProfile.deviceType = 'MOBILE_XR';
            this.xrProfile.foveatedRenderingLevel = 1;
            this.xrProfile.refreshRateTarget = 60;
        } else {
            this.xrProfile.deviceType = 'DESKTOP_XR';
            this.xrProfile.foveatedRenderingLevel = 0;
            this.xrProfile.refreshRateTarget = 120;
        }

        this.hardwareGovernance.gpuBudgetMs = 1000 / this.xrProfile.refreshRateTarget;
        this.trace('XR-DAL', 'INFO', `Perfil de hardware detectado: [${this.xrProfile.deviceType}]. Target: ${this.xrProfile.refreshRateTarget}Hz (Budget: ${this.hardwareGovernance.gpuBudgetMs.toFixed(2)}ms)`);
    }

    validateEventOrigin(eventName, sourceModuleName) {
        if (!sourceModuleName) return false;
        if (!this.securityPolicy.trustedModules.has(sourceModuleName)) {
            this.trace('SECURITY', 'WARN', `Origem de evento rejeitada. Canal [${eventName}] disparado por nó não confiável: [${sourceModuleName}]`);
            return false;
        }
        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WATCHDOG THREAD PROTECTION
    // ═══════════════════════════════════════════════════════════════════════
    startWatchdog() {
        if (this.watchdogInterval) clearInterval(this.watchdogInterval);

        this.watchdogInterval = setInterval(() => {
            const now = performance.now();
            this._moduleHealth.forEach((meta, name) => {
                if (meta.status === 'REGISTERED') return;

                const delta = now - meta.lastHeartbeat;
                if (delta > 5000) { 
                    this.trace('WATCHDOG', 'WARN', `Heartbeat perdido do módulo [${name}]. Delta: ${delta.toFixed(2)}ms`);
                    meta.status = 'STALE';
                    this.recoverModule(name);
                }
            });
        }, 2000);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RECOVERY ENGINE
    // ═══════════════════════════════════════════════════════════════════════
    recoverModule(name) {
        const health = this._moduleHealth.get(name);
        if (!health) return;

        if (health.recoveryAttempts >= 3) {
            this.trace('RECOVERY', 'CRITICAL', `Módulo [${name}] excedeu o teto de tolerância.`);
            this.recoverRuntime();
            return;
        }

        health.recoveryAttempts++;
        this.trace('RECOVERY', 'WARN', `Tentativa de auto-recuperação cirúrgica [${health.recoveryAttempts}/3] no nó: [${name}]`);
        
        setTimeout(() => {
            if (this.activePhase !== 'SAFE_MODE' && this.activePhase !== 'SHUTDOWN') {
                this.loadModule(name);
            }
        }, 150 * health.recoveryAttempts);
    }

    recoverRuntime() {
        this.trace('RECOVERY', 'CRITICAL', 'Instabilidade detectada. Analisando árvore de dependências.');
        let absoluteCollapse = false;

        this._moduleHealth.forEach((meta, name) => {
            if (meta.status === 'FAULTY' || meta.status === 'STALE') {
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

    // ═══════════════════════════════════════════════════════════════════════
    // SAFE MODE ISOLATION (BLOQUEIO TOTAL DE PROCESSOS ÓRFÃOS)
    // ═══════════════════════════════════════════════════════════════════════
    enterSafeMode(reason) {
        this.activePhase = "SAFE_MODE";
        this.hardwareGovernance.schedulerPriority = 'RECOVERY_CRITICAL';
        
        // ISOLAMENTO TERMINAL: Interrompe todos os loops assíncronos e paralisa agendadores
        if (this._clockAnimationId) {
            cancelAnimationFrame(this._clockAnimationId);
            this._clockAnimationId = null;
        }
        if (this.watchdogInterval) {
            clearInterval(this.watchdogInterval);
            this.watchdogInterval = null;
        }
        if (this.memoryMonitorInterval) {
            clearInterval(this.memoryMonitorInterval);
            this.memoryMonitorInterval = null;
        }

        this.trace('KERNEL', 'CRITICAL', `[MODO SEGURO ATIVADO] Motivo: ${reason}. Motores asincronos paralisados.`);
        
        if (this.bus) {
            this.bus.emit('kernel:emergency_fallback', { reason: reason, ts: performance.now() });
            this.bus.emit('system:nsdr-trigger'); 
        }
    }

    onBoot() { this.trace('LIFECYCLE', 'INFO', 'Contratos de Boot assinados. Alocando buffers.'); }
    onReady() { 
        this.trace('LIFECYCLE', 'INFO', 'Sistema síncrono. Lock de performance liberado.'); 
        if (this.bus) this.bus.emit('system:boot-complete');
    }

    suspend() {
        if (this.activePhase === 'SUSPENDED') return;
        this.activePhase = 'SUSPENDED';
        this.trace('LIFECYCLE', 'WARN', 'Metabolismo em modo passivo. Loops secundários suprimidos.');
        if (this.bus) this.bus.emit('kernel:suspended');
    }

    shutdown() {
        this.activePhase = 'SHUTDOWN';
        
        if (this.watchdogInterval) clearInterval(this.watchdogInterval);
        if (this.memoryMonitorInterval) clearInterval(this.memoryMonitorInterval);
        if (this._clockAnimationId) cancelAnimationFrame(this._clockAnimationId);
        
        this.watchdogInterval = null;
        this.memoryMonitorInterval = null;
        this._clockAnimationId = null;

        // Executa encerramento limpo seguindo o contrato oficial de cada módulo
        this._registry.forEach((instance, name) => {
            if (instance && typeof instance.shutdown === 'function') {
                try {
                    instance.shutdown();
                    this.trace('SHUTDOWN', 'INFO', `Módulo destruído de forma limpa: [${name}]`);
                } catch (e) {
                    this.trace('SHUTDOWN', 'ERROR', `Erro ao encerrar módulo [${name}]: ${e.message}`);
                }
            }
        });

        this._registry.clear();
        this._moduleHealth.clear();
        this._bootLock = false;
        this.trace('KERNEL', 'INFO', 'Runtime completamente limpo. Desalocação concluída.');
    }

    updateHardwareTelemetry(metrics) {
        if (!metrics) return;
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
        if (metrics.frameExecutionTimeMs) {
            this.hardwareGovernance.currentGpuLoadMs = metrics.frameExecutionTimeMs;
        }
    }

    enforceThermalThrottling() {
        this.trace('THERMAL_GOVERNANCE', 'CRITICAL', 'Proteção de silício ativada. Comprimindo ciclos do Scheduler.');
        if (this.bus) {
            this.bus.emit('nexus:command', {
                command: 'APPLY_DEGRADATION_PROFILE',
                payload: { profile: 'LOW_POWER' },
                source: 'KERNEL_THERMAL_GOVERNOR'
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRACE ENGINE COM FILTRAGEM E SEVERIDADE OPERACIONAL
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
        this._moduleHealth.forEach((meta, name) => { snapshot[name] = { ...meta }; });
        return snapshot;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BUS HEARTBEAT PROPAGATION & TELEMETRY LINK
    // ═══════════════════════════════════════════════════════════════════════
    _bindCoreEvents() {
        if (!this.bus) return;

        // Ingestão centralizada de heartbeats via barramento assíncrono
        this.bus.on('kernel:heartbeat', (payload) => {
            if (payload && payload.module) {
                this.heartbeat(payload.module);
            }
        });

        this.bus.on('performance:diagnostics', (telemetry) => {
            if (telemetry) {
                this.updateHardwareTelemetry({
                    frameExecutionTimeMs: telemetry.frameTime,
                    fps: telemetry.fps,
                    thermalTemperature: telemetry.cpuLoad ? telemetry.cpuLoad * 0.8 : 35
                });
            }
        });
    }
}

const SovereignKernel = new SentinelKernel();
window.SovereignKernel = SovereignKernel;
export default SovereignKernel;
