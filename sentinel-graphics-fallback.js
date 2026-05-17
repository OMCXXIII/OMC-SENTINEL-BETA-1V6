/**
 * SENTINEL GRAPHICS FALLBACK v1.2 - ANTI-SANDBOX ANGLE PATCH
 * * Objetivo: Substituir A-Frame/THREE.js WebGL por renderização Canvas 2D pura.
 * Versão 1.2: Corrige falsos-positivos causados por falhas de bind em Sandbox e ANGLE/D3D9.
 */

window.SentinelGraphicsFallback = (() => {

    const STATE = {
        isActive: false,
        canvas: null,
        ctx: null,
        entities: [],
        animationFrameId: null,
        backgroundColor: '#000408'
    };

    /**
     * Verifica se WebGL pode ser criado E operado com segurança.
     * Bloqueia emuladores ANGLE Direct3D9 instáveis para evitar falhas pós-handshake.
     */
    const canCreateWebGL = () => {
        try {
            const c = document.createElement('canvas');
            const contextNames = ['webgl', 'experimental-webgl'];
            let gl = null;
            
            for (let name of contextNames) {
                try {
                    gl = c.getContext(name, {
                        antialias: false,
                        alpha: false,
                        powerPreference: 'low-power',
                        failIfMajorPerformanceCaveat: false
                    });
                    if (gl) break;
                } catch (e) {}
            }
            
            if (!gl) return false;

            // --- DETECÇÃO AGRESSIVA DE DRIVER COMPROMETIDO (PATCH 1.2) ---
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const rendererStr = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
                const vendorStr = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
                
                // Se a GPU for Intel legada rodando em Direct3D9 (Mecanismo ANGLE), o THREE.js vai falhar no bind.
                // Forçamos o Fallback imediatamente para evitar crash em sandbox.
                if (rendererStr.includes('Direct3D9') || rendererStr.includes('Intel(R) HD Graphics') || vendorStr.includes('0x8086')) {
                    if (!rendererStr.includes('Direct3D11') && !rendererStr.includes('Direct3D12')) {
                        throw new Error('Hardware em lista negra de compatibilidade (ANGLE D3D9/Intel Legacy).');
                    }
                }
            }

            // --- TESTE DE PIPELINE ATIVO ---
            const vs = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vs, 'void main() { gl_Position = vec4(0.0, 0.0, 0.0, 1.0); }');
            gl.compileShader(vs);

            const fs = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fs, 'void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); }');
            gl.compileShader(fs);

            const program = gl.createProgram();
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error('Falha de linkagem interna do Shader.');
            }

            gl.useProgram(program);
            gl.viewport(0, 0, 1, 1);
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            const ext = gl.getExtension('WEBGL_lose_context');
            if (ext) ext.loseContext();
            return true;

        } catch (e) {
            console.warn('%c[GRAPHICS-PATCH] WebGL rejeitado pelo validador de Sandbox/Driver:', 'color:#FF6B35; font-weight:bold;', e.message);
            return false;
        }
    };

    /**
     * Ativa fallback Canvas 2D
     */
    const activate = () => {
        console.warn('%c[GRAPHICS-FALLBACK] Forçando Canvas 2D. Neutralizando falha de Bind do THREE.js.', 
                     'color:#FF6B35;font-weight:bold;');
        
        STATE.isActive = true;
        
        const wrapper = document.getElementById('scene-wrapper');
        if (wrapper) {
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
        }
    };

    /**
     * Cria entidades mockadas (ghost-windows) em Canvas 2D
     */
    const createMockEntities = () => {
        STATE.entities = [
            { id: 'window-alpha', label: 'ALPHA_NEXUS', x: 50, y: 100, width: 300, height: 150, color: '#00FF88' },
            { id: 'window-beta', label: 'BETA_NEXUS', x: window.innerWidth / 2 - 150, y: 100, width: 300, height: 150, color: '#0088FF' },
            { id: 'window-gamma', label: 'GAMMA_NEXUS', x: window.innerWidth - 350, y: 100, width: 300, height: 150, color: '#FF8800' }
        ];
    };

    /**
     * Loop de renderização Canvas 2D
     */
    const startRenderLoop = () => {
        const render = () => {
            if (!STATE.canvas || !STATE.ctx) return;

            const ctx = STATE.ctx;
            const w = STATE.canvas.width;
            const h = STATE.canvas.height;

            ctx.fillStyle = STATE.backgroundColor;
            ctx.fillRect(0, 0, w, h);

            // Grid de scanlines
            ctx.strokeStyle = 'rgba(0, 255, 136, 0.03)';
            ctx.lineWidth = 1;
            for (let y = 0; y < h; y += 2) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }

            // Renderizar entidades
            STATE.entities.forEach(entity => {
                ctx.strokeStyle = entity.color;
                ctx.lineWidth = 2;
                ctx.strokeRect(entity.x, entity.y, entity.width, entity.height);

                ctx.fillStyle = entity.color + '15';
                ctx.fillRect(entity.x, entity.y, entity.width, entity.height);

                ctx.fillStyle = entity.color;
                ctx.font = 'bold 12px monospace';
                ctx.fillText(entity.label, entity.x + 10, entity.y + 25);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.font = '10px monospace';
                ctx.fillText('CANVAS 2D', entity.x + 10, entity.y + 45);
            });

            ctx.fillStyle = 'rgba(0, 255, 136, 0.7)';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('GRAPHICS FALLBACK: Canvas 2D (Safe Mode Actived)', 20, 30);

            STATE.animationFrameId = requestAnimationFrame(render);
        };

        render();
    };

    return {
        init() {
            console.log('[GRAPHICS] Iniciando verificação de compatibilidade...');

            if (!canCreateWebGL()) {
                console.warn('[GRAPHICS] WebGL instável ou bloqueado na Sandbox. Forçando fallback Canvas 2D.');
                activate();
                return false;
            } else {
                console.log('[GRAPHICS] WebGL perfeitamente operacional.');
                return true;
            }
        },
        isActive() { return STATE.isActive; },
        getMode() { return STATE.isActive ? 'canvas2d' : 'webgl'; }
    };

})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.SentinelGraphicsFallback.init(); });
} else {
    window.SentinelGraphicsFallback.init();
}
