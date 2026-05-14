/* ═══════════════════════════════════════════════════════════════════════════
   OMC VR-OS | SENTINEL STATE VAULT v1.1 - COGNITIVE MEMORY LAYER
   Cognitive Modular Architecture (CMA)

   L1 → Runtime Memory Layer
   L2 → Persistent Mirror Layer
   L3 → Recovery & Diagnostic Layer

   OBJETIVO:
   Blindagem do Kernel contra entropia externa,
   persistência automática e recuperação resiliente.

   FEATURES:
   ✓ Mission Lock
   ✓ Mirror Persistence
   ✓ Auto Recovery
   ✓ Telemetry Sync
   ✓ Root Isolation
   ✓ Sticky State Replay
   ✓ Cognitive Diagnostics
═══════════════════════════════════════════════════════════════════════════ */

const StateVault = (() => {

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       MEMÓRIA INTERNA (L1)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    let _state = {

        system: {
            booted: false,
            initializedAt: null,
            version: '1.1-CMA'
        },

        ui: {
            mode: 'default',
            latency: '0ms',
            overlay: false
        },

        telemetry: {
            lastInput: null,
            idleTime: 0,
            activityLevel: 'stable'
        },

        mission: {},

        ops: {},

        diagnostics: {
            errors: [],
            warnings: [],
            logs: []
        }
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       REGISTROS INTERNOS
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const MIRROR_PREFIX = 'SENTINEL_MIRROR_';

    const _watchers = Object.create(null);

    const _history = [];

    const MAX_HISTORY = 300;

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       LOGGER INTERNO
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _log = (type, message, payload = null) => {

        const colorMap = {
            info: '#00D4FF',
            success: '#00FF41',
            warn: '#FFD500',
            error: '#FF004C'
        };

        console.log(
            `%c[STATE:${type.toUpperCase()}] ${message}`,
            `color:${colorMap[type]};font-family:monospace;font-weight:bold;`,
            payload || ''
        );
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       UTILITÁRIOS DE PATH
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _resolvePath = (obj, path, create = false) => {

        const parts = path.split('.');

        let current = obj;

        for (let i = 0; i < parts.length - 1; i++) {

            const key = parts[i];

            if (!current[key]) {

                if (!create) return undefined;

                current[key] = {};
            }

            current = current[key];
        }

        return {
            parent: current,
            key: parts[parts.length - 1]
        };
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       APLICAÇÃO SÍNCRONA (L1)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _applySync = (path, value) => {

        const resolved = _resolvePath(_state, path, true);

        if (!resolved) return false;

        resolved.parent[resolved.key] = value;

        return true;
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       LEITURA SEGURA
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _readSync = (path) => {

        const parts = path.split('.');

        let current = _state;

        for (const key of parts) {

            if (current[key] === undefined) {
                return undefined;
            }

            current = current[key];
        }

        return current;
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       MIRROR L2 (PERSISTÊNCIA)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _mirrorPersist = (path, value) => {

        try {

            localStorage.setItem(
                `${MIRROR_PREFIX}${path}`,
                JSON.stringify({
                    value,
                    ts: Date.now()
                })
            );

            _log(
                'success',
                `Mirror persistido → ${path}`
            );

        } catch (e) {

            _log(
                'error',
                `Falha no mirror → ${path}`,
                e
            );

            window.SentinelBus?.emit('system:error', {
                module: 'StateVault',
                path,
                error: e.message
            });
        }
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       WATCHERS
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _notifyWatchers = (path, value) => {

        if (!_watchers[path]) return;

        _watchers[path].forEach(callback => {

            try {

                callback(value);

            } catch (e) {

                _log(
                    'error',
                    `Watcher failure → ${path}`,
                    e
                );
            }
        });
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       HISTÓRICO
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _pushHistory = (entry) => {

        _history.push(entry);

        if (_history.length > MAX_HISTORY) {
            _history.shift();
        }
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       API PÚBLICA
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    return {

        version: '1.1-CMA-STATE',

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           SET
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        set(path, value) {

            const previous = this.get(path);

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               L1 → MEMÓRIA DE EXECUÇÃO
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            _applySync(path, value);

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               L2 → REDUNDÂNCIA CRÍTICA
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            if (
                path.startsWith('ops') ||
                path.startsWith('mission') ||
                path.startsWith('system')
            ) {

                _mirrorPersist(path, value);
            }

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               FLAG GLOBAL DE BOOT
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            if (path === 'system.booted') {

                window.SENTINEL_BOOTED = !!value;

                _state.system.booted = !!value;

                if (value === true) {

                    window.SentinelBus?.emit(
                        'boot:complete',
                        {
                            source: 'StateVault',
                            ts: Date.now()
                        }
                    );
                }
            }

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               HISTÓRICO
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            _pushHistory({
                path,
                previous,
                value,
                ts: Date.now()
            });

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               WATCHERS
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            _notifyWatchers(path, value);

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               TELEMETRIA → BARRAMENTO
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            window.SentinelBus?.emit(
                'state:changed',
                {
                    path,
                    value,
                    previous,
                    ts: Date.now()
                }
            );

            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               AUTODIAGNÓSTICO
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

            if (
                path.includes('force') ||
                path.includes('brut') ||
                path.includes('override')
            ) {

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

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           GET
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        get(path = null) {

            if (!path) {
                return JSON.parse(JSON.stringify(_state));
            }

            return _readSync(path);
        },

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           WATCH
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        watch(path, callback) {

            if (!_watchers[path]) {
                _watchers[path] = [];
            }

            _watchers[path].push(callback);
        },

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           UNWATCH
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        unwatch(path, callback) {

            if (!_watchers[path]) return;

            _watchers[path] =
                _watchers[path]
                    .filter(cb => cb !== callback);
        },

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           RECOVERY SYSTEM
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        recover() {

            _log(
                'warn',
                'Iniciando protocolo de recuperação de redundância...'
            );

            let recovered = 0;

            try {

                Object.keys(localStorage).forEach(key => {

                    if (!key.startsWith(MIRROR_PREFIX)) return;

                    const path = key.replace(MIRROR_PREFIX, '');

                    const raw = localStorage.getItem(key);

                    if (!raw) return;

                    const parsed = JSON.parse(raw);

                    _applySync(path, parsed.value);

                    recovered++;

                    window.SentinelBus?.emit(
                        'state:sync',
                        {
                            path,
                            recovered: true,
                            ts: parsed.ts || Date.now()
                        }
                    );
                });

                _log(
                    'success',
                    `Recuperação concluída (${recovered} estados)`
                );

                return true;

            } catch (e) {

                _log(
                    'error',
                    'Falha no protocolo de recuperação',
                    e
                );

                window.SentinelBus?.emit(
                    'system:error',
                    {
                        module: 'StateVault',
                        error: e.message
                    }
                );

                return false;
            }
        },

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           RESET PARCIAL
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        clearMirror(path = null) {

            if (path) {

                localStorage.removeItem(
                    `${MIRROR_PREFIX}${path}`
                );

                return;
            }

            Object.keys(localStorage).forEach(key => {

                if (key.startsWith(MIRROR_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
        },

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           HISTÓRICO
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        history() {

            return [..._history];
        },

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           SNAPSHOT
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        snapshot() {

            return JSON.parse(
                JSON.stringify(_state)
            );
        },

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           DIAGNÓSTICO
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        diagnostics() {

            return {

                version: this.version,

                booted: _state.system.booted,

                mirrorKeys: Object.keys(localStorage)
                    .filter(k => k.startsWith(MIRROR_PREFIX))
                    .length,

                watchers: Object.keys(_watchers).length,

                historyEntries: _history.length,

                memorySize: JSON.stringify(_state).length
            };
        }
    };

})();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   EXPOSIÇÃO GLOBAL CONTROLADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.StateVault = StateVault;

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   RECOVERY AUTOMÁTICO NO BOOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

StateVault.recover();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HANDSHAKE COM SENTINEL BUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.SentinelBus?.emit(
    'boot:module-ready',
    {
        module: 'StateVault',
        version: StateVault.version,
        ts: Date.now()
    }
);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   LOG DE INICIALIZAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

console.log(
    '%c OMC STATE VAULT v1.1 ONLINE [MISSION-LOCK][RECOVERY-READY] ',
    'background:#000;color:#00FF41;border:1px solid #00FF41;padding:5px;font-family:monospace;'
);