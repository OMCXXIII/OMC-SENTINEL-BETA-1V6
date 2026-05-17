/* ═══════════════════════════════════════════════════════════════════════════
   OMC VR-OS | SENTINEL GRAPHICS FALLBACK v6.6
   Soberania de Renderização: GERENCIAMENTO DE IMPEDÂNCIA VISUAL REATIVA
   Domínio: MODULES / HARDWARE DEFENSE
   ═══════════════════════════════════════════════════════════════════════════ */

(() => {
    'use strict';

    if (!window.SentinelBus) {
        console.error('[FALLBACK] SentinelBus não encontrado. Abortando inicialização do driver de segurança visual.');
        return;
    }

    const GRAPHICS_FALLBACK_LIMITS = {
        maxStutterTicks: 3,
        criticalLatencyMs: 33.3 // Alvo abaixo de 30 FPS para XR
    };

    let stutterCounter = 0;
    let fallbackLevel = 0;

    const GraphicsFallback = {
        init() {
            console.log('%c[FALLBACK] Inicializando subsistema de proteção de GPU...', 'color: #FF9900; font-weight: bold;');
            this._bindSignals();
        },

        _bindSignals() {
            // Escuta eventos de performance vindos do motor XR ou HUD de telemetria
            SentinelBus.on('render:pipeline-stutter', (data) => this._evaluatePerformance(data));
            SentinelBus.on('gpu:force-low-power', () => this._applyAggressiveFallback());
            SentinelBus.on('boot:complete', () => this._verifySystemRenderCapabilities());
        },

        _verifySystemRenderCapabilities() {
            // Autodiagnóstico passivo de aceleração de hardware sem bloquear a thread principal
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                console.warn('[FALLBACK] WebGL não detectado ou bloqueado. Ativando Modo de Segurança Estático.');
                this._applyAggressiveFallback();
                return;
            }

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
                if (renderer.includes('Intel') || renderer.includes('HD Graphics') || renderer.includes('Software')) {
                    console.log('[FALLBACK] Hardware de baixo desempenho ou integrado detectado: ' + renderer);
                    // Prepara o sistema aplicando Inibição Lateral visual preventiva
                    document.body.setAttribute('data-hardware-profile', 'low-tier');
                }
            }
        },

        _evaluatePerformance({ frameTime, latency }) {
            if (frameTime > GRAPHICS_FALLBACK_LIMITS.criticalLatencyMs) {
                stutterCounter++;
                if (stutterCounter >= GRAPHICS_FALLBACK_LIMITS.maxStutterTicks && fallbackLevel === 0) {
                    this._triggerLevelOneFallback();
                }
            } else {
                if (stutterCounter > 0) stutterCounter--;
            }
        },

        _triggerLevelOneFallback() {
            fallbackLevel = 1;
            console.warn('[FALLBACK] [LATE-START] detectado no loop de renderização. Reduzindo efeitos complexos.');
            
            // Emite evento para que css_sentinel_fx desative animações pesadas e reduza opacidades secundárias
            SentinelBus.emit('xr:focus-isolate', { level: 'soft' });
            
            // Aplica a classe diretamente na raiz de renderização de forma limpa para manipulação via CSS dos tokens
            document.body.classList.add('low-power-mode');
            
            SentinelBus.emit('telemetry:log', { 
                type: 'PFC-BRUT-PREVENT', 
                message: 'Redução de fidelidade visual executada para proteger clock cognitivo.' 
            });
        },

        _applyAggressiveFallback() {
            fallbackLevel = 2;
            console.error('[FALLBACK] Alerta de performance crítica. Purgando overlays redundantes.');
            
            document.body.classList.add('low-power-mode');
            document.body.setAttribute('data-latency-state', 'critical');
            
            // Força o isolamento total pulvinar através do barramento
            SentinelBus.emit('xr:focus-isolate', { level: 'absolute' });
            
            // Notifica o VoiceCore para feedback tático auditivo
            SentinelBus.emit('jarvis:speak', { 
                text: "Atenção: Sobrecarga de renderização de hardware. Ativando modo econômico soberano." 
            });
        }
    };

    // Registro no ciclo de vida global preservando a integridade da CMA v1.0
    window.GraphicsFallback = GraphicsFallback;
    
    // Aguarda a autorização do barramento centralizado para acionar escuta ativa
    SentinelBus.once('boot:complete', () => {
        GraphicsFallback.init();
    });

})();
