/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE GPU PERCEPTION & SHADER RUNTIME
 * Arquivo: xr/shaders/core/shader-runtime.js
 * Papel: Centro de Estética Científica, Feedback de Fluidez e Efeitos GLSL
 * Domínio: GRAPHICS / SPATIAL INTERFACE / RENDER ACCELERATION
 * Fix: Correção de extensão dupla (.js.js) e isolamento estrito de strings GLSL
 * ═══════════════════════════════════════════════════════════════════════════
 */

if (typeof AFRAME === 'undefined') {
    throw new Error('[VR-OS SHADER] A-Frame precisa ser carregado antes da inicialização do runtime de shaders.');
}

/**
 * Registro do componente de Shader customizado no ecossistema A-Frame.
 * Fornece a identidade visual Cyber Glass com renderização acelerada por GPU.
 */
AFRAME.registerShader('sentinel-cyber-glass', {
    // Esqueleto de Uniforms injetados diretamente no pipeline do WebGL2
    schema: {
        time: { type: 'time', is: 'uniform' },
        glowColor: { type: 'color', is: 'uniform', default: '#D4AF37' },
        focusIntensity: { type: 'float', is: 'uniform', default: 1.0 },
        degradedMode: { type: 'float', is: 'uniform', default: 0.0 }
    },

    // 1. VERTEX SHADER: Projeta coordenadas espaciais na tela com latência zero de matriz
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            
            gl_Position = projectionMatrix * mvPosition;
        }
    `,

    // 2. FRAGMENT SHADER: Assinatura visual Dark Mode Scientific com gradientes dourados e scanlines
    fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        uniform float time;
        uniform vec3 glowColor;
        uniform float focusIntensity;
        uniform float degradedMode;

        void main() {
            // Conversão segura do tempo para rotação de ciclo senoidal sutil
            float seconds = time * 0.001;
            float pulse = 0.5 + 0.5 * sin(seconds * 1.5);
            
            // Fundo Escuro Translúcido Científico (Deep Obsidian Blue)
            vec3 baseBackground = vec3(0.005, 0.012, 0.02);
            
            // Criação de linhas de varredura (Scanlines) horizontais anti-aliased para estética HUD
            float scanlineFrequency = degradedMode > 0.5 ? 100.0 : 250.0;
            float scanlineSpeed = degradedMode > 0.5 ? 2.0 : 4.0;
            float scanline = sin(vUv.y * scanlineFrequency - seconds * scanlineSpeed) * 0.035;
            
            // Efeito Cyber Glass: Brilho de borda sutil (Fresnel Adaptativo Simplificado)
            vec3 normalVec = normalize(vNormal);
            vec3 viewVec = normalize(vViewPosition);
            float fresnel = pow(1.0 - max(dot(normalVec, viewVec), 0.0), 3.0);
            
            // Gradiente dourado vertical estabilizado para diminuir a fadiga cognitiva
            float gradientY = pow(1.0 - vUv.y, 2.0) * 0.15 + pow(vUv.y, 2.0) * 0.05;
            
            // Interpolação de cor final com base na saúde atencional do sistema
            vec3 dynamicGlow = mix(glowColor, vec3(0.0, 0.83, 1.0), pulse * 0.1);
            
            // Compositor final de fragmentos (Pintura de pixels acelerada)
            vec3 finalColor = baseBackground + (dynamicGlow * (gradientY + (fresnel * 0.45) + (pulse * 0.03) * focusIntensity));
            
            // Ajuste dinâmico de opacidade (Alpha Channel) contra quebras de oclusão tridimensional
            float alpha = 0.68 + scanline + (fresnel * 0.22);
            
            // Mitigação instantânea de carga se o modo degradado (Performance Emergency) estiver ativo
            if (degradedMode > 0.5) {
                finalColor = baseBackground + (glowColor * (gradientY + 0.1));
                alpha = 0.55;
            }
            
            gl_FragColor = vec4(finalColor, alpha);
        }
    `
});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTROLADOR DE GERENCIAMENTO DE PIPELINE DE SHADERS (LEGADO REESTRUTURADO)
 * ═══════════════════════════════════════════════════════════════════════════
 */
class SentinelShaderRuntime {
    constructor() {
        this.version = "9.0-SHADER-RUNTIME";
        this.programCache = new Map();
        this.activeShaders = new Set();
        this.glContext = null;
        this.bus = window.SentinelBus || null;
        
        // Alocações de Perfilamento e Orçamento (Frame Budget Alvo para 90Hz = ~11.1ms)
        this.budget = {
            maxShaderExecutionTimeMs: 4.5, 
            currentLoadMs: 0.0,
            qualityTier: 'XR_SAFE' // HIGH, MEDIUM, LOW, XR_SAFE, EMERGENCY
        };

        this._initGlobalListeners();
    }

    setGraphicsContext(glContext) {
        this.glContext = glContext;
        this._trace('CONTEXT', 'Contexto gráfico WebGL acoplado com sucesso ao Runtime.', 'INFO');
    }

    enforceQualityTier(tier) {
        this.budget.qualityTier = tier;
        this._trace('QUALITY', `Iniciando rebaixamento homeostático de shaders para o Tier: [${tier}]`, 'WARN');
        
        // Propaga atualização de estados para todas as malhas tridimensionais ligadas ao DOM espacial
        const sceneEl = document.querySelector('a-scene');
        if (sceneEl) {
            const entities = sceneEl.querySelectorAll('[material]');
            entities.forEach(entity => {
                if (entity.getAttribute('material')?.shader === 'sentinel-cyber-glass') {
                    entity.setAttribute('material', 'degradedMode', tier === 'EMERGENCY' || tier === 'LOW' ? 1.0 : 0.0);
                }
            });
        }
    }

    _updateGpuTelemetry() {
        // Cálculo estático não bloqueante para evitar chamadas de ReadPixels na GPU
        let totalMs = this.budget.qualityTier === 'HIGH' ? 3.2 : 1.1;
        this.budget.currentLoadMs = totalMs;

        if (this.bus) {
            this.bus.emit('shader:metrics-update', {
                loadMs: this.budget.currentLoadMs,
                budgetFraction: (this.budget.currentLoadMs / this.budget.maxShaderExecutionTimeMs),
                activeCount: this.activeShaders.size
            });
        }
    }

    _initGlobalListeners() {
        if (this.bus) {
            // Escuta o sinal de exaustão biológica para diminuir instantaneamente a atividade da GPU
            this.bus.on('system:nsdr-trigger', () => {
                this.enforceQualityTier('EMERGENCY');
            });

            // Restaura a qualidade nominal se a telemetria de performance estabilizar
            this.bus.on('performance:nominal', () => {
                if (this.budget.qualityTier === 'EMERGENCY' || this.budget.qualityTier === 'LOW') {
                    this.enforceQualityTier('XR_SAFE');
                }
            });
        }
    }

    _trace(subsystem, message, level = 'INFO') {
        console.log(`[${new Date().toISOString()}] [SHADER_RUNTIME:${subsystem}] [${level}] ${message}`);
    }
}

// Inicialização automática e acoplamento seguro no escopo global
const SovereignShaderRuntime = new SentinelShaderRuntime();
window.SentinelShaderRuntime = SovereignShaderRuntime;

console.log("%c[SENTINEL XR] Shader 'sentinel-cyber-glass' unificado e injetado no barramento gráfico.", "color: #D4AF37; font-weight: bold;");
