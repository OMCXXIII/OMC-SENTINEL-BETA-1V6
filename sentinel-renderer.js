/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE SOVEREIGN GRAPHICS RENDERER (GPU ORCHESTRATOR)
 * Arquivo: sentinel-renderer.js
 * Papel: Runtime Gráfico Soberano, Controle de Budgets e Pipelines de Estereofonia
 * Governança: Totalmente subordinado ao SovereignKernel e ao seu Scheduler.
 * Fix: Implementação de GPU Budgets, Camadas Estritas de Desenho, Res-Scaling,
 * Frame Pacing (30/45/60/90fps), Occlusion Engine e Foveated Rendering Espacial.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// B) DRAW PRIORITY: Enumeração Congelada de Camadas de Prioridade Gráfica
export const RENDER_LAYERS = Object.freeze({
    BACKGROUND:  0, // Skyboxes, matrizes ambientais frias de fundo
    ENVIRONMENT: 1, // Geometria de mundo estática, estruturas estruturais
    WORLD:       2, // Entidades ativas, objetos táticos de cena
    INTERACTION: 3, // Canvas de feedback dinâmico, ganchos colidíveis
    FOCUS:       4  // Elementos foveais directos, HUD e Retículas de Alta Urgência
});

// F) FX GOVERNANCE: Perfis Adaptativos de Carga de Shaders
export const FX_PROFILES = Object.freeze({
    LOW:       'LOW',      // Shaders estáticos básicos, zero pós-processamento, sem partículas
    MEDIUM:    'MEDIUM',   // Partículas reduzidas, bloom simplificado, overlays nominais
    HIGH:      'HIGH',     // Pipeline volumétrico completo, pós-processamento denso
    XR_SAFE:   'XR_SAFE',  // Otimização estrita de latência para mitigar cinetose
    EMERGENCY: 'EMERGENCY' // Downscaling drástico de render target, desativação de filtros
});

export class SentinelSovereignRenderer {
    constructor() {
        this.version = "9.0-SOVEREIGN-RENDERER";
        this.gl = null;
        this.canvas = null;
        this.currentFxProfile = FX_PROFILES.HIGH;

        // A) GPU BUDGET CONTROLLER
        this.budget = {
            maxRenderTimeMs: 4.5, // Teto máximo de renderização de fragmentos por frame
            currentRenderTimeMs: 0.0,
            frameIndex: 0
        };

        // C) RESOLUTION SCALING CONFIGURATION
        this.resolution = {
            baseScale: 1.0,
            currentScale: 1.0,
            minScale: 0.5,
            maxScale: 1.2,
            viewportWidth: 0,
            viewportHeight: 0
        };

        // D) FRAME PACING MATRIX
        this.pacing = {
            targetFPS: 60,                // Alvos válidos normativos: 30, 45, 60, 90
            frameIntervalMs: 16.66,       // Atualizado dinamicamente com base no FPS alvo
            lastFrameTime: performance.now()
        };

        // E) OCCLUSION ENGINE REGISTER
        this._occlusionRegistry = new Map();

        // H) FOVEATED RENDERING BUFFER MASK
        this.foveated = {
            enabled: false,
            center: { x: 0.5, y: 0.5 },    // Coordenadas normalizadas do olhar do operador
            innerRadius: 0.3,              // Resolução máxima (100% render scale)
            outerRadius: 0.65,             // Resolução degradada na periferia (Falloff)
            peripheralScale: 0.4           // Multiplicador de amostragem na borda externa
        };

        // G) XR RENDER PATH STATE
        this.xr = {
            isStereo: false,
            leftViewport: null,
            rightViewport: null
        };

        this._drawQueues = Array.from({ length: 5 }, () => []);
        this.bus = null;
    }

    /**
     * Acopla o contexto WebGL2 / WebGPU nativo ao Governador Gráfico
     */
    setGraphicsContext(canvasElement, glContext) {
        if (!glContext) throw new Error("[RENDERER] Contexto de hardware inválido fornecido.");
        this.canvas = canvasElement;
        this.gl = glContext;
        
        // Ativa recursos nativos de hardware para otimização espacial
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        
        this.updateViewportSize();
        this._trace('HARDWARE', 'WebGL2 Context estabilizado e blindado contra estouro de pipeline.');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // C) RESOLUTION SCALING ENGINE (REDIMENSIONAMENTO ATÔMICO)
    // ═══════════════════════════════════════════════════════════════════════
    setResolutionScale(scale) {
        const targetScale = Math.max(this.resolution.minScale, Math.min(this.resolution.maxScale, scale));
        if (this.resolution.currentScale === targetScale) return;

        this.resolution.currentScale = targetScale;
        this.updateViewportSize();
        
        this._trace('SCALING', `Escala de amostragem dinâmica reconfigurada para: ${(targetScale * 100).toFixed(0)}%`);
    }

    updateViewportSize() {
        if (!this.canvas || !this.gl) return;
        
        this.resolution.viewportWidth = Math.floor(this.canvas.clientWidth * this.resolution.currentScale);
        this.resolution.viewportHeight = Math.floor(this.canvas.clientHeight * this.resolution.currentScale);
        
        this.canvas.width = this.resolution.viewportWidth;
        this.canvas.height = this.resolution.viewportHeight;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // D) FRAME PACING MANAGER (TRAVAMENTO DE RELÓGIO COGNITIVO)
    // ═══════════════════════════════════════════════════════════════════════
    setFramePacing(fpsTarget) {
        const validTargets = [30, 45, 60, 90];
        if (!validTargets.includes(fpsTarget)) {
            throw new Error(`[RENDERER] Taxa de pacing inválida solicitada: ${fpsTarget}fps.`);
        }

        this.pacing.targetFPS = fpsTarget;
        this.pacing.frameIntervalMs = 1000 / fpsTarget;
        this._trace('PACING', `Clock normativo de renderização travado estritamente em: ${fpsTarget}Hz`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // B) DRAW PRIORITY QUEUE SYSTEM (INJEÇÃO E COUPLING)
    // ═══════════════════════════════════════════════════════════════════════
    queueEntity(layer, entityId, drawCommand) {
        if (layer < 0 || layer > 4) throw new Error(`[RENDERER] Camada de desenho inválida: ${layer}`);
        
        this._drawQueues[layer].push({
            id: entityId,
            render: drawCommand
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // E) OCCLUSION ENGINE (REJEIÇÃO DE GEOMETRIA EM ÁREAS OCULTAS)
    // ═══════════════════════════════════════════════════════════════════════
    registerOccluder(entityId, boundingBox, isOccluded = false) {
        this._occlusionRegistry.set(entityId, { boundingBox, isOccluded });
    }

    setOcclusionState(entityId, isOccluded) {
        const record = this._occlusionRegistry.get(entityId);
        if (record) {
            record.isOccluded = isOccluded;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // F) FX GOVERNOR & ADAPTIVE THROTTLING
    // ═══════════════════════════════════════════════════════════════════════
    setFxProfile(profile) {
        if (!Object.values(FX_PROFILES).includes(profile)) return;
        this.currentFxProfile = profile;
        this._trace('FX_GOVERNANCE', `Perfil de processamento gráfico alterado para: ${profile}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // H) SPATIAL FOVEATED RENDERING CONFIGURATOR
    // ═══════════════════════════════════════════════════════════════════════
    configureFoveated(enabled, centerX = 0.5, centerY = 0.5) {
        this.foveated.enabled = enabled;
        this.foveated.center.x = centerX;
        this.foveated.center.y = centerY;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // G) XR STEREO PATH INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════
    setStereoPath(enabled, leftView = null, rightView = null) {
        this.xr.isStereo = enabled;
        this.xr.leftViewport = leftView;
        this.xr.rightViewport = rightView;
        if (enabled && this.currentFxProfile === FX_PROFILES.HIGH) {
            this.setFxProfile(FX_PROFILES.XR_SAFE); 
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RUNTIME RENDER EXECUTION CYCLE (O MOTOR COGNITIVO CENTRAL)
    // ═══════════════════════════════════════════════════════════════════════
    executeRenderCycle(currentTime = performance.now()) {
        const elapsed = currentTime - this.pacing.lastFrameTime;
        
        // Aplicação estrita do Frame Pacing
        if (elapsed < this.pacing.frameIntervalMs) return false;
        
        this.pacing.lastFrameTime = currentTime - (elapsed % this.pacing.frameIntervalMs);
        this.budget.frameIndex++;
        
        const cycleStartTime = performance.now();
        
        if (!this.gl) return false;
        
        // Limpeza dos buffers nativos de hardware
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Processamento ordenado por Camadas de Prioridade Estrita (0 -> 4)
        for (let layer = 0; layer < this._drawQueues.length; layer++) {
            const queue = this._drawQueues[layer];
            
            for (let i = 0; i < queue.length; i++) {
                const entity = queue[i];
                
                // Filtro da Occlusion Engine
                const occlusionData = this._occlusionRegistry.get(entity.id);
                if (occlusionData && occlusionData.isOccluded) {
                    continue; 
                }
                
                // Execução do comando de desenho encapsulado
                if (typeof entity.render === 'function') {
                    entity.render(this.gl, this.foveated, this.xr, this.currentFxProfile);
                }
            }

            // Verificação em tempo real do GPU Budget Controller
            const currentElapsed = performance.now() - cycleStartTime;
            if (currentElapsed > this.budget.maxRenderTimeMs) {
                this._trace('BUDGET_OVERFLOW', `Orçamento estourado na camada ${layer}. Forçando corte estrutural.`);
                this._triggerEmergencyThrottling();
                break; // Descarta renderização de camadas de baixa urgência para manter os gânglios basais estáveis
            }
        }

        // Limpeza de filas prontas para o próximo ciclo sináptico
        this.clearQueues();
        
        this.budget.currentRenderTimeMs = performance.now() - cycleStartTime;
        return true;
    }

    clearQueues() {
        for (let i = 0; i < this._drawQueues.length; i++) {
            this._drawQueues[i].length = 0;
        }
    }

    _triggerEmergencyThrottling() {
        if (this.resolution.currentScale > this.resolution.minScale) {
            this.setResolutionScale(this.resolution.currentScale - 0.1);
        } else {
            this.setFxProfile(FX_PROFILES.EMERGENCY);
        }
    }

    _trace(system, message) {
        console.log(
            `%c[SENTINEL-OS][${system}] ${message}`, 
            'background: #000c14; color: #00ffaa; font-family: monospace; font-weight: bold; padding: 2px 5px;'
        );
    }
}

// ═══════════════════════════════════════════════════════════════════════
// REGISTRO DO SHADER COGNITIVO HOLOGRÁFICO (INTEGRAÇÃO DE ECOSSISTEMA XR)
// ═══════════════════════════════════════════════════════════════════════
if (typeof window !== 'undefined' && window.AFRAME && !AFRAME.shaders['sentinel-cyber-glass']) {
    AFRAME.registerShader('sentinel-cyber-glass', { 
        schema: {
            color: { type: 'color', default: '#00ffee' },
            opacity: { type: 'number', default: 0.35 }
        },

        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,

        fragmentShader: `
            precision mediump float;
            varying vec2 vUv;
            uniform vec3 color;
            uniform float opacity;

            void main() {
                float glow = 0.5 + 0.5 * sin(vUv.y * 40.0);
                gl_FragColor = vec4(color * glow, opacity);
            }
        `
    });

    console.log(
        '%c SHADER REGISTERED: sentinel-cyber-glass ',
        'background:#001122;color:#00ffee;font-weight:bold;padding:4px;'
    );
}
