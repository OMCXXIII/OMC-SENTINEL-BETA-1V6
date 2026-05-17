/* ═══════════════════════════════════════════════════════════════════════════
   OMC VR-OS | SENTINEL CORE v7.5 — SOVEREIGN STATE AUTHORITY & COMPOSITION
   Fusão CMA: StateStore + StateVault → Autoridade Única de Estado
   Domínio: CORE / ABSOLUTE / COMPOSITION
   
   FUNÇÃO EVOLUÍDA: Runtime Nervous System (Composição, Sincronização e Coordenação)
   NÃO COMPETE COM O KERNEL. O Kernel Governa, o Core Compõe e Coordena.

   ARQUITETURA DE MEMÓRIA:
   L1 → Runtime Memory    — objeto JS em memória, acesso < 1μs
   L2 → Persistent Mirror — localStorage por chave raiz única
   L3 → Recovery Layer    — hidratação atômica no boot
═══════════════════════════════════════════════════════════════════════════ */

const StateStore = (() => {

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       CHAVES DE PERSISTÊNCIA — RAIZ ÚNICA
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    const ROOT_KEY         = 'SENTINEL_STATE_ROOT';
    const MISSION_LOCK_KEY = 'SENTINEL_MISSION_LOCK';

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       MEMÓRIA INTERNA L1 — ESTADO UNIFICADO
       Fusão dos namespaces StateStore v6.6 + StateVault v1.1
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    let _state = {
        kernel: {
            initialized:   false,
            bootAttempts:  0,
            recoveryMode:  false,
            lastHeartbeat: Date.now(),
            hardwareStatus: 'STABLE',
            version:       '7.0-SOVEREIGN'
        },
        system: {
            booted:        false,
            initializedAt: null,
            version:       '7.0-SOVEREIGN'
        },
        ui: {
            isSleep:        false,
            isShadow:       false,
            isLocked:       false,
            isFocusMode:    false,
            isEmergency:    false,
            isListening:    false,
            pulse:          72,
            overlayOpacity: 1,
            neuroTheme:     'default',
            mode:           'default',
            latency:        '0ms',
            overlay:        false
        },
        ops: {
            profile:        'ALPHA',
            buffer:         '',
            deepFlow:       false,
            override:       false,
            mission:        'IDLE',
            activeMission:  null,
            latency:        '0.0ms',
            actionChunking: true,
            autoPilot:      false,
            executionState: 'STABLE'
        },
        telemetry: {
            startTime:      Date.now(),
            lastInput:      Date.now(),
            cycles:         0,
            neuroSync:      100,
            multitaskDetected: false,
            hesitationTime: 0,
            mentalBattery:  100,
            pfcLoad:        0,
            neuralNoise:    0,
            focusStability: 100,
            idleTime:       0,
            activityLevel:  'stable'
        },
        mission: {
            active: null,
            lockedAt: null,
            history: []
        },
        diagnostics: {
            egoInterference:    false,
            bruteForceDetected: false,
            errors:   [],
            warnings: [],
            logs:     []
        }
    };

    const _watchers  = Object.create(null);
    const _history   = [];
    const MAX_HISTORY = 500;
    let _bootSealed = false;

    const _log = (type, message, payload = null) => {
        const colors = { info: '#00D4FF', success: '#00FF41', warn: '#FFD500', error: '#FF004C' };
        console.log(`%c[CORE:STORE:${type.toUpperCase()}] ${message}`, `color:${colors[type]};font-family:monospace;font-weight:bold;`, payload || '');
    };

    const _resolvePath = (obj, path, create = false) => {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (current[key] === undefined || current[key] === null) {
                if (!create) return undefined;
                current[key] = {};
            }
            current = current[key];
        }
        return { parent: current, key: keys[keys.length - 1] };
    };

    const _applySync = (path, value) => {
        const resolved = _resolvePath(_state, path, true);
        if (!resolved) return false;
        resolved.parent[resolved.key] = value;
        return true;
    };

    const _readSync = (path) => {
        const parts = path.split('.');
        let current = _state;
        for (const key of parts) {
            if (current === undefined || current === null) return undefined;
            current = current[key];
        }
        return current;
    };

    const _persistL2 = () => {
        try {
            const payload = JSON.stringify({ ts: Date.now(), state: _state });
            localStorage.setItem(ROOT_KEY, payload);
        } catch (e) {
            _log('error', 'Falha na persistência L2', e);
            window.SentinelBus?.emit('system:error', { module: 'StateStore', layer: 'L2', error: e.message });
        }
    };

    const _shouldPersist = (path) =>
        path.startsWith('ops') || path.startsWith('mission') || path.startsWith('system') || path.startsWith('kernel') || path.startsWith('telemetry');

    const _recoverL3 = () => {
        let recovered = 0;
        try {
            const raw = localStorage.getItem(ROOT_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.state) {
                    const merge = (target, source) => {
                        for (const key of Object.keys(source)) {
                            if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key]) && typeof target[key] === 'object' && target[key] !== null) {
                                merge(target[key], source[key]);
                            } else {
                                target[key] = source[key];
                            }
                        }
                    };
                    merge(_state, parsed.state);
                    _state.kernel.recoveryMode = true;
                    recovered++;
                    _log('success', `L3 recovery: chave raiz restaurada (ts: ${parsed.ts})`);
                }
            }
        } catch (e) { _log('warn', 'L3: falha ao ler chave raiz', e); }

        if (!recovered) {
            try {
                const legacyRaw = localStorage.getItem('SENTINEL_STATE_MIRROR');
                if (legacyRaw) {
                    const legacy = JSON.parse(legacyRaw);
                    if (legacy?.state) {
                        Object.assign(_state, legacy.state);
                        _state.kernel.recoveryMode = true;
                        recovered++;
                        _log('warn', 'L3 recovery: chave legada SENTINEL_STATE_MIRROR migrada.');
                        _persistL2();
                        localStorage.removeItem('SENTINEL_STATE_MIRROR');
                    }
                }
            } catch (e) { _log('warn', 'L3: falha ao ler chave legada', e); }
        }

        try {
            const sparseKeys = Object.keys(localStorage).filter(k => k.startsWith('SENTINEL_MIRROR_'));
            if (sparseKeys.length > 0) {
                sparseKeys.forEach(k => {
                    const path = k.replace('SENTINEL_MIRROR_', '');
                    const entry = JSON.parse(localStorage.getItem(k) || '{}');
                    if (entry?.value !== undefined) { _applySync(path, entry.value); recovered++; }
                    localStorage.removeItem(k);
                });
                _persistL2();
                _log('warn', `L3 recovery: ${sparseKeys.length} chaves esparsas migradas e consolidadas.`);
            }
        } catch (e) { _log('warn', 'L3: falha ao migrar chaves esparsas', e); }

        try {
            const savedMission = localStorage.getItem(MISSION_LOCK_KEY);
            if (savedMission && !_state.mission.active) {
                _state.mission.active = savedMission;
                _log('info', `MissionLock restaurado: ${savedMission}`);
            }
        } catch (e) { _log('warn', 'L3: falha ao restaurar MissionLock', e); }

        return recovered;
    };

    const _notifyWatchers = (path, value) => {
        if (!_watchers[path]) return;
        _watchers[path].forEach(fn => { try { fn(value); } catch (e) { _log('error', `Watcher failure → ${path}`, e); } });
    };

    const _pushHistory = (entry) => {
        _history.push(entry);
        if (_history.length > MAX_HISTORY) _history.shift();
    };

    const _recoveredCount = _recoverL3();

    return {
        version: '7.0-SOVEREIGN',
        get(path = null) {
            if (!path) return JSON.parse(JSON.stringify(_state));
            return _readSync(path);
        },
        all() { return this.get(); },
        set(path, value) {
            const previous = this.get(path);
            _applySync(path, value);
            if (_shouldPersist(path)) _persistL2();
            if (path === 'kernel.initialized' || path === 'system.booted') {
                if (value === true) {
                    window.SENTINEL_BOOTED = true;
                    _state.system.booted = true;
                    _state.kernel.initialized = true;
                }
            }
            _pushHistory({ path, previous, value, ts: Date.now() });
            _notifyWatchers(path, value);
            window.SentinelBus?.emit('state:changed', { path, value, previous, ts: Date.now() });
            if (path.includes('force') || path.includes('brut') || path.includes('override')) {
                window.SentinelBus?.emit('diagnostic:pfc-brut', { path, value, severity: 'warning' });
            }
            return true;
        },
        watch(path, fn) {
            if (!_watchers[path]) _watchers[path] = [];
            _watchers[path].push(fn);
        },
        unwatch(path, fn) {
            if (!_watchers[path]) return;
            _watchers[path] = _watchers[path].filter(cb => cb !== fn);
        },
        snapshot() { return JSON.parse(JSON.stringify(_state)); },
        history() { return [..._history]; },
        clearMirror(path = null) {
            if (path) _log('info', `clearMirror chamado com path '${path}'. Limpando chave raiz.`);
            localStorage.removeItem(ROOT_KEY);
            _log('warn', 'Mirror L2 removido.');
        },
        recover() {
            const n = _recoverL3();
            _log('success', `recover() manual: ${n} estado(s) restaurado(s).`);
            return n > 0;
        },
        missionLock(mission) {
            if (mission === undefined) return _state.mission.active;
            if (mission === null) {
                _state.mission.active = null; _state.mission.lockedAt = null;
                localStorage.removeItem(MISSION_LOCK_KEY);
                window.SentinelBus?.emit('mission:cleared', { ts: Date.now() });
                _log('warn', 'MissionLock liberado.');
                return null;
            }
            if (typeof mission === 'string' && mission.trim().length >= 2) {
                _state.mission.active = mission; _state.mission.lockedAt = Date.now();
                _state.mission.history.push({ mission, ts: Date.now() });
                localStorage.setItem(MISSION_LOCK_KEY, mission);
                _persistL2();
                window.SentinelBus?.emit('mission:locked', { mission, ts: Date.now() });
                window.SentinelBus?.emit('ui:nexus-update', { text: `MISSION_LOCK:\n${mission}` });
                window.SentinelBus?.emit('state:changed', { path: 'mission.active', value: mission, previous: null, ts: Date.now() });
                _log('success', `MissionLock ativo: ${mission}`);
                return mission;
            }
            _log('warn', 'missionLock: argumento inválido ignorado.');
            return _state.mission.active;
        },
        diagnostics() {
            return {
                version: this.version, booted: _state.system.booted, recoveryMode: _state.kernel.recoveryMode,
                recoveredOnBoot: _recoveredCount, mirrorKey: ROOT_KEY, mirrorPresent: !!localStorage.getItem(ROOT_KEY),
                watchers: Object.keys(_watchers).length, historyEntries: _history.length, memorySize: JSON.stringify(_state).length,
                missionActive: _state.mission.active, bootSealed: _bootSealed
            };
        }
    };
})();

/* ═══════════════════════════════════════════════════════════════════════════
   SENTINEL KERNEL v7.0 (PRESERVADO INTEGRALMENTE)
═══════════════════════════════════════════════════════════════════════════ */
const SentinelKernel = (() => {
    const _log = (msg) => console.log(`%c[KERNEL] ${msg}`, 'color:#7F00FF;font-weight:bold;font-family:monospace;');
    const _incrementBootAttempts = () => {
        const current = StateStore.get('kernel.bootAttempts') || 0;
        StateStore.set('kernel.bootAttempts', current + 1);
    };
    let _bootSealed = false;

    const _sealBoot = (status = 'NOMINAL') => {
        if (_bootSealed) { _log(`boot:complete já emitido. Chamada extra ignorada (status: ${status}).`); return false; }
        _bootSealed = true;
        StateStore.set('kernel.initialized', true);
        StateStore.set('system.booted', true);
        StateStore.set('system.initializedAt', Date.now());
        window.SentinelBus?.emit('boot:complete', {
            status, ts: Date.now(), kernel: 'v7.0', recovery: StateStore.get('kernel.recoveryMode') || false,
            recovered: StateStore.diagnostics?.()?.recoveredOnBoot ?? 0
        });
        _log(`Boot selado. Status: ${status}`);
        return true;
    };

    const init = () => {
        _log('Iniciando Soberania Operativa v7.0...');
        window.SENTINEL_BOOTED = false;
        _incrementBootAttempts();
        window.SentinelBus?.emit('boot:start', { ts: Date.now(), kernel: 'v7.0' });

        setInterval(() => {
            const cycles = (StateStore.get('telemetry.cycles') || 0) + 1;
            StateStore.set('telemetry.cycles', cycles);
            StateStore.set('kernel.lastHeartbeat', Date.now());
            if (window.SENTINEL_BOOTED) {
                window.SentinelBus?.emit('ui:pulse', { bpm: 72 + Math.floor(Math.random() * 5) });
            }
        }, 1000);

        setTimeout(() => {
            if (!_bootSealed) {
                _log('Failsafe: hardware não respondeu em 2s. Ativando OVERRIDE...');
                _sealBoot('OVERRIDE_ENABLED');
                window.SENTINEL_BOOTED = true;
            }
        }, 2000);
        window._SentinelSealBoot = _sealBoot;
    };
    return { init, sealBoot: _sealBoot };
})();

/* ═══════════════════════════════════════════════════════════════════════════
   EXPANSÃO SOVEREIGN CORE v7.5 — RUNTIME NERVOUS SYSTEM
   Foco: Composição, Sincronização, Gerenciamento de Pipeline e Grafo de Dependências.
═══════════════════════════════════════════════════════════════════════════ */

class SentinelCoreComposition {
    constructor() {
        // 1. Runtime Composition System
        this.modules = new Map();

        // 2. Runtime Dependency Graph
        this.dependencies = new Map();

        // 3. Runtime Bootstrap Pipeline
        this.BOOT_PHASES = ['PREINIT', 'KERNEL', 'SERVICES', 'RENDER', 'XR', 'COGNITION', 'HUD', 'READY'];
        this.currentPhase = 'PREINIT';

        // 5. Runtime Clock
        this.clock = { delta: 0, elapsed: 0, frame: 0, fps: 60, _lastTime: Date.now() };

        // 7. Runtime Layer Registry
        this.layers = { kernel: [], runtime: [], cognition: [], render: [], interface: [], telemetry: [] };

        // 9. Runtime Activation Matrix
        this.activationMatrix = {
            XR: ['renderer', 'xr', 'audio'],
            LOW_POWER: ['scheduler'],
            SAFE_MODE: ['kernel']
        };

        // 11. Runtime Middleware Pipeline
        this.middleware = [];

        // 12. Runtime Context Layer
        this.context = { mission: null, focus: null, userState: null, cognitiveLoad: 0, xrZone: null };

        // 13. Runtime Resource Broker
        this.resources = { gpu: {}, cpu: {}, memory: {}, audio: {} };

        // 15. Runtime Isolation Zones
        this.zones = { critical: [], protected: [], isolated: [], background: [] };

        // 23. Runtime Metrics Layer
        this.metrics = { frameTime: [], fpsHistory: [], gpuHistory: [], xrHistory: [], schedulerHistory: [] };

        // 24. Runtime Cognitive Bridge
        this.cognition = { attention: {}, memory: {}, semanticState: {}, missionContext: {} };
    }

    // 1. Runtime Composition System
    compose() {
        this.trace('Iniciando composição do ecossistema SENTINEL...', 'INFO');
        this.resolveDependencies();
        this.syncRuntime();
    }

    mountModule(name, moduleInstance, layer = 'runtime', zone = 'protected') {
        if (this.modules.has(name)) {
            this.trace(`Módulo [${name}] já se encontra montado. Ignorando replicação.`, 'WARN');
            return;
        }
        this.modules.set(name, moduleInstance);
        if (this.layers[layer]) this.layers[layer].push(name);
        if (this.zones[zone]) this.zones[zone].push(name);
        
        this.trace(`Módulo [${name}] montado com sucesso na camada [${layer}] / zona [${zone}].`);
        this.initializeModule(name);
    }

    unmountModule(name) {
        if (!this.modules.has(name)) return false;
        this.modules.delete(name);
        Object.keys(this.layers).forEach(l => this.layers[l] = this.layers[l].filter(m => m !== name));
        Object.keys(this.zones).forEach(z => this.zones[z] = this.zones[z].filter(m => m !== name));
        this.trace(`Módulo [${name}] desmontado da malha de composição.`, 'WARN');
        return true;
    }

    initializeModule(name) {
        const module = this.modules.get(name);
        if (module && typeof module.init === 'function') {
            try {
                module.init(this);
            } catch (err) {
                this.trace(`Erro ao inicializar módulo [${name}]: ${err.message}`, 'ERROR');
            }
        }
    }

    // 2. Runtime Dependency Graph
    defineDependency(module, deps) {
        if (!Array.isArray(deps)) deps = [deps];
        this.dependencies.set(module, deps);
    }

    resolveDependencies() {
        this.trace('Validando e construindo grafo relacional de dependências...');
        for (const [module, deps] of this.dependencies.entries()) {
            for (const dep of deps) {
                if (!this.modules.has(dep)) {
                    this.trace(`Aviso de topologia: O módulo [${module}] requer [${dep}], que ainda não foi montado.`, 'WARN');
                }
            }
        }
    }

    // 3. Runtime Bootstrap Pipeline
    async runBootPhase(phase) {
        if (!this.BOOT_PHASES.includes(phase)) {
            throw new Error(`[CORE] Fase de boot desconhecida: ${phase}`);
        }
        this.currentPhase = phase;
        this.trace(`Avançando Pipeline Backbone ──> Fase: [${phase}]`);
        this.executeMiddleware({ type: 'PHASE_CHANGE', phase });

        // Executa ganchos de sincronia baseados na fase atual se os módulos possuírem receptores
        for (const [name, module] of this.modules.entries()) {
            if (module && typeof module.onPhaseChange === 'function') {
                try { await module.onPhaseChange(phase); } catch (e) {
                    this.trace(`Erro na fase [${phase}] do módulo [${name}]: ${e.message}`, 'ERROR');
                }
            }
        }
    }

    // 4. Runtime Synchronization Layer
    synchronize() {
        this.syncRuntime();
        this.syncModules();
    }

    syncRuntime() {
        // Puxa snapshots limpos do StateStore para unificação contextual do Core
        const stateSnapshot = StateStore.get();
        this.context.mission = stateSnapshot.ops.mission;
        this.context.focus = stateSnapshot.ui.isFocusMode ? 'MAX_FOCUS' : 'NORMAL';
        this.context.cognitiveLoad = stateSnapshot.telemetry.pfcLoad;
    }

    syncModules() {
        this.modules.forEach((module, name) => {
            if (module && typeof module.onSync === 'function') {
                try { module.onSync(this.context); } catch (e) {
                    this.trace(`Erro de sincronia no módulo [${name}]: ${e.message}`, 'ERROR');
                }
            }
        });
    }

    // 5. Runtime Clock
    updateClock() {
        const now = Date.now();
        this.clock.delta = (now - this.clock._lastTime) / 1000;
        this.clock._lastTime = now;
        this.clock.elapsed += this.clock.delta;
        this.clock.frame++;
        
        if (this.clock.frame % 30 === 0) {
            this.clock.fps = Math.round(1 / this.clock.delta);
        }
    }

    // 6. Runtime Tick Coordinator
    tick() {
        this.updateClock();
        const delta = this.clock.delta;

        // Executa encadeamento de loops técnicos sem executar lógicas profundas diretamente no core
        this._executeTickOnModule('kernel', delta);
        this._executeTickOnModule('scheduler', delta);
        this._executeTickOnModule('renderer', delta);
        this._executeTickOnModule('xr', delta);
        this._executeTickOnModule('attention', delta);
        this._executeTickOnModule('hud', delta);
        this._executeTickOnModule('telemetry', delta);

        this.traceFrame();
    }

    _executeTickOnModule(name, delta) {
        const module = this.modules.get(name);
        if (module && typeof module.tick === 'function') {
            try { module.tick(delta); } catch (e) {
                this.trace(`Erro no loop cíclico do módulo [${name}]: ${e.message}`, 'ERROR');
            }
        }
    }

    // 8. Runtime Capability Discovery
    discoverCapabilities(name) {
        const module = this.modules.get(name);
        if (module && Array.isArray(module.capabilities)) {
            return module.capabilities;
        }
        return [];
    }

    // 10. Runtime Routing Layer & Communication Network
    route(event, payload = {}) {
        this.routeMessage({ event, payload });
    }

    routeMessage(message) {
        this.executeMiddleware(message);
        window.SentinelBus?.emit(`core:route:${message.event}`, message.payload);
    }

    routeCommand(targetModule, command, args = []) {
        const module = this.modules.get(targetModule);
        if (module && typeof module.executeCommand === 'function') {
            return module.executeCommand(command, args);
        }
        this.trace(`Falha ao rotear comando para [${targetModule}]: Método inacessível.`, 'WARN');
        return null;
    }

    // 11. Runtime Middleware Pipeline
    use(middlewareFn) {
        if (typeof middlewareFn === 'function') {
            this.middleware.push(middlewareFn);
        }
    }

    executeMiddleware(context) {
        for (const mw of this.middleware) {
            try { mw(context, this); } catch (e) {
                this.trace(`Erro na execução de middleware de pipeline: ${e.message}`, 'ERROR');
            }
        }
    }

    // 13. Runtime Resource Broker
    allocateResource(clientName, hardwareType, specification = {}) {
        if (!this.resources[hardwareType]) this.resources[hardwareType] = {};
        this.resources[hardwareType][clientName] = specification;
        this.trace(`Recurso [${hardwareType}] alocado para módulo [${clientName}].`);
        this.rebalanceResources();
    }

    releaseResource(clientName, hardwareType) {
        if (this.resources[hardwareType] && this.resources[hardwareType][clientName]) {
            delete this.resources[hardwareType][clientName];
            this.trace(`Recurso [${hardwareType}] liberado pelo módulo [${clientName}].`);
            this.rebalanceResources();
        }
    }

    rebalanceResources() {
        // Lógica de reequilíbrio estrutural de carga distribuída (HUD vs FX vs XR)
        this.executeMiddleware({ type: 'RESOURCE_REBALANCE', allocation: this.resources });
    }

    // 14. Runtime Hot Reload System
    reloadModule(name, newInstance) {
        this.trace(`Iniciando Hot Reload do módulo: [${name}]`, 'WARN');
        this.unmountModule(name);
        this.mountModule(name, newInstance);
        this.trace(`Hot Swap concluído com sucesso para o módulo: [${name}]`);
    }

    hotSwapModule(name, newInstance) {
        this.reloadModule(name, newInstance);
    }

    // 16. Runtime Health Coordinator
    healthCheck() {
        return this.monitorRuntime();
    }

    monitorRuntime() {
        let systemStable = true;
        const healthSummary = { modulesChecked: [], anomalies: 0 };

        this.modules.forEach((module, name) => {
            if (module && typeof module.healthCheck === 'function') {
                try {
                    const status = module.healthCheck();
                    if (!status) { systemStable = false; healthSummary.anomalies++; }
                } catch (e) { healthSummary.anomalies++; }
            }
            healthSummary.modulesChecked.push(name);
        });

        return { stable: systemStable, summary: healthSummary };
    }

    // 17. Runtime Recovery Coordinator
    recover() {
        this.trace('Coordenando restauração em malha de rede...', 'WARN');
        this.modules.forEach((module, name) => {
            if (module && typeof module.onRecover === 'function') {
                try { module.onRecover(); } catch (e) { }
            }
        });
    }

    rollback() {
        this.trace('Iniciando Rollback sistêmico coordenado.');
    }

    restore() {
        this.trace('Restaurando integridade operacional.');
    }

    // 18. Runtime Trace Engine
    trace(event, level = 'INFO') {
        const logMsg = `[${new Date().toISOString()}] [CORE:BACKBONE] [${level}] ${event}`;
        if (level === 'ERROR') console.error(logMsg);
        else if (level === 'WARN') console.warn(logMsg);
        else console.log(logMsg);
    }

    traceFrame() {
        if (this.clock.frame % 300 === 0 && this.metrics.frameTime.length > 0) {
            this.trace(`Metrificação de FrameTime Médio: ${this.metrics.frameTime.reduce((a,b)=>a+b, 0) / this.metrics.frameTime.length}ms`);
        }
    }

    traceModule(name, message) {
        this.trace(`[Módulo: ${name}] ${message}`);
    }

    // 19. Runtime Snapshot Manager
    createSnapshot() {
        const snapshot = {
            timestamp: Date.now(),
            clock: { ...this.clock },
            context: { ...this.context },
            moduleStates: {}
        };

        this.modules.forEach((module, name) => {
            if (module && typeof module.saveState === 'function') {
                snapshot.moduleStates[name] = module.saveState();
            }
        });
        return snapshot;
    }

    restoreSnapshot(snapshot) {
        if (!snapshot) return;
        this.clock = snapshot.clock;
        this.context = snapshot.context;
        this.modules.forEach((module, name) => {
            if (module && snapshot.moduleStates[name] && typeof module.loadState === 'function') {
                module.loadState(snapshot.moduleStates[name]);
            }
        });
        this.trace('Snapshot operacional restaurado no Backbone.');
    }

    persistSnapshot() {
        try {
            localStorage.setItem('SENTINEL_BACKBONE_SNAPSHOT', JSON.stringify(this.createSnapshot()));
        } catch (e) { }
    }

    // 20. Runtime Attention Bridge
    syncAttention(attentionMetrics) {
        if (attentionMetrics) {
            this.cognition.attention = attentionMetrics;
            this.updateFocus();
        }
    }

    updateFocus() {
        if (this.cognition.attention?.load > 0.8) {
            this.suppressDistractions();
        }
    }

    suppressDistractions() {
        // Reduz atividade e logs de canais de telemetria secundários
        const hud = this.modules.get('hud');
        if (hud && typeof hud.setDenseMode === 'function') hud.setDenseMode(false);
    }

    // 21. Runtime State Reflection
    reflectRuntimeState() {
        return {
            currentPhase: this.currentPhase,
            activeModulesCount: this.modules.size,
            clock: this.clock,
            layersAllocation: this.layers,
            zonesAllocation: this.zones
        };
    }

    // 22. Runtime Security Hooks
    validateRuntime() {
        return this.checkIntegrity();
    }

    verifyModules() {
        return this.checkIntegrity();
    }

    checkIntegrity() {
        let secure = true;
        this.modules.forEach((module, name) => {
            if (module && typeof module.verifyToken === 'function') {
                if (!module.verifyToken()) secure = false;
            }
        });
        return secure;
    }
}

// Inicialização e acoplamento na janela global
const SovereignCore = new SentinelCoreComposition();

/* ═══════════════════════════════════════════════════════════════════════════
   HANDSHAKE GLOBAL COMPLETADO E AMPLIADO
═══════════════════════════════════════════════════════════════════════════ */
window.addEventListener('load', () => {
    window.StateStore  = StateStore;
    window.StateVault  = StateStore; // Alias mantido
    window.SentinelKernel = SentinelKernel;
    window.SentinelCore = SovereignCore; // Registro unificado do Backbone de composição

    window.SentinelBus?.emit('boot:module-ready', {
        module:  'StateStore',
        version: StateStore.version,
        ts:      Date.now()
    });

    // Acopla o Loop Central de Composição ao requestAnimationFrame nativo da janela
    if (window.SENTINEL_BOOTED || true) {
        const coreLoop = () => {
            SovereignCore.tick();
            requestAnimationFrame(coreLoop);
        };
        requestAnimationFrame(coreLoop);
    }

    SentinelKernel.init();

    const restoredMission = StateStore.missionLock();
    if (restoredMission) {
        window.SentinelBus?.emit('mission:restored', { mission: restoredMission });
        window.SentinelBus?.emit('ui:nexus-update',  { text: `MISSION_RESTORED:\n${restoredMission}` });
    }
});

console.log(
    '%c OMC SENTINEL CORE & COMPOSITION BACKBONE v7.5 ONLINE [NERVOUS-SYSTEM-READY] ',
    'background:#000;color:#00D4FF;border:1px solid #00D4FF;padding:5px;font-family:monospace;'
);
