/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — SOVEREIGN COGNITIVE TOPOLOGY ENGINE (NEUROGRAPH OS)
 * Arquivo: sentinel-neurograph.js
 * Papel: Malha Cognitiva, Grafo Semântico e Ponderação de Relevância Tática
 * Governança: Totalmente subordinado ao SovereignKernel; dita regras de Conectividade.
 * Fix: Refatoração para ESM nativo. Implementação de Semantic Graph, Mission 
 * Topology, Context Links, Memory Relationships, Attention Network e Weighting.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Tipos de Nós Homologados na Infraestrutura Perceptiva
export const NEURO_NODE_TYPES = Object.freeze({
    CONTEXT:   'CONTEXT',   // C) CONTEXT LINKS: Ambientes ativos e estados macro do sistema
    MISSION:   'MISSION',   // B) MISSION TOPOLOGY: Objetivos táticos, tarefas e sub-rotinas
    ATTENTION: 'ATTENTION', // E) ATTENTION NETWORK: Elementos capturados sob foco retiniano
    MEMORY:    'MEMORY',    // D) MEMORY RELATIONSHIPS: Snapshots, registros e dados estáveis
    ENTITY:    'ENTITY'     // Elementos de interface física, shaders ou objetos tridimensionais
});

// Tipos de Conexões Relacionais (Sinapses)
export const NEURO_EDGE_TYPES = Object.freeze({
    COMPLEMENTS: 'COMPLEMENTS', // Conexão associativa livre entre nós adjacentes
    DEPENDS_ON:  'DEPENDS_ON',  // Vínculo estrito de precedência estrutural ou hierárquica
    REINFORCES:  'REINFORCES',  // Modulador positivo de peso atencional cruzado
    SUPPRESSES:  'SUPPRESSES'   // Modulador negativo para inibição colateral de ruído
});

class NeuroNode {
    constructor(id, type, baseWeight = 1.0) {
        this.id = id;
        this.type = type;
        this.baseWeight = baseWeight;
        this.currentActivation = baseWeight; // Energia sináptica volátil (0.0 a 2.0+)
        this.lastActivationTimestamp = performance.now();
    }
}

class NeuroEdge {
    constructor(sourceId, targetId, relationType, initialStrength = 0.5) {
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.relationType = relationType;
        this.strength = initialStrength; // Multiplicador de transferência de energia (0.0 a 1.0)
    }
}

class SentinelNeuroGraphEngine {
    constructor() {
        this.version = "9.0-COGNITIVE-MESH";
        this.isActive = false;

        // A) SEMANTIC GRAPH CORE ARRAYS
        this.nodes = new Map();
        this.edges = new Map(); // Chave composta: "sourceId->targetId"

        // Configurações metabólicas de dissipação de energia (Plasticidade Neural)
        this.plasticity = {
            decayRatePerSec: 0.05,       // Perda natural de ativação de nós não estimulados
            propagationDamping: 0.65,    // Fator de perda de energia ao saltar sinapses
            maxActivationCeiling: 2.5    // Evita saturação infinita e loops recursivos de feedback
        };

        this.bus = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // A) SEMANTIC GRAPH GRAPH MANIPULATION HANDLERS
    // ═══════════════════════════════════════════════════════════════════════
    addNode(id, type, baseWeight = 1.0) {
        if (!NEURO_NODE_TYPES[type]) {
            this._trace('GRAPH', `Tipo de nó desconhecido omitido: [${type}]`, 'WARN');
            return null;
        }
        const node = new NeuroNode(id, type, baseWeight);
        this.nodes.set(id, node);
        return node;
    }

    addEdge(sourceId, targetId, relationType, strength = 0.5) {
        if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
            return false; // Bloqueia sinapses órfãs na malha
        }
        const edgeId = `${sourceId}->${targetId}`;
        const edge = new NeuroEdge(sourceId, targetId, relationType, strength);
        this.edges.set(edgeId, edge);
        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PARADIGMAS ABSTRATOS DE INFRAESTRUTURA (B, C, D, E)
    // ═══════════════════════════════════════════════════════════════════════
    
    // B) MISSION TOPOLOGY: Monta a árvore de objetivos e nós subordinados de tarefas
    buildMissionTopology(rootMissionId, stepIdsArray) {
        this.addNode(rootMissionId, NEURO_NODE_TYPES.MISSION, 1.2);
        
        stepIdsArray.forEach((stepId, index) => {
            this.addNode(stepId, NEURO_NODE_TYPES.MISSION, 1.0);
            // Cada passo depende do cumprimento do nó de missão central
            this.addEdge(stepId, rootMissionId, NEURO_EDGE_TYPES.DEPENDS_ON, 0.9);
            
            // Cria link sequencial linear de progresso se houver passo prévio
            if (index > 0) {
                this.addEdge(stepIdsArray[index - 1], stepId, NEURO_EDGE_TYPES.COMPLEMENTS, 0.5);
            }
        });
        this._trace('TOPOLOGY', `Mission Topology selada para [${rootMissionId}] com ${stepIdsArray.length} sub-etapas.`);
    }

    // C) CONTEXT LINKS: Vincula o estado operacional macro às entidades visíveis
    establishContextLink(contextStateId, entityId, relation = NEURO_EDGE_TYPES.COMPLEMENTS) {
        this.addNode(contextStateId, NEURO_NODE_TYPES.CONTEXT, 1.0);
        this.addEdge(contextStateId, entityId, relation, 0.7);
    }

    // D) MEMORY RELATIONSHIPS: Conecta dumps estáveis a nós voláteis do runtime
    bindMemoryRelationship(memorySnapshotId, activeNodeId, cognitiveRelevance = 0.6) {
        this.addNode(memorySnapshotId, NEURO_NODE_TYPES.MEMORY, 0.8);
        this.addEdge(activeNodeId, memorySnapshotId, NEURO_EDGE_TYPES.REINFORCES, cognitiveRelevance);
    }

    // E) ATTENTION NETWORK: Sincroniza vetores focais retinianos diretamente na malha topológica
    injectAttentionNetworkPulse(focusedNodeId, focusIntensity = 1.0) {
        let node = this.nodes.get(focusedNodeId);
        if (!node) {
            // Criação reativa imediata se o nó atencional não existia no grafo
            node = this.addNode(focusedNodeId, NEURO_NODE_TYPES.ATTENTION, 1.0);
        }

        // Bombeia energia cinética direta no nó foveal ativo
        node.currentActivation = Math.min(this.plasticity.maxActivationCeiling, node.currentActivation + focusIntensity);
        node.lastActivationTimestamp = performance.now();

        // F) PRIORITY WEIGHTING: Propaga o pulso energético pelas sinapses vizinhas
        this._propagateActivation(focusedNodeId, focusIntensity * this.plasticity.propagationDamping, new Set());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // F) PRIORITY WEIGHTING (ALGORITMO MATRICIAL DE PROPAGAÇÃO E DISSIPAÇÃO)
    // ═══════════════════════════════════════════════════════════════════════
    _propagateActivation(sourceId, energy, visitedSet) {
        if (energy < 0.08 || visitedSet.has(sourceId)) return; // Critério de parada de atenuação ou loop
        visitedSet.add(sourceId);

        for (const [edgeId, edge] of this.edges.entries()) {
            if (edge.sourceId === sourceId) {
                const targetNode = this.nodes.get(edge.targetId);
                if (!targetNode) continue;

                let effectiveEnergy = energy * edge.strength;

                // Regras semânticas estritas baseadas no tipo de vínculo lógico
                if (edge.relationType === NEURO_EDGE_TYPES.SUPPRESSES) {
                    // Inibição colateral: drena a energia do nó vizinho (Filtro de distrações)
                    targetNode.currentActivation = Math.max(0.0, targetNode.currentActivation - effectiveEnergy);
                } else if (edge.relationType === NEURO_EDGE_TYPES.REINFORCES) {
                    // Ressonância sináptica: amplifica a transferência de relevância
                    targetNode.currentActivation = Math.min(this.plasticity.maxActivationCeiling, targetNode.currentActivation + (effectiveEnergy * 1.3));
                } else {
                    // Transferência complementar nominal
                    targetNode.currentActivation = Math.min(this.plasticity.maxActivationCeiling, targetNode.currentActivation + effectiveEnergy);
                }

                // Propagação recursiva atenuada em profundidade
                this._propagateActivation(edge.targetId, effectiveEnergy * this.plasticity.propagationDamping, visitedSet);
            }
        }
    }

    /**
     * Ciclo metabólico contínuo executado por batimento cardíaco físico (rAnimationFrame / Core Loop)
     * Realiza a reabsorção natural de energia para evitar o transbordo da memória cognitiva.
     */
    maintainCognitiveEquilibrium() {
        if (!this.isActive) return;

        const now = performance.now();
        
        for (const [id, node] of this.nodes.entries()) {
            // Ignora nós de missão estáveis para preservar a topologia dos objetivos do usuário
            if (node.type === NEURO_NODE_TYPES.MISSION) continue;

            const timeElapsedSec = (now - node.lastActivationTimestamp) / 1000;
            if (timeElapsedSec > 0.5) {
                // Dissipação linear ponderada em direção ao peso base original do nó
                const decay = this.plasticity.decayRatePerSec * timeElapsedSec;
                node.currentActivation = Math.max(node.baseWeight, node.currentActivation - decay);
            }

            // Injeção de variáveis de renderização cruzadas se o nó corresponder a um elemento DOM real
            this._projectWeightToInterfaceTokens(node);
        }
    }

    _projectWeightToInterfaceTokens(node) {
        const element = document.getElementById(node.id);
        if (!element) return;

        // Injeta o peso cognitivo normalizado diretamente como token CSS estrutural
        // Shaders WebGL2 ou renderizadores HUD leem essa variável nativamente
        const normalizedWeight = Math.min(2.0, node.currentActivation).toFixed(2);
        element.style.setProperty('--cognitive-mesh-weight', normalizedWeight);

        // Se o nó estiver inibido/zerado pela rede de supressão colateral, força ocultação semântica
        if (node.currentActivation < 0.2) {
            element.classList.add('hud-mesh-suppressed');
        } else {
            element.classList.remove('hud-mesh-suppressed');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LIFECYCLE E HANDSHAKES DO BARRAMENTO
    // ═══════════════════════════════════════════════════════════════════════
    initializeEngine() {
        this.isActive = true;
        this._trace('LIFECYCLE', 'Plasticidade neural e malha de topologia integradas ao barramento.');
    }

    shutdownEngine() {
        this.isActive = false;
        this.nodes.clear();
        this.edges.clear();
    }

    _trace(subsystem, message, level = 'INFO') {
        const formatted = `[${new Date().toISOString()}] [NEURO-GRAPH:${subsystem}] [${level}] ${message}`;
        if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
        else if (level === 'WARN') console.warn(formatted);
        else console.log(formatted);
    }

    _attachSignalBus(busInstance) {
        this.bus = busInstance;

        // Escuta o movimento do olhar para injetar pulsos elétricos de relevância atencional
        this.bus.on('xr:gaze_moved', (data) => {
            if (data && data.target) {
                this.injectAttentionNetworkPulse(data.target, data.urgency || 1.0);
            }
        });

        // Quando o cofre de memória recupera o estado pós-falha, vincula as relações estáveis na malha
        this.bus.on('memory:state_recovered', (evt) => {
            this.bindMemoryRelationship(`SNAPSHOT_RECOVERY_${evt.ts}`, 'SYSTEM_ROOT', 0.9);
            this._trace('SYNAPSE', 'Sinapses estáveis de recuperação injetadas na malha de prioridades.');
        });
    }
}

// Instanciação e exposição única em total conformidade com o ecossistema v9.0
const SovereignNeuroGraph = new SentinelNeuroGraphEngine();
window.SentinelNeuroGraph = SovereignNeuroGraph;

export default SovereignNeuroGraph;
