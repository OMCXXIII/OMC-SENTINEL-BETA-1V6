/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.8 — COGNITIVE SOVEREIGN GRAPHICS RENDERER (GPU ORCHESTRATOR)
 * Arquivo: sentinel-renderer.js
 * Papel: Runtime Gráfico Soberano, Controle de Budgets e Pipelines de Estereofonia
 * Governança: Totalmente subordinado ao SovereignKernel e ao seu Scheduler.
 * Fix: Implementação de GPU Budgets, Camadas Estritas de Desenho, Res-Scaling,
 * Frame Pacing (30/45/60/90fps), Occlusion Engine e Foveated Rendering Espacial.
 * Atualização: Singleton Unificado, Telemetria via GPU Query Ext (Disjoint Timer),
 * Resource Lifecycle Management (VRAM), State Cache de Hardware contra Thrashing.
 * ═══════════════════════════════════════════════════════════════════════
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
        if (SentinelSovereignRenderer.instance) {
            return SentinelSovereignRenderer.instance;
        }

        this.version = "9.8-SOVEREIGN-RENDERER";
        this.gl = null;
        this.canvas = null;
        this.currentFxProfile = FX_PROFILES.HIGH;
        this.isInitialized = false;

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
            viewportHeight: 0,
            devicePixelRatioLimit: 2
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

        // REAL GPU TELEMETRY METRICS & HARDWARE QUERIES
        this.telemetry = {
            gpuTimeMs: 0.0,
            cpuTimeMs: 0.0,
            droppedFrames: 0,
            contextLossCount: 0
        };
        
        this.gpuQueryExt = null;
        this._activeGpuQuery = null;
        this._isQueryPending = false;

        // RESOURCE LIFECYCLE GOVERNANCE (PREVENÇÃO DE LEAKS EM XR)
        this.resources = {
            textures: new Set(),
            framebuffers: new Set(),
            programs: new Set(),
            buffers: new Set(),
            vaos: new Set()
        };

        // STATE CACHE GRAPHICS HARDWARE (PREVENÇÃO DE STATE THRASHING / STALLS)
        this.stateCache = {
            depthTest: null,
            cullFace: null,
            currentProgram: null,
            currentVertexArray: null,
            clearColor: { r: null, g: null, b: null, a: null }
        };

        this._drawQueues = Array.from({ length: 5 }, () => []);
        this.bus = null;

        // Preservação de escopo para listeners voláteis
        this._boundResizeHandler = this._handleResizeEvent.bind(this);
        this._boundContextLost = this._handleContextLost.bind(this);
        this._boundContextRestored = this._handleContextRestored.bind(this);

        SentinelSovereignRenderer.instance = this;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 1) KERNEL RUNTIME CONTRACT
    // ═══════════════════════════════════════════════════════════════════════
    async initialize(config = {}) {
        if (this.isInitialized) return;
        
        this._trace('KERNEL', 'Iniciando acoplamento do subsistema gráfico soberano...');
        
        if (config.maxRenderTimeMs) this.budget.maxRenderTimeMs = config.maxRenderTimeMs;
        if (config.targetFPS) this.setFramePacing(config.targetFPS);
        if (config.baseScale) this.resolution.baseScale = config.baseScale;

        window.addEventListener('resize', this._boundResizeHandler);

        this.isInitialized = true;
        this._trace('KERNEL', 'Subsistema de renderização inicializado com sucesso.');
    }

    heartbeat() {
        if (!this.isInitialized) return { status: 'OFFLINE' };
        
        this._pollGpuQueries();
        
        return {
            status: this.gl && !this.gl.isContextLost() ? 'HEALTHY' : 'CONTEXT_ERROR',
            version: this.version,
            profile: this.currentFxProfile,
            metrics: {
                fpsTarget: this.pacing.targetFPS,
                scale: this.resolution.currentScale,
                cpuTime: this.budget.currentRenderTimeMs,
                gpuTimeMs: this.telemetry.gpuTimeMs,
                droppedFrames: this.telemetry.droppedFrames,
                contextLosses: this.telemetry.contextLossCount
            },
            vramAllocation: {
                textures: this.resources.textures.size,
                framebuffers: this.resources.framebuffers.size,
                programs: this.resources.programs.size,
                buffers: this.resources.buffers.size,
                vertexArrays: this.resources.vaos.size
            }
        };
    }

    shutdown() {
        this._trace('KERNEL', 'Executando shutdown e desalocação em massa da VRAM...');
        
        window.removeEventListener('resize', this._boundResizeHandler);
        
        if (this.canvas) {
            this.canvas.removeEventListener('webglcontextlost', this._boundContextLost);
            this.canvas.removeEventListener('webglcontextrestored', this._boundContextRestored);
        }

        this._releaseAllGpuResources();
        this.clearQueues();
        this._occlusionRegistry.clear();
        
        this.gl = null;
        this.canvas = null;
        this.bus = null;
        this.gpuQueryExt = null;
        this._activeGpuQuery = null;
        this._isQueryPending = false;
        this.isInitialized = false;
        
        this._trace('KERNEL', 'Renderer e VRAM totalmente limpos. Subsistema offline.');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3) SIGNAL BUS INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════
    _attachSignalBus(bus) {
        if (!bus) return;
        this.bus = bus;

        if (typeof this.bus.on === 'function') {
            this.bus.on('performance:tier_changed', (data) => {
                this._trace('SIGNAL', `Ajustando hardware devido a mudança de tier de performance: ${data.tier}`);
                if (data.tier === 'LOW') {
                    this.setFxProfile(FX_PROFILES.LOW);
                    this.setResolutionScale(0.7);
                } else if (data.tier === 'MEDIUM') {
                    this.setFxProfile(FX_PROFILES.MEDIUM);
                    this.setResolutionScale(1.0);
                } else if (data.tier === 'HIGH') {
                    this.setFxProfile(FX_PROFILES.HIGH);
                    this.setResolutionScale(1.2);
                }
            });

            this.bus.on('performance:emergency_engaged', () => {
                this._trace('SIGNAL', 'Alerta de emergência de performance recebido. Forçando degradação máxima.');
                this.setFxProfile(FX_PROFILES.EMERGENCY);
                this.setResolutionScale(this.resolution.minScale);
            });

            this.bus.on('xr:session_start', () => {
                this._trace('SIGNAL', 'Sessão XR detectada. Forçando travamento seguro de latência.');
                this.setStereoPath(true, this.xr.leftViewport, this.xr.rightViewport);
            });

            this.bus.on('xr:session_end', () => {
                this._trace('SIGNAL', 'Sessão XR encerrada. Retornando ao pipeline monoscópico padrão.');
                this.setStereoPath(false);
                this.setFxProfile(FX_PROFILES.HIGH);
            });

            this.bus.on('attention:focus_changed', (data) => {
                if (data && data.x !== undefined && data.y !== undefined) {
                    this.configureFoveated(this.foveated.enabled, data.x, data.y);
                }
            });
        }
    }

    /**
     * Acopla o contexto WebGL2 nativo ao Governador Gráfico
     */
    setGraphicsContext(canvasElement, glContext) {
        if (!glContext) throw new Error("[RENDERER] Contexto de hardware inválido fornecido.");
        
        if (this.canvas) {
            this.canvas.removeEventListener('webglcontextlost', this._boundContextLost);
            this.canvas.removeEventListener('webglcontextrestored', this._boundContextRestored);
        }

        this.canvas = canvasElement;
        this.gl = glContext;
        
        this.canvas.addEventListener('webglcontextlost', this._boundContextLost, false);
        this.canvas.addEventListener('webglcontextrestored', this._boundContextRestored, false);
        
        // Inicialização do Extensor de Telemetria de GPU Real via Hardware Fences
        this.gpuQueryExt = this.gl.getExtension('EXT_disjoint_timer_query_webgl2');
        if (!this.gpuQueryExt) {
            this._trace('HARDWARE_WARN', 'EXT_disjoint_timer_query_webgl2 não suportado. Telemetria rebaixada para estimativa simbólica.');
        }

        // Reset do cache de estado de hardware
        this._resetStateCache();

        this.setDepthTest(true);
        this.setCullFace(true);
        this.setClearColor(0.0, 0.04, 0.08, 1.0);
        
        this.updateViewportSize();
        this._trace('HARDWARE', 'WebGL2 Context estabilizado, cache blindado e monitorado via Disjoint Timer Queries.');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STATE CACHE MANAGEMENT (Wrappers anti-thrashing de chamadas WebGL)
    // ═══════════════════════════════════════════════════════════════════════
    _resetStateCache() {
        this.stateCache.depthTest = null;
        this.stateCache.cullFace = null;
        this.stateCache.currentProgram = null;
        this.stateCache.currentVertexArray = null;
        this.stateCache.clearColor = { r: null, g: null, b: null, a: null };
    }

    setDepthTest(enabled) {
        if (!this.gl || this.stateCache.depthTest === enabled) return;
        if (enabled) this.gl.enable(this.gl.DEPTH_TEST);
        else this.gl.disable(this.gl.DEPTH_TEST);
        this.stateCache.depthTest = enabled;
    }

    setCullFace(enabled) {
        if (!this.gl || this.stateCache.cullFace === enabled) return;
        if (enabled) this.gl.enable(this.gl.CULL_FACE);
        else this.gl.disable(this.gl.CULL_FACE);
        this.stateCache.cullFace = enabled;
    }

    useProgram(program) {
        if (!this.gl || this.stateCache.currentProgram === program) return;
        this.gl.useProgram(program);
        this.stateCache.currentProgram = program;
    }

    bindVertexArray(vao) {
        if (!this.gl || this.stateCache.currentVertexArray === vao) return;
        this.gl.bindVertexArray(vao);
        this.stateCache.currentVertexArray = vao;
    }

    setClearColor(r, g, b, a) {
        if (!this.gl) return;
        const cache = this.stateCache.clearColor;
        if (cache.r === r && cache.g === g && cache.b === b && cache.a === a) return;
        this.gl.clearColor(r, g, b, a);
        this.stateCache.clearColor = { r, g, b, a };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RESOURCE LIFECYCLE GOVERNANCE (Gestão explícita de alocação de VRAM)
    // ═══════════════════════════════════════════════════════════════════════
    registerTexture(texture) { if (texture) this.resources.textures.add(texture); return texture; }
    registerFramebuffer(fb) { if (fb) this.resources.framebuffers.add(fb); return fb; }
    registerProgram(program) { if (program) this.resources.programs.add(program); return program; }
    registerBuffer(buffer) { if (buffer) this.resources.buffers.add(buffer); return buffer; }
    registerVertexArray(vao) { if (vao) this.resources.vaos.add(vao); return vao; }

    disposeTexture(texture) {
        if (!this.gl || !texture) return;
        this.gl.deleteTexture(texture);
        this.resources.textures.delete(texture);
    }

    disposeFramebuffer(fb) {
        if (!this.gl || !fb) return;
        this.gl.deleteFramebuffer(fb);
        this.resources.framebuffers.delete(fb);
    }

    disposeProgram(program) {
        if (!this.gl || !program) return;
        this.gl.deleteProgram(program);
        this.resources.programs.delete(program);
        if (this.stateCache.currentProgram === program) this.stateCache.currentProgram = null;
    }

    disposeBuffer(buffer) {
        if (!this.gl || !buffer) return;
        this.gl.deleteBuffer(buffer);
        this.resources.buffers.delete(buffer);
    }

    disposeVertexArray(vao) {
        if (!this.gl || !vao) return;
        this.gl.deleteVertexArray(vao);
        this.resources.vaos.delete(vao);
        if (this.stateCache.currentVertexArray === vao) this.stateCache.currentVertexArray = null;
    }

    _releaseAllGpuResources() {
        if (!this.gl) return;
        this._trace('HARDWARE', `Iniciando purga forçada de ${this.resources.textures.size + this.resources.buffers.size} objetos gráficos expostos na VRAM.`);
        
        this.resources.textures.forEach(t => this.gl.deleteTexture(t));
        this.resources.framebuffers.forEach(fb => this.gl.deleteFramebuffer(fb));
        this.resources.programs.forEach(p => this.gl.deleteProgram(p));
        this.resources.buffers.forEach(b => this.gl.deleteBuffer(b));
        this.resources.vaos.forEach(v => this.gl.deleteVertexArray(v));

        this.resources.textures.clear();
        this.resources.framebuffers.clear();
        this.resources.programs.clear();
        this.resources.buffers.clear();
        this.resources.vaos.clear();
        
        this._resetStateCache();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 11) CONTEXT LOSS RECOVERY
    // ═══════════════════════════════════════════════════════════════════════
    _handleContextLost(event) {
        event.preventDefault();
        this.telemetry.contextLossCount++;
        this._isQueryPending = false;
        this._activeGpuQuery = null;
        this._resetStateCache();
        
        this._trace('HARDWARE_CRITICAL', 'WebGL Context perdido detectado pela GPU. Ciclos de renderização suspensos.');
        if (this.bus && typeof this.bus.emit === 'function') {
            this.bus.emit('renderer:context_lost', { count: this.telemetry.contextLossCount });
        }
    }

    _handleContextRestored() {
        this._trace('HARDWARE', 'WebGL Context restaurado pelo driver de hardware. Reconfigurando pipeline e limpando registros obsoletos...');
        
        // Limpeza lógica de referências mortas
        this.resources.textures.clear();
        this.resources.framebuffers.clear();
        this.resources.programs.clear();
        this.resources.buffers.clear();
        this.resources.vaos.clear();
        
        this._resetStateCache();

        if (this.gl) {
            this.setDepthTest(true);
            this.setCullFace(true);
            this.setClearColor(0.0, 0.04, 0.08, 1.0);
        }
        
        this.updateViewportSize();
        if (this.bus && typeof this.bus.emit === 'function') {
            this.bus.emit('renderer:context_restored', {});
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 7) RESIZE OBSERVER / EVENT HANDLING
    // ═══════════════════════════════════════════════════════════════════════
    _handleResizeEvent() {
        this.updateViewportSize();
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
        
        // 6) DEVICE PIXEL RATIO AWARENESS
        const dpr = Math.min(window.devicePixelRatio || 1, this.resolution.devicePixelRatioLimit);
        
        this.resolution.viewportWidth = Math.floor(this.canvas.clientWidth * dpr * this.resolution.currentScale);
        this.resolution.viewportHeight = Math.floor(this.canvas.clientHeight * dpr * this.resolution.currentScale);
        
        this.canvas.width = this.resolution.viewportWidth;
        this.canvas.height = this.resolution.viewportHeight;

        // 5) VIEWPORT UPDATE BUG FIX
        this.gl.viewport(0, 0, this.resolution.viewportWidth, this.resolution.viewportHeight);
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
    // TELEMETRIA NATIVA DE HARDWARE (Poll de queries assíncronas da GPU)
    // ═══════════════════════════════════════════════════════════════════════
    _pollGpuQueries() {
        if (!this.gl || !this.gpuQueryExt || !this._isQueryPending || !this._activeGpuQuery) return;

        const available = this.gl.getQueryParameter(this._activeGpuQuery, this.gl.QUERY_RESULT_AVAILABLE);
        const disjoint = this.gl.getParameter(this.gpuQueryExt.GPU_DISJOINT_EXT);

        if (available) {
            this._isQueryPending = false;
            if (!disjoint) {
                const elapsedNanos = this.gl.getQueryParameter(this._activeGpuQuery, this.gl.QUERY_RESULT);
                this.telemetry.gpuTimeMs = elapsedNanos / 1e6; // Conversão direta para Milissegundos reais
            } else {
                this._trace('HARDWARE_WARN', 'Disjoint de GPU disparado. Telemetria do frame atual descartada para estabilização.');
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RUNTIME RENDER EXECUTION CYCLE (O MOTOR COGNITIVO CENTRAL)
    // ═══════════════════════════════════════════════════════════════════════
    // 9) XR FRAME LOOP COMPATIBILITY: Suporte nativo a timestamps e xrFrame externo
    executeRenderCycle(currentTime = performance.now(), xrFrame = null) {
        if (!this.gl || this.gl.isContextLost()) return false;

        const elapsed = currentTime - this.pacing.lastFrameTime;
        
        // Aplicação estrita do Frame Pacing
        if (elapsed < this.pacing.frameIntervalMs) return false;
        
        this.pacing.lastFrameTime = currentTime - (elapsed % this.pacing.frameIntervalMs);
        this.budget.frameIndex++;
        
        // Tenta colher dados de telemetria pendentes do ciclo gráfico anterior
        this._pollGpuQueries();

        const cycleStartTime = performance.now();

        // Inicializa Query de Hardware Real se a extensão estiver ativa e livre
        if (this.gpuQueryExt && !this._isQueryPending) {
            if (!this._activeGpuQuery) {
                this._activeGpuQuery = this.gl.createQuery();
            }
            this.gl.beginQuery(this.gpuQueryExt.TIME_ELAPSED_EXT, this._activeGpuQuery);
            this._isQueryPending = true;
        }
        
        // Limpeza dos buffers nativos de hardware via State Cache Wrappers
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
                
                // 8) DRAW QUEUE SAFETY: Isolamento completo de falhas por entidade catastrófica
                if (typeof entity.render === 'function') {
                    try {
                        entity.render(this.gl, this.foveated, this.xr, this.currentFxProfile, xrFrame);
                    } catch (drawError) {
                        this.telemetry.droppedFrames++;
                        console.error(`[RENDERER][DRAW_ERROR] Falha crítica na entidade ${entity.id} [Camada ${layer}]:`, drawError);
                        if (this.bus && typeof this.bus.emit === 'function') {
                            this.bus.emit('renderer:entity_fault', { id: entity.id, error: drawError.message, layer });
                        }
                    }
                }
            }

            // Verificação em tempo real do GPU Budget Controller (Fallback defensivo na CPU)
            const currentElapsed = performance.now() - cycleStartTime;
            if (currentElapsed > this.budget.maxRenderTimeMs) {
                this._trace('BUDGET_OVERFLOW', `Orçamento estourado na camada ${layer}. Forçando corte estrutural.`);
                this._triggerEmergencyThrottling();
                break; // Descarta renderização de camadas de baixa urgência para manter os gânglios basais estáveis
            }
        }

        // Finaliza Query de Hardware Real da GPU
        if (this.gpuQueryExt && this._isQueryPending) {
            this.gl.endQuery(this.gpuQueryExt.TIME_ELAPSED_EXT);
        }

        // Limpeza de filas prontas para o próximo ciclo sináptico
        this.clearQueues();
        
        const cycleEndTime = performance.now();
        this.budget.currentRenderTimeMs = cycleEndTime - cycleStartTime;
        this.telemetry.cpuTimeMs = this.budget.currentRenderTimeMs;

        // Fallback simbólico se a extensão nativa de hardware estiver indisponível
        if (!this.gpuQueryExt) {
            this.telemetry.gpuTimeMs = this.budget.currentRenderTimeMs * 0.92;
        }

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
// 2) UNIFICAÇÃO DA INSTÂNCIA SINGLETON & CONTRATO DE IMPORTAÇÃO ES6
// ═══════════════════════════════════════════════════════════════════════
const SovereignRenderer = new SentinelSovereignRenderer();

if (typeof window !== 'undefined') {
    window.SovereignRenderer = SovereignRenderer;

    if (window.SovereignKernel) {
        window.SovereignKernel.registerModule(
            'sentinel-renderer',
            SovereignRenderer
        );
    }
}

export default SovereignRenderer;

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
