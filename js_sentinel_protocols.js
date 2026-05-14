/* ═══════════════════════════════════════════════════════════════════════════
   OMC VR-OS | SENTINEL PROTOCOLS v6.1
   Gestão de Telemetria, Clock ATC e Handshake de Dados
   Fragmento 3/4 — SOBERANIA OPERATIVA
   ---------------------------------------------------------------------------
   AJUSTE: Sincronização com Sequência de Boot (Quadro 4)
   ENRIQUECIMENTO: BIOMETRIA + RESFRIAMENTO METABÓLICO
═══════════════════════════════════════════════════════════════════════════ */

const SentinelProtocols = (() => {

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       CACHE DE TELEMETRIA
       Minimiza querySelector recorrente.
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    let clockDisplay = null;
    let latencyDisplay = null;
    let batteryDisplay = null;

    /* Estado metabólico interno */
    let mentalBattery = 100;

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       INIT
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const init = () => {

        clockDisplay =
            document.getElementById('clock-display');

        latencyDisplay =
            document.getElementById('latency-value');

        batteryDisplay =
            document.getElementById('mental-battery');

        console.log(
            '[PROTOCOLS] Handshake de Telemetria pronto.'
        );

        _bindEvents();

        _initializeMetabolicLoop();
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       EVENTOS DE TELEMETRIA
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _bindEvents = () => {

        if (!window.SentinelBus) return;

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           CLOCK ATC
           Cadência operacional do operador.
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        window.SentinelBus.on(
            'ui:clock-tick',
            (data) => {

                if (
                    !window.SENTINEL_BOOTED ||
                    !clockDisplay
                ) return;

                /* Render XR */
                if (
                    clockDisplay.tagName
                        .toLowerCase()
                        .startsWith('a-')
                ) {

                    clockDisplay.setAttribute(
                        'value',
                        `CLOCK_ATC\n${data.time}\nSESSÃO: ${data.elapsed}s`
                    );

                } else {

                    clockDisplay.textContent =
                        `${data.time} | ${data.elapsed}s`;
                }
            }
        );

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           HUD LATENCY
           Monitoramento de hiato operacional.
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        window.SentinelBus.on(
            'ui:hud-latency',
            (data) => {

                if (!latencyDisplay) return;

                latencyDisplay.textContent = data.value;

                /* ALERTA DE LATÊNCIA */
                if (data.ms > 600000) {

                    latencyDisplay.classList.add(
                        'latency-critical'
                    );

                    console.warn(
                        '%c[LATE-START] Latência crítica detectada.',
                        'color:#FFC400;font-weight:bold;'
                    );

                    SentinelBus.emit(
                        'system:late-start',
                        {
                            patch: '[PREDEF-ALL]'
                        }
                    );
                }
            }
        );

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           MENTAL BATTERY LISTENER
           Gestão de glicose operacional.
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        window.SentinelBus.on(
            'system:mental-battery',
            (data) => {

                if (
                    typeof data.level !== 'number'
                ) return;

                mentalBattery = data.level;

                _renderBatteryState(mentalBattery);

                /* Disparo metabólico crítico */
                if (mentalBattery <= 20) {

                    console.warn(
                        '%c[PFC-BRUT] Reserva metabólica crítica.',
                        'color:#FF4B00;font-weight:bold;'
                    );

                    SentinelBus.emit(
                        'system:nsdr-trigger',
                        {
                            duration: 600,
                            reason: 'low-metabolic-voltage'
                        }
                    );
                }
            }
        );

        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           NSDR COOLING
           Resfriamento metabólico.
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

        window.SentinelBus.on(
            'system:nsdr-trigger',
            (data) => {

                _activateNSDRCooling(data);
            }
        );
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       RENDER DE BATERIA MENTAL
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    function _renderBatteryState(level) {

        if (!batteryDisplay) return;

        const safeLevel =
            Math.max(0, Math.min(level, 100));

        batteryDisplay.textContent =
            `${safeLevel}%`;

        /* Estado visual progressivo */

        batteryDisplay.classList.remove(
            'battery-warning',
            'battery-critical'
        );

        if (safeLevel <= 20) {

            batteryDisplay.classList.add(
                'battery-critical'
            );

        } else if (safeLevel <= 45) {

            batteryDisplay.classList.add(
                'battery-warning'
            );
        }
    }

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       NSDR ENGINE
       Non-Sleep Deep Rest Automation
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    function _activateNSDRCooling(data = {}) {

        document.body.classList.add(
            'nsdr-cooling'
        );

        console.log(
            '%c[NSDR] Cooling metabólico ativado.',
            'color:#00D4FF;font-weight:bold;'
        );

        /* Interface reduz estímulo sensorial */
        document
            .querySelectorAll(
                '.hud-corner, .glass-panel, .cyber-glass'
            )
            .forEach(node => {

                node.style.filter =
                    'saturate(0.45) brightness(0.82)';

                node.style.transition =
                    'filter 1.2s ease';
            });

        /* Overlay informacional */
        SentinelBus?.emit?.(
            'ui:notification',
            {
                type: 'NSDR',
                message:
                    'Resfriamento metabólico recomendado por 10 minutos.'
            }
        );

        /* Auto-restauração */
        setTimeout(() => {

            document.body.classList.remove(
                'nsdr-cooling'
            );

            document
                .querySelectorAll(
                    '.hud-corner, .glass-panel, .cyber-glass'
                )
                .forEach(node => {

                    node.style.filter = '';
                });

            console.log(
                '%c[NSDR] Sistema restaurado.',
                'color:#00FF41;font-weight:bold;'
            );

        }, (data.duration || 600) * 1000);
    }

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       LOOP METABÓLICO
       Simulação contínua de drenagem cognitiva.
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    function _initializeMetabolicLoop() {

        setInterval(() => {

            if (!window.SENTINEL_BOOTED) return;

            /* Drenagem leve */
            mentalBattery =
                Math.max(0, mentalBattery - 0.15);

            SentinelBus?.emit?.(
                'system:mental-battery',
                {
                    level: Math.round(mentalBattery)
                }
            );

        }, 45000);
    }

    return {
        init
    };

})();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BOOT SEQUENCE INTEGRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

if (window.SentinelBus) {

    window.SentinelBus.once(
        'boot:complete',
        () => {

            SentinelProtocols.init();

            console.log(
                '%c[PROTOCOLS] Sequência 4: Ouvintes de telemetria ativos.',
                'color:#00FF41;'
            );
        }
    );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   INTERFACE DE COMANDO (PROTOCOLO CMD)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

document.addEventListener('keydown', (e) => {

    const cmdInput =
        document.querySelector('.cmd-input');

    if (
        !cmdInput ||
        document.activeElement !== cmdInput
    ) return;

    if (e.key === 'Enter') {

        const command =
            cmdInput.value.trim();

        if (
            command &&
            window.SentinelBus
        ) {

            window.SentinelBus.emit(
                'nexus:command',
                {
                    raw: command
                }
            );

            console.log(
                `%c[CMD] ${command}`,
                'color:#00D4FF;'
            );

            cmdInput.value = '';
        }
    }
});

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   EXPORTAÇÃO GLOBAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.SentinelProtocols =
    SentinelProtocols;

/* ═══════════════════════════════════════════════════════════════════════════
   JS_Sentinel_Protocols: Ponte Biometria-Interface
═══════════════════════════════════════════════════════════════════════════

   Este módulo transforma o HUD em uma camada de
   diagnóstico metabólico contínuo.

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Mental Battery Listener
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   O protocolo monitora continuamente o valor de:
   system:mental-battery

   Representando:
   - reserva energética operacional
   - fadiga executiva
   - carga metabólica do CPF

   Se a carga cair abaixo de 20%:

   → emite:
   system:nsdr-trigger

   → sinaliza:
   [PFC-BRUT]

   Resultado:
   prevenção de colapso por força bruta.

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   NSDR Automation
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   O gatilho ativa:
   .nsdr-cooling

   A interface reduz:
   - saturação
   - contraste competitivo
   - carga visual simultânea

   O operador recebe:
   - aviso metabólico
   - recomendação de resfriamento
   - desaceleração operacional

   Tempo sugerido:
   10 minutos.

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Coerência Neurobiológica
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Em baixa energia executiva,
   o cérebro tende a favorecer:

   - atalhos
   - procrastinação
   - evasão
   - recompensa imediata

   O protocolo evita entrada no:
   "Modo de Segurança Biológico"

   preservando:
   - estabilidade do Clock ATC
   - continuidade operacional
   - integridade do buffer atencional
   - consistência da execução

═══════════════════════════════════════════════════════════════════════════ */