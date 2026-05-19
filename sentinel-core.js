/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.5 — SOVEREIGN COMPOSITION INFRASTRUCTURE (CORE CORE)
 * Arquivo: sentinel-core.js
 * Papel: Service Locator, Module Bridges e Cache Atômico de Estado L1/L2
 * Governança: Subordinado diretamente ao SovereignKernel; centraliza bridges.
 * Fix: Implementação do Kernel Runtime Contract v9.5 e Auto-Registro Soberano.
 * ═══════════════════════════════════════════════════════════════════════════
 */

class SentinelCoreComposition {
    constructor() {
        this.version = "9.5-CORE-COMPOSITION";
        this.isActive = false;

        // B) SERVICE LOCATOR REGISTRY (Catálogo Centralizado de Componentes)
        this._services = new Map();

        // D) RUNTIME STATE CACHE (Memória L1 - Acesso Volátil de Velocidade < 1μs)
        this._stateCache = {
            session: { active: false, operatorId: 'OPERATOR_UNKNOWN', startTimestamp: null },
            ops: { latency: 0, mission: 'NULL', cycles: 0 },
            telemetry: { cpuLoad: 0.0, gpuFrameTimeMs: 0.0, thermalState: 'NOMINAL' },
            xr: { sessionActive: false, hmdPose: null, trackingStatus: 'OFFLINE' },
            attention: { currentFocusTarget: null, fovealSalienceScore: 1.0 }
        };

        this.ROOT_KEY = 'SENTINEL_STATE_ROOT';
        this._hydrateFromL3();
        this._trace('SYSTEM', 'Infraestrutura de Composição Core Instanciada.');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // A) RUNTIME API (PONTOS DE ENTRADA AUTORITÁRIOS)
    // ═══════════════════════════════════════════════════════════════════════
    getRuntime() {
        return {
            version: this.version,
            isActive: this.isActive,
            cache: this._stateCache,
            diagnostics: this.getDiagnostics()
        };
    }

    getKernel() {
        return window.SovereignKernel || this.getService('sentinel-kernel') || null;
    }

    getScheduler() {
        return window.SovereignTemporalScheduler || this.getService('sentinel-scheduler') || null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // B) SERVICE LOCATOR (GERENCIAMENTO DE ACOPLAMENTOS)
    // ═══════════════════════════════════════════════════════════════════════
    registerService(name, serviceInstance) {
        if (this._services.has(name)) {
            this._trace('LOCATOR', `Sobrescrevendo serviço existente no locator: [${name}]`, 'WARN');
        }
        this._services.set(name, serviceInstance);
        this._trace('LOCATOR', `Serviço indexado com sucesso no ecossistema: [${name}]`);
    }

    getService(name) {
        const service = this._services.get(name);
        if (!service) {
            this._trace('LOCATOR', `Aviso: Solicitação de serviço não registrado: [${name}]`, 'WARN');
        }
        return service;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // E) LIFECYCLE HOOKS DE ORQUESTRAÇÃO
    // ═══════════════════════════════════════════════════════════════════════
    async initializeCore() {
        this._trace('LIFECYCLE', 'Executando gancho [beforeInit] da infraestrutura...');
        this.isActive = true;

        // C) MODULE BRIDGES: Inicializa pontes de comunicação e amarra escutas do barramento
        this._establishModuleBridges();

        this._trace('LIFECYCLE', 'Infraestrutura de Composição Core totalmente estabilizada [afterInit].');
    }

    async shutdownCore() {
        this._trace('LIFECYCLE', 'Iniciando purga e congelamento de serviços de hardware...');
        this._flushToL3();
        this.isActive = false;
        this._services.clear();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // C) MODULE BRIDGES & ENGENHARIA DE PASSAGEM DE SINAIS (XR / ATTENTION / MEMORY)
    // ═══════════════════════════════════════════════════════════════════════
    _establishModuleBridges() {
        const bus = window.SentinelBus;
        if (!bus) {
            this._trace('BRIDGES', 'Barramento Nervoso ausente. Pontes operando em modo isolado.', 'WARN');
            return;
        }

        // F) XR INTEGRATION BRIDGE
        bus.on('xr:session_start', (data) => {
            this.setCacheValue('xr.sessionActive', true);
            this.setCacheValue('xr.trackingStatus', 'OPTIMAL');
            this._trace('XR_BRIDGE', 'Viewport imersivo detectado. Alocando prioridade geométrica.');
        });

        bus.on('xr:session_end', () => {
            this.setCacheValue('xr.sessionActive', false);
            this.setCacheValue('xr.trackingStatus', 'OFFLINE');
            this._trace('XR_BRIDGE', 'Sessão XR encerrada. Recuando para renderização planar.');
        });

        // G) ATTENTION BRIDGE
        bus.on('attention:focus_changed', (data) => {
            if (data && data.target) {
                this.setCacheValue('attention.currentFocusTarget', data.target);
                this.setCacheValue('attention.fovealSalienceScore', data.score || 1.0);
                
                // Propaga alteração visual mutando propriedades CSS reativas no documento
                document.documentElement.style.setProperty('--hud-focus-strength', (data.score || 1.0).toFixed(2));
            }
        });

        // H) MEMORY BRIDGE (Sincronização de Telemetria e Pulso Metabólico)
        bus.on('system:state_changed', (stateEvent) => {
            this.setCacheValue('ops.mission', stateEvent.to);
            this._flushToL3(); // Sincroniza em armazenamento secundário de forma atômica
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // D) RUNTIME STATE CACHE INTERFACES (L1/L2 ATOMIC PERFORMANCE)
    // ═══════════════════════════════════════════════════════════════════════
    getCacheValue(path) {
        return path.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : null, this._stateCache);
    }

    setCacheValue(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const targetObj = keys.reduce((obj, key) => obj[key] = obj[key] || {}, this._stateCache);
        
        if (targetObj) {
            targetObj[lastKey] = value;
            this._stateCache.ops.cycles++; // Incrementa ciclo de batimento metabólico
            return true;
        }
        return false;
    }

    _hydrateFromL3() {
        try {
            const raw = localStorage.getItem(this.ROOT_KEY);
            if (raw) {
                const hydrated = JSON.parse(raw);
                this._stateCache.session = { ...this._stateCache.session, ...hydrated.session };
                this._stateCache.ops.mission = hydrated.ops?.mission || 'NULL';
                this._trace('CACHE_L3', 'Memória não volátil L3 recuperada e injetada no Cache L1.');
            }
        } catch (e) {
            this._trace('CACHE_L3', 'Falha ao reidratar cache L3 persistente. Inicializando limpo.', 'WARN');
        }
    }

    _flushToL3() {
        try {
            const exportPayload = {
                session: this._stateCache.session,
                ops: { mission: this._stateCache.ops.mission },
                savedAt: performance.now()
            };
            localStorage.setItem(this.ROOT_KEY, JSON.stringify(exportPayload));
        } catch (e) {
            this._trace('CACHE_L3', 'Erro crítico ao descarregar L1 para L3 não-volátil.', 'ERROR');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DIAGNÓSTICO E TELEMETRIA
    // ═══════════════════════════════════════════════════════════════════════
    getDiagnostics() {
        return {
            registeredServicesCount: this._services.size,
            metabolicCycles: this._stateCache.ops.cycles,
            xrActive: this._stateCache.xr.sessionActive,
            focusTarget: this._stateCache.attention.currentFocusTarget
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // KERNEL RUNTIME CONTRACT (v9.5)
    // ═══════════════════════════════════════════════════════════════════════
    async initialize() {
        this._trace('LIFECYCLE', 'Handshake soberano do Core iniciado.');
        await this.initializeCore();
        this._trace('LIFECYCLE', 'Core estabilizado e operacional.');
        return true;
    }

    heartbeat() {
        if (window.SovereignKernel) {
            window.SovereignKernel.heartbeat('sentinel-core');
        }
        return {
            active: this.isActive,
            cycles: this._stateCache.ops.cycles,
            services: this._services.size
        };
    }

    shutdown() {
        this._trace('LIFECYCLE', 'Recebido comando soberano de shutdown.');
        this.shutdownCore();
        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRACE SYSTEM EM TEMPO REAL
    // ═══════════════════════════════════════════════════════════════════════
    _trace(subsystem, message, level = 'INFO') {
        const formatted = `[${new Date().toISOString()}] [CORE-COMPOSITION:${subsystem}] [${level}] ${message}`;
        if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
        else if (level === 'WARN') console.warn(formatted);
        else console.log(formatted);
    }
}

// Instanciação e exposição única na infraestrutura do ecossistema
const SovereignCore = new SentinelCoreComposition();
window.SentinelCore = SovereignCore;

// Vincula temporariamente para compatibilidade com stubs legados
window.StateStore = SovereignCore;

// Auto-registro soberano no kernel
if (window.SovereignKernel) {
    window.SovereignKernel.registerModule('sentinel-core', SovereignCore);
}

export default SovereignCore;
