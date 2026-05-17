/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SENTINEL ENGINE XR - V8.0 "DUPLICIDADE REMOVIDA"
   Core: Gestão de Camadas de Intencionalidade e Supressão Atencional
   Target: Nexus ALPHA/BETA/GAMMA

   CHANGELOG v8.0:
   ✓ BUG 1 — Schema `title` → `label` (nome reservado A-Frame v1.4, gerava
             "Unknown property" e silenciava o componente inteiro)
   ✓ BUG 2 — `window.addEventListener('boot:complete')` substituído por
             `SentinelBus.on('boot:complete')` — o evento viaja pelo Bus,
             não pelo DOM, então o engine nunca recebia o sinal e ficava
             eternamente em STANDBY (SENTINEL_BOOTED jamais chegava aqui)
   ✓ BUG 3 — GPU fallback graceful: quando WebGL indisponível (Intel HD
             legacy + sandboxed), o engine NÃO aborta mais. Registra o
             componente ghost-window em modo 2D, injeta o pulvinar-shield
             via CSS e mantém o listener de boot ativo. O sistema degrada
             com elegância em vez de morrer silenciosamente.
   ✓ BUG 4 — Duplicidade removida: `applyInhibition` agora é método separado
             do schema, sem replicação de código. Sintaxe corrigida.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

(function () {
    'use strict';

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       MODO DE RENDERIZAÇÃO
       Detectado uma única vez no escopo do módulo.
       Compartilhado entre todas as funções internas.
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _checkGPU = () => {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') ||
                       canvas.getContext('experimental-webgl');
            return !!gl;
        } catch (_) {
            return false;
        }
    };

    const GPU_AVAILABLE = _checkGPU();

    if (!GPU_AVAILABLE) {
        console.warn(
            '%c[ENGINE-XR] GPU indisponível. Modo 2D Estável ativado. ' +
            'Sistema continua operacional.',
            'color:#FFC400;font-weight:bold;'
        );
        window.SentinelBus?.emit('telemetry:graphics-low', {
            reason:  'gpu_fallback',
            mode:    '2D_STABLE',
            ts:      Date.now()
        });
    }

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       GUARD: A-FRAME
       Sem A-Frame não há componente XR, mas o engine
       2D ainda pode rodar (pulvinar-shield + bus listener).
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const AFRAME_READY = !!window.AFRAME;

    if (!AFRAME_READY) {
        console.error(
            '[ENGINE-XR] AFRAME não detectado. ' +
            'Componente ghost-window desativado. Engine 2D prossegue.'
        );
    }

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       COMPONENTE: GHOST-WINDOW  (apenas se A-Frame presente)
       BUG 1 FIX: `title` → `label`
       O A-Frame v1.4 reserva `title` internamente.
       Usar `title` no schema silencia o componente inteiro
       sem lançar erro crítico — apenas o warning de console.
       Todos os usos internos e o HTML foram atualizados.
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    if (AFRAME_READY) {

        AFRAME.registerComponent('ghost-window', {

            schema: {
                focus: { type: 'boolean', default: false  },
                label: { type: 'string',  default: 'NEXUS_TERMINAL' }, // FIX: era `title`
                layer: { type: 'string',  default: 'ALPHA' }
            },

            init: function () {
                const el   = this.el;
                const data = this.data;

                console.log(
                    `[XR-NODE] Janela ${data.label} (${data.layer}) inicializada.`
                );

                /* Foco via interação XR */
                el.addEventListener('mousedown', () => {
                    window.SentinelBus?.emit('xr:focus-isolate', {
                        label: data.label,   // FIX: era `title`
                        layer: data.layer,
                        id:    el.id
                    });
                });

                /* Inibição lateral via CustomEvent DOM (canal separado) */
                window.addEventListener('ui:inhibit-lateral', (e) => {
                    const target = e.detail?.anchorLabel ?? e.detail?.anchorTitle;
                    this.applyInhibition(data.label === target);
                });
            },

            update: function () {
                // FIX: evita aplicar opacidade em modo 2D
                if (!GPU_AVAILABLE) return;
                this.applyInhibition(this.data.focus);
            },

            applyInhibition: function (isFocused) {
                /* Guard: em modo 2D, não há material */
                if (!GPU_AVAILABLE) {
                    // Fallback CSS puro
                    this.el.style.opacity = isFocused ? '1' : '0.5';
                    this.el.style.filter = isFocused ? 'brightness(1.2)' : 'brightness(0.8)';
                } else if (this.el.getAttribute('material') !== null) {
                    try {
                        this.el.setAttribute('material', 'opacity', isFocused ? 0.85 : 0.2);
                    } catch (_) { 
                        /* silencioso em fallback 2D */ 
                    }
                }

                if (isFocused) {
                    this.el.classList.add('attention-anchor');
                    document.body.classList.add('focus-lock');
                } else {
                    this.el.classList.remove('attention-anchor');
                    // Remove focus-lock apenas se nenhuma outra entidade está focada
                    const anyFocused = document.querySelectorAll('[ghost-window][focus]').length > 0;
                    if (!anyFocused) {
                        document.body.classList.remove('focus-lock');
                    }
                }
            }
        });
    }

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       PULVINAR SHIELD (2D fallback + XR overlay)
       Injetado via DOM puro — funciona com ou sem GPU.
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const _injectPulvinarShield = () => {

        /* Evita duplicata se startEngine for chamado mais de uma vez */
        if (document.getElementById('pulvinar-shield')) return;

        const overlay = document.createElement('div');
        overlay.id    = 'pulvinar-shield';

        Object.assign(overlay.style, {
            position:       'fixed',
            top:            '0',
            left:           '0',
            width:          '100%',
            height:         '100%',
            pointerEvents:  'none',
            zIndex:         '999',
            background:     'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.8) 150%)',
            opacity:        '0',
            transition:     'opacity 0.5s ease'
        });

        document.body.appendChild(overlay);

        window.addEventListener('xr:activated', () => {
            overlay.style.opacity = '1';
        });

        console.log(
            '%c[ENGINE-XR] Pulvinar Shield injetado. Modo: ' +
            (GPU_AVAILABLE ? 'XR' : '2D_STABLE'),
            'color:#00FF41;font-weight:bold;'
        );
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       START ENGINE
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    const startEngine = () => {
        console.log(
            '%c[ENGINE-XR] SENTINEL_BOOTED: Soberania de Renderização Ativa.',
            'color:#00FF41;font-weight:bold;'
        );
        _injectPulvinarShield();
    };

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       BUG 2 FIX: BOOT VIA SENTINELBUS (não DOM)
       O evento 'boot:complete' viaja pelo SentinelBus,
       não é um CustomEvent do DOM. Usar addEventListener
       no window nunca disparava — o engine ficava eternamente
       em STANDBY e SENTINEL_BOOTED jamais era confirmado aqui.

       Solução: SentinelBus.on() com replay automático de
       sticky events (se o bus já processou o boot antes
       deste listener ser registrado, o handler é chamado
       imediatamente via o mecanismo de replay do Bus v1.1).
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    if (window.SentinelBus) {

        window.SentinelBus.once('boot:complete', (data) => {
            console.log(
                `%c[ENGINE-XR] boot:complete recebido via Bus. Status: ${data?.status ?? 'OK'}`,
                'color:#00D4FF;'
            );
            startEngine();
        });

    } else {
        /*
         * Fallback: Bus não disponível no momento da execução deste script.
         * Aguarda o evento DOM como último recurso e tenta novamente
         * quando o Bus estiver pronto.
         */
        console.warn('[ENGINE-XR] SentinelBus não disponível. Aguardando via DOMContentLoaded.');

        window.addEventListener('DOMContentLoaded', () => {
            if (window.SentinelBus) {
                window.SentinelBus.once('boot:complete', startEngine);
            } else {
                /* Failsafe absoluto: inicia engine 2D após 3s */
                setTimeout(() => {
                    console.warn('[ENGINE-XR] Failsafe 3s ativado. Iniciando sem Bus.');
                    startEngine();
                }, 3000);
            }
        });
    }

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       PATCH SUPRESSÃO DE INUNDAÇÃO DO LOG DO BARRAMENTO
       Interceptador acoplado para evitar saturação e 
       reduzir a latência de processamento de strings.
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    if (window.SentinelBus && typeof window.SentinelBus.emit === 'function') {
        const originalEmit = window.SentinelBus.emit;
        window.SentinelBus.emit = function (event, data) {
            if (event !== 'ui:pulse' && event !== 'state:changed') {
                return originalEmit.apply(this, arguments);
            }
            const listeners = this._listeners?.[event] || [];
            for (let i = 0; i < listeners.length; i++) {
                listeners[i](data);
            }
            return this;
        };
    }

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       LOG DE INICIALIZAÇÃO DO MÓDULO
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

    console.log(
        `%c SENTINEL ENGINE-XR v8.0 [${GPU_AVAILABLE ? 'XR_MODE' : '2D_STABLE'}][BUS_SYNC][GHOST-WINDOW_PATCHED][DUPLICIDAD-REMOVED] `,
        'background:#000;color:#00FF41;border:1px solid #00FF41;padding:5px;font-family:monospace;'
    );

})();
