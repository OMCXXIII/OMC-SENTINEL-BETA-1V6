/* ═══════════════════════════════════════════════════════════════════════════
   OMC VR-OS | SENTINEL GRAPHICS FALLBACK v7.1 - PATCH DE EMERGÊNCIA
   Domínio: HARDWARE DEFENSE / RECOVERY
   ═══════════════════════════════════════════════════════════════════════════ */

(() => {
    'use strict';

    // Tolerância a atrasos de carregamento: Se o barramento não estiver pronto, aguarda na fila de microtasks
    const bootstrapFallback = () => {
        if (!window.SentinelBus) {
            console.warn('[FALLBACK:RETRY] Barramento não encontrado. Postergando inicialização para o próximo ciclo.');
            setTimeout(bootstrapFallback, 50);
            return;
        }
        GraphicsFallback.init();
    };

    const GraphicsFallback = {
        init() {
            console.log('%c[FALLBACK] Subsistema reativo injetado com sucesso.', 'color: #00FFCC; font-weight: bold;');
            this._bindSignals();
            this._interceptHardwareFailure();
        },

        _bindSignals() {
            window.SentinelBus.on('boot:start', () => this._verifySystemRenderCapabilities());
            window.SentinelBus.on('gpu:force-low-power', () => this._applyStatic2DOverride());
        },

        _verifySystemRenderCapabilities() {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            // Se o WebGL falhou nativamente (como no log da Intel HD Graphics)
            if (!gl) {
                console.error('[FALLBACK:CRITICAL] Falência catastrófica do WebGL detectada na inicialização do Core.');
                this._applyStatic2DOverride();
            }
        },

        _interceptHardwareFailure() {
            // Força a remoção dos avisos de propriedades desconhecidas limpando a pilha de avisos inúteis
            if (window.AFRAME) {
                window.AFRAME.utils.warn = function() {}; 
            }
        },

        _applyStatic2DOverride() {
            console.warn('[FALLBACK] Executando protocolo OVERRIDE: Migrando de XR Imersivo para 2D HUD de Baixa Latência.');
            
            // Injeta imediatamente os atributos de degradação controlada na viewport
            document.documentElement.classList.add('fallback-static-ui');
            document.documentElement.setAttribute('data-hardware-profile', 'legacy-intel');
            
            // Notifica o barramento e o Kernel para cancelar o congelamento de 2 segundos
            if (window.SentinelBus) {
                window.SentinelBus.emit('xr:pipeline-bypass', { status: 'override-active' });
                window.SentinelBus.emit('jarvis:speak', { 
                    text: "Hardware gráfico incompatível. Interface convertida para Modo de Segurança HUD Estático." 
                });
            }

            // Oculta a cena do A-Frame que está travando o loop de renderização da GPU
            const scene = document.querySelector('a-scene');
            if (scene) {
                scene.style.display = 'none';
                scene.setAttribute('visible', 'false');
            }
        }
    };

    window.GraphicsFallback = GraphicsFallback;
    bootstrapFallback();

})();
