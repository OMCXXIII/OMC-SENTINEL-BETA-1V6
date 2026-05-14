/* ═══════════════════════════════════════════════════════════════════════════
   OMC VR-OS | SENTINEL ENGINE-XR v6.1
   Renderização Neuroadaptativa + Cyber-Glass Engine
   Fragmento 2/4 — SOBERANIA OPERATIVA
   ---------------------------------------------------------------------------
   DEBUG LOG INTEGRATED: [XR-CHECK]
   PATCH: Redundância de Boot no Proximity Loop
   ENRIQUECIMENTO: DENSIFICAÇÃO DE PROJETO + INIBIÇÃO LATERAL
═══════════════════════════════════════════════════════════════════════════ */

if (!window.SentinelBus) {
    console.error('[ENGINE-XR] SentinelBus não encontrado. Carregue sentinel-bus.js primeiro.');
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ESTADO GLOBAL XR
   Núcleo de Soberania Operativa
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.XR_STATE = {
    focusLocked: false,
    multitaskingDetected: false,
    lastInteraction: performance.now(),
    cognitiveLoad: 0,
    activeWindow: null
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GHOST WINDOW COMPONENT
   Responsabilidade: Lógica local de cada janela 3D.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

AFRAME.registerComponent('ghost-window', {

    schema: {
        focus: { type: 'boolean', default: false }
    },

    init: function () {

        this.el.classList.add('sentinel-node');

        /* Registro de telemetria local */
        this.el.dataset.xrNode = true;

        /* Inicialização de materiais holográficos */
        this.el.setAttribute('material', {
            transparent: true,
            opacity: 0.92
        });

        /* Proteção contra sobreposição cognitiva */
        this.el.addEventListener('mouseenter', () => {

            window.XR_STATE.activeWindow = this.el;

            SentinelBus?.emit?.('ui:focus-lock', {
                target: this.el.id || 'ghost-window'
            });
        });
    },

    update: function () {

        /* Reatividade de foco neuroadaptativo */
        if (this.data.focus) {

            this.el.classList.add('focus-active');

            this.el.object3D.position.z = -2;

        } else {

            this.el.classList.remove('focus-active');

            this.el.object3D.position.z = -4;
        }
    }
});

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   OBSERVADOR DE FOCO
   Multitasking Detection + Deriva Atencional
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function initializeFocusObserver() {

    let hiddenTimestamp = 0;

    document.addEventListener('visibilitychange', () => {

        if (document.hidden) {

            hiddenTimestamp = performance.now();

            SentinelBus?.emit?.('attention:drift', {
                state: 'hidden'
            });

        } else {

            const delta = performance.now() - hiddenTimestamp;

            /* Deriva superior a 10 segundos */
            if (delta > 10000) {

                triggerLateralInhibition();

                console.warn(
                    '[XR-FOCUS] Deriva atencional detectada.'
                );
            }
        }
    });

    /* Telemetria de perda de foco */
    window.addEventListener('blur', () => {

        triggerLateralInhibition();

        SentinelBus?.emit?.('ui:inhibit-lateral', {
            reason: 'window-blur'
        });
    });

    /* Retorno operacional */
    window.addEventListener('focus', () => {

        restoreCognitivePriority();

        SentinelBus?.emit?.('ui:restore-focus');
    });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   INIBIÇÃO LATERAL
   Blindagem do Pulvinar do Tálamo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function triggerLateralInhibition() {

    window.XR_STATE.multitaskingDetected = true;

    document
        .querySelectorAll('.background-muted, .secondary-window')
        .forEach(node => {

            node.style.opacity = '0.2';

            node.style.filter =
                'blur(6px) grayscale(0.8) brightness(0.55)';

            node.style.pointerEvents = 'none';

            node.classList.add('inhibited-node');
        });

    console.warn(
        '%c[XR-INHIBIT] Inibição lateral ativada.',
        'color:#FF4B00;font-weight:bold;'
    );
}

function restoreCognitivePriority() {

    window.XR_STATE.multitaskingDetected = false;

    document
        .querySelectorAll('.inhibited-node')
        .forEach(node => {

            node.style.opacity = '';

            node.style.filter = '';

            node.style.pointerEvents = '';

            node.classList.remove('inhibited-node');
        });

    console.log(
        '%c[XR-RESTORE] Prioridade cognitiva restaurada.',
        'color:#00FF41;font-weight:bold;'
    );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SPATIAL ENGINE CORE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function updateQuantumProximity() {

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       SOBERANIA DE BOOT
       Handshake de Segurança
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    if (!window.SENTINEL_BOOTED) {

        if (window.SENTINEL_BOOTED === true) {

            console.log(
                '[ENGINE-XR] Redundância detectada: Sistema Bootado. Forçando ativação.'
            );

            _flushBuffer();

        } else {

            return;
        }
    }

    const nodes = document.querySelectorAll('.sentinel-node');

    nodes.forEach(node => {

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           DENSIDADE DE FOCO
           Simulação de proximidade cognitiva
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        const isFocused =
            node === window.XR_STATE.activeWindow;

        if (isFocused) {

            node.style.opacity = '1';

            node.style.transform =
                'scale(1.02) translateZ(12px)';

            node.style.filter =
                'brightness(1.08) saturate(1.15)';

        } else {

            node.style.opacity = '0.72';

            node.style.transform =
                'scale(0.985) translateZ(0px)';

            node.style.filter =
                'brightness(0.82)';
        }
    });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BIOMETRIC CLOCK SIGNAL
   Cadência de Execução Operacional
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function initializeClockSignal() {

    let pulse = 0;

    setInterval(() => {

        pulse++;

        document.documentElement.style.setProperty(
            '--ene-intensity',
            pulse % 2 === 0 ? '1' : '0.92'
        );

        SentinelBus?.emit?.('clock:tick', {
            pulse
        });

    }, 1000);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   INITIALIZATION & EVENT BINDING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function initializeSpatialBoot() {

    if (window.SentinelBus) {

        /* Ouvinte principal do Barramento */
        SentinelBus.once('boot:complete', () => {

            console.log(
                '%c[ENGINE-XR] boot:complete recebido — Proximity Engine liberada.',
                'color:#00D4FF;'
            );

            window.SENTINEL_BOOTED = true;

            const scene = document.querySelector('a-scene');

            if (scene) {

                scene.style.display = 'block';

                scene.style.opacity = '1';
            }

            _flushBuffer();

            initializeFocusObserver();

            initializeClockSignal();

            console.log(
                '%c[XR-SOVEREIGNTY] Renderização espacial estabilizada.',
                'color:#00FF41;font-weight:bold;'
            );
        });
    }
}

function _flushBuffer() {

    /* Sincronização de estados pendentes */
    console.log(
        '[ENGINE-XR] Buffer flutuante sincronizado com Nexus.'
    );

    SentinelBus?.emit?.('xr:buffer-synced');
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   XR TELEMETRY & DEBUG LOOP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/* Loop de Proximidade */
setInterval(() => {

    updateQuantumProximity();

}, window.IS_MOBILE ? 120 : 32);

/* Debug de Integridade */
setInterval(() => {

    if (window.SENTINEL_BOOTED) {

        console.debug(
            '%c[XR-CHECK] Engine Ativa, Renderizando...',
            'color:#7F00FF;font-style:italic;'
        );

    } else {

        console.warn(
            '[XR-CHECK] Engine em STANDBY. Aguardando SENTINEL_BOOTED: true'
        );
    }

}, 5000);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   LATENCY WATCHDOG
   Proteção contra LATE-START
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

setInterval(() => {

    const idle =
        performance.now() - window.XR_STATE.lastInteraction;

    /* 60 segundos */
    if (idle > 60000) {

        console.warn(
            '%c[LATE-START] Inércia detectada.',
            'color:#FFC400;font-weight:bold;'
        );

        SentinelBus?.emit?.('ui:late-start', {
            patch: '[PREDEF-ALL]'
        });

        document.body.classList.add('latency-critical');
    }

}, 8000);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TELEMETRIA DE INTERAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

[
    'mousemove',
    'mousedown',
    'keydown',
    'touchstart'
].forEach(eventType => {

    window.addEventListener(eventType, () => {

        window.XR_STATE.lastInteraction =
            performance.now();

        document.body.classList.remove('latency-critical');
    });
});

/* ═══════════════════════════════════════════════════════════════════════════
   XR ROOT AUTHORITY ENTRY POINT
═══════════════════════════════════════════════════════════════════════════ */

window.addEventListener('load', () => {

    console.log(
        '%c OMC ENGINE-XR v6.1 ONLINE ',
        'background:#000;color:#00D4FF;font-weight:bold;'
    );

    initializeSpatialBoot();
});

/* ═══════════════════════════════════════════════════════════════════════════
   JS_Sentinel_Engine-XR: Motor de Densificação de Projeto
═══════════════════════════════════════════════════════════════════════════

   Esta camada transforma a ENGINE-XR em um Sistema de Supressão
   Atencional Ativo.

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Observador de Foco (Multitasking Detection)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   O motor monitora perda de foco, troca de abas,
   dispersão operacional e concorrência de processos.

   Ao detectar deriva cognitiva, dispara:
   SentinelBus.emit('ui:inhibit-lateral')

   O evento injeta:
   .background-muted
   .secondary-window

   → opacity: 0.2
   → blur periférico
   → bloqueio de interação

   Resultado:
   Redução do ruído visual competitivo.

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Mecanismo de Blindagem
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Inspirado na função de supressão lateral do Pulvinar.

   Objetivo:
   impedir que estímulos adjacentes sequestram
   a largura de banda do Processador Central.

   O sistema prioriza:
   - Janela ativa
   - Tarefa âncora
   - Feedback operacional imediato

   Enquanto reduz:
   - Inputs periféricos
   - Contraste competitivo
   - Saturação simultânea de contexto

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Soberania de Boot
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   A constante global:
   window.SENTINEL_BOOTED

   atua como Handshake de Segurança Operacional.

   A renderização espacial só é liberada após:
   boot:complete

   Isso elimina:
   - Latência de ativação
   - Corrida de inicialização
   - Estados XR órfãos
   - Suspensão silenciosa da engine

   Resultado:
   estabilidade contínua do pipeline XR
   e sincronização confiável com o SentinelBus.

═══════════════════════════════════════════════════════════════════════════ */