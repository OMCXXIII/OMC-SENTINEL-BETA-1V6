/* ═══════════════════════════════════════════════════════════════════════════
   OMC VR-OS | SENTINEL CORE — UNIFIED AUTHORITY v6.6
   Soberania Operativa: ISOLAMENTO DE KERNEL + EXPOSIÇÃO STATESTORE
   Domínio: CORE / ABSOLUTE

   CAMADAS:
   L1 → Runtime Memory
   L2 → Persistent Mirror
   L3 → Recovery Layer

   FEATURES:
   ✓ Mission Lock
   ✓ Recovery Protocol
   ✓ Gamma Heartbeat
   ✓ Fail-Safe Engine
   ✓ Action Chunking
   ✓ Ego Interference Detection
   ✓ Neural Silence Architecture
   ✓ Saltatory Conduction Bus
═══════════════════════════════════════════════════════════════════════════ */

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   STATE VAULT v1.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const StateStore = (() => {

    const MIRROR_KEY = 'SENTINEL_STATE_MIRROR';

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       L1 → MEMÓRIA DE EXECUÇÃO
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    let _state = {

        ui: {
            isSleep: false,
            isShadow: false,
            isLocked: false,
            isFocusMode: false,
            isEmergency: false,
            isListening: false,
            pulse: 72,
            overlayOpacity: 1,
            neuroTheme: 'default'
        },

        ops: {
            profile: 'ALPHA',
            buffer: '',
            deepFlow: false,
            override: false,
            mission: 'IDLE',
            latency: '0.0ms',
            actionChunking: true,
            autoPilot: false,
            executionState: 'STABLE'
        },

        telemetry: {
            startTime: Date.now(),
            lastInput: Date.now(),
            cycles: 0,
            neuroSync: 100,
            multitaskDetected: false,
            hesitationTime: 0,
            mentalBattery: 100,
            pfcLoad: 0,
            neuralNoise: 0,
            focusStability: 100
        },

        kernel: {
            initialized: false,
            bootAttempts: 0,
            recoveryMode: false,
            lastHeartbeat: Date.now()
        },

        diagnostics: {
            egoInterference: false,
            bruteForceDetected: false,
            logs: [],
            warnings: [],
            errors: []
        }
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       REGISTROS INTERNOS
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _watchers = Object.create(null);

    const _history = [];

    const MAX_HISTORY = 500;

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       LOGGER INTERNO
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _log = (type, message, payload = null) => {

        const colors = {
            info: '#00D4FF',
            success: '#00FF41',
            warn: '#FFD500',
            error: '#FF004C'
        };

        console.log(
            `%c[CORE:${type.toUpperCase()}] ${message}`,
            `color:${colors[type]};font-family:monospace;font-weight:bold;`,
            payload || ''
        );
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       PATH RESOLUTION
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _resolvePath = (obj, path, create = false) => {

        const keys = path.split('.');

        let current = obj;

        for (let i = 0; i < keys.length - 1; i++) {

            const key = keys[i];

            if (!current[key]) {

                if (!create) return undefined;

                current[key] = {};
            }

            current = current[key];
        }

        return {
            parent: current,
            key: keys[keys.length - 1]
        };
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       SET INTERNO
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _apply = (path, value) => {

        const resolved = _resolvePath(_state, path, true);

        if (!resolved) return false;

        resolved.parent[resolved.key] = value;

        return true;
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       GET INTERNO
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _read = (path) => {

        return path
            .split('.')
            .reduce((obj, key) => obj?.[key], _state);
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       PERSISTÊNCIA L2
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _persist = () => {

        try {

            localStorage.setItem(
                MIRROR_KEY,
                JSON.stringify({
                    ts: Date.now(),
                    state: _state
                })
            );

        } catch (e) {

            _log(
                'error',
                'Falha na persistência L2',
                e
            );
        }
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       RECOVERY L3
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _recover = () => {

        try {

            const backup = localStorage.getItem(MIRROR_KEY);

            if (!backup) return;

            const parsed = JSON.parse(backup);

            if (parsed?.state) {

                _state = {
                    ..._state,
                    ...parsed.state
                };

                _state.kernel.recoveryMode = true;

                _log(
                    'success',
                    'Recovery L3 executado com sucesso.'
                );

                window.SentinelBus?.emit(
                    'state:sync',
                    {
                        recovered: true,
                        timestamp: parsed.ts || Date.now()
                    }
                );
            }

        } catch (e) {

            _log(
                'warn',
                'Falha na hidratação de redundância.'
            );
        }
    };

    _recover();

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       WATCHERS
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _notifyWatchers = (path, value) => {

        if (!_watchers[path]) return;

        _watchers[path].forEach(fn => {

            try {

                fn(value);

            } catch (e) {

                _log(
                    'error',
                    `Watcher failure → ${path}`,
                    e
                );
            }
        });
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       HISTORY
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _pushHistory = (entry) => {

        _history.push(entry);

        if (_history.length > MAX_HISTORY) {
            _history.shift();
        }
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       API PÚBLICA
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    return {

        version: '6.6-ABSOLUTE',

        get(path) {

            return _read(path);
        },

        set(path, value) {

            const previous = this.get(path);

            _apply(path, value);

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               MISSION LOCK
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            if (
                path.startsWith('ops') ||
                path.startsWith('mission') ||
                path.startsWith('telemetry') ||
                path.startsWith('kernel')
            ) {

                _persist();
            }

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               BOOT FLAG
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            if (path === 'kernel.initialized') {

                window.SENTINEL_BOOTED = !!value;
            }

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               WATCHERS
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            _notifyWatchers(path, value);

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               HISTÓRICO
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            _pushHistory({
                path,
                previous,
                value,
                ts: Date.now()
            });

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               BARRAMENTO GLOBAL
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            window.SentinelBus?.emit(
                'state:changed',
                {
                    path,
                    value,
                    previous,
                    ts: Date.now()
                }
            );

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               DETECÇÃO DE FORÇA BRUTA
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            if (
                path.includes('override') ||
                path.includes('force') ||
                path.includes('brut')
            ) {

                _state.diagnostics.bruteForceDetected = true;

                window.SentinelBus?.emit(
                    'diagnostic:pfc-brut',
                    {
                        path,
                        value,
                        severity: 'warning'
                    }
                );
            }

            return true;
        },

        all() {

            return JSON.parse(
                JSON.stringify(_state)
            );
        },

        watch(path, fn) {

            if (!_watchers[path]) {
                _watchers[path] = [];
            }

            _watchers[path].push(fn);
        },

        unwatch(path, fn) {

            if (!_watchers[path]) return;

            _watchers[path] =
                _watchers[path]
                    .filter(cb => cb !== fn);
        },

        diagnostics() {

            return {

                version: this.version,

                historyEntries: _history.length,

                watchers: Object.keys(_watchers).length,

                recoveryMode: _state.kernel.recoveryMode,

                mentalBattery:
                    _state.telemetry.mentalBattery,

                pfcLoad:
                    _state.telemetry.pfcLoad,

                egoInterference:
                    _state.diagnostics.egoInterference
            };
        }
    };

})();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   EXPOSIÇÃO GLOBAL CONTROLADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.StateStore = StateStore;
window.SYSTEM_STATE = StateStore;

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SENTINEL KERNEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const SentinelKernel = (() => {

    let _heartbeatInterval = null;

    let _failSafeInterval = null;

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       LOGGER
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _log = (message) => {

        console.log(
            `%c[KERNEL] ${message}`,
            'color:#7F00FF;font-weight:bold;font-family:monospace;'
        );
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       INIT
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const init = () => {

        _log('Iniciando Soberania Operativa...');

        window.SENTINEL_BOOTED = false;

        StateStore.set(
            'kernel.bootAttempts',
            (StateStore.get('kernel.bootAttempts') || 0) + 1
        );

        window.SentinelBus?.emit(
            'boot:start',
            {
                ts: Date.now(),
                kernel: 'v6.6'
            }
        );

        _bindEvents();

        _startHeartbeat();

        _startFailSafeEngine();

        _startTaskBracketMonitor();

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           HANDSHAKE FAILSAFE
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        setTimeout(() => {

            if (!window.SENTINEL_BOOTED) {

                StateStore.set(
                    'kernel.initialized',
                    true
                );

                window.SentinelBus?.emit(
                    'boot:complete',
                    {
                        fallback: true
                    }
                );

                _log(
                    'Failsafe de boot ativado.'
                );
            }

        }, 2000);
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       EVENT BRIDGE
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _bindEvents = () => {

        if (!window.SentinelBus) return;

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           NEXUS DISPLAY BRIDGE
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        window.SentinelBus.on(
            'ui:nexus-update',
            (data) => {

                const display =
                    document.getElementById(
                        'nexus-display'
                    );

                if (display) {

                    display.setAttribute(
                        'value',
                        data.string || data
                    );
                }
            }
        );

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           INPUT TELEMETRY
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        window.SentinelBus.on(
            'telemetry:input',
            () => {

                StateStore.set(
                    'telemetry.lastInput',
                    Date.now()
                );
            }
        );

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           MULTITASK DETECTION
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        window.SentinelBus.on(
            'telemetry:multitask',
            () => {

                StateStore.set(
                    'telemetry.multitaskDetected',
                    true
                );

                _applyLateralInhibition();
            }
        );
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       HEARTBEAT ENGINE
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _startHeartbeat = () => {

        _heartbeatInterval = setInterval(() => {

            const cycles =
                StateStore.get(
                    'telemetry.cycles'
                ) || 0;

            StateStore.set(
                'telemetry.cycles',
                cycles + 1
            );

            StateStore.set(
                'kernel.lastHeartbeat',
                Date.now()
            );

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               CLOCK SIGNAL
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            if (window.SENTINEL_BOOTED) {

                const now = new Date();

                const ts =
                    now.toTimeString().slice(0, 8);

                const elapsed = Math.floor(
                    (
                        Date.now() -
                        StateStore.get(
                            'telemetry.startTime'
                        )
                    ) / 1000
                );

                window.SentinelBus?.emit(
                    'ui:clock-tick',
                    {
                        time: ts,
                        elapsed
                    }
                );

                /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                   GAMMA PULSE
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

                const pulse =
                    72 + Math.floor(Math.random() * 4);

                StateStore.set(
                    'ui.pulse',
                    pulse
                );

                window.SentinelBus?.emit(
                    'ui:pulse',
                    {
                        bpm: pulse,
                        neuroSync:
                            StateStore.get(
                                'telemetry.neuroSync'
                            )
                    }
                );
            }

        }, 1000);
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       FAILSAFE ENGINE
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _startFailSafeEngine = () => {

        _failSafeInterval = setInterval(() => {

            const battery =
                StateStore.get(
                    'telemetry.mentalBattery'
                );

            const multitask =
                StateStore.get(
                    'telemetry.multitaskDetected'
                );

            const hesitation =
                StateStore.get(
                    'telemetry.hesitationTime'
                );

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               PATCH NSDR
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            if (battery < 20) {

                window.SentinelBus?.emit(
                    'patch:nsdr',
                    {
                        reason: 'low-battery'
                    }
                );

                _log(
                    'Patch NSDR aplicado.'
                );
            }

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               INIBIÇÃO LATERAL
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            if (multitask) {

                _applyLateralInhibition();
            }

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               PREDEF-ALL
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            if (hesitation > 60) {

                window.SentinelBus?.emit(
                    'patch:predef-all',
                    {
                        hesitation
                    }
                );

                _log(
                    'Patch PREDEF-ALL executado.'
                );
            }

        }, 5000);
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       INIBIÇÃO LATERAL
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _applyLateralInhibition = () => {

        document
            .querySelectorAll('.secondary-window')
            .forEach(el => {

                el.style.opacity = '0.25';

                el.style.filter =
                    'blur(2px)';
            });

        window.SentinelBus?.emit(
            'ui:mode',
            {
                mode: 'focus-lock',
                active: true
            }
        );

        _log(
            'Inibição lateral aplicada.'
        );
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       TASK BRACKET MONITOR
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _startTaskBracketMonitor = () => {

        setInterval(() => {

            const pfcLoad =
                StateStore.get(
                    'telemetry.pfcLoad'
                );

            const deepFlow =
                StateStore.get(
                    'ops.deepFlow'
                );

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               EGO INTERFERENCE
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            if (
                deepFlow &&
                pfcLoad > 70
            ) {

                StateStore.set(
                    'diagnostics.egoInterference',
                    true
                );

                window.SentinelBus?.emit(
                    'diagnostic:ego-int',
                    {
                        load: pfcLoad,
                        severity: 'warning'
                    }
                );

                _log(
                    'Interferência de Ego detectada.'
                );
            }

        }, 4000);
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ACTION CHUNKING
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const executeChunk = (actions = []) => {

        if (!Array.isArray(actions)) return;

        window.SentinelBus?.emit(
            'ops:chunk:start',
            {
                total: actions.length
            }
        );

        actions.forEach((fn, index) => {

            setTimeout(() => {

                try {

                    fn();

                    window.SentinelBus?.emit(
                        'ops:chunk:step',
                        {
                            step: index + 1
                        }
                    );

                } catch (e) {

                    window.SentinelBus?.emit(
                        'system:error',
                        {
                            chunk: index,
                            error: e.message
                        }
                    );
                }

            }, index * 150);
        });

        window.SentinelBus?.emit(
            'ops:chunk:complete',
            {
                total: actions.length
            }
        );
    };

    return {

        init,

        executeChunk
    };

})();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HANDSHAKE GLOBAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.addEventListener('load', () => {

    SentinelKernel.init();
});

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   EXPOSIÇÃO GLOBAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.SentinelKernel = SentinelKernel;

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   LOG DE INICIALIZAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

console.log(
    '%c OMC SENTINEL CORE v6.6 ONLINE [UNIFIED-AUTHORITY][ENE-READY] ',
    'background:#000;color:#00FF41;border:1px solid #00FF41;padding:5px;font-family:monospace;'
);