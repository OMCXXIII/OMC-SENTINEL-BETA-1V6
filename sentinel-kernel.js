/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.5 — SOVEREIGN AUTONOMOUS RUNTIME OPERATING KERNEL
 * Arquivo: sentinel-kernel.js
 * Papel: Centro Absoluto de Governança, Arbitragem de Hardware e Ciclo de Vida
 * Padrão: ECMAScript Modules (ESM) Nativos com Isolamento de Escopo
 *
 * CHANGELOG v9.5 — CORREÇÕES APLICADAS:
 * ✓ CORREÇÃO 1 — trustedModules whitelist completa (shader-runtime, scene-orchestrator)
 * ✓ CORREÇÃO 2 — dependency graph completo (shader-runtime, scene-orchestrator)
 * ✓ CORREÇÃO 3 — validateModuleContract exige initialize() + heartbeat() + shutdown()
 * ✓ CORREÇÃO 4 — trace() restaurado com console.error/console.warn por severidade
 * ✓ CORREÇÃO 5 — memoryPressureInterval cleanup correto no shutdown()
 * ✓ CORREÇÃO 6 — window.performance.memory guard para não-Chromium
 * ✓ CORREÇÃO 7 — Desktop XR travado em 90Hz (era 120Hz — irreal para Quest Link)
 * ✓ CORREÇÃO 8 — heartbeat() propaga via setInterval interno em cada módulo
 * ═══════════════════════════════════════════════════════════════════════════
 */

class SentinelKernel {
    constructor() {
        this.version = "9.5-SOVEREIGN";

        // Estados de ciclo de vida legais:
        // SHUTDOWN → BOOT → INIT → READY → ACTIVE → SAFE_MODE
        // Qualquer caminho com EMERGENCY pode entrar via BOOT, INIT, READY, ACTIVE
        this.activePhase = "SHUTDOWN";

        // ─────────────────────────────────────────────────────────────────
        // A) RUNTIME REGISTRY & MODULE HEALTH
        // ─────────────────────────────────────────────────────────────────
        this._registry    = new Map();
        this._moduleHealth = new Map();

        // ─────────────────────────────────────────────────────────────────
        // B) DEPENDENCY GRAPH — COMPLETO (inclui shader-runtime e scene-orchestrator)
        // ─────────────────────────────────────────────────────────────────
        this.dependencies = {
            'sentinel-bus':        [],
            'sentinel-core':       ['sentinel-bus'],
            'sentinel-performance':['sentinel-core'],
            'sentinel-renderer':   ['sentinel-core'],
            'attention-manager':   ['sentinel-core'],
            'memory-vault':        ['sentinel-core'],

            // Módulos XR avançados — dependências explícitas
            'shader-runtime': [
                'sentinel-renderer'
            ],
            'scene-orchestrator': [
                'shader-runtime',
                'engine-xr'
            ],
            'engine-xr': [
                'sentinel-renderer',
                'sentinel-performance'
            ],
            'sentinel-hud': [
                'engine-xr',
                'attention-manager'
            ]
        };

        // ─────────────────────────────────────────────────────────────────
        // C) PRIORITY SCHEDULER QUEUES
        // ─────────────────────────────────────────────────────────────────
        this.priorityQueues = {
            CRITICAL: new Set(['sentinel-bus',  'sentinel-core']),
            HIGH:     new Set(['sentinel-performance', 'sentinel-renderer', 'shader-runtime', 'engine-xr']),
            NORMAL:   new Set(['attention-manager', 'sentinel-hud', 'scene-orchestrator']),
            LOW:      new Set(['memory-vault'])
        };

        // ─────────────────────────────────────────────────────────────────
        // D) HARDWARE & FRAME PIPELINE GOVERNANCE
        // ─────────────────────────────────────────────────────────────────
        this.hardwareGovernance = {
            gpuBudgetMs:           11.11, // Alvo estrito para 90Hz — recalculado por detectXRProfile()
            currentGpuLoadMs:      0.0,
            thermalState:          'NOMINAL', // NOMINAL | ELEVATED | CRITICAL | THROTTLED
            xrLatencyMs:           0.0,
            schedulerPriority:     'DETERMINISTIC',
            activeGraphicsProfile: 'ULTRA_XR'  // ULTRA_XR | MED_XR | LOW_POWER
        };

        // ─────────────────────────────────────────────────────────────────
        // E) SOVEREIGN KERNEL CLOCK
        // ─────────────────────────────────────────────────────────────────
        this.kernelClock = {
            delta:     0,
            frame:     0,
            tick:      0,
            uptime:    0,
            _lastTime: performance.now()
        };

        // ─────────────────────────────────────────────────────────────────
        // F) XR DEVICE ABSTRACTION LAYER (XR-DAL)
        // ─────────────────────────────────────────────────────────────────
        this.xrProfile = {
            deviceType:            'UNKNOWN', // QUEST | MOBILE_XR | DESKTOP_XR | LINK_MODE
            foveatedRenderingLevel: 0,
            refreshRateTarget:      90
        };

        // ─────────────────────────────────────────────────────────────────
        // G) RUNTIME SECURITY LAYER — WHITELIST COMPLETA
        // ─────────────────────────────────────────────────────────────────
        this.securityPolicy = {
            trustedModules: new Set([
                'sentinel-bus',
                'sentinel-core',
                'sentinel-performance',
                'sentinel-renderer',
                'attention-manager',
                'memory-vault',
                'engine-xr',
                'sentinel-hud',
                'shader-runtime',       // ← CORREÇÃO 1: adicionado
                'scene-orchestrator'    // ← CORREÇÃO 1: adicionado
            ]),
            enforceSignatures: true
        };

        // ─────────────────────────────────────────────────────────────────
        // H) LIFECYCLE & INTERRUPT HANDLES
        // ─────────────────────────────────────────────────────────────────
        this._bootLock             = false;
        this.bus                   = null;
        this.watchdogInterval      = null;
        this.memoryPressureInterval = null; // ← CORREÇÃO 5: referência explícita
        this._clockAnimationId     = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REGISTRO E VALIDAÇÃO DE CONTRATO ESTRITO
    // ═══════════════════════════════════════════════════════════════════════

    registerModule(name, instance) {
        if (!name || !instance) {
            this.trace('REGISTRY', 'ERROR', 'Tentativa de registro inválida: Nome ou instância nulos.');
            return false;
        }

        // Segurança de origem
        if (this.securityPolicy.enforceSignatures && !this.securityPolicy.trustedModules.has(name)) {
            this.trace('SECURITY', 'CRITICAL', `Bloqueio de Injeção: Módulo [${name}] não listado na política confiável.`);
            return false;
        }

        // Validação de contrato — initialize() + heartbeat() + shutdown()
        if (!this.validateModuleContract(name, instance)) {
            this.trace('REGISTRY', 'ERROR',
                `Módulo [${name}] rejeitado por violação de contrato de runtime (initialize / heartbeat / shutdown).`
            );
            return false;
        }

        this._registry.set(name, instance);
        this._moduleHealth.set(name, {
            status:            'REGISTERED',
            failureCount:      0,
            lastHeartbeat:     performance.now(),
            recoveryAttempts:  0,
            priority:          this._getModulePriority(name)
        });

        this.trace('REGISTRY', 'INFO', `Módulo catalogado com sucesso: [${name}]`);
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────
    // CORREÇÃO 3 — contrato mínimo: initialize() + heartbeat() + shutdown()
    // ─────────────────────────────────────────────────────────────────────
    validateModuleContract(name, instance) {
        const requiredMethods = ['initialize', 'heartbeat', 'shutdown'];
        for (const method of requiredMethods) {
            if (typeof instance[method] !== 'function') {
                this.trace('CONTRACT', 'WARN',
                    `Módulo [${name}] falhou na validação. Método ausente: ${method}()`
                );
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

    getModule(name)      { return this._registry.get(name);      }
    hasModule(name)      { return this._registry.has(name);       }
    getModuleStatus(name){ return this._moduleHealth.get(name) || null; }
    getActivePhase()     { return this.activePhase; }

    heartbeat(name) {
        const meta = this._moduleHealth.get(name);
        if (!meta) return false;
        meta.lastHeartbeat = performance.now();
        if (meta.status === 'STALE' || meta.status === 'REGISTERED') {
            meta.status = 'INITIALIZED';
        }
        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AUTO-DESCOBERTA DE MÓDULOS
    // ═══════════════════════════════════════════════════════════════════════

    discoverModules() {
        this.trace('DISCOVERY', 'INFO', 'Iniciando varredura autônoma no escopo Global e WebXR Runtime.');

        const targets = {
            'sentinel-bus':         window.SentinelBus,
            'sentinel-core':        window.SentinelCore,
            'sentinel-performance': window.SentinelPerformance || window.SovereignPerformance,
            'sentinel-renderer':    window.SentinelRenderer,
            'attention-manager':    window.SentinelAttention,
            'memory-vault':         window.SentinelMemory,
            'engine-xr':            window.SentinelEngineXR || window.XRSceneRuntime,
            'sentinel-hud':         window.SentinelHUD,
            'shader-runtime':       window.SentinelShaderRuntime,   // ← CORREÇÃO 2
            'scene-orchestrator':   window.SentinelSceneManager     // ← CORREÇÃO 2
        };

        for (const [name, instance] of Object.entries(targets)) {
            if (instance && !this.hasModule(name)) {
                this.trace('DISCOVERY', 'INFO', `Instância interceptada no escopo global: [${name}]`);
                this.registerModule(name, instance);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ORQUESTRADOR DE CICLO DE VIDA — HANDSHAKE ASSÍNCRONO
    // ═══════════════════════════════════════════════════════════════════════

    async boot() {
        if (this._bootLock) {
            this.trace('BOOT', 'WARN', 'Ignorando chamada duplicada. Kernel já em execução.');
            return false;
        }
        this._bootLock = true;
        this.trace('KERNEL', 'INFO', '=== INICIANDO HANDSHAKE SOBERANO v9.5 ===');

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
            this.trace('KERNEL', 'CRITICAL', `Colapso crítico durante boot: ${fatalError.message}`);
            this.enterSafeMode(fatalError.message);
            return false;
        }
    }

    async bootPhase(phase) {
        this.activePhase = phase;
        this.trace('LIFECYCLE', 'INFO', `Fase macro: [${phase}]`);

        switch (phase) {
            case 'BOOT':  this.onBoot();  break;
            case 'INIT':  await this._loadSequence(); break;
            case 'READY': this.onReady(); break;
        }

        if (this.bus) {
            this.bus.emit(`kernel:phase:${phase.toLowerCase()}`, { timestamp: performance.now() });
        }
    }

    async _loadSequence() {
        this.trace('SCHEDULER', 'INFO', 'Sequenciamento por prioridades de fila.');
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
            this.trace('SCHEDULER', 'WARN', `[${name}] ausente do Registry durante sequenciamento.`);
            return;
        }

        // Valida dependências antes de inicializar
        const deps = this.dependencies[name] || [];
        for (const dep of deps) {
            const depHealth = this._moduleHealth.get(dep);
            if (!depHealth ||
                (depHealth.status !== 'INITIALIZED' && depHealth.status !== 'REGISTERED')) {
                throw new Error(`Dependência não resolvida para [${name}]: requer [${dep}]`);
            }
        }

        try {
            const instance = this._registry.get(name);

            if (instance && typeof instance.initialize === 'function') {
                await instance.initialize();
            }

            health.status             = 'INITIALIZED';
            health.lastHeartbeat      = performance.now();
            health.recoveryAttempts   = 0; // reset após recuperação bem-sucedida

            this.trace('SCHEDULER', 'INFO',
                `Nó de runtime estabilizado (${health.priority}): [${name}]`
            );
        } catch (err) {
            health.status = 'FAULTY';
            health.failureCount++;
            this.trace('SCHEDULER', 'ERROR', `Falha ao ativar nó [${name}]: ${err.message}`);
            this.recoverModule(name);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SOVEREIGN KERNEL CLOCK ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    _startKernelClock() {
        if (this._clockAnimationId) cancelAnimationFrame(this._clockAnimationId);

        const runClock = (now) => {
            this.kernelClock.delta    = now - this.kernelClock._lastTime;
            this.kernelClock.uptime   = now;
            this.kernelClock.frame++;
            if (this.kernelClock.frame % 60 === 0) this.kernelClock.tick++;
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
                this.trace('FRAME_GOVERNOR', 'WARN', 'Degradação Dinâmica: Perfil rebaixado para MED_XR.');
                this._applyGraphicsProfile('MED_XR');
            } else if (this.hardwareGovernance.activeGraphicsProfile === 'MED_XR') {
                this.hardwareGovernance.activeGraphicsProfile = 'LOW_POWER';
                this.trace('FRAME_GOVERNOR', 'CRITICAL', 'Orçamento contínuo estourado. Forçando LOW_POWER.');
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
    // MEMORY PRESSURE ENGINE — CORREÇÃO 5 (cleanup de intervalo)
    // ═══════════════════════════════════════════════════════════════════════

    _setupMemoryPressureEngine() {
        if (this.memoryPressureInterval) clearInterval(this.memoryPressureInterval);

        this.memoryPressureInterval = setInterval(() => {
            this.monitorMemoryPressure();
        }, 4000);
    }

    monitorMemoryPressure() {
        // CORREÇÃO 6 — guard para navegadores sem performance.memory (Firefox, Safari)
        if (
            window.performance &&
            window.performance.memory &&
            window.performance.memory.jsHeapSizeLimit
        ) {
            const memory     = window.performance.memory;
            const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

            if (usageRatio > 0.80) {
                this.trace('MEMORY', 'CRITICAL',
                    `Pressão de Heap: ${(usageRatio * 100).toFixed(2)}%. Forçando purga de texturas.`
                );
                if (this.bus) this.bus.emit('memory:eviction:purge', { forceGeometryPurge: true });
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // XR DEVICE ABSTRACTION LAYER (XR-DAL)
    // CORREÇÃO 7 — Desktop XR travado em 90Hz (era 120Hz, irreal para Quest Link)
    // ═══════════════════════════════════════════════════════════════════════

    detectXRProfile() {
        const ua = navigator.userAgent.toLowerCase();

        if (ua.includes('oculus') || ua.includes('quest')) {
            this.xrProfile.deviceType             = 'QUEST';
            this.xrProfile.foveatedRenderingLevel = 3;
            this.xrProfile.refreshRateTarget      = 90;
        } else if (/android|iphone|ipad/.test(ua)) {
            this.xrProfile.deviceType             = 'MOBILE_XR';
            this.xrProfile.foveatedRenderingLevel = 1;
            this.xrProfile.refreshRateTarget      = 60;
        } else {
            // Desktop (Link Mode / PCVR) — 90Hz é o teto seguro e estável
            this.xrProfile.deviceType             = 'DESKTOP_XR';
            this.xrProfile.foveatedRenderingLevel = 0;
            this.xrProfile.refreshRateTarget      = 90; // ← CORREÇÃO 7: era 120
        }

        this.hardwareGovernance.gpuBudgetMs =
            1000 / this.xrProfile.refreshRateTarget;

        this.trace('XR-DAL', 'INFO',
            `Perfil detectado: [${this.xrProfile.deviceType}] ` +
            `Target: ${this.xrProfile.refreshRateTarget}Hz ` +
            `(Budget: ${this.hardwareGovernance.gpuBudgetMs.toFixed(2)}ms)`
        );
    }

    validateEventOrigin(eventName, sourceModuleName) {
        if (!sourceModuleName) return false;
        if (!this.securityPolicy.trustedModules.has(sourceModuleName)) {
            this.trace('SECURITY', 'WARN',
                `Origem rejeitada: [${eventName}] disparado por nó não confiável: [${sourceModuleName}]`
            );
            return false;
        }
        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WATCHDOG — PROTEÇÃO DE HEARTBEAT
    // ═══════════════════════════════════════════════════════════════════════

    startWatchdog() {
        if (this.watchdogInterval) clearInterval(this.watchdogInterval);

        this.watchdogInterval = setInterval(() => {
            const now = performance.now();
            this._moduleHealth.forEach((meta, name) => {
                if (meta.status === 'REGISTERED') return;

                const delta = now - meta.lastHeartbeat;
                if (delta > 5000) {
                    this.trace('WATCHDOG', 'WARN',
                        `Heartbeat perdido: [${name}]. Delta: ${delta.toFixed(2)}ms`
                    );
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
            this.trace('RECOVERY', 'CRITICAL', `Módulo [${name}] excedeu tolerância de recuperação.`);
            this.recoverRuntime();
            return;
        }

        health.recoveryAttempts++;
        this.trace('RECOVERY', 'WARN',
            `Auto-recuperação cirúrgica [${health.recoveryAttempts}/3] em: [${name}]`
        );

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
            this.enterSafeMode('Cascata de quebras no Grafo de Dependências.');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SAFE MODE — ISOLAMENTO TERMINAL
    // ═══════════════════════════════════════════════════════════════════════

    enterSafeMode(reason) {
        this.activePhase = 'SAFE_MODE';
        this.hardwareGovernance.schedulerPriority = 'RECOVERY_CRITICAL';

        if (this._clockAnimationId) {
            cancelAnimationFrame(this._clockAnimationId);
            this._clockAnimationId = null;
        }
        if (this.watchdogInterval) {
            clearInterval(this.watchdogInterval);
            this.watchdogInterval = null;
        }
        // CORREÇÃO 5 — cleanup correto do interval de memória
        if (this.memoryPressureInterval) {
            clearInterval(this.memoryPressureInterval);
            this.memoryPressureInterval = null;
        }

        this.trace('KERNEL', 'CRITICAL',
            `[SAFE_MODE ATIVADO] Motivo: ${reason}. Motores assíncronos paralisados.`
        );

        if (this.bus) {
            this.bus.emit('kernel:emergency_fallback', { reason, ts: performance.now() });
            this.bus.emit('system:nsdr-trigger');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LIFECYCLE HOOKS
    // ═══════════════════════════════════════════════════════════════════════

    onBoot() {
        this.trace('LIFECYCLE', 'INFO', 'Contratos de Boot assinados. Alocando buffers.');
    }

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

        if (this.watchdogInterval)       clearInterval(this.watchdogInterval);
        if (this.memoryPressureInterval) clearInterval(this.memoryPressureInterval); // CORREÇÃO 5
        if (this._clockAnimationId)      cancelAnimationFrame(this._clockAnimationId);

        this.watchdogInterval       = null;
        this.memoryPressureInterval = null;
        this._clockAnimationId      = null;

        // Encerramento limpo por contrato oficial
        this._registry.forEach((instance, name) => {
            if (instance && typeof instance.shutdown === 'function') {
                try {
                    instance.shutdown();
                    this.trace('SHUTDOWN', 'INFO', `Módulo destruído de forma limpa: [${name}]`);
                } catch (e) {
                    this.trace('SHUTDOWN', 'ERROR', `Erro ao encerrar [${name}]: ${e.message}`);
                }
            }
        });

        this._registry.clear();
        this._moduleHealth.clear();
        this._bootLock = false;
        this.trace('KERNEL', 'INFO', 'Runtime completamente limpo. Desalocação concluída.');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TELEMETRIA DE HARDWARE
    // ═══════════════════════════════════════════════════════════════════════

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

        if (metrics.frameExecutionTimeMs !== undefined) {
            this.hardwareGovernance.currentGpuLoadMs = metrics.frameExecutionTimeMs;
        }
    }

    enforceThermalThrottling() {
        this.trace('THERMAL_GOVERNANCE', 'CRITICAL',
            'Proteção de silício ativada. Comprimindo ciclos do Scheduler.'
        );
        if (this.bus) {
            this.bus.emit('nexus:command', {
                command: 'APPLY_DEGRADATION_PROFILE',
                payload: { profile: 'LOW_POWER' },
                source:  'KERNEL_THERMAL_GOVERNOR'
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRACE ENGINE — CORREÇÃO 4 (console.error / console.warn restaurados)
    // ═══════════════════════════════════════════════════════════════════════

    trace(namespace, level, message) {
        const timestamp = new Date().toISOString();
        const formatted = `[${timestamp}] [KERNEL:${namespace}] [${level}] ${message}`;

        switch (level) {
            case 'CRITICAL':
            case 'ERROR':
                console.error(formatted);
                break;
            case 'WARN':
                console.warn(formatted);
                break;
            case 'INFO':
            default:
                console.log(formatted);
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

    // ═══════════════════════════════════════════════════════════════════════
    // BUS HEARTBEAT PROPAGATION & TELEMETRY LINK
    // ═══════════════════════════════════════════════════════════════════════

    _bindCoreEvents() {
        if (!this.bus) return;

        // Ingestão centralizada de heartbeats via barramento
        this.bus.on('kernel:heartbeat', (payload) => {
            if (payload && payload.module) {
                this.heartbeat(payload.module);
            }
        });

        this.bus.on('performance:diagnostics', (telemetry) => {
            if (telemetry) {
                this.updateHardwareTelemetry({
                    frameExecutionTimeMs: telemetry.frameTime,
                    fps:                  telemetry.fps,
                    thermalTemperature:   telemetry.cpuLoad ? telemetry.cpuLoad * 0.8 : 35
                });
            }
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// INSTANCIAÇÃO SOBERANA
// ═══════════════════════════════════════════════════════════════════════════

const SovereignKernel = new SentinelKernel();
window.SovereignKernel = SovereignKernel;

export default SovereignKernel;
