/* ═══════════════════════════════════════════════════════════════════════════
   SENTINEL-DEBUG-HUD.js v1.2
   MONITOR DE INTEGRIDADE FINAL + LATENCY TRACKER
   ---------------------------------------------------------------------------
   OBJETIVO:
   - Monitorar integridade operacional em tempo real
   - Detectar latência entre intenção → ação
   - Disparar [LATE-START] acima de 60s
   - Sugerir PATCH [PREDEF-ALL]
   - Consolidar telemetria de boot e execução
═══════════════════════════════════════════════════════════════════════════ */

(function () {

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       STATE
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    let bootTimestamp       = null;
    let firstActionDetected = false;
    let latencyInterval     = null;

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       HUD FACTORY
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const createDebugOverlay = () => {

        const overlay = document.createElement('div');

        overlay.id = 'sentinel-debug-hud';

        overlay.style = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 320px;

            background:
                linear-gradient(
                    145deg,
                    rgba(0,12,18,0.92),
                    rgba(0,4,8,0.88)
                );

            border: 1px solid rgba(0,212,255,0.28);

            color: #00D4FF;

            font-family: 'Share Tech Mono', monospace;
            font-size: 10px;

            padding: 12px;

            z-index: 10000;

            pointer-events: none;

            backdrop-filter: blur(10px) saturate(180%);
            -webkit-backdrop-filter: blur(10px) saturate(180%);

            box-shadow:
                0 0 25px rgba(0,212,255,0.12),
                inset 0 0 15px rgba(0,212,255,0.05);

            clip-path: polygon(
                0 0,
                100% 0,
                100% calc(100% - 12px),
                calc(100% - 12px) 100%,
                0 100%
            );

            transition:
                border-color 0.3s ease,
                box-shadow 0.3s ease,
                opacity 0.4s ease;
        `;

        overlay.innerHTML = `

            <div style="
                border-bottom:1px solid rgba(0,212,255,0.25);
                padding-bottom:6px;
                margin-bottom:8px;
                font-weight:bold;
                letter-spacing:0.15em;
            ">
                DEBUG_AUTHORITY_v1.2
            </div>

            <div id="debug-state-monitor">
                STATE: AGUARDANDO...
            </div>

            <div style="
                margin-top:10px;
                border-top:1px solid rgba(0,212,255,0.18);
                padding-top:6px;
            ">
                LAST_BUS_EVENT:
                <div id="debug-bus-monitor"
                     style="color:#00FF41;margin-top:2px;">
                    [IDLE]
                </div>
            </div>

            <div style="
                margin-top:10px;
                border-top:1px solid rgba(0,212,255,0.18);
                padding-top:6px;
            ">
                ACTION_LATENCY:
                <div id="debug-latency-monitor"
                     style="color:#FFC400;margin-top:2px;">
                    TRACKING...
                </div>
            </div>

            <div style="
                margin-top:10px;
                border-top:1px solid rgba(0,212,255,0.18);
                padding-top:6px;
            ">
                ENGINE_STATUS:
                <div id="debug-engine-status"
                     style="color:#00FF41;margin-top:2px;">
                    STANDBY
                </div>
            </div>

            <div id="debug-patch-monitor"
                 style="
                    margin-top:10px;
                    color:#FF4B00;
                    display:none;
                    line-height:1.6;
                 ">
            </div>
        `;

        document.body.appendChild(overlay);

        return overlay;
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       LATENCY ENGINE
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const startLatencyTracking = () => {

        const latencyMon =
            document.getElementById('debug-latency-monitor');

        const patchMon =
            document.getElementById('debug-patch-monitor');

        latencyInterval = setInterval(() => {

            if (!bootTimestamp || firstActionDetected) return;

            const elapsed =
                Math.floor((Date.now() - bootTimestamp) / 1000);

            latencyMon.textContent =
                `${elapsed}s desde BOOT`;

            /* LIMIAR OPERACIONAL */

            if (elapsed >= 60) {

                latencyMon.style.color = '#FF4B00';

                latencyMon.textContent =
                    `[LATE-START] ${elapsed}s`;

                patchMon.style.display = 'block';

                patchMon.innerHTML = `
                    PATCH [PREDEF-ALL]<br>
                    EXECUTE UMA AÇÃO DE 60s.<br>
                    ELIMINE DELIBERAÇÃO.<br>
                    REDUZA ESCOPO.<br>
                    INÉRCIA DETECTADA.
                `;

                document.body.classList.add(
                    'latency-critical'
                );

                /* EVENTO GLOBAL */

                if (window.SentinelBus) {

                    SentinelBus.emit(
                        'system:late-start',
                        {
                            latency: elapsed,
                            patch: 'PREDEF-ALL'
                        }
                    );
                }
            }

        }, 1000);
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       PRIMEIRA AÇÃO
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const registerFirstAction = (source = 'unknown') => {

        if (firstActionDetected) return;

        firstActionDetected = true;

        const elapsed =
            Math.floor((Date.now() - bootTimestamp) / 1000);

        const latencyMon =
            document.getElementById('debug-latency-monitor');

        latencyMon.style.color = '#00FF41';

        latencyMon.innerHTML = `
            EXECUTION_CONFIRMED<br>
            ${elapsed}s | SOURCE: ${source}
        `;

        clearInterval(latencyInterval);

        document.body.classList.remove(
            'latency-critical'
        );

        console.log(
            `%c[EXECUTION] Primeira ação registrada em ${elapsed}s`,
            'color:#00FF41;'
        );

        if (window.SentinelBus) {

            SentinelBus.emit(
                'telemetry:first-action',
                {
                    latency: elapsed,
                    source
                }
            );
        }
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       BOOT
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    window.addEventListener('load', () => {

        createDebugOverlay();

        const stateMon =
            document.getElementById('debug-state-monitor');

        const busMon =
            document.getElementById('debug-bus-monitor');

        const engineStatus =
            document.getElementById('debug-engine-status');

        if (window.SentinelBus) {

            /* HOOK EMIT */

            const originalEmit =
                window.SentinelBus.emit;

            window.SentinelBus.emit = function (
                event,
                payload
            ) {

                busMon.textContent = `> ${event}`;

                /* PRIMEIRA AÇÃO */

                const actionableEvents = [

                    'mission:lock',
                    'jarvis:intent',
                    'nexus:command',
                    'xr:focus-isolate',
                    'ui:mode'

                ];

                if (
                    actionableEvents.includes(event)
                ) {

                    registerFirstAction(event);
                }

                return originalEmit.apply(
                    this,
                    arguments
                );
            };

            /* BOOT HANDSHAKE */

            window.SentinelBus.once(
                'boot:complete',
                () => {

                    bootTimestamp = Date.now();

                    engineStatus.textContent =
                        'ONLINE';

                    engineStatus.style.color =
                        '#00FF41';

                    console.log(
                        '%c[DEBUG-HUD] Boot timestamp sincronizado.',
                        'color:#00D4FF;'
                    );

                    startLatencyTracking();
                }
            );

            /* STATE TRACKING */

            window.SentinelBus.on(
                'state:changed',
                (data) => {

                    const state =
                        window.StateStore?.all?.();

                    if (!state) return;

                    stateMon.innerHTML = `

                        LATENCY:
                        ${state.ops?.latency ?? '--'}<br>

                        MISSION:
                        ${state.ops?.mission ?? 'NULL'}<br>

                        CYCLES:
                        ${state.telemetry?.cycles ?? '--'}<br>

                        PATH_UP:
                        ${data.path ?? '--'}
                    `;
                }
            );
        }

        /* FALLBACK */

        if (!window.SentinelBus) {

            engineStatus.textContent =
                'BUS_OFFLINE';

            engineStatus.style.color =
                '#FF4B00';

            console.warn(
                '[DEBUG-HUD] SentinelBus não encontrado.'
            );
        }
    });

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       VEREDITO DE ENGENHARIA
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    /**
     * [LATE-START]
     * -----------------------------------------
     * Resistência operacional não é tratada
     * como falha moral.
     *
     * O sistema interpreta hesitação como:
     *
     * → Alta impedância sináptica
     * → Dissipação de sinal
     * → Excesso de deliberação
     * → Fragmentação executiva
     *
     * PATCH:
     * [PREDEF-ALL]
     *
     * Executar ação extremamente pequena
     * para reduzir atrito de ativação e
     * transferir execução para loops
     * automatizados.
     *
     * OBJETIVO:
     * induzir condução operacional rápida
     * via repetição curta e consistente.
     */

})();