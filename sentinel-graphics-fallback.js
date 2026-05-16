/**
 * SENTINEL GRAPHICS FALLBACK v1.1 - PATCHED
 * * Objetivo: Substituir A-Frame/THREE.js WebGL por renderização Canvas 2D pura
 * quando WebGL não está disponível ou apresenta falhas estruturais de driver.
 * * Este sistema:
 * - Detecta falha de WebGL ANTES de A-Frame tentar (com teste rigoroso de pipeline)
 * - Substitui <a-scene> por <canvas> + renderização 2D
 * - Mantém Bus de eventos operacional
 * - Renderiza entidades como retângulos com labels
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
     * Realiza teste rigoroso de linkagem e execução para capturar falhas ocultas do ANGLE.
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
                } catch (e) {
                    // Continua para próximo contexto
                }
            }
            
            if (!gl) return false;

            // --- INÍCIO DO TESTE RIGOROSO DE PIPELINE ---
            
            // 1. Criar Shaders Mínimos (Vertex e Fragment Dummy)
            const vs = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vs, 'void main() { gl_Position = vec4(0.0, 0.0, 0.0, 1.0); }');
            gl.compileShader(vs);

            const fs = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fs, 'void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); }');
            gl.compileShader(fs);

            // 2. Criar e Linkar o Programa Gráfico
            const program = gl.createProgram();
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            gl.linkProgram(program);

            // Se o driver/ANGLE falhar na linkagem interna da sequência, aborta aqui
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error('Falha crítica de linkagem (Bug de driver/ANGLE detectado).');
            }

            // 3. Forçar o Bind e Execução Ativa do Contexto
            gl.useProgram(program);
            gl.viewport(0, 0, 1, 1);
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // Se passou por todo o pipeline ativo, o contexto é real e seguro
            const ext = gl.getExtension('WEBGL_lose_context');
            if (ext) ext.loseContext();
            return true;

        } catch (e) {
            console.error('%c[GRAPHICS-PATCH] WebGL reprovou no teste ativo de stress:', 'color:#FF4A4A; font-weight:bold;', e.message);
            return false;
        }
    };

    /**
     * Ativa fallback Canvas 2D
     */
    const activate = () => {
        console.warn('%c[GRAPHICS-FALLBACK] Canvas 2D ativado. Sistema degradado mas funcional.', 
                     'color:#FF6B35;font-weight:bold;');
        
        STATE.isActive = true;
        
        // Injetar canvas na página
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
            
            // Iniciar loop de renderização
            startRenderLoop();
            
            // Criar entidades mockadas
            createMockEntities();
            
            // Emitir evento de fallback
            if (window.SentinelBus) {
                window.SentinelBus.emit('graphics:fallback-activated', {
                    reason: 'webgl_unavailable',
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
            {
                id: 'window-alpha',
                label: 'ALPHA_NEXUS',
                x: 50,
                y: 100,
                width: 300,
                height: 150,
                color: '#00FF88'
            },
            {
                id: 'window-beta',
                label: 'BETA_NEXUS',
                x: window.innerWidth / 2 - 150,
                y: 100,
                width: 300,
                height: 150,
                color: '#0088FF'
            },
            {
                id: 'window-gamma',
                label: 'GAMMA_NEXUS',
                x: window.innerWidth - 350,
                y: 100,
                width: 300,
                height: 150,
                color: '#FF8800'
            }
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

            // Fundo
            ctx.fillStyle = STATE.backgroundColor;
            ctx.fillRect(0, 0, w, h);

            // Grid de scanlines (efeito cyberpunk)
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
                // Borda
                ctx.strokeStyle = entity.color;
                ctx.lineWidth = 2;
                ctx.strokeRect(entity.x, entity.y, entity.width, entity.height);

                // Preenchimento translúcido
                ctx.fillStyle = entity.color + '15';
                ctx.fillRect(entity.x, entity.y, entity.width, entity.height);

                // Label
                ctx.fillStyle = entity.color;
                ctx.font = 'bold 12px monospace';
                ctx.fillText(entity.label, entity.x + 10, entity.y + 25);

                // Info de fallback
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.font = '10px monospace';
                ctx.fillText('CANVAS 2D', entity.x + 10, entity.y + 45);
            });

            // Info global
            ctx.fillStyle = 'rgba(0, 255, 136, 0.7)';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('GRAPHICS FALLBACK: Canvas 2D (Safe Mode)', 20, 30);

            STATE.animationFrameId = requestAnimationFrame(render);
        };

        render();
    };

    /**
     * Interface pública
     */
    return {
        init() {
            console.log('[GRAPHICS] Iniciando verificação de compatibilidade...');

            if (!canCreateWebGL()) {
                console.warn('[GRAPHICS] WebGL corrompido ou indisponível. Forçando fallback Canvas 2D.');
                activate();
                return false; // WebGL indisponível / Bloqueado
            } else {
                console.log('[GRAPHICS] WebGL passou em todos os testes ativos. Mantendo A-Frame.');
                return true; // WebGL perfeitamente operacional
            }
        },

        isActive() {
            return STATE.isActive;
        },

        getMode() {
            return STATE.isActive ? 'canvas2d' : 'webgl';
        }
    };

})();

// Auto-iniciar antes de A-Frame carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.SentinelGraphicsFallback.init();
    });
} else {
    window.SentinelGraphicsFallback.init();
}
