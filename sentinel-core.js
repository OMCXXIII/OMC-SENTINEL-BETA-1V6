/* ═══════════════════════════════════════════════════════════════════════════
   OMC VR-OS | SENTINEL CORE — UNIFIED AUTHORITY v6.6
   Soberania Operativa: ISOLAMENTO DE KERNEL + EXPOSIÇÃO STATESTORE
   Domínio: CORE / ABSOLUTE
═══════════════════════════════════════════════════════════════════════════ */

const StateStore = (() => {
    const MIRROR_KEY = 'SENTINEL_STATE_MIRROR';

    let _state = {
        ui: {
            isSleep: false, isShadow: false, isLocked: false,
            isFocusMode: false, isEmergency: false, isListening: false,
            pulse: 72, overlayOpacity: 1, neuroTheme: 'default'
        },
        ops: {
            profile: 'ALPHA', buffer: '', deepFlow: false,
            override: false, mission: 'IDLE', latency: '0.0ms',
            actionChunking: true, autoPilot: false, executionState: 'STABLE'
        },
        telemetry: {
            startTime: Date.now(), lastInput: Date.now(), cycles: 0,
            neuroSync: 100, multitaskDetected: false, hesitationTime: 0,
            mentalBattery: 100, pfcLoad: 0, neuralNoise: 0, focusStability: 100
        },
        kernel: {
            initialized: false, bootAttempts: 0, recoveryMode: false,
            lastHeartbeat: Date.now(), hardwareStatus: 'STABLE'
        },
        diagnostics: {
            egoInterference: false, bruteForceDetected: false,
            logs: [], warnings: [], errors: []
        }
    };

    const _watchers = Object.create(null);
    const _history = [];
    const MAX_HISTORY = 500;

    const _log = (type, message, payload = null) => {
        const colors = { info: '#00D4FF', success: '#00FF41', warn: '#FFD500', error: '#FF004C' };
        console.log(`%c[CORE:${type.toUpperCase()}] ${message}`, `color:${colors[type]};font-family:monospace;font-weight:bold;`, payload || '');
    };

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
        return { parent: current, key: keys[keys.length - 1] };
    };

    const _apply = (path, value) => {
        const resolved = _resolvePath(_state, path, true);
        if (!resolved) return false;
        resolved.parent[resolved.key] = value;
        return true;
    };

    const _read = (path) => path.split('.').reduce((obj, key) => obj?.[key], _state);

    const _persist = () => {
        try {
            localStorage.setItem(MIRROR_KEY, JSON.stringify({ ts: Date.now(), state: _state }));
        } catch (e) { _log('error', 'Falha na persistência L2', e); }
    };

    const _recover = () => {
        try {
            const backup = localStorage.getItem(MIRROR_KEY);
            if (!backup) return;
            const parsed = JSON.parse(backup);
            if (parsed?.state) {
                _state = { ..._state, ...parsed.state };
                _state.kernel.recoveryMode = true;
                _log('success', 'Recovery L3 executado com sucesso.');
            }
        } catch (e) { _log('warn', 'Falha na hidratação de redundância.'); }
    };

    _recover();

    return {
        version: '6.6-ABSOLUTE',
        get: (path) => _read(path),
        set(path, value) {
            const previous = this.get(path);
            _apply(path, value);

            if (['ops', 'mission', 'telemetry', 'kernel'].some(p => path.startsWith(p))) _persist();
            if (path === 'kernel.initialized') window.SENTINEL_BOOTED = !!value;

            if (_watchers[path]) _watchers[path].forEach(fn => { try { fn(value); } catch(e) {} });

            _history.push({ path, previous, value, ts: Date.now() });
            if (_history.length > MAX_HISTORY) _history.shift();

            window.SentinelBus?.emit('state:changed', { path, value, previous, ts: Date.now() });
            return true;
        },
        watch(path, fn) {
            if (!_watchers[path]) _watchers[path] = [];
            _watchers[path].push(fn);
        }
    };
})();

const SentinelKernel = (() => {
    const _log = (message) => console.log(`%c[KERNEL] ${message}`, 'color:#7F00FF;font-weight:bold;font-family:monospace;');

    const init = () => {
        _log('Iniciando Soberania Operativa...');
        window.SENTINEL_BOOTED = false;

        StateStore.set('kernel.bootAttempts', (StateStore.get('kernel.bootAttempts') || 0) + 1);

        window.SentinelBus?.emit('boot:start', { ts: Date.now(), kernel: 'v6.6' });

        // HEARTBEAT & FAILSAFE MONITOR
        setInterval(() => {
            StateStore.set('telemetry.cycles', (StateStore.get('telemetry.cycles') || 0) + 1);
            StateStore.set('kernel.lastHeartbeat', Date.now());
            
            if (window.SENTINEL_BOOTED) {
                window.SentinelBus?.emit('ui:pulse', { bpm: 72 + Math.floor(Math.random() * 5) });
            }
        }, 1000);

        // MOTOR DE FORÇA BRUTA (TIMEOUT DE SEGURANÇA)
        // Se após 2 segundos o hardware não responder, o kernel força a entrada
        setTimeout(() => {
            if (!window.SENTINEL_BOOTED) {
                _log('Aviso: Hardware demorando a responder. Ativando OVERRIDE...');
                StateStore.set('kernel.initialized', true);
                window.SentinelBus?.emit('boot:complete', { status: 'OVERRIDE_ENABLED' });
            }
        }, 2000);
    };

    return { init };
})();

// HANDSHAKE GLOBAL
window.addEventListener('load', () => {
    window.StateStore = StateStore;
    window.SentinelKernel = SentinelKernel;
    SentinelKernel.init();
});

console.log('%c OMC SENTINEL CORE v6.6 ONLINE [UNIFIED-AUTHORITY][ENE-READY] ', 'background:#000;color:#00FF41;border:1px solid #00FF41;padding:5px;font-family:monospace;');
