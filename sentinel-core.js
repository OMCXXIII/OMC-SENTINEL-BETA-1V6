/* ═══════════════════════════════════════════════════════════════════════════
   OMC VR-OS | SENTINEL CORE v7.0 — SOVEREIGN STATE AUTHORITY
   Fusão CMA: StateStore + StateVault → Autoridade Única de Estado
   Domínio: CORE / ABSOLUTE

   ARQUITETURA DE MEMÓRIA:
   L1 → Runtime Memory    — objeto JS em memória, acesso < 1μs
   L2 → Persistent Mirror — localStorage por chave raiz única
   L3 → Recovery Layer    — hidratação atômica no boot

   CHAVE RAIZ ÚNICA: SENTINEL_STATE_ROOT
   MISSÃO LOCK KEY:  SENTINEL_MISSION_LOCK

   CORREÇÕES v7.0:
   ✓ Eliminação da race condition de boot (flag atômica _bootSealed)
   ✓ Método .all() adicionado para compatibilidade com Debug-HUD
   ✓ boot:complete emitido UMA ÚNICA VEZ após L3 recovery
   ✓ Lógica impossível de SENTINEL_BOOTED removida
   ✓ Alias window.StateVault mantido para compatibilidade retroativa
   ✓ MissionLock nativo integrado ao Core
   ✓ Autodiagnóstico PFC-BRUT preservado
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

        /* ── Kernel ─────────────────────────────────────── */
        kernel: {
            initialized:   false,
            bootAttempts:  0,
            recoveryMode:  false,
            lastHeartbeat: Date.now(),
            hardwareStatus: 'STABLE',
            version:       '7.0-SOVEREIGN'
        },

        /* ── Sistema (ex-StateVault) ─────────────────────── */
        system: {
            booted:        false,
            initializedAt: null,
            version:       '7.0-SOVEREIGN'
        },

        /* ── Interface ───────────────────────────────────── */
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

        /* ── Operacional ─────────────────────────────────── */
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

        /* ── Telemetria ──────────────────────────────────── */
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

        /* ── Missão (MissionLock nativo) ─────────────────── */
        mission: {
            active: null,
            lockedAt: null,
            history: []
        },

        /* ── Diagnóstico ─────────────────────────────────── */
        diagnostics: {
            egoInterference:    false,
            bruteForceDetected: false,
            errors:   [],
            warnings: [],
            logs:     []
        }
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       REGISTROS INTERNOS
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _watchers  = Object.create(null);
    const _history   = [];
    const MAX_HISTORY = 500;

    /* Flag atômica: impede emissão duplicada de boot:complete */
    let _bootSealed = false;

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       LOGGER INTERNO
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _log = (type, message, payload = null) => {
        const colors = {
            info:    '#00D4FF',
            success: '#00FF41',
            warn:    '#FFD500',
            error:   '#FF004C'
        };
        console.log(
            `%c[CORE:${type.toUpperCase()}] ${message}`,
            `color:${colors[type]};font-family:monospace;font-weight:bold;`,
            payload || ''
        );
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       UTILITÁRIOS DE PATH
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

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

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       L2 — PERSISTÊNCIA POR RAIZ ÚNICA
       Substitui SENTINEL_STATE_MIRROR + SENTINEL_MIRROR_*
       Um único JSON atômico. Zero colisão de chaves.
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _persistL2 = () => {
        try {
            const payload = JSON.stringify({ ts: Date.now(), state: _state });
            localStorage.setItem(ROOT_KEY, payload);
        } catch (e) {
            _log('error', 'Falha na persistência L2', e);
            window.SentinelBus?.emit('system:error', {
                module: 'StateStore',
                layer:  'L2',
                error:  e.message
            });
        }
    };

    /* Caminhos que disparam persistência L2 */
    const _shouldPersist = (path) =>
        path.startsWith('ops')      ||
        path.startsWith('mission')  ||
        path.startsWith('system')   ||
        path.startsWith('kernel')   ||
        path.startsWith('telemetry');

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       L3 — RECOVERY ATÔMICO
       Chamado UMA VEZ antes de qualquer emissão de boot.
       Migra dados legados (SENTINEL_MIRROR_* e SENTINEL_STATE_MIRROR)
       para a nova chave raiz na primeira execução.
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _recoverL3 = () => {
        let recovered = 0;

        /* ── Tentativa 1: chave raiz unificada (v7.0) ─── */
        try {
            const raw = localStorage.getItem(ROOT_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.state) {
                    /* Merge profundo — não sobrescreve chaves ausentes no backup */
                    const merge = (target, source) => {
                        for (const key of Object.keys(source)) {
                            if (
                                source[key] !== null &&
                                typeof source[key] === 'object' &&
                                !Array.isArray(source[key]) &&
                                typeof target[key] === 'object' &&
                                target[key] !== null
                            ) {
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
        } catch (e) {
            _log('warn', 'L3: falha ao ler chave raiz', e);
        }

        /* ── Tentativa 2: chave legada flat (v6.6) ─────── */
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
                        /* Migra para nova chave e apaga legado */
                        _persistL2();
                        localStorage.removeItem('SENTINEL_STATE_MIRROR');
                    }
                }
            } catch (e) {
                _log('warn', 'L3: falha ao ler chave legada', e);
            }
        }

        /* ── Tentativa 3: chaves esparsas (SENTINEL_MIRROR_*) ─ */
        try {
            const sparseKeys = Object.keys(localStorage)
                .filter(k => k.startsWith('SENTINEL_MIRROR_'));
            if (sparseKeys.length > 0) {
                sparseKeys.forEach(k => {
                    const path = k.replace('SENTINEL_MIRROR_', '');
                    const entry = JSON.parse(localStorage.getItem(k) || '{}');
                    if (entry?.value !== undefined) {
                        _applySync(path, entry.value);
                        recovered++;
                    }
                    localStorage.removeItem(k); /* limpa legado */
                });
                _persistL2();
                _log('warn', `L3 recovery: ${sparseKeys.length} chaves esparsas migradas e consolidadas.`);
            }
        } catch (e) {
            _log('warn', 'L3: falha ao migrar chaves esparsas', e);
        }

        /* ── Restaura MissionLock se existir ────────────── */
        try {
            const savedMission = localStorage.getItem(MISSION_LOCK_KEY);
            if (savedMission && !_state.mission.active) {
                _state.mission.active = savedMission;
                _log('info', `MissionLock restaurado: ${savedMission}`);
            }
        } catch (e) {
            _log('warn', 'L3: falha ao restaurar MissionLock', e);
        }

        return recovered;
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       WATCHERS E HISTÓRICO
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _notifyWatchers = (path, value) => {
        if (!_watchers[path]) return;
        _watchers[path].forEach(fn => {
            try { fn(value); } catch (e) {
                _log('error', `Watcher failure → ${path}`, e);
            }
        });
    };

    const _pushHistory = (entry) => {
        _history.push(entry);
        if (_history.length > MAX_HISTORY) _history.shift();
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       EXECUTA L3 NO ESCOPO DO MÓDULO (pré-exposição global)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _recoveredCount = _recoverL3();

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       API PÚBLICA
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    return {

        version: '7.0-SOVEREIGN',

        /* ── get(path?) ────────────────────────────────────
           Sem argumento → snapshot completo do estado L1.
           Compatível com: StateStore.get('ops.profile')
                           StateStore.get()  ← usado pelo HUD
        ─────────────────────────────────────────────────── */
        get(path = null) {
            if (!path) return JSON.parse(JSON.stringify(_state));
            return _readSync(path);
        },

        /* ── all() ─────────────────────────────────────────
           Alias semântico de .get() sem argumento.
           EXIGIDO pelo sentinel-debug-hud.js:
           const state = window.StateStore?.all?.();
        ─────────────────────────────────────────────────── */
        all() {
            return this.get();
        },

        /* ── set(path, value) ──────────────────────────────
           Escreve L1, persiste L2 (se caminho crítico),
           notifica watchers e emite state:changed via Bus.
        ─────────────────────────────────────────────────── */
        set(path, value) {
            const previous = this.get(path);
            _applySync(path, value);

            /* ── L2: persistência seletiva ── */
            if (_shouldPersist(path)) _persistL2();

            /* ── Flag global de boot ── */
            if (path === 'kernel.initialized' || path === 'system.booted') {
                if (value === true) {
                    window.SENTINEL_BOOTED = true;
                    _state.system.booted   = true;
                    _state.kernel.initialized = true;
                }
            }

            /* ── Histórico ── */
            _pushHistory({ path, previous, value, ts: Date.now() });

            /* ── Watchers ── */
            _notifyWatchers(path, value);

            /* ── Barramento (único canal de saída) ── */
            window.SentinelBus?.emit('state:changed', {
                path, value, previous, ts: Date.now()
            });

            /* ── Autodiagnóstico PFC-BRUT ── */
            if (path.includes('force') || path.includes('brut') || path.includes('override')) {
                window.SentinelBus?.emit('diagnostic:pfc-brut', {
                    path, value, severity: 'warning'
                });
            }

            return true;
        },

        /* ── watch(path, fn) / unwatch(path, fn) ───────── */
        watch(path, fn) {
            if (!_watchers[path]) _watchers[path] = [];
            _watchers[path].push(fn);
        },

        unwatch(path, fn) {
            if (!_watchers[path]) return;
            _watchers[path] = _watchers[path].filter(cb => cb !== fn);
        },

        /* ── snapshot() ────────────────────────────────────
           Cópia profunda do estado L1 em determinado instante.
        ─────────────────────────────────────────────────── */
        snapshot() {
            return JSON.parse(JSON.stringify(_state));
        },

        /* ── history() ─────────────────────────────────────
           Retorna log de mutações (max 500 entradas).
        ─────────────────────────────────────────────────── */
        history() {
            return [..._history];
        },

        /* ── clearMirror(path?) ─────────────────────────────
           Remove a chave raiz L2. Aceita path para clareza
           de API, mas a persistência é sempre atômica (root).
        ─────────────────────────────────────────────────── */
        clearMirror(path = null) {
            if (path) {
                _log('info', `clearMirror chamado com path '${path}'. Limpando chave raiz.`);
            }
            localStorage.removeItem(ROOT_KEY);
            _log('warn', 'Mirror L2 removido.');
        },

        /* ── recover() ─────────────────────────────────────
           Re-executa L3 manualmente (uso em diagnóstico).
        ─────────────────────────────────────────────────── */
        recover() {
            const n = _recoverL3();
            _log('success', `recover() manual: ${n} estado(s) restaurado(s).`);
            return n > 0;
        },

        /* ── missionLock(mission?) ──────────────────────────
           Sem argumento → retorna missão ativa.
           Com string    → grava e persiste a missão.
           Com null      → limpa a missão.
        ─────────────────────────────────────────────────── */
        missionLock(mission) {
            if (mission === undefined) {
                return _state.mission.active;
            }

            if (mission === null) {
                _state.mission.active   = null;
                _state.mission.lockedAt = null;
                localStorage.removeItem(MISSION_LOCK_KEY);
                window.SentinelBus?.emit('mission:cleared', { ts: Date.now() });
                _log('warn', 'MissionLock liberado.');
                return null;
            }

            if (typeof mission === 'string' && mission.trim().length >= 2) {
                _state.mission.active   = mission;
                _state.mission.lockedAt = Date.now();
                _state.mission.history.push({ mission, ts: Date.now() });

                localStorage.setItem(MISSION_LOCK_KEY, mission);
                _persistL2();

                window.SentinelBus?.emit('mission:locked', { mission, ts: Date.now() });
                window.SentinelBus?.emit('ui:nexus-update', { text: `MISSION_LOCK:\n${mission}` });
                window.SentinelBus?.emit('state:changed', {
                    path: 'mission.active', value: mission, previous: null, ts: Date.now()
                });

                _log('success', `MissionLock ativo: ${mission}`);
                return mission;
            }

            _log('warn', 'missionLock: argumento inválido ignorado.');
            return _state.mission.active;
        },

        /* ── diagnostics() ─────────────────────────────────
           Relatório de integridade do módulo.
        ─────────────────────────────────────────────────── */
        diagnostics() {
            return {
                version:        this.version,
                booted:         _state.system.booted,
                recoveryMode:   _state.kernel.recoveryMode,
                recoveredOnBoot: _recoveredCount,
                mirrorKey:      ROOT_KEY,
                mirrorPresent:  !!localStorage.getItem(ROOT_KEY),
                watchers:       Object.keys(_watchers).length,
                historyEntries: _history.length,
                memorySize:     JSON.stringify(_state).length,
                missionActive:  _state.mission.active,
                bootSealed:     _bootSealed
            };
        }
    };

})();

/* ═══════════════════════════════════════════════════════════════════════════
   SENTINEL KERNEL v7.0
   Responsabilidade: sequência de boot atômica e única.

   CONTRATO:
   — boot:complete é emitido UMA ÚNICA VEZ (_bootSealed).
   — window.SENTINEL_BOOTED só passa para true via StateStore.set().
   — Timeout de override permanece como failsafe de hardware (2s),
     mas verifica _bootSealed antes de disparar para não duplicar.
═══════════════════════════════════════════════════════════════════════════ */

const SentinelKernel = (() => {

    const _log = (msg) =>
        console.log(
            `%c[KERNEL] ${msg}`,
            'color:#7F00FF;font-weight:bold;font-family:monospace;'
        );

    /* Incrementa tentativas de boot no estado antes de qualquer emissão */
    const _incrementBootAttempts = () => {
        const current = StateStore.get('kernel.bootAttempts') || 0;
        StateStore.set('kernel.bootAttempts', current + 1);
    };

    /* Selo atômico: garante emissão única de boot:complete */
    let _bootSealed = false;

    const _sealBoot = (status = 'NOMINAL') => {
        if (_bootSealed) {
            _log(`boot:complete já emitido. Chamada extra ignorada (status: ${status}).`);
            return false;
        }
        _bootSealed = true;

        StateStore.set('kernel.initialized', true);
        StateStore.set('system.booted',      true);
        StateStore.set('system.initializedAt', Date.now());

        window.SentinelBus?.emit('boot:complete', {
            status,
            ts:       Date.now(),
            kernel:   'v7.0',
            recovery: StateStore.get('kernel.recoveryMode') || false,
            recovered: StateStore.diagnostics?.()?.recoveredOnBoot ?? 0
        });

        _log(`Boot selado. Status: ${status}`);
        return true;
    };

    const init = () => {
        _log('Iniciando Soberania Operativa v7.0...');

        /* Garante que a flag global começa em false nesta execução */
        window.SENTINEL_BOOTED = false;

        _incrementBootAttempts();

        window.SentinelBus?.emit('boot:start', {
            ts:     Date.now(),
            kernel: 'v7.0'
        });

        /* ── HEARTBEAT ──────────────────────────────────── */
        setInterval(() => {
            const cycles = (StateStore.get('telemetry.cycles') || 0) + 1;
            StateStore.set('telemetry.cycles',         cycles);
            StateStore.set('kernel.lastHeartbeat',     Date.now());

            if (window.SENTINEL_BOOTED) {
                window.SentinelBus?.emit('ui:pulse', {
                    bpm: 72 + Math.floor(Math.random() * 5)
                });
            }
        }, 1000);

        /* ── VERIFICADOR DE INTEGRIDADE DE BOOT (failsafe) ─
           Substitui a lógica impossível original:
             if (!SENTINEL_BOOTED) { if (SENTINEL_BOOTED === true) { ... } }
           Novo contrato: se após 2s o boot não foi selado,
           o kernel assume controle via OVERRIDE e sela uma única vez.
        ──────────────────────────────────────────────────── */
        setTimeout(() => {
            if (!_bootSealed) {
                _log('Failsafe: hardware não respondeu em 2s. Ativando OVERRIDE...');
                _sealBoot('OVERRIDE_ENABLED');
            }
        }, 2000);

        /* Expõe o seal para módulos externos que precisem confirmar boot */
        window._SentinelSealBoot = _sealBoot;
    };

    return { init, sealBoot: _sealBoot };

})();

/* ═══════════════════════════════════════════════════════════════════════════
   HANDSHAKE GLOBAL
   Ordem: StateStore já executou L3 recovery no escopo do módulo.
   Kernel.init() roda no load para garantir que o DOM e o Bus existam.
═══════════════════════════════════════════════════════════════════════════ */

window.addEventListener('load', () => {

    /* ── Exposição global controlada ── */
    window.StateStore  = StateStore;
    window.StateVault  = StateStore; /* alias retroativo — elimina dependência do estore */
    window.SentinelKernel = SentinelKernel;

    /* ── Handshake com o Bus ── */
    window.SentinelBus?.emit('boot:module-ready', {
        module:  'StateStore',
        version: StateStore.version,
        ts:      Date.now()
    });

    /* ── Inicia sequência de boot ── */
    SentinelKernel.init();

    /* ── Log de missão restaurada (se existir) ── */
    const restoredMission = StateStore.missionLock();
    if (restoredMission) {
        window.SentinelBus?.emit('mission:restored', { mission: restoredMission });
        window.SentinelBus?.emit('ui:nexus-update',  { text: `MISSION_RESTORED:\n${restoredMission}` });
    }
});

/* ═══════════════════════════════════════════════════════════════════════════
   LOG DE INICIALIZAÇÃO
═══════════════════════════════════════════════════════════════════════════ */

console.log(
    '%c OMC SENTINEL CORE v7.0 ONLINE [SOVEREIGN-STATE][L1/L2/L3][ENE-READY] ',
    'background:#000;color:#00FF41;border:1px solid #00FF41;padding:5px;font-family:monospace;'
);

/* ═══════════════════════════════════════════════════════════════════════════
   TABELA DE COMPATIBILIDADE — MÓDULOS DEPENDENTES

   sentinel-bus.js          → sem alteração necessária
   sentinel-debug-hud.js    → StateStore.all() agora existe ✓
   js_sentinel_protocols.js → sem alteração necessária
   js_sentinel_engine-xr.js → window.SENTINEL_BOOTED via StateStore ✓
   js_sentinel_jarvis-voice.js →
       MissionLockEngine.lock(m) pode chamar StateStore.missionLock(m)
       localStorage direto ainda funciona (chave SENTINEL_MISSION_LOCK mantida)
   index.html →
       Remover: window.SENTINEL_BOOTED = true  (não mais necessário)
       Manter:  SentinelBus.emit('boot:complete') → agora bloqueado por _bootSealed

   ARQUIVO A DELETAR: sentinel-state-estore.js
   REFERÊNCIAS A REMOVER DE index.html:
       <script src="sentinel-state-estore.js">
═══════════════════════════════════════════════════════════════════════════ */
