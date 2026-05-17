/* ═══════════════════════════════════════════════════════════════════════════
   S_SENTINEL_JARVIS-VOICE v6.3 — PATCH BUG 5 + BUG 6
   PROCESSADOR DE INTENÇÕES + MISSION LOCK v1.1
   ---------------------------------------------------------------------------
   CHANGELOG v6.3:
   ✓ BUG 5 — `state:change` → `state:changed`
             O evento emitido pelo Jarvis era `state:change` (sem `d`).
             O StateStore e todos os outros módulos escutam `state:changed`.
             A missão era travada no localStorage mas nunca chegava ao
             StateStore.set() — ops.activeMission ficava null para sempre.
   ✓ BUG 6 — `SentinelBus.emit()` sem `window.` dentro de MissionLockEngine
             MissionLockEngine é um objeto literal no escopo global.
             Dentro de seus métodos, `SentinelBus` é resolvido via escopo
             léxico — que não inclui `window` automaticamente em strict mode
             ou após bundle. Substituído por `window.SentinelBus?.emit()`
             em todos os pontos de chamada dentro do objeto.
   ---------------------------------------------------------------------------
   OBJETIVO ORIGINAL:
   - Reduzir a latência entre verbo → ação
   - Persistir intenção ativa fora do CPF (RAM Mental)
   - Neutralizar loops de background [ZEI-LOOP]
   - Blindar foco via Mission Lock Persistente
═══════════════════════════════════════════════════════════════════════════ */

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MISSION LOCK v1.1
   Persistência Cognitiva Externa
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const MissionLockEngine = {

    STORAGE_KEY: 'OMC_MISSION_LOCK',

    activeMission: null,

    init() {

        const saved = localStorage.getItem(this.STORAGE_KEY);

        if (saved) {

            this.activeMission = saved;

            console.log(
                `%c[MISSION-LOCK] Missão restaurada: ${saved}`,
                'color:#00FF41;'
            );

            // BUG 6 FIX: window.SentinelBus?.emit() em vez de SentinelBus.emit()
            window.SentinelBus?.emit('mission:restored', { mission: saved });
            window.SentinelBus?.emit('ui:nexus-update',  { text: `MISSION_RESTORED:\n${saved}` });
        }
    },

    lock(mission) {

        if (!mission || mission.length < 2) return;

        this.activeMission = mission;

        /* Persistência Externa */
        localStorage.setItem(this.STORAGE_KEY, mission);

        console.log(
            '%c[MISSION-LOCK] Persistência Zeigarnik ativa.',
            'color:#00D4FF;'
        );

        // BUG 6 FIX: window.SentinelBus?.emit() em todos os pontos abaixo

        /* Feedback no HUD */
        window.SentinelBus?.emit('ui:nexus-update', {
            text: `MISSION_LOCK:\n${mission}`
        });

        /* Estado Global — BUG 5 FIX: state:change → state:changed */
        window.SentinelBus?.emit('state:changed', {
            path:  'ops.activeMission',
            value: mission,
            previous: null,
            ts: Date.now()
        });

        /* Telemetria */
        window.SentinelBus?.emit('telemetry:mission-lock', {
            mission,
            timestamp: Date.now()
        });

        /* Feedback Neural */
        window.SentinelBus?.emit('jarvis:feedback', {
            type: 'mission'
        });

        /* Sincroniza StateStore nativo se disponível */
        if (window.StateStore?.missionLock) {
            window.StateStore.missionLock(mission);
        }
    },

    clear() {

        localStorage.removeItem(this.STORAGE_KEY);

        this.activeMission = null;

        // BUG 6 FIX: window.SentinelBus?.emit()
        window.SentinelBus?.emit('ui:nexus-update', {
            text: 'MISSION_LOCK_CLEARED'
        });

        /* Sincroniza StateStore nativo se disponível */
        if (window.StateStore?.missionLock) {
            window.StateStore.missionLock(null);
        }

        console.warn('[MISSION-LOCK] Buffer cognitivo liberado.');
    }
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FECHAMENTO DO CICLO ZEIGARNIK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * FUNÇÃO OPERACIONAL:
 *
 * A persistência da missão reduz reprocessamento cognitivo
 * interno ao sinalizar ao operador que a intenção já foi
 * consolidada fora da memória operacional imediata.
 *
 * RESULTADO:
 * - Menor ruminação
 * - Menor carga de retenção ativa
 * - Menor fragmentação de atenção
 * - Redução de loops mentais concorrentes
 */

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SPEECH → ACTION → LOCK PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

if (window.SentinelBus) {

    window.SentinelBus.on('jarvis:intent', ({ intent, value }) => {

        /* MISSÃO */
        if (intent === 'mission') {

            MissionLockEngine.lock(value);

            window.SentinelBus?.emit('jarvis:speak', {
                text: 'Missão consolidada. Buffer cognitivo protegido.'
            });
        }

        /* DEEP FLOW */
        if (intent === 'deepflow') {

            window.SentinelBus?.emit('telemetry:focus-state', {
                mode:      'deepflow',
                timestamp: Date.now()
            });

            document.body.classList.add('ene-active');
        }

        /* FOCUS */
        if (intent === 'focus') {

            window.SentinelBus?.emit('xr:focus-isolate', {
                opacity: 0.05,
                blur:    6
            });

            window.SentinelBus?.emit('telemetry:focus-state', {
                mode:      'focus',
                timestamp: Date.now()
            });
        }
    });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   COGNITIVE SAFETY LOOP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

setInterval(() => {

    if (!window.SentinelBus) return;

    const hasMission = !!localStorage.getItem('OMC_MISSION_LOCK');

    if (!hasMission && window.SENTINEL_BOOTED) {

        window.SentinelBus.emit('ui:nexus-update', {
            text: '[MISSION-NULL]\nNenhuma missão ativa detectada.'
        });

        console.warn('[MISSION-NULL] Sistema sem vetor prioritário.');
    }

}, 180000);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   RESTORE ON BOOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

if (window.SentinelBus) {

    window.SentinelBus.once('boot:complete', () => {

        MissionLockEngine.init();

        console.log(
            '%c[S_JARVIS] Mission Lock Engine sincronizada.',
            'color:#00D4FF;font-weight:bold;'
        );
    });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   OPTIONAL COMMANDS — Ctrl+Shift+X → Clear Mission
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

document.addEventListener('keydown', (e) => {

    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'x') {

        MissionLockEngine.clear();

        window.SentinelBus?.emit('jarvis:speak', {
            text: 'Mission Lock removido.'
        });
    }
});

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   EXPOSIÇÃO GLOBAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.MissionLockEngine = MissionLockEngine;

/* ═══════════════════════════════════════════════════════════════════════════
   RESULTADO OPERACIONAL v6.3
   ✓ state:changed (com `d`) — StateStore recebe a mutação
   ✓ window.SentinelBus?.emit() — sem ReferenceError em qualquer contexto
   ✓ StateStore.missionLock() sincronizado para dupla persistência L1+L2
═══════════════════════════════════════════════════════════════════════════ */
console.log('%c OMC SENTINEL JARVIS v8.0 ONLINE ', 
    'background:#000;color:#00FF41;border:1px solid #00FF41;padding:5px;font-family:monospace;');
