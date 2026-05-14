/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
   SENTINEL ENGINE XR - V7.0 "BAIXA IMPEDÂNCIA"
   Core: Gestão de Camadas de Intencionalidade e Supressão Atencional
   Target: Nexus ALPHA/BETA/GAMMA
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

(function() {
    'use strict';

    // 1. Verificação de Integridade de Hardware (GPU Fallback)
    const checkGPUIntegrity = () => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            console.warn('[ENGINE-XR] Hardware insuficiente. Ativando Modo 2D Estável.');
            window.SentinelBus?.emit('telemetry:graphics-low', { reason: 'gpu_fallback' });
            return false;
        }
        return true;
    };

    if (!window.AFRAME) {
        console.error('[ENGINE-XR] Falha crítica: AFRAME não detectado.');
        return;
    }

    if (!checkGPUIntegrity()) return;

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
       COMPONENTE: GHOST-WINDOW
       Responsabilidade: Inibição Lateral e Foco Seletivo
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    AFRAME.registerComponent('ghost-window', {
        schema: {
            focus: { type: 'boolean', default: false },
            title: { type: 'string', default: 'NEXUS_TERMINAL' },
            layer: { type: 'string', default: 'ALPHA' }
        },

        init: function () {
            const el = this.el;
            const data = this.data;

            // Handshake de Telemetria
            console.log(`[XR-NODE] Janela ${data.title} (${data.layer}) inicializada.`);

            // Listener para Troca de Foco (Interação XR)
            el.addEventListener('mousedown', () => {
                window.SentinelBus?.emit('xr:focus-isolate', { 
                    title: data.title,
                    layer: data.layer,
                    id: el.id 
                });
            });

            // Escuta para Inibição Lateral Global
            window.addEventListener('ui:inhibit-lateral', (e) => {
                const targetTitle = e.detail.anchorTitle;
                this.applyInhibition(data.title === targetTitle);
            });
        },

        update: function (oldData) {
            // Reação imediata a mudanças de propriedade no schema
            this.applyInhibition(this.data.focus);
        },

        applyInhibition: function (isFocused) {
            const opacity = isFocused ? 0.85 : 0.2;
            const blurEffect = isFocused ? 'none' : 'blur(4px)';

            this.el.setAttribute('material', 'opacity', opacity);
            
            if (isFocused) {
                this.el.classList.add('attention-anchor');
                document.body.classList.add('focus-lock'); // Integração Pulvinar Firewall
            } else {
                this.el.classList.remove('attention-anchor');
            }
        }
    });

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
       PROTOCOLO ATC E SOBERANIA DE BOOT
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    const startEngine = () => {
        console.log('[ENGINE-XR] SENTINEL_BOOTED: Soberania de Renderização Ativa.');
        
        // Injeção de Efeito Periférico (Radial Gradient)
        const overlay = document.createElement('div');
        overlay.id = 'pulvinar-shield';
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: 999;
            background: radial-gradient(circle, transparent 30%, rgba(0,0,0,0.8) 150%);
            opacity: 0; transition: opacity 0.5s ease;
        `;
        document.body.appendChild(overlay);

        // Ativação do Shield no Estado Natural de Execução (ENE)
        window.addEventListener('ene:activated', () => {
            overlay.style.opacity = '1';
        });
    };

    // Aguarda Hidratação L1/L2/L3 (Simulada via Handshake do Core)
    window.addEventListener('boot:complete', () => {
        startEngine();
    });

})();
