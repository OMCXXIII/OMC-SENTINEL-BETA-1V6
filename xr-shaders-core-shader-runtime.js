/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.7 — COGNITIVE GPU PERCEPTION INFRASTRUCTURE [PRODUCTION HARDENED]
 * Arquivo: xr/shaders/core/shader-runtime.js
 * Papel: Governador de Ciclo de Vida GLSL/WGSL, Shaders Foveais,
 *        Zero-Allocation Telemetry, Frame-Budget Micro-Scheduling & Thermal Safety.
 * Domínio: GPU RENDERING / ZERO-ALLOCATION TELEMETRY / XR ULTRA-LOW LATENCY
 * ═══════════════════════════════════════════════════════════════════════════
 */

class SentinelShaderRuntime {
    constructor() {
        this.programCache = new Map(); 
        this.activeShaders = new Set();
        this.glContext = null;
        this.webgpuDevice = null;      
        this.backendType = 'webgl2';   
        this.bus = window.SentinelBus || null;
        this.destroyed = false; 
        
        // Perfilamento Dinâmico e Alocação de Frame Budget (Alvo: 11.1ms para 90Hz)
        this.budget = {
            maxShaderExecutionTimeMs: 4.5, 
            currentLoadMs: 0.0,
            qualityTier: 'XR_SAFE',        
            vramUsageBytes: 0,             
            maxVramBudgetBytes: 1024 * 1024 * 256 
        };

        this.asyncCompileQueue = [];
        this.isProcessingQueue = false;
        this.programHashes = new Map();
        this.framebuffers = new Map();
        this.textureRegistry = new Map();

        // [CORREÇÃO CRÍTICA #2] Pool estático de Queries para evitar alocações por frame, setTimeout e jitter de GC
        this.pendingGpuQueries = [];
        this.availableQueryPool = [];
        this._maxStaticQueryPoolSize = 8; // Teto de segurança para enfileiramento latente de frames

        this._boundListeners = new Map();

        this._compileBuiltInSourceDictionaries();
        this._initGlobalListeners();
    }

    setGraphicsContext(ctx) {
        if (typeof window !== 'undefined' && window.GPUDevice && ctx instanceof window.GPUDevice) {
            this.webgpuDevice = ctx;
            this.backendType = 'webgpu';
            this._trace('CONTEXT_ATTACH_WEBGPU', 'Dispositivo WebGPU nativo acoplado.');
            return;
        }

        if (typeof window !== 'undefined' && window.WebGL2RenderingContext && ctx instanceof window.WebGL2RenderingContext) {
            this.glContext = ctx;
            this.backendType = 'webgl2';
            this._setupHardwareTimerExtension();
            this._buildStaticQueryPool();
            this._registerContextLossHandlers();
            this._trace('CONTEXT_ATTACH_WEBGL2', 'Contexto WebGL2 acoplado com sucesso.');
        } else {
            this.glContext = ctx; 
            this._trace('CONTEXT_ATTACH_GENERIC', 'Modo de compatibilidade genérico ativado.');
        }
    }

    _setupHardwareTimerExtension() {
        if (!this.glContext || this.backendType !== 'webgl2') return;
        this.timerExtension = this.glContext.getExtension('EXT_disjoint_timer_query_webgl2');
        if (this.timerExtension) {
            this._trace('TIMER_QUERY_INIT', 'Extensão EXT_disjoint_timer_query_webgl2 ativada e nominal.');
        }
    }

    _buildStaticQueryPool() {
        const gl = this.glContext;
        if (!gl || !this.timerExtension) return;

        // Pré-alocação controlada de objetos de query para evitar chamadas de criação em runtime quente
        for (let i = 0; i < this._maxStaticQueryPoolSize; i++) {
            this.availableQueryPool.push(gl.createQuery());
        }
    }

    _registerContextLossHandlers() {
        if (!this.glContext || !this.glContext.canvas) return;
        const canvas = this.glContext.canvas;
        
        this._contextLostListener = (e) => {
            e.preventDefault();
            this._trace('CONTEXT_LOST_EVENT', 'Contexto Gráfico Perdido. Blindando subsistemas.');
            this.enforceQualityTier('EMERGENCY');
        };

        this._contextRestoredListener = () => {
            this._trace('CONTEXT_RESTORED_EVENT', 'Contexto Gráfico Restaurado. Reinjetando pipelines...');
            this._rebuildProgramsAfterContextRestore();
        };

        canvas.addEventListener('webglcontextlost', this._contextLostListener, false);
        canvas.addEventListener('webglcontextrestored', this._contextRestoredListener, false);
    }

    _rebuildProgramsAfterContextRestore() {
        if (!this.glContext) return;
        
        // Limpa e reconstrói buffers estáticos obsolescentes
        this.pendingGpuQueries = [];
        this.availableQueryPool = [];
        this._buildStaticQueryPool();

        const tempRegistry = new Map(this.programCache);
        this.programCache.clear();
        this.activeShaders.clear();
        this.programHashes.clear();

        for (const [id, metadata] of tempRegistry.entries()) {
            if (id.endsWith('_safe_fallback') || id === 'GLOBAL_SAFE_FALLBACK') continue;
            if (metadata.sources) {
                this.registerShader(id, metadata.sources.vertex, metadata.sources.fragment, metadata.originalMetadata);
            }
        }
        this.enforceQualityTier('XR_SAFE');
    }

    registerShader(id, vertexSource, fragmentSource, initialMetadata = {}) {
        if (this.destroyed) return false;

        if (!this._validateShaderSafetySandbox(vertexSource, fragmentSource)) {
            this._trace('SANDBOX_VIOLATION', `Bloqueio de Compilação: Código inseguro detectado em [${id}].`);
            this._injectSafeFallbackProgram(id);
            return false;
        }

        const shaderHash = this._calculateShaderHash(vertexSource, fragmentSource);
        if (this.programHashes.has(shaderHash) && initialMetadata.allowSharing !== false) {
            const existingProgramData = this.programCache.get(this.programHashes.get(shaderHash));
            if (existingProgramData) {
                this.programCache.set(id, { 
                    ...existingProgramData, 
                    sources: { vertex: vertexSource, fragment: fragmentSource }, 
                    originalMetadata: initialMetadata,
                    shaderHash: shaderHash
                });
                return true;
            }
        }

        const gl = this.glContext;
        if (!gl) return false;

        try {
            let processedVertex = vertexSource;
            let processedFragment = fragmentSource;
            if (initialMetadata.xrMultiviewRequired && gl.getExtension('OVR_multiview2')) {
                processedVertex = `#extension GL_OVR_multiview2 : require\nlayout(num_views = 2) in;\n` + vertexSource;
            }

            const vertexShader = this._compileShaderSource(gl.VERTEX_SHADER, processedVertex);
            const fragmentShader = this._compileShaderSource(gl.FRAGMENT_SHADER, processedFragment);
            
            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error(gl.getProgramInfoLog(program));
            }

            // [CORREÇÃO CRÍTICA #1] Remoção completa de validateProgram() em produção normal para evitar cache stalls de driver móvel
            if (initialMetadata.debugValidation === true) {
                gl.validateProgram(program);
                if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
                    throw new Error(`Falha de Validação do Programa (Modo Debug): ${gl.getProgramInfoLog(program)}`);
                }
            }

            const uniforms = this._mapActiveUniformLocations(gl, program);
            const attributes = this._mapActiveAttributeLocations(gl, program);

            this.programCache.set(id, {
                program: program,
                uniformLocations: uniforms,
                attributeLocations: attributes,
                sources: { vertex: vertexSource, fragment: fragmentSource }, 
                originalMetadata: initialMetadata,
                shaderHash: shaderHash, 
                profiles: {
                    performanceProfile: {
                        baseExecutionMs: initialMetadata.baseExecutionMs || 0.15,
                        fallbackRequired: false
                    }
                }
            });

            this.programHashes.set(shaderHash, id);
            return true;

        } catch (error) {
            this._trace('COMPILE_CRITICAL_FAILURE', `Erro estrutural no pipeline [${id}]: ${error.message}`);
            this._injectSafeFallbackProgram(id);
            return false;
        }
    }

    registerShaderAsync(id, vertexSource, fragmentSource, initialMetadata = {}) {
        return new Promise((resolve) => {
            if (this.destroyed) return resolve(false);
            this.asyncCompileQueue.push({ id, vertexSource, fragmentSource, initialMetadata, resolve });
            this._processAsyncQueueNextFrame();
        });
    }

    /**
     * Gerenciador de fila de compilação baseado em Frame Budget Slice focado em XR
     * [CORREÇÃO CRÍTICA #3] Substituição de requestIdleCallback por micro-agendamento determinístico via queueMicrotask
     */
    _processAsyncQueueNextFrame() {
        if (this.destroyed || this.isProcessingQueue || this.asyncCompileQueue.length === 0) return;
        this.isProcessingQueue = true;

        queueMicrotask(() => {
            if (this.destroyed) return;
            
            const startTime = performance.now();
            const sliceBudgetMs = 1.5; // Fatiamento ultra-estrito para não estourar o limite de frame rate ativo

            while (this.asyncCompileQueue.length > 0 && (performance.now() - startTime) < sliceBudgetMs) {
                const task = this.asyncCompileQueue.shift();
                const status = this.registerShader(task.id, task.vertexSource, task.fragmentSource, task.initialMetadata);
                task.resolve(status);
            }

            this.isProcessingQueue = false;
            if (this.asyncCompileQueue.length > 0) {
                // Sincroniza a continuação para o início da próxima fatia livre do loop de renderização nativo
                requestAnimationFrame(() => this._processAsyncQueueNextFrame());
            }
        });
    }

    reloadShader(id, nextVertexSource, nextFragmentSource) {
        const existing = this.programCache.get(id);
        const meta = existing ? existing.originalMetadata : {};
        this.destroyShader(id);
        return this.registerShader(id, nextVertexSource, nextFragmentSource, meta);
    }

    destroyShader(id) {
        const shaderObj = this.programCache.get(id);
        if (!shaderObj) return;

        const gl = this.glContext;
        if (gl && gl.isProgram(shaderObj.program)) {
            const attachedShaders = gl.getAttachedShaders(shaderObj.program);
            if (Array.isArray(attachedShaders)) {
                for (const shader of attachedShaders) {
                    gl.detachShader(shaderObj.program, shader);
                    gl.deleteShader(shader);
                }
            }
            gl.deleteProgram(shaderObj.program);
        }

        if (shaderObj.shaderHash && this.programHashes.get(shaderObj.shaderHash) === id) {
            this.programHashes.delete(shaderObj.shaderHash);
        }

        this.programCache.delete(id);
        this.activeShaders.delete(id);
        this._trace('VRAM_CLEANUP', `Programa [${id}] purgado.`);
    }

    useShader(id, frameRuntimeUniformsPayload) {
        if (this.destroyed) return null;
        const gl = this.glContext;
        if (!gl) return null;

        let shaderObj = this.programCache.get(id);
        
        if (!shaderObj || this.budget.qualityTier === 'EMERGENCY') {
            shaderObj = this.programCache.get(`${id}_safe_fallback`) || this.programCache.get('GLOBAL_SAFE_FALLBACK');
        }

        if (!shaderObj) return null;

        gl.useProgram(shaderObj.program);
        this.activeShaders.add(id);

        const uLoc = shaderObj.uniformLocations;
        
        if (uLoc['u_focus_intensity'] != null) {
            this._setUniformSafely(gl, '1f', uLoc['u_focus_intensity'], frameRuntimeUniformsPayload.focusIntensity ?? 1.0);
        }
        if (uLoc['u_depth_attenuation'] != null) {
            this._setUniformSafely(gl, '1f', uLoc['u_depth_attenuation'], frameRuntimeUniformsPayload.depthAttenuation ?? 0.0);
        }
        if (uLoc['u_degraded_mode'] != null) {
            const isDegraded = this.budget.qualityTier === 'LOW' || this.budget.qualityTier === 'EMERGENCY' ? 1 : 0;
            this._setUniformSafely(gl, '1i', uLoc['u_degraded_mode'], isDegraded);
        }

        if (uLoc['u_emissive_clamp'] != null) {
            const metabolicIndex = window.StateStore?.get('telemetry.metabolicIndex') || 1.0;
            const targetClamp = Math.min(0.85, 1.0 - (metabolicIndex * 0.15)); 
            this._setUniformSafely(gl, '1f', uLoc['u_emissive_clamp'], targetClamp);
        }

        if (frameRuntimeUniformsPayload.customUniforms) {
            for (const [name, data] of Object.entries(frameRuntimeUniformsPayload.customUniforms)) {
                if (uLoc[name] != null) {
                    this._setUniformSafely(gl, data.type, uLoc[name], data.value);
                }
            }
        }

        // A telemetria passa a ler dados do frame anterior de forma assíncrona desacoplada
        this._executeTelemetryRecording();
        return shaderObj.program;
    }

    _setUniformSafely(gl, type, location, value) {
        try {
            switch(type) {
                case '1f': gl.uniform1f(location, value); break;
                case '2f': gl.uniform2fv(location, value); break;
                case '3f': gl.uniform3fv(location, value); break;
                case '4f': gl.uniform4fv(location, value); break;
                case '1i': gl.uniform1i(location, value); break;
                case 'mat4': gl.uniformMatrix4fv(location, false, value); break;
                default:
                    if (typeof gl[`uniform${type}`] === 'function') {
                        gl[`uniform${type}`](location, value);
                    }
            }
        } catch(err) {
            console.error(`[UNIFORM_ERROR] Falha de injeção no tipo: ${type}`, err);
        }
    }

    enforceQualityTier(targetTier) {
        this.budget.qualityTier = targetTier;
        this._trace('TIER_MUTATION', `Qualidade chave modificada para: [${targetTier}]`);
    }

    registerTexture(id, width, height, internalFormat, options = {}) {
        if (this.destroyed) return null;
        const gl = this.glContext;
        if (!gl) return null;

        if (this.textureRegistry.has(id)) {
            const oldTex = this.textureRegistry.get(id);
            if (gl.isTexture(oldTex.texture)) gl.deleteTexture(oldTex.texture);
            this.budget.vramUsageBytes -= oldTex.bytes;
        }

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, options.format || gl.RGBA, options.type || gl.UNSIGNED_BYTE, null);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.minFilter || gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.magFilter || gl.LINEAR);

        const bytesPerPixel = internalFormat === gl.RGBA32F ? 16 : (internalFormat === gl.RGBA16F ? 8 : 4);
        const estimatedBytes = width * height * bytesPerPixel;

        this.textureRegistry.set(id, { texture, width, height, bytes: estimatedBytes, resident: true });
        this.budget.vramUsageBytes += estimatedBytes;

        this._checkVramBudgetEmergencyThreshold();
        return texture;
    }

    _checkVramBudgetEmergencyThreshold() {
        if (this.budget.vramUsageBytes > this.budget.maxVramBudgetBytes) {
            this._garbageCollectUnusedTextures();
        }
    }

    _garbageCollectUnusedTextures() {
        this._trace('VRAM_GC_START', 'Iniciando limpeza em bloco do cache de texturas nativas.');
        for (const [id, texData] of this.textureRegistry.entries()) {
            if (id.startsWith('system_')) continue; 
            const gl = this.glContext;
            if (gl && gl.isTexture(texData.texture)) gl.deleteTexture(texData.texture);
            this.budget.vramUsageBytes -= texData.bytes;
            this.textureRegistry.delete(id);
            if (this.budget.vramUsageBytes <= this.budget.maxVramBudgetBytes * 0.8) break;
        }
    }

    createMultiPassFramebuffer(id, width, height) {
        if (this.destroyed) return null;
        const gl = this.glContext;
        if (!gl) return null;

        if (this.framebuffers.has(id)) {
            this.destroyFramebuffer(id);
        }

        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

        const colorTexId = `fb_color_${id}`;
        const colorTex = this.registerTexture(colorTexId, width, height, gl.RGBA);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTex, 0);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            this._trace('FRAMEBUFFER_FAILURE', `Falha de integridade em render target pass: [${id}]`);
            gl.deleteFramebuffer(fb);
            return null;
        }

        this.framebuffers.set(id, { framebuffer: fb, textureId: colorTexId, width, height });
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return fb;
    }

    destroyFramebuffer(id) {
        const fbData = this.framebuffers.get(id);
        if (!fbData) return;

        const gl = this.glContext;
        if (gl) {
            if (gl.isFramebuffer(fbData.framebuffer)) {
                gl.deleteFramebuffer(fbData.framebuffer);
            }
            if (fbData.textureId && this.textureRegistry.has(fbData.textureId)) {
                const texData = this.textureRegistry.get(fbData.textureId);
                if (gl.isTexture(texData.texture)) gl.deleteTexture(texData.texture);
                this.budget.vramUsageBytes -= texData.bytes;
                this.textureRegistry.delete(fbData.textureId);
            }
        }
        this.framebuffers.delete(id);
    }

    /**
     * Interface de limpeza de rastreio de chamadas
     * Deve ser invocada obrigatoriamente na base finalizadora do loop principal (`executeRenderCycle()`)
     */
    clearActiveShadersTracking() {
        this.activeShaders.clear();
        
        // [CORREÇÃO CRÍTICA #2 CONTINUAÇÃO] Dispara o processamento adiado das queries de telemetria sem induzir stalls
        this._processPendingGpuQueries();
    }

    _compileShaderSource(type, source) {
        const gl = this.glContext;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(log);
        }
        return shader;
    }

    _mapActiveUniformLocations(gl, program) {
        const uniforms = {};
        const activeCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < activeCount; i++) {
            const info = gl.getActiveUniform(program, i);
            if (info) {
                uniforms[info.name] = gl.getUniformLocation(program, info.name);
            }
        }
        return uniforms;
    }

    _mapActiveAttributeLocations(gl, program) {
        const attributes = {};
        const activeCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < activeCount; i++) {
            const info = gl.getActiveAttrib(program, i);
            if (info) {
                attributes[info.name] = gl.getAttribLocation(program, info.name);
            }
        }
        return attributes;
    }

    _validateShaderSafetySandbox(vs, fs) {
        const dangerousPatterns = [/while\s*\(\s*true\s*\)/, /for\s*\(\s*;\s*;\s*\)/, /#extension\s+GL_EXT_gpu_shader4/];
        for (const pattern of dangerousPatterns) {
            if (pattern.test(vs) || pattern.test(fs)) return false;
        }
        return true;
    }

    _calculateShaderHash(vs, fs) {
        let hash = 0;
        const combined = vs + fs;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; 
        }
        return `sh_${hash}`;
    }

    /**
     * Captura o início de execução do bloco gráfico usando o pool de alocação fixa
     */
    _executeTelemetryRecording() {
        if (this.destroyed) return;
        const gl = this.glContext;
        
        if (this.timerExtension && gl && this.availableQueryPool.length > 0) {
            const query = this.availableQueryPool.pop();
            gl.beginQuery(this.timerExtension.TIME_ELAPSED_EXT, query);
            gl.endQuery(this.timerExtension.TIME_ELAPSED_EXT);
            
            this.pendingGpuQueries.push(query);
        }
    }

    /**
     * Processa queries completadas de frames anteriores
     * [CORREÇÃO CRÍTICA #2 FINALIZADA] Loop desacoplado e livre de pooling de CPU ou Garbage Collection Stalls
     */
    _processPendingGpuQueries() {
        const gl = this.glContext;
        if (!gl || !this.timerExtension || this.pendingGpuQueries.length === 0) {
            if (!this.timerExtension) this._fallbackSoftwareTelemetryCalculate();
            return;
        }

        const disjoint = gl.getParameter(this.timerExtension.GPU_DISJOINT_EXT);
        let activeQueriesCount = this.pendingGpuQueries.length;

        for (let i = 0; i < activeQueriesCount; i++) {
            const query = this.pendingGpuQueries[i];
            
            // Verifica a disponibilidade do dado sem bloquear o encerramento do pipeline da CPU
            const available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);

            if (available) {
                if (!disjoint) {
                    const timeElapsedNanos = gl.getQueryParameter(query, gl.QUERY_RESULT);
                    this.budget.currentLoadMs = timeElapsedNanos / 1000000.0;
                }
                
                // Remove do vetor pendente e retorna a instância intacta para reuso futuro no pool estático
                this.pendingGpuQueries.splice(i, 1);
                this.availableQueryPool.push(query);
                i--;
                activeQueriesCount--;
            }
        }

        this.bus?.emit('shader:metrics-update', {
            loadMs: this.budget.currentLoadMs,
            budgetFraction: (this.budget.currentLoadMs / this.budget.maxShaderExecutionTimeMs),
            activeCount: this.activeShaders.size,
            vramUsageBytes: this.budget.vramUsageBytes
        });
    }

    _fallbackSoftwareTelemetryCalculate() {
        let totalMs = 0;
        this.activeShaders.forEach(id => {
            const s = this.programCache.get(id);
            if (s) totalMs += s.profiles.performanceProfile.baseExecutionMs;
        });
        this.budget.currentLoadMs = totalMs;
    }

    /**
     * [CORREÇÃO CRÍTICA #4] Implementação de Fullscreen Triangle estável e matematicamente auto-gerado
     * Remove qualquer vinculação posicional cega e gera coordenadas de rasterização idênticas via gl_VertexID (Driver-Safe)
     */
    _injectSafeFallbackProgram(id) {
        const gl = this.glContext;
        if (!gl) return;

        try {
            const fallbackVertex = `#version 300 es
                const vec2 pos[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
                void main() { gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0); }`;
                
            const fallbackFragment = `#version 300 es
                precision highp float; out vec4 color; 
                void main() { color = vec4(0.0, 0.83, 1.0, 0.3); }`;
            
            const vertexShader = this._compileShaderSource(gl.VERTEX_SHADER, fallbackVertex);
            const fragmentShader = this._compileShaderSource(gl.FRAGMENT_SHADER, fallbackFragment);
            
            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);

            const uniforms = this._mapActiveUniformLocations(gl, program);
            const attributes = this._mapActiveAttributeLocations(gl, program);

            this.programCache.set(`${id}_safe_fallback`, {
                program: program,
                uniformLocations: uniforms,
                attributeLocations: attributes,
                profiles: { performanceProfile: { baseExecutionMs: 0.01, fallbackRequired: true } }
            });
            this._trace('FALLBACK_INJECTED', `Pipeline Fullscreen-Triangle associado para [${id}].`);
        } catch (err) {
            console.error('[CRITICAL_GPU_DIE] Falha de contingência profunda.', err);
        }
    }

    _compileBuiltInSourceDictionaries() {
        this.builtInSources = {
            focusFragment: `#version 300 es
                precision highp float; in vec2 v_uv; out vec4 fragColor;
                uniform sampler2D u_scene_texture; uniform float u_focus_intensity;
                void main() {
                    vec2 center = vec2(0.5, 0.5); vec2 dist = v_uv - center;
                    vec2 uvWarped = center + dist * (1.0 - u_focus_intensity * 0.12 * dot(dist, dist));
                    fragColor = texture(u_scene_texture, uvWarped);
                }`
        };
    }

    _initGlobalListeners() {
        const onNsdr = () => this.enforceQualityTier('EMERGENCY');
        const onNominal = () => {
            if (this.budget.qualityTier === 'LOW' || this.budget.qualityTier === 'EMERGENCY') {
                this.enforceQualityTier('XR_SAFE');
            }
        };

        this.bus?.on('system:nsdr-trigger', onNsdr);
        this.bus?.on('performance:nominal', onNominal);

        this._boundListeners.set('system:nsdr-trigger', onNsdr);
        this._boundListeners.set('performance:nominal', onNominal);
    }

    shutdown() {
        this._trace('SHUTDOWN_REQUESTED', 'Fechando barramentos gráficos ativos e liberando pool estático.');
        this.destroyed = true;
        this.asyncCompileQueue = [];

        const gl = this.glContext;

        if (this.bus) {
            for (const [event, callback] of this._boundListeners.entries()) {
                this.bus.off(event, callback);
            }
        }
        this._boundListeners.clear();

        if (gl && gl.canvas) {
            gl.canvas.removeEventListener('webglcontextlost', this._contextLostListener);
            gl.canvas.removeEventListener('webglcontextrestored', this._contextRestoredListener);
        }

        const programIds = Array.from(this.programCache.keys());
        for (const id of programIds) this.destroyShader(id);

        const framebufferIds = Array.from(this.framebuffers.keys());
        for (const id of framebufferIds) this.destroyFramebuffer(id);

        if (gl) {
            for (const [id, texData] of this.textureRegistry.entries()) {
                if (gl.isTexture(texData.texture)) gl.deleteTexture(texData.texture);
            }
            // Purga as queries ativas do pool estático reutilizável
            for (const query of this.availableQueryPool) {
                if (gl.isQuery(query)) gl.deleteQuery(query);
            }
            for (const query of this.pendingGpuQueries) {
                if (gl.isQuery(query)) gl.deleteQuery(query);
            }
        }

        this.textureRegistry.clear();
        this.availableQueryPool = [];
        this.pendingGpuQueries = [];
        this.programHashes.clear();
        this.activeShaders.clear();
        
        this.budget.vramUsageBytes = 0;
        this._trace('SHUTDOWN_COMPLETE', 'Módulo de runtime congelado e purgado com sucesso.');
    }

    _trace(action, msg) {
        console.log(`%c[SHADER_RUNTIME] [${action}] ${msg}`, 'color:#00FF88; font-family: monospace;');
    }
}

// INSTANCIAÇÃO DO RUNTIME SOBERANO
(() => {
    const ShaderRuntimeInstance = new SentinelShaderRuntime();
    window.SentinelShaderRuntimeClass = SentinelShaderRuntime; 
    window.SentinelShaderRuntime = ShaderRuntimeInstance;      

    if (window.SovereignKernel) {
        window.SovereignKernel.registerModule('shader-runtime', ShaderRuntimeInstance);
    } else {
        Object.defineProperty(window, 'SovereignKernel', {
            configurable: true,
            enumerable: true,
            set: (kernelInstance) => {
                delete window.SovereignKernel;
                window.SovereignKernel = kernelInstance;
                window.SovereignKernel.registerModule('shader-runtime', ShaderRuntimeInstance);
            }
        });
    }
})();
