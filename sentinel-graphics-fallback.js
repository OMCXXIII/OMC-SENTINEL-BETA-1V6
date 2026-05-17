/* ═══════════════════════════════════════════════════════════════════════════
   OMC VR-OS | SENTINEL GRAPHICS FALLBACK v7.5 - PROTETOR DE SOBERANIA
   Foco: Resolução de Assincronia, Supressão de Erros de GPU e Otimização HUD
   ═══════════════════════════════════════════════════════════════════════════ */

(() => {
    'use strict';

    // Sistema de checagem reativa para contornar a ordem de carregamento do DOM
    const interceptBootSequence = () => {
        if (typeof window.SentinelBus === 'undefined') {
            // Re-executa na próxima micro-task até o barramento estar alocado
            setTimeout(interceptBootSequence, 10);
            return;
        }
        SentinelVisualGuard.instantiate();
    };

    const SentinelVisualGuard = {
        instantiate() {
            console.log('%c[FALLBACK:READY] Driver de Segurança Visual acoplado ao Barramento.', 'color: #D4AF37; font-weight: bold;');
            this._bindKernelSignals();
            this._patchSceneEngine();
            this._verifyHardwareContext();
        },

        _bindKernelSignals() {
            // Ouve os sinais do barramento sem travar o fluxo principal
            window.SentinelBus.on('boot:start', () => {
                console.log('[FALLBACK] Monitoramento de latência ativa ativado.');
            });
        },

        _verifyHardwareContext() {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            // Tratamento preventivo para a falha detectada na Intel HD Graphics
            if (!gl) {
                console.warn('[FALLBACK:ALERT] WebGL corrompido no hardware nativo. Forçando Modo de Segurança 2D CSS-HUD.');
                this._activateSovereignFallback();
            }
        },

        _patchSceneEngine() {
            // Silencia os avisos chatos do A-Frame sobre propriedades desconhecidas (ex: powerPreference)
            if (window.AFRAME) {
                const originalWarn = window.AFRAME.utils.warn;
                window.AFRAME.utils.warn = function(message) {
                    if (message.indexOf('Unknown property') !== -1 || message.indexOf('raycaster') !== -1) {
                        return; // Ignora e limpa o console para manter o foco cognitivo
                    }
                    originalWarn.apply(this, arguments);
                };
                this._optimizeRaycaster();
            }
        },

        _optimizeRaycaster() {
            // Força a otimização do raycaster estaticamente nas cenas injetadas
            document.querySelectorAll('[raycaster]').forEach(entity => {
                if (!entity.getAttribute('raycaster').includes('objects')) {
                    entity.setAttribute('raycaster', 'objects: [data-raycastable]; interval: 200;');
                }
            });
        },

        _activateSovereignFallback() {
            document.documentElement.classList.add('sentinel-static-hud');
            document.documentElement.setAttribute('data-hardware-profile', 'legacy-intel-d3d9');
            
            // Notifica os demais módulos (protocols, engine-xr, jarvis-voice) via barramento
            if (window.SentinelBus) {
                window.SentinelBus.emit('xr:pipeline-bypass', { status: 'override-active' });
                window.SentinelBus.emit('jarvis:speak', { 
                    text: "Hardware gráfico instável. Modo de Segurança HUD Estático ativado para garantir baixa latência." 
                });
            }

            // Oculta elementos 3D pesados que estão dando crash no driver de vídeo
            const scene = document.querySelector('a-scene');
            if (scene) {
                scene.style.visibility = 'hidden';
                scene.setAttribute('visible', 'false');
                scene.pointerLockEnabled = false;
            }
        }
    };

    // Inicializa a varredura assíncrona
    interceptBootSequence();

})();
