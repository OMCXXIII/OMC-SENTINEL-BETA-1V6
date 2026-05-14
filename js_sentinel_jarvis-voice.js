/* ═══════════════════════════════════════════════════════════════════════════
   S_SENTINEL_JARVIS-VOICE v6.2
   PROCESSADOR DE INTENÇÕES + MISSION LOCK v1.1
   ENRIQUECIMENTO COGNITIVO NÃO-INTRUSIVO
   ---------------------------------------------------------------------------
   OBJETIVO:
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

            if (window.SentinelBus) {

                SentinelBus.emit('mission:restored', {
                    mission: saved
                });

                SentinelBus.emit('ui:nexus-update', {
                    text: `MISSION_RESTORED:\n${saved}`
                });
            }
        }
    },

    lock(mission) {

        if (!mission || mission.length < 2) return;

        this.activeMission = mission;

        /* Persistência Externa */
        localStorage.setItem(this.STORAGE_KEY, mission);

        console.log(
            `%c[MISSION-LOCK] Persistência Zeigarnik ativa.`,
            'color:#00D4FF;'
        );

        /* Feedback no HUD */
        SentinelBus.emit('ui:nexus-update', {
            text: `MISSION_LOCK:\n${mission}`
        });

        /* Estado Global */
        SentinelBus.emit('state:change', {
            key: 'ops.activeMission',
            val: mission,
            prev: null
        });

        /* Telemetria */
        SentinelBus.emit('telemetry:mission-lock', {
            mission,
            timestamp: Date.now()
        });

        /* Feedback Neural */
        SentinelBus.emit('jarvis:feedback', {
            type: 'mission'
        });
    },

    clear() {

        localStorage.removeItem(this.STORAGE_KEY);

        this.activeMission = null;

        SentinelBus.emit('ui:nexus-update', {
            text: 'MISSION_LOCK_CLEARED'
        });

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

    SentinelBus.on('jarvis:intent', ({ intent, value }) => {

        /* MISSÃO */
        if (intent === 'mission') {

            MissionLockEngine.lock(value);

            SentinelBus.emit('jarvis:speak', {
                text: `Missão consolidada. Buffer cognitivo protegido.`
            });
        }

        /* DEEP FLOW */
        if (intent === 'deepflow') {

            SentinelBus.emit('telemetry:focus-state', {
                mode: 'deepflow',
                timestamp: Date.now()
            });

            document.body.classList.add('ene-active');
        }

        /* FOCUS */
        if (intent === 'focus') {

            SentinelBus.emit('xr:focus-isolate', {
                opacity: 0.05,
                blur: 6
            });

            SentinelBus.emit('telemetry:focus-state', {
                mode: 'focus',
                timestamp: Date.now()
            });
        }
    });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   COGNITIVE SAFETY LOOP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * Detecta ausência de missão ativa durante estados
 * prolongados de execução e sugere realinhamento.
 */

setInterval(() => {

    if (!window.SentinelBus) return;

    const hasMission =
        !!localStorage.getItem('OMC_MISSION_LOCK');

    if (!hasMission && window.SENTINEL_BOOTED) {

        SentinelBus.emit('ui:nexus-update', {
            text:
                '[MISSION-NULL]\n' +
                'Nenhuma missão ativa detectada.'
        });

        console.warn(
            '[MISSION-NULL] Sistema sem vetor prioritário.'
        );
    }

}, 180000);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   RESTORE ON BOOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

if (window.SentinelBus) {

    SentinelBus.once('boot:complete', () => {

        MissionLockEngine.init();

        console.log(
            '%c[S_JARVIS] Mission Lock Engine sincronizada.',
            'color:#00D4FF;font-weight:bold;'
        );
    });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   OPTIONAL COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

document.addEventListener('keydown', (e) => {

    /* CTRL + SHIFT + X → CLEAR MISSION */

    if (
        e.ctrlKey &&
        e.shiftKey &&
        e.key.toLowerCase() === 'x'
    ) {

        MissionLockEngine.clear();

        SentinelBus.emit('jarvis:speak', {
            text: 'Mission Lock removido.'
        });
    }
});

/* ═══════════════════════════════════════════════════════════════════════════
   RESULTADO OPERACIONAL
═══════════════════════════════════════════════════════════════════════════ */

/**
 * MISSION LOCK v1.1
 * -----------------
 * - Persistência externa da intenção ativa
 * - Blindagem contra loops cognitivos concorrentes
 * - Redução de latência verbo → ação
 * - Menor retenção ativa no CPF
 * - Integração total com SentinelBus
 * - Compatível com Engine-XR + Protocols + HUD
 *
 * EVENTOS UTILIZADOS:
 *
 * → mission:lock
 * → mission:restored
 * → telemetry:mission-lock
 * → telemetry:focus-state
 * → ui:nexus-update
 * → state:change
 * → xr:focus-isolate
 *
 * LOGS:
 *
 * [MISSION-LOCK]
 * [MISSION-NULL]
 * [ZEI-LOOP]
 */