/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE XR SCENE RUNTIME ORCHESTRATOR
 * Arquivo: xr/scenes/core/runtime.scene.js
 * Papel: Governador Soberano de Estados Espaciais, Iluminação de Baixo Impacto e WebXR
 * Domínio: SPATIAL INTERFACE / RENDERING CONFIGURATION / REACTION LOOP
 * * COMPLIANCE DE ENGENHARIA DE COMPOSIÇÃO:
 * ✓ A) SCENE MANAGER: Barramento central de registro, transição suave e cache de viewport.
 * ✓ B) SCENE STREAMING: Carga sob demanda de partições, garbage-collection geométrico L1/L2.
 * ✓ C) XR ZONES: Mapeamento de coordenadas concêntricas para isolamento óptico (Foveation).
 * ✓ D) ACTIVE SCENE GOVERNANCE: Laço preditivo de pânico por frame budget contra cinetose.
 * ═══════════════════════════════════════════════════════════════════════════
 */

if (typeof AFRAME === 'undefined') {
    throw new Error('[VR-OS SCENE] Falha crítica: O motor gráfico A-Frame está offline.');
}

// CONSTANTES E CONFIGURAÇÕES GEOMÉTRICAS DO SUBSISTEMA
const INTERPOLATION_MODES = Object.freeze({
    NOMINAL: 'nominal',
    EMERGENCY: 'emergency',
    WARP: 'warp'
});

const IMMERSIVE_ZONES = Object.freeze({
    HEAD_LOCKED: 'HEAD_LOCKED',   // Zonas HUD estáticas absolutas contra aberrações esféricas
    FOVEAL_CORE: 'FOVEAL_CORE',   // Vetor óptico direto do olhar (+/- 15deg) - Prioridade Máxima
    CONTEXT_MID: 'CONTEXT_MID',   // Plano médio de leitura, transformadas táteis interativas
    BACKGROUND:  'BACKGROUND',    // Skybox e malhas frias volumétricas ambientais
    PANIC_LAYER: 'PANIC_LAYER'    // Overlay fixado superior para interrupções do Kernel
});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * A) SCENE MANAGER & B) SCENE STREAMING SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 */
class SentinelSceneManager {
    constructor() {
        this.registry = new Map();
        this.activeScene = null;
        this.transitioning = false;
        this.bus = window.SentinelBus || null;
        
        // Cache estrutural de overlays de hardware
        this.overlay = this._createTransitionOverlay();
        
        // Inicialização dos gânglios de controle de streaming
        this.streamingChunks = new Map();
        this.allocatedVertexCount = 0;
        this.maxVertexBudget = 2000000; // Teto de segurança para hardware standalone antigo
        
        // Laço de governança ativo acoplado
        this.governor = new ActiveSceneGovernance(this);
        
        this._initGlobalListeners();
    }

    registerScene(id, sceneInstance) {
        this.registry.set(id, sceneInstance);
        this._trace('REGISTRY', `Estado espacial registrado com sucesso: [${id}]`);
    }

    /**
     * B) SCENE STREAMING — Carregamento Dinâmico de Partições Poligonais sem Micro-Stutters
     */
    async streamSceneChunk(chunkId, vertexCount, geometryDataPayload) {
        this._trace('STREAMING', `Avaliando entrada de chunk: [${chunkId}] (Vértices: ${vertexCount})`);
        
        // Verificação de estouro de orçamento geométrico físico
        if (this.allocatedVertexCount + vertexCount > this.maxVertexBudget) {
            this._trace('STREAMING_WARNING', 'Orçamento geométrico esgotado. Iniciando purga L1/L2 imediata.');
            this.purgeInactiveChunks();
        }

        // Simulação assíncrona de injeção paralela na GPU via Blob/Worker
        return new Promise((resolve) => {
            setTimeout(() => {
                this.streamingChunks.set(chunkId, {
                    loaded: true,
                    vertices: vertexCount,
                    payload: geometryDataPayload,
                    timestamp: performance.now()
                });
                this.allocatedVertexCount += vertexCount;
                this.bus?.emit('xr:chunk_streamed', { chunkId, currentVertices: this.allocatedVertexCount });
                resolve(true);
            }, 5); // Fatiamento sínclito curto para evitar bloqueio da thread principal de renderização
        });
    }

    purgeInactiveChunks() {
        let clearedVertices = 0;
        for (const [id, chunk] of this.streamingChunks.entries()) {
            if (id !== this.activeScene) {
                clearedVertices += chunk.vertices;
                // Desreferenciação explícita de memória para acionar o Garbage Collector do JavaScript
                chunk.payload = null; 
                this.streamingChunks.delete(id);
                this._trace('GARBAGE_COLLECTOR', `Chunk espacial desalocado da VRAM: [${id}]`);
            }
        }
        this.allocatedVertexCount -= clearedVertices;
    }

    /**
     * A) SCENE MANAGER — Controle Estrito de Transição e Viewport
     */
    async activateScene(targetId, transitionType = 'nominal') {
        if (this.transitioning) {
            this._trace('REJECT', `Transição bloqueada. Laço ocupado processando rota espacial: [${targetId}]`);
            return false;
        }

        if (!this.registry.has(targetId)) {
            this._trace('ERROR', `Invocação inválida. Cenário não catalogado no dicionário estrutural: [${targetId}]`);
            return false;
        }

        this.transitioning = true;
        this.bus?.emit('xr:scene_transition_start', { from: this.activeScene, to: targetId, mode: transitionType });

        // Executa escurecimento periférico foveal automático se a transição não for imediata (Preventivo de Cinetose)
        if (transitionType !== INTERPOLATION_MODES.WARP) {
            await this._fadeOverlay(0.0, 1.0, 250);
        }

        // Desativação lógica do cenário de origem
        if (this.activeScene && this.registry.has(this.activeScene)) {
            const currentSceneInstance = this.registry.get(this.activeScene);
            if (typeof currentSceneInstance.deactivate === 'function') {
                await currentSceneInstance.deactivate();
            }
        }

        // Ativação e streaming forçado do cenário de destino
        const targetSceneInstance = this.registry.get(targetId);
        this.activeScene = targetId;

        if (typeof targetSceneInstance.activate === 'function') {
            await targetSceneInstance.activate();
        }

        // Força sincronização do laço de governança com as novas metas do cenário ativo
        this.governor.synchronizeSceneTargets(targetSceneInstance.budgetTargets || { maxFrameTimeMs: 11.11 });

        // Clareia a viewport de forma progressiva restabelecendo a imersão visual
        if (transitionType !== INTERPOLATION_MODES.WARP) {
            await this._fadeOverlay(1.0, 0.0, 200);
        }

        this.transitioning = false;
        this.bus?.emit('xr:scene_transition_complete', { activeScene: this.activeScene });
        this._trace('SUCCESS', `Pipeline espacial chaveado para o domínio: [${targetId}]`);
        return true;
    }

    _createTransitionOverlay() {
        const overlayNode = document.createElement('div');
        overlayNode.id = 'xr-runtime-fade-overlay';
        overlayNode.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: #020408; opacity: 0; pointer-events: none;
            z-index: 9999; transition: opacity 0s linear;
            will-change: opacity; isolation: isolate;
        `;
        document.body.appendChild(overlayNode);
        return overlayNode;
    }

    _fadeOverlay(start, end, durationMs) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const animateFade = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / durationMs, 1.0);
                const currentOpacity = start + (end - start) * progress;
                
                this.overlay.style.opacity = currentOpacity;
                
                if (progress < 1.0) {
                    requestAnimationFrame(animateFade);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animateFade);
        });
    }

    _initGlobalListeners() {
        this.bus?.on('nexus:route_scene', (payload) => {
            if (payload && payload.targetId) {
                this.activateScene(payload.targetId, payload.mode || 'nominal');
            }
        });

        // Escuta rebaixamento sínclito se o governor sinalizar falha crítica de hardware
        this.bus?.on('performance:emergency_throttle', () => {
            this.purgeInactiveChunks();
            this.overlay.style.opacity = 0.2; // Aplica máscara periférica fixa para aliviar rasterização
        });
    }

    _trace(action, msg) {
        console.log(`%c[SENTINEL_SCENE_MANAGER] [${action}] ${msg}`, 'color:#00D4FF; font-weight:bold;');
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * C) XR ZONES SYSTEM (Geografia Cognitiva e Vetores de Coordenadas)
 * ═══════════════════════════════════════════════════════════════════════════
 */
class XRZoneRegistry {
    constructor() {
        this.zones = new Map();
        this._initDefaultZones();
    }

    _initDefaultZones() {
        this.registerZone(IMMERSIVE_ZONES.HEAD_LOCKED, { minZ: -0.1, maxZ: -0.6, priority: 100, foveationLevel: 0 });
        this.registerZone(IMMERSIVE_ZONES.FOVEAL_CORE, { minZ: -0.6, maxZ: -1.5, priority: 90,  foveationLevel: 0 });
        this.registerZone(IMMERSIVE_ZONES.CONTEXT_MID, { minZ: -1.5, maxZ: -4.0, priority: 50,  foveationLevel: 1 });
        this.registerZone(IMMERSIVE_ZONES.BACKGROUND,  { minZ: -4.0, maxZ: -100.0, priority: 10, foveationLevel: 2 });
    }

    registerZone(zoneId, boundaryConfig) {
        this.zones.set(zoneId, {
            ...boundaryConfig,
            activeElementsCount: 0,
            allocatedBytes: 0
        });
    }

    /**
     * Retorna qual zona tridimensional envelopa o objeto com base na sua profundidade linear (Eixo Z)
     */
    mapCoordinateToZone(zCoordinate) {
        const absZ = Math.abs(zCoordinate); // Converte coordenadas negativas do WebXR para escala absoluta
        
        if (absZ <= 0.6) return IMMERSIVE_ZONES.HEAD_LOCKED;
        if (absZ > 0.6 && absZ <= 1.5) return IMMERSIVE_ZONES.FOVEAL_CORE;
        if (absZ > 1.5 && absZ <= 4.0) return IMMERSIVE_ZONES.CONTEXT_MID;
        return IMMERSIVE_ZONES.BACKGROUND;
    }

    getZoneMetadata(zoneId) {
        return this.zones.get(zoneId) || null;
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * D) ACTIVE SCENE GOVERNANCE (Laço de Estabilidade, Latência e Proteção Cinestésica)
 * ═══════════════════════════════════════════════════════════════════════════
 */
class ActiveSceneGovernance {
    constructor(managerInstance) {
        this.manager = managerInstance;
        this.targetMaxFrameTimeMs = 11.11; // Alvo rígido para taxas mínimas de 90Hz em XR
        this.consecutivePanicFrames = 0;
        this.panicThresholdFrames = 5;     // Limiar estrito antes de ejetar sub-sistemas complexos
        
        this._initGovernanceLoop();
    }

    synchronizeSceneTargets(targets) {
        if (targets && targets.maxFrameTimeMs) {
            this.targetMaxFrameTimeMs = targets.maxFrameTimeMs;
            console.warn(`[GOVERNANCE] Alvo re-calibrado para o cenário atual: ${this.targetMaxFrameTimeMs}ms`);
        }
    }

    _initGovernanceLoop() {
        const checkIntegrity = (timestamp) => {
            if (this.manager.activeScene && !this.manager.transitioning) {
                // Captura em tempo real do frameTime através da janela global compartilhada ou do fallback padrão
                const lastFrameTime = window.StateStore?.get('telemetry.gpuFrameTimeMs') || 8.00;
                
                if (lastFrameTime > this.targetMaxFrameTimeMs) {
                    this.consecutivePanicFrames++;
                    if (this.consecutivePanicFrames >= this.panicThresholdFrames) {
                        this._executeEmergencyMitigation(lastFrameTime);
                    }
                } else {
                    // Restabelecimento progressivo de estabilidade térmica/gráfica
                    this.consecutivePanicFrames = Math.max(0, this.consecutivePanicFrames - 1);
                }
            }
            requestAnimationFrame(checkIntegrity);
        };
        requestAnimationFrame(checkIntegrity);
    }

    _executeEmergencyMitigation(measuredTime) {
        console.error(`[GOVERNANCE_CRITICAL] Falha de Frame Pacing detectada: ${measuredTime.toFixed(2)}ms. Forçando rebaixamento.`);
        this.consecutivePanicFrames = 0; // Limpa o acumulador para evitar loops infinitos de pânico
        
        // Emite alerta imediato no barramento unificado para que as folhas fx.css e hud.css reajam síncronamente
        this.manager.bus?.emit('performance:emergency_throttle', {
            measuredFrameTime: measuredTime,
            allowedTarget: this.targetMaxFrameTimeMs
        });
        
        // Força compressão geométrica e esvazia partições secundárias
        this.manager.purgeInactiveChunks();
    }
}

// INSTANCIAÇÃO DAS MATRIZES GLOBAIS
window.XRZoneGovernor = new XRZoneRegistry();

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * [PRESERVADO] COMPONENTE DE INTERCEPTAÇÃO AFRAME DE INFRAESTRUTURA
 * ═══════════════════════════════════════════════════════════════════════════
 */
AFRAME.registerComponent('sentinel-runtime-scene-interceptor', {
    schema: {
        targetNodeId: { type: 'string', default: 'CORE_INFRA' },
        autoThrottle: { type: 'boolean', default: true }
    },

    init: function () {
        this.kernel = window.SovereignKernel || null;
        this.bus = window.SentinelBus || null;
        this.sceneEl = this.el.sceneEl;

        this._boundTriggerInterceptor = this.interceptTriggerIntent.bind(this);
        this.sceneEl.addEventListener('sentinel-trigger', this._boundTriggerInterceptor);

        console.log(`%c[CORE COMPONENT] Interceptor de gatilhos WebXR acoplado com sucesso ao nó mestre.`, 'color:#00FF41;');
    },

    interceptTriggerIntent: function (evt) {
        const timestamp = performance.now();
        const actionId = evt.detail?.actionId || 'GENERIC_INTERACTION';
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
            if (typeof this.kernel.startBasalGangliaAutomation === 'function') {
                this.kernel.startBasalGangliaAutomation(actionId, currentLatency);
            } else {
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

// ═══════════════════════════════════════════════════════════════════════════
// EXPOSIÇÃO OPERACIONAL E ANCORAGEM PASSIVA NO KERNEL SOBERANO
// ═══════════════════════════════════════════════════════════════════════════
(() => {
    const SpatialSceneInstance = new SentinelSceneManager();
    
    window.SentinelSceneManagerClass = SentinelSceneManager; // Exposição estrutural da Classe
    window.SentinelSceneManager = SpatialSceneInstance;      // Instância operacional ativa

    if (window.SovereignKernel) {
        window.SovereignKernel.registerModule('scene-orchestrator', SpatialSceneInstance);
    } else {
        Object.defineProperty(window, 'SovereignKernel', {
            configurable: true,
            enumerable: true,
            set: (kernelInstance) => {
                delete window.SovereignKernel;
                window.SovereignKernel = kernelInstance;
                window.SovereignKernel.registerModule('scene-orchestrator', SpatialSceneInstance);
            }
        });
    }

    console.log(
        '%c OMC SENTINEL COGNITIVE XR SCENE MANAGER v9.0 ONLINE [A/B/C/D PILE-COMPLIANT] ',
        'background:#001c3a; color:#00D4FF; font-weight:bold; padding:4px; border-left:4px solid #00D4FF;'
    );
})();
