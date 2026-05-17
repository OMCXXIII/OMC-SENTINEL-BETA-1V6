/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE GPU PERCEPTION INFRASTRUCTURE
 * Arquivo: xr/shaders/core/shader-runtime.js
 * Papel: Governador Global de Ciclo de Vida GLSL e Controle de Frame-Budget
 * ═══════════════════════════════════════════════════════════════════════════
 */

class SentinelShaderRuntime {
    constructor() {
        this.programCache = new Map();
        this.activeShaders = new Set();
        this.glContext = null;
        this.bus = window.SentinelBus || null;
        
        // Alocações de Perfilamento e Orçamento (Frame Budget Alvo para 90Hz = ~11.1ms)
        this.budget = {
            maxShaderExecutionTimeMs: 4.5, // Teto máximo reservado apenas para shaders cognitivos
            currentLoadMs: 0.0,
            qualityTier: 'XR_SAFE'         // HIGH, MEDIUM, LOW, XR_SAFE, EMERGENCY
        };

        this._initGlobalListeners();
    }

    /**
     * Vincula o contexto gráfico ativo da engine à infraestrutura de percepção cognitiva
     * @param {WebGL2RenderingContext|WebGPUDevice} glContext - Contexto de renderização ativo
     */
    setGraphicsContext(glContext) {
        this.glContext = glContext;
        console.log('[SHADER-RUNTIME] Contexto gráfico acoplado com sucesso à infraestrutura.');
    }

    /**
     * Registra e compila um par de Shaders (Vertex + Fragment) sob governança cognitiva
     * @param {string} id - ID único do mecanismo perceptivo
     * @param {string} vertexSource - Código-fonte GLSL do Vertex Shader
     * @param {string} fragmentSource - Código-fonte GLSL do Fragment Shader
     * @param {Object} metadata - Perfis de Atenção, Custo e Missão
     */
    async compileAndRegister(id, vertexSource, fragmentSource, metadata) {
        if (this.programCache.has(id)) return this.programCache.get(id);

        const runtimeShader = {
            identity: id,
            initialized: false,
            status: 'UNLOADED', // UNLOADED, COMPILED, ACTIVE, DEGRADED, SUSPENDED
            program: null,
            uniforms: {},
            profiles: {
                performanceProfile: metadata?.performanceProfile || { gpuCostFraction: 0.02, baseExecutionMs: 0.2 },
                attentionProfile: metadata?.attentionProfile || { attentionWeight: 1.0, focusIntensity: 0.5 },
                xrProfile: metadata?.xrProfile || { xrSafetyLevel: 5, motionSensitivity: false },
                semanticProfile: metadata?.semanticProfile || { function: 'GENERIC_PERCEPTION' }
            },
            
            // Hooks Internos de Execução Regulada
            onActivate: function(gl) {
                this.status = 'ACTIVE';
                console.log(`[SHADER:${this.identity}] Ativado e injetado na pipeline principal.`);
            },
            onDegrade: function(gl) {
                this.status = 'DEGRADED';
                // Injeta uniformes de sobrevivência para cortar processamento interno do loop GLSL
                if (this.uniforms.u_degraded_mode) {
                    gl.uniform1i(this.uniforms.u_degraded_mode, 1);
                }
                console.warn(`[SHADER:${this.identity}] Linha de amostragem rebaixada para modo adaptativo.`);
            },
            onSuspend: function() {
                this.status = 'SUSPENDED';
            }
        };

        // Realiza a compilação real no hardware se o contexto estiver disponível
        if (this.glContext) {
            runtimeShader.program = this._compileNativeProgram(vertexSource, fragmentSource);
            runtimeShader.uniforms = this._mapUniformLocations(runtimeShader.program);
            runtimeShader.initialized = true;
            runtimeShader.status = 'COMPILED';
        } else {
            console.warn(`[SHADER-RUNTIME] Contexto offline. Pré-registrando ${id} em modo Standby.`);
        }

        this.programCache.set(id, runtimeShader);
        return runtimeShader;
    }

    /**
     * Ativa um shader específico e avalia o impacto orçamentário na GPU
     * @param {string} id - ID do shader cognitivo
     */
    async activateShader(id) {
        const shader = this.programCache.get(id);
        if (!shader) return false;

        // Validação preventiva de orçamento de hardware
        const projectedLoad = this.budget.currentLoadMs + shader.profiles.performanceProfile.baseExecutionMs;
        if (projectedLoad > this.budget.maxShaderExecutionTimeMs && this.budget.qualityTier !== 'EMERGENCY') {
            console.warn(`[SHADER-RUNTIME] Saturação de Frame evitada! Forçando degradação do shader: ${id}`);
            shader.onDegrade(this.glContext);
        } else {
            shader.onActivate(this.glContext);
        }

        this.activeShaders.add(id);
        this._updateGpuTelemetry();
        return true;
    }

    /**
     * Força a reconfiguração global da fidelidade visual para blindagem do frame budget
     * @param {string} tier - Nova classificação de qualidade exigida (LOW, MEDIUM, HIGH, XR_SAFE, EMERGENCY)
     */
    enforceQualityTier(tier) {
        this.budget.qualityTier = tier;
        console.log(`%c [SHADER-RUNTIME] Modificando fidelidade perceptual da GPU para: ${tier} `, 'background:#000; color:#FFC400;');

        this.programCache.forEach(shader => {
            if (shader.status === 'ACTIVE' || shader.status === 'DEGRADED') {
                if (tier === 'LOW' || tier === 'EMERGENCY') {
                    shader.onDegrade(this.glContext);
                } else if (tier === 'HIGH' || tier === 'XR_SAFE') {
                    shader.status = 'ACTIVE';
                    if (shader.uniforms.u_degraded_mode && this.glContext) {
                        this.glContext.useProgram(shader.program);
                        this.glContext.uniform1i(shader.uniforms.u_degraded_mode, 0);
                    }
                }
            }
        });

        // Atualiza variáveis CSS nativas para sincronia com o hud.css e fx.css
        document.documentElement.style.setProperty('--fx-shader-tier-emergency', tier === 'EMERGENCY' ? '1' : '0');
    }

    _compileNativeProgram(vSrc, fSrc) {
        const gl = this.glContext;
        
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vSrc);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            throw new Error(`Erro na compilação do Vertex Shader: ${gl.getShaderInfoLog(vs)}`);
        }

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fSrc);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            throw new Error(`Erro na compilação do Fragment Shader: ${gl.getShaderInfoLog(fs)}`);
        }

        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`Erro no Link do Programa de Shader: ${gl.getProgramInfoLog(program)}`);
        }

        return program;
    }

    _mapUniformLocations(program) {
        const gl = this.glContext;
        const uniforms = {};
        const count = gl.getProgramParameter(program, gl.ACTIVE_UNFORMS) || 0;
        
        for (let i = 0; i < count; i++) {
            const info = gl.getActiveUniform(program, i);
            if (info) {
                uniforms[info.name] = gl.getUniformLocation(program, info.name);
            }
        }
        // Injeções padrões obrigatórias pelo ecossistema SENTINEL
        uniforms['u_attention_weight'] = gl.getUniformLocation(program, 'u_attention_weight');
        uniforms['u_focus_intensity'] = gl.getUniformLocation(program, 'u_focus_intensity');
        uniforms['u_degraded_mode'] = gl.getUniformLocation(program, 'u_degraded_mode');
        
        return uniforms;
    }

    _updateGpuTelemetry() {
        let totalMs = 0;
        this.activeShaders.forEach(id => {
            const s = this.programCache.get(id);
            if (s) totalMs += s.profiles.performanceProfile.baseExecutionMs;
        });
        this.budget.currentLoadMs = totalMs;

        // Emite telemetria direto no barramento global de monitoramento
        this.bus?.emit('shader:metrics-update', {
            loadMs: this.budget.currentLoadMs,
            budgetFraction: (this.budget.currentLoadMs / this.budget.maxShaderExecutionTimeMs),
            activeCount: this.activeShaders.size
        });
    }

    _initGlobalListeners() {
        // Escuta o sinal de exaustão biológica (NSDR Trigger) para diminuir instantaneamente a atividade da GPU
        this.bus?.on('system:nsdr-trigger', () => {
            this.enforceQualityTier('EMERGENCY');
            console.warn('[SHADER-RUNTIME] Blindagem Biológica ativada via Shader Downscaling.');
        });

        // Restaura a qualidade nominal se a telemetria de performance estabilizar
        this.bus?.on('performance:nominal', () => {
            if (this.budget.qualityTier === 'LOW') {
                this.enforceQualityTier('XR_SAFE');
            }
        });
    }
}

// Injeção da infraestrutura no escopo global
window.SentinelShaderRuntime = new SentinelShaderRuntime();