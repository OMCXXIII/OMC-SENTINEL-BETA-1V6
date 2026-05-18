/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE SPATIAL INTEGRITY & XR RUNTIME ENGINE
 * Arquivo: js_sentinel_engine-xr.js
 * Papel: Runtime Espacial Cognitivo, Grafo de Cena e Estabilização Vestibular
 * Governança: Subordinado ao SovereignKernel; sincroniza com o SovereignRenderer.
 * Fix: Implementação de Scene Graph Tridimensional, XR Zones Dinâmicas,
 * Node Lifecycle Hooks, Attention Rendering, Occlusion Culling e XR Recovery.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// B) XR ZONES: Zoneamento Geométrico Estrito para Alocação de Atenção e Presença
export const XR_ZONES = Object.freeze({
    FOCUS:     'FOCUS',     // Matriz tátil tridimensional imediata de alta acuidade visual
    SAFE:      'SAFE',      // HUD estabilizado e travado no espaço de cabeça (Head-locked)
    IMMERSION: 'IMMERSION'  // Volume ambiental e skyboxes de baixa frequência de atualização
});

// C) NODE LIFECYCLE: Estados de Processamento e Renderização de Entidades Espaciais
export const NODE_STATES = Object.freeze({
    UNLOADED:  'UNLOADED',
    INSTANTIATED: 'INSTANTIATED',
    ACTIVE:    'ACTIVE',
    OCCLUDED:  'OCCLUDED',
    DESTROYED: 'DESTROYED'
});

// A) SCENE GRAPH COMPONENTS: Classe de Nó Base Tridimensional
class SpatialNode {
    constructor(id, zone = XR_ZONES.FOCUS) {
        this.id = id;
        this.zone = zone;
        this.state = NODE_STATES.UNLOADED;
        
        // Atributos Espaciais (Vetores de Transformação)
        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0, w: 1 };
        this.scale = { x: 1, y: 1, z: 1 };
        
        this.parent = null;
        this.children = new Map();
        
        // D) ATTENTION RENDERING METRICS
        this.salienceScore = 1.0;
        this.isCulled = false;
        
        // Bounding Box Simples para E) OCCLUSION CULLING
        this.boundingBox = { radius: 1.0 };
    }

    addChild(node) {
        node.parent = this;
        node.state = NODE_STATES.INSTANTIATED;
        this.children.set(node.id, node);
    }

    removeChild(id) {
        const node = this.children.get(id);
        if (node) {
            node.parent = null;
            node.state = NODE_STATES.DESTROYED;
            this.children.delete(id);
            return true;
        }
        return false;
    }
}

class SentinelSpatialCognitiveRuntime {
    constructor() {
        this.version = "9.0-SPATIAL-COGNITIVE";
        this.isActive = false;

        // A) SCENE GRAPH ROOT NODE
        this.rootNode = new SpatialNode('ROOT_UNIVERSE', XR_ZONES.IMMERSION);

        // F) ADAPTIVE RESOLUTION CONTROLLER
        this.resolution = {
            viewportMultiplier: 1.0,
            targetGpuFrameTimeMs: 11.11, // Teto máximo normativo para amostragem limpa a 90Hz
            consecutiveDroppingFrames: 0
        };

        // G) XR RECOVERY & H) FRAME SAFE MODE CONTROLS
        this.recoveryMode = {
            isStabilizing: false,
            blackoutTriggered: false,
            frameDropThreshold: 5,
            safetyClockActive: false
        };

        this.bus = null;
        this._currentSession = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // A) SCENE GRAPH MANAGEMENT & C) NODE LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════
    registerSpatialEntity(id, zone, transformData = {}) {
        const node = new SpatialNode(id, zone);
        if (transformData.position) node.position = { ...transformData.position };
        if (transformData.scale) node.scale = { ...transformData.scale };
        if (transformData.radius) node.boundingBox.radius = transformData.radius;

        // Ativação implícita pelo Lifecycle Hook
        node.state = NODE_STATES.ACTIVE;
        this.rootNode.addChild(node);
        this._trace('NODE_LIFECYCLE', `Nó espacial [${id}] instanciado e injetado na zona [${zone}].`);
        return node;
    }

    destroySpatialEntity(id) {
        if (this.rootNode.removeChild(id)) {
            this._trace('NODE_LIFECYCLE', `Nó espacial [${id}] cortado do grafo e movido para purga.`);
            return true;
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // D) ATTENTION RENDERING & E) OCCLUSION CULLING ENGINES
    // ═══════════════════════════════════════════════════════════════════════
    updateSpatialMatrix(gazeVector, hmdPosition) {
        if (!this.isActive) return;

        // Varre o grafo executando testes de relevância espacial e descarte geométrico
        for (const [id, node] of this.rootNode.children.entries()) {
            if (node.state === NODE_STATES.DESTROYED) continue;

            // D) ATTENTION RENDERING: Calcula proximidade angular com a fóvea ocular (Gaze)
            const dotProduct = this._calculateGazeProximity(node.position, gazeVector, hmdPosition);
            node.salienceScore = Math.max(0.1, dotProduct);

            // B) XR ZONES: Repassa o coeficiente adaptativo com base na criticidade da área
            if (node.zone === XR_ZONES.SAFE) {
                node.salienceScore = 1.0; // Isola o HUD de degradação atencional
            }

            // E) OCCLUSION CULLING: Descarte preemptivo na CPU se estiver fora do ângulo visível do HMD
            if (dotProduct < 0.25 && node.zone !== XR_ZONES.SAFE) {
                if (node.state !== NODE_STATES.OCCLUDED) {
                    node.state = NODE_STATES.OCCLUDED;
                    node.isCulled = true;
                    this._trace('CULLING', `Entidade [${id}] ocultada preemptivamente por desvio de fóvea.`);
                    
                    // Notifica o renderer central para abortar desenho deste ID nas filas
                    if (window.SovereignRenderer) window.SovereignRenderer.setOcclusionState(id, true);
                }
            } else {
                if (node.state === NODE_STATES.OCCLUDED) {
                    node.state = NODE_STATES.ACTIVE;
                    node.isCulled = false;
                    if (window.SovereignRenderer) window.SovereignRenderer.setOcclusionState(id, false);
                }
            }
        }
    }

    _calculateGazeProximity(nodePos, gazeVec, hmdPos) {
        if (!gazeVec || !hmdPos) return 1.0;
        
        // Vetor HMD para a Entidade
        const targetVec = {
            x: nodePos.x - hmdPos.x,
            y: nodePos.y - hmdPos.y,
            z: nodePos.z - hmdPos.z
        };
        const mag = Math.sqrt(targetVec.x**2 + targetVec.y**2 + targetVec.z**2) || 1.0;
        const normTarget = { x: targetVec.x / mag, y: targetVec.y / mag, z: targetVec.z / mag };

        // Produto escalar entre o vetor do olhar e a direção do objeto
        return Math.max(0, (normTarget.x * gazeVec.x) + (normTarget.y * gazeVec.y) + (normTarget.z * gazeVec.z));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // F) ADAPTIVE RESOLUTION CONTROLLER (PIPELINE ANTI-GARGALO)
    // ═══════════════════════════════════════════════════════════════════════
    evaluateHardwareStress(measuredFrameTimeMs) {
        if (measuredFrameTimeMs > this.resolution.targetGpuFrameTimeMs) {
            this.resolution.consecutiveDroppingFrames++;
            
            // Se houver 3 quedas consecutivas de renderização, aciona mitigação imediata
            if (this.resolution.consecutiveDroppingFrames >= 3) {
                this.resolution.viewportMultiplier = Math.max(0.45, this.resolution.viewportMultiplier - 0.10);
                this.resolution.consecutiveDroppingFrames = 0;
                
                if (window.SovereignRenderer) {
                    window.SovereignRenderer.setResolutionScale(this.resolution.viewportMultiplier);
                }
                this._trace('ADAPTIVE_RES', `Saturação detectada. Forçando compressão de viewport para: ${(this.resolution.viewportMultiplier*100).toFixed(0)}%`);
            }
        } else {
            // Recuperação gradativa lenta
            if (this.resolution.viewportMultiplier < 1.0 && measuredFrameTimeMs < this.resolution.targetGpuFrameTimeMs * 0.7) {
                this.resolution.viewportMultiplier = Math.min(1.0, this.resolution.viewportMultiplier + 0.02);
                if (window.SovereignRenderer) {
                    window.SovereignRenderer.setResolutionScale(this.resolution.viewportMultiplier);
                }
            }
            this.resolution.consecutiveDroppingFrames = 0;
        }

        // H) FRAME SAFE MODE INTERCEPT
        if (measuredFrameTimeMs > 22.22) { // Tempo correspondente a queda abaixo de 45FPS
            this._triggerFrameSafeClock();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // G) XR RECOVERY & H) FRAME SAFE MODE (PROTEÇÃO VESTIBULAR MÁXIMA)
    // ═══════════════════════════════════════════════════════════════════════
    _triggerFrameSafeClock() {
        if (this.recoveryMode.safetyClockActive) return;
        this.recoveryMode.safetyClockActive = true;
        
        this._trace('FRAME_SAFE', 'ALERTA: Desassociação vestibular iminente. Congelando buffers estáticos secundários.', 'WARN');
        
        // Muta o perfil global do scheduler de tempo para isolar processos paralelos
        if (window.SovereignTemporalScheduler) {
            window.SovereignTemporalScheduler.suspendTask('core-memory-flush');
        }
    }

    triggerEmergencySpatialRecovery() {
        if (this.recoveryMode.blackoutTriggered) return;
        this.recoveryMode.blackoutTriggered = true;
        this.recoveryMode.isStabilizing = true;

        this._trace('XR_RECOVERY', 'COLAPSO DE SUBMÓDULO GRÁFICO XR DETECTADO. Forçando Blackout Tático para mitigar náusea severa.', 'CRITICAL');

        // Cria overlay visual absoluto de opacidade preta opaca para cortar o flicker de hardware
        const recoveryScreen = document.createElement('div');
        recoveryScreen.id = 'sentinel-xr-blackout-mask';
        recoveryScreen.style = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:#000000; z-index:999999; display:flex; align-items:center; justify-content:center; color:#FF3E3E; font-family:monospace;';
        recoveryScreen.innerHTML = '<div>[XR_VESTIBULAR_SHIELD_ACTIVE] <br> RECONECTANDO CLOCK ESPACIAL...</div>';
        document.body.appendChild(recoveryScreen);

        // Força downscaling imediato e reconexão de hardware limpa
        setTimeout(() => {
            this.resolution.viewportMultiplier = 0.5;
            this.recoveryMode.blackoutTriggered = false;
            this.recoveryMode.isStabilizing = false;
            this.recoveryMode.safetyClockActive = false;
            
            const mask = document.getElementById('sentinel-xr-blackout-mask');
            if (mask) mask.remove();
            
            if (window.SovereignTemporalScheduler) window.SovereignTemporalScheduler.resumeTask('core-memory-flush');
            this._trace('XR_RECOVERY', 'Malha de orientação espacial reestabelecida. Retornando viewport com clock estável.');
        }, 1500);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ORCHESTRATION HANDSHAKES
    // ═══════════════════════════════════════════════════════════════════════
    bindXRSession(xrSession) {
        this._currentSession = xrSession;
        this.isActive = true;
        
        if (window.SovereignRenderer) {
            window.SovereignRenderer.configureXRPath(true, { left: {}, right: {} });
        }
        this._trace('LIFECYCLE', 'Sessão WebXR amarrada com sucesso ao grafo de cena cognitivo.');
    }

    unbindXRSession() {
        this.isActive = false;
        this._currentSession = null;
        
        if (window.SovereignRenderer) {
            window.SovereignRenderer.configureXRPath(false);
        }
        this._trace('LIFECYCLE', 'Sessão WebXR abortada. Grafo de cena retornado para modo ocioso.');
    }

    _trace(subsystem, message, level = 'INFO') {
        const formatted = `[${new Date().toISOString()}] [ENGINE-XR:${subsystem}] [${level}] ${message}`;
        if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
        else if (level === 'WARN') console.warn(formatted);
        else console.log(formatted);
    }

    _attachSignalBus(busInstance) {
        this.bus = busInstance;

        this.bus.on('xr:session_start', (session) => this.bindXRSession(session));
        this.bus.on('xr:session_end', () => this.unbindXRSession());
        
        // Escuta telemetria do agendador para medir o tempo de execução do quadro
        this.bus.on('shader:metrics-update', (metrics) => {
            if (metrics && metrics.loadMs) {
                this.evaluateHardwareStress(metrics.loadMs);
            }
        });
    }
}

// Instanciação e exposição única na infraestrutura do ecossistema
const SovereignEngineXR = new SentinelSpatialCognitiveRuntime();
window.SentinelEngineXR = SovereignEngineXR;

export default SovereignEngineXR;
