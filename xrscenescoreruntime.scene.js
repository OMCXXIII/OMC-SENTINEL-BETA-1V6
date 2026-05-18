/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE XR SCENE RUNTIME ORCHESTRATOR
 * Arquivo: xr/scenes/core/runtime.scene.js
 * Papel: Governador Soberano de Estados Espaciais, Iluminação de Baixo Impacto e WebXR
 * Domínio: SPATIAL INTERFACE / RENDERING CONFIGURATION / REACTION LOOP
 * Fix: Fusão do SceneManager v9.0 com o componente do ecossistema A-Frame
 * ═══════════════════════════════════════════════════════════════════════════
 */

if (typeof AFRAME === 'undefined') {
    throw new Error('[VR-OS SCENE] Falha crítica: O motor gráfico A-Frame está offline.');
}

/**
 * 1. GERENCIADOR DE ORQUESTRAÇÃO DE CENAS COGNITIVAS (MÁQUINA DE ESTADO ESPACIAL)
 */
class SentinelSceneManager {
    constructor() {
        this.registry = new Map();
        this.activeScene = null;
        this.transitioning = false;
        this.bus = window.SentinelBus || null;
        
        // Cache de overlays de hardware
        this.overlay = this._createTransitionOverlay();
        
        this._initGlobalListeners();
    }

    registerScene(id, sceneInstance) {
        this.registry.set(id, sceneInstance);
        this._trace('REGISTRY', `Estado espacial registrado com sucesso: [${id}]`);
    }

    async activateScene(targetId, transitionType = 'nominal') {
        if (this.transitioning) return false;
        if (!this.registry.has(targetId)) {
            this._trace('ORCHESTRATION', `Falha: Cena alvo [${targetId}] não encontrada no registro físico.`, 'ERROR');
            return false;
        }

        this.transitioning = true;
        this._trace('TRANSITION', `Iniciando mutação espacial para [${targetId}] via perfil [${transitionType}]`);

        // Executa fade por hardware para suavização atencional (Prevenção de Jitter Ocular)
        await this._applyOverlayFade(1.0);

        if (this.activeScene && typeof this.activeScene.unload === 'function') {
            await this.activeScene.unload();
        }

        this.activeScene = this.registry.get(targetId);
        
        if (this.activeScene && typeof this.activeScene.load === 'function') {
            await this.activeScene.load();
        }

        // Notifica o barramento central e a máquina de estados jerárquica (HSM)
        if (this.bus) {
            this.bus.emit('scene:changed', { id: targetId, type: transitionType });
        }

        await this._applyOverlayFade(0.0);
        this.transitioning = false;
        return true;
    }

    _applyOverlayFade(targetOpacity) {
        return new Promise(resolve => {
            if (!this.overlay) return resolve();
            this.overlay.style.opacity = targetOpacity;
            setTimeout(resolve, 300); // Sincronizado com o transition CSS
        });
    }

    _createTransitionOverlay() {
        let el = document.getElementById('scene-transition-overlay');
        if (!el) {
            el = document.createElement('div');
            el.id = 'scene-transition-overlay';
            el.style = 'position:fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:99999; transition: opacity 0.3s ease-in-out; opacity:0; background: #000408;';
            document.body.appendChild(el);
        }
        return el;
    }

    _initGlobalListeners() {
        if (this.bus) {
            // Escuta por degradação crítica de frames emitida pelo Performance Engine
            this.bus.on('performance:drop', (telemetry) => {
                if (telemetry && telemetry.fps < 45) {
                    this._trace('HOMEOSTASIS', 'Queda severa de FPS detectada. Ajustando pipeline para modo econômico.', 'WARN');
                    document.body.classList.add('fx-degraded', 'hud-minimal');
                }
            });

            // Força evacuação para a cena de recuperação em caso de colapso cognitivo (NSDR)
            this.bus.on('system:nsdr-trigger', () => {
                this._trace('RECOVERY', 'Sinal de exaustão biológica recebido. Acionando mitigação espacial.', 'WARN');
                this.activateScene('recovery', 'emergency');
            });
        }
    }

    _trace(subsystem, message, level = 'INFO') {
        console.log(`[${new Date().toISOString()}] [SCENE_MANAGER:${subsystem}] [${level}] ${message}`);
    }
}

// Inicializa e expõe o Governador do Ciclo de Vida de Cenas
window.SentinelSceneManager = new SentinelSceneManager();


/**
 * 2. COMPONENTE WEBXR A-FRAME (ORQUESTRAÇÃO FÍSICA E CAPTURA DE EVENTOS)
 */
AFRAME.registerComponent('sentinel-runtime-scene', {
    init: function () {
        this.sceneEl = this.el;
        this.kernel = window.SovereignKernel || window.SentinelKernel;
        this.bus = window.SentinelBus;

        // Configura iluminação cinematográfica estrita de latência zero (Dark Mode Scientific)
        this.setupEnvironment();

        // Configuração do WebGLRenderer nativo para travar frame-rate ao hardware do display
        this.optimizeGraphicsPipeline();

        // Centraliza a escuta de intenções e despacha diretamente ao barramento tático do Kernel
        this._boundTriggerInterceptor = this.onSpatialTriggerIntercepted.bind(this);
        this.sceneEl.addEventListener('sentinel-trigger', this._boundTriggerInterceptor);

        console.log("%c[SENTINEL XR] Componente 'sentinel-runtime-scene' acoplado à malha tridimensional.", "color: #9D00FF; font-weight: bold;");
    },

    // Configuração estrita de iluminação matemática sem geração de sombras custosas
    setupEnvironment: function () {
        // Desativa luzes automáticas e genéricas do A-Frame para cessar overhead de CPU
        this.sceneEl.setAttribute('light', 'defaultLightsEnabled: false');

        // Luz Ambiente Estabilizada Base (Obsidian Dark Field)
        const ambientLight = document.createElement('a-entity');
        ambientLight.setAttribute('id', 'sentinel-ambient-core');
        ambientLight.setAttribute('light', {
            type: 'ambient',
            color: '#03070d', // Deep Space Navy
            intensity: 1.2
        });
        this.sceneEl.appendChild(ambientLight);

        // Luz Direcional Técnica de Alta Definição (Assinatura Gradiente Gold-Amber)
        const directionalLight = document.createElement('a-entity');
        directionalLight.setAttribute('id', 'sentinel-directional-accent');
        directionalLight.setAttribute('light', {
            type: 'directional',
            color: '#D4AF37',   // Ouro Imperial Sutil
            intensity: 0.55,
            castShadow: false   // TOTALMENTE DESATIVADO PARA EVITAR PROCESSAMENTO EM CPU
        });
        directionalLight.setAttribute('position', '4.0 12.0 2.5');
        this.sceneEl.appendChild(directionalLight);
    },

    // Ajustes diretos no motor Three.js para maximizar sincronização com headsets (90Hz/120Hz)
    optimizeGraphicsPipeline: function () {
        const renderer = this.sceneEl.renderer;
        if (renderer) {
            renderer.physicallyCorrectLights = true;
            renderer.sortObjects = true; // Previne sobreposição e quebra de z-buffer
            
            // Força a liberação imediata dos buffers após a projeção ocular
            const ctx = renderer.getContext();
            if (ctx && ctx.hint) {
                ctx.hint(ctx.FRAGMENT_SHADER_DERIVATIVE_HINT, ctx.NICEST);
            }
        }
    },

    // INTERCEPTADOR DE GATILHOS: Comunicação direta sub-milissegundo com o Kernel
    onSpatialTriggerIntercepted: function (event) {
        if (!event.detail) return;
        
        const { actionId, timestamp } = event.detail;
        const currentLatency = performance.now() - timestamp;

        // 1. Despacho assíncrono instantâneo no barramento sínclito para logs e observabilidade
        if (this.bus) {
            this.bus.emit('xr:intent_captured', {
                actionId: actionId,
                latencyMs: currentOpacity => currentLatency,
                capturedAt: performance.now()
            });
        }

        // 2. Acionamento direto da automação de hardware contida no Kernel Soberano
        if (this.kernel) {
            // Roteamento direto para os Gânglios Basais Automatizados (Se expostos)
            if (typeof this.kernel.startBasalGangliaAutomation === 'function') {
                this.kernel.startBasalGangliaAutomation(actionId, currentLatency);
            } else {
                // Fallback de injeção de comando limpo via comando centralizado
                if (this.bus) {
                    this.bus.emit('nexus:command', {
                        command: 'TRIGGER_AUTOMATION_NODE',
                        payload: { id: actionId, inputLatency: currentLatency },
                        source: 'RUNTIME_SCENE_INTERCEPTOR'
                    });
                }
            }
        }

        console.log(`[KERNEL COGNITIVO] Latência de entrada medida no barramento espacial: ${currentLatency.toFixed(3)}ms // Ação: ${actionId}`);
    },

    remove: function () {
        this.sceneEl.removeEventListener('sentinel-trigger', this._boundTriggerInterceptor);
    }
});
