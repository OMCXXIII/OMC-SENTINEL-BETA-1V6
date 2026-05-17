/**
     * Ativa fallback Canvas 2D com descarte assíncrono seguro para evitar quebras no ciclo do A-Frame
     */
    const activate = () => {
        console.warn('%c[GRAPHICS-FALLBACK] Forçando Canvas 2D. Neutralizando falha de Bind do THREE.js.', 
                     'color:#FF6B35;font-weight:bold;');
        
        STATE.isActive = true;
        
        const wrapper = document.getElementById('scene-wrapper');
        if (wrapper) {
            // Criar o canvas de fallback em memória primeiro
            const canvas = document.createElement('canvas');
            canvas.id = 'sentinel-canvas-fallback';
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            canvas.style.cssText = `
                display: block;
                width: 100%;
                height: 100%;
                background: ${STATE.backgroundColor};
            `;
            
            // Isolar a substituição do DOM em um microtask/timeout assíncrono.
            // Isso permite que o A-Frame e o THREE.js encerrem suas tentativas de boot 
            // sem que a remoção do HTML quebre o fluxo interno deles.
            setTimeout(() => {
                try {
                    wrapper.innerHTML = '';
                    wrapper.appendChild(canvas);
                    
                    STATE.canvas = canvas;
                    STATE.ctx = canvas.getContext('2d', { alpha: false });
                    
                    startRenderLoop();
                    createMockEntities();
                    
                    if (window.SentinelBus) {
                        window.SentinelBus.emit('graphics:fallback-activated', {
                            reason: 'webgl_sandbox_bind_failed',
                            mode: 'canvas2d',
                            timestamp: Date.now()
                        });
                    }
                } catch (domErr) {
                    console.error('[GRAPHICS-PATCH] Erro ao injetar Canvas 2D no DOM:', domErr.message);
                }
            }, 0);
        }
    };
