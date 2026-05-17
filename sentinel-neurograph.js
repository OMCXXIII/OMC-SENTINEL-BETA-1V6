/**
 * ============================================================================
 * SENTINEL CORE RUNTIME ARCHITECTURE
 * Module: sentinel-neurograph.js
 * Role: Cognitive Topology Operating System (Sovereign Topology Engine)
 * Design Aesthetic: Non-Linear Graph Determinism & Adaptive Synaptic Plasticity
 * ============================================================================
 */

// 3. GRAPH NODE TYPES (Geografia de Entidades Cognitivas)
const NODE_TYPES = {
  CONTEXT:   'CONTEXT',   // Contexto operacional ativo e macro-cenários
  MISSION:   'MISSION',   // Missões, diretrizes centrais e objetivos táticos
  ATTENTION: 'ATTENTION', // Nós sob foco foveal ou supressão periférica
  MEMORY:    'MEMORY',    // Registros episódicos ou persistentes (L1/L2/L3)
  SPATIAL:   'SPATIAL',   // Vetores, zonas e matrizes de presença WebXR
  ENTITY:    'ENTITY',    // Objetos tridimensionais, nós de interface ou elementos lógicos
  EVENT:     'EVENT'      // Ocorrências críticas, exceções e gatilhos estruturais
};

// 4. EDGE RELATIONSHIP TYPES
const EDGE_TYPES = {
  RELATED_TO:     'RELATED_TO',
  DEPENDS_ON:     'DEPENDS_ON',
  FOCUSES_ON:     'FOCUSES_ON',
  ORIGINATED_FROM:'ORIGINATED_FROM',
  LINKED_TO:      'LINKED_TO',
  SUPPRESSES:     'SUPPRESSES',
  ACTIVATES:      'ACTIVATES'
};

// 24. MODE-AWARE NEUROGRAPH PROFILES
const NEURO_PROFILES = {
  NORMAL:    'NORMAL',    // Malha topológica completa operando em equilíbrio nominal
  FOCUS:     'FOCUS',     // Estreitamento drástico; suprime caminhos periféricos irrelevantes
  XR:        'XR',        // Prioridade absoluta à topologia espacial e transformações tridimensionais
  EMERGENCY: 'EMERGENCY'  // Isolamento de segurança: Nós de missão e eventos absorvem o tráfego sináptico
};

class SentinelNeurograph {
  constructor() {
    this.version = '1.0.0';
    this.isActive = true;
    this.currentProfile = NEURO_PROFILES.NORMAL;

    // 1. NEUROGRAPH CORE
    this.graph = {
      nodes: new Map(),       // Armazenamento de nós: id -> node
      edges: new Map(),       // Armazenamento de arestas: edgeId -> edge
      contexts: new Map(),    // Indexador rápido de contextos operacionais
      activeTopology: 'ROOT'
    };

    // 5. COGNITIVE TOPOLOGY SYSTEM
    this.topology = { activeRegions: new Set(), cognitiveDensity: 0.0, semanticClusters: [] };

    // 6. ATTENTION GRAPH
    this.attentionGraph = { activeFocus: null, peripheralContexts: [], suppressedContexts: [] };

    // 7. MEMORY LINK ENGINE
    this.memoryLinks = { episodic: [], contextual: [], missionBased: [], spatial: [] };

    // 8. MISSION GRAPH SYSTEM
    this.missions = { active: [], dependencies: new Map(), objectives: [], urgency: 0.0 };

    // 9. INTENT TOPOLOGY ENGINE
    this.intent = { predictedPaths: [], interactionTrajectories: [], cognitiveDirection: { x: 0, y: 0, z: 0 } };

    // 10. TEMPORAL GRAPH LAYER
    this.temporal = { timelines: [], decayRate: 0.02, persistenceThreshold: 0.1, activationHistory: [] };

    // 11. SPATIAL CONTEXT GRAPH
    this.spatial = { xrZones: [], spatialMemory: new Map(), immersionRegions: [] };

    // 16. GRAPH ACTIVATION ENGINE & 28. SEMANTIC FIELD ENGINE
    this.semanticField = { activationMap: new Map(), densityField: 0.0, relevanceGradient: 0.0 };

    // 19. GRAPH TELEMETRY METRICS
    this.metrics = { activeNodes: 0, graphDensity: 0.0, semanticLoad: 0.0, contextSpread: 0.0 };

    // 26. MULTI-DOMAIN GRAPH SYSTEM
    this.domains = { xr: 'XR_DOM', mission: 'MSN_DOM', memory: 'MEM_DOM', attention: 'ATT_DOM', diagnostics: 'DIA_DOM', interface: 'UI_DOM' };

    // 27. IMMERSION GRAPH LAYER
    this.immersion = { spatialMeaning: true, environmentalRelationships: new Map(), presenceTopology: 'STABLE' };

    // 30. FUTURE NEURAL COMPUTE PREPARATION
    this.neuralCompute = { semanticPrediction: null, topologyOptimization: true, relevanceForecasting: false };

    this._initializeNeurograph();
  }

  // ==========================================================================
  // 1. CORE OPERATIONAL INJECTION & NODE/EDGE SYSTEM
  // ==========================================================================

  registerNode(id, type, config = {}) {
    this.safeGraph(() => {
      if (!NODE_TYPES[type]) throw new Error(`[INVALID_NODE_TYPE]: ${type}`);

      // 3. GRAPH NODE STRUCTURE
      const node = {
        id,
        type,
        weight: config.weight || 1.0,               // 12. Semantic Weight System
        context: config.context || 'GLOBAL',
        salience: config.salience || 0.5,
        temporalState: { lastActivated: performance.now(), lifespan: config.lifespan || -1 },
        spatialState: config.spatialState || { x: 0, y: 0, z: 0 },
        activation: config.activation || 0.5        // Nível de energia na consciência operacional
      };

      this.graph.nodes.set(id, node);
      this.traceNode(`Nó cognitivo registrado com sucesso: [${id}] do tipo [${type}]`);
    });
  }

  registerEdge(source, target, type, strength = 1.0, persistence = 1.0) {
    this.safeGraph(() => {
      if (!this.graph.nodes.has(source) || !this.graph.nodes.has(target)) {
        this.traceGraph(`Tentativa abortada: Origem [${source}] ou Destino [${target}] inexistentes.`, 'WARN');
        return;
      }

      if (!EDGE_TYPES[type]) throw new Error(`[INVALID_EDGE_TYPE]: ${type}`);
      const edgeId = `${source}->${type}->${target}`;

      // 4. EDGE RELATIONSHIP STRUCTURE
      const edge = { source, target, strength, type, persistence, activation: 1.0 };
      this.graph.edges.set(edgeId, edge);
    });
  }

  // ==========================================================================
  // 13. RELEVANCE PROPAGATION ENGINE & 16. ACTIVATION ENGINE
  // ==========================================================================

  propagateRelevance(triggerNodeId, surgeIntensity = 0.5) {
    this.safeGraph(() => {
      const visited = new Set();
      const queue = [{ id: triggerNodeId, force: surgeIntensity }];

      this.tracePropagation(`Disparando onda expansiva de relevância semântica a partir de: [${triggerNodeId}]`);

      // Algoritmo de propagação por difusão atenuada (BFS adaptativo sobre pesos das arestas)
      while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current.id) || current.force < 0.05) continue;
        visited.add(current.id);

        const node = this.graph.nodes.get(current.id);
        if (node) {
          // Incrementa ativação do nó baseado na força propagada residual
          node.activation = Math.min(1.0, node.activation + current.force);
          node.weight = Math.min(2.0, node.weight + (current.force * 0.5));

          // Chaveamento reflexo caso receba pulsos de supressão atenuante
          this._evaluateNodeSuppressionDynamics(node);
        }

        // Propaga para os vizinhos conectados por arestas ativas
        this.graph.edges.forEach((edge) => {
          if (edge.source === current.id) {
            const attenuation = edge.type === EDGE_TYPES.SUPPRESSES ? -0.4 : 0.7;
            const nextForce = current.force * edge.strength * Math.abs(attenuation);
            queue.push({ id: edge.target, force: nextForce });
          }
        });
      }
    });
  }

  _evaluateNodeSuppressionDynamics(node) {
    if (this.currentProfile === NEURO_PROFILES.FOCUS && node.weight < 0.4) {
      this.deactivateNode(node.id);
    }
  }

  activateNode(id) {
    const node = this.graph.nodes.get(id);
    if (node) {
      node.activation = 1.0;
      node.temporalState.lastActivated = performance.now();
      this.semanticField.activationMap.set(id, 1.0);
    }
  }

  deactivateNode(id) {
    const node = this.graph.nodes.get(id);
    if (node) {
      node.activation = 0.0;
      this.semanticField.activationMap.set(id, 0.0);
    }
  }

  // ==========================================================================
  // 15. COGNITIVE QUERY ENGINE & 17. COGNITIVE COMPRESSION
  // ==========================================================================

  queryGraph(criteria = {}) {
    // Retorna os nós mais vitais filtrados pela projeção e relevância operacional imediata
    const results = [];
    this.graph.nodes.forEach((node) => {
      let match = true;
      if (criteria.type && node.type !== criteria.type) match = false;
      if (criteria.context && node.context !== criteria.context) match = false;
      if (criteria.minActivation && node.activation < criteria.minActivation) match = false;

      if (match) results.push(node);
    });

    // Ordena por peso semântico e ativação combinados (O que merece atenção AGORA)
    return results.sort((a, b) => (b.weight * b.activation) - (a.weight * a.activation));
  }

  compressGraph() {
    this.safeGraph(() => {
      let purgeCount = 0;
      this.graph.nodes.forEach((node, id) => {
        // Purga nós transientes cuja ativação faliu e decaiu abaixo do limiar estrito de obsolescência
        if (node.activation < this.temporal.persistenceThreshold && node.type === NODE_TYPES.EVENT) {
          this._severAssociatedEdges(id);
          this.graph.nodes.delete(id);
          this.semanticField.activationMap.delete(id);
          purgeCount++;
        }
      });
      if (purgeCount > 0) this.traceGraph(`Compressão cognitiva executada. [${purgeCount}] nós redundantes evaporados.`);
    });
  }

  _severAssociatedEdges(nodeId) {
    this.graph.edges.forEach((edge, edgeId) => {
      if (edge.source === nodeId || edge.target === nodeId) {
        this.graph.edges.delete(edgeId);
      }
    });
  }

  // ==========================================================================
  // 18. ADAPTIVE NEUROPLASTICITY (Evolução e Modulação de Sinapses)
  // ==========================================================================

  adaptRelationships(deltaTime) {
    // 10. Temporal Decay Applied to Networks
    this.graph.nodes.forEach((node) => {
      if (node.activation > 0.0) {
        node.activation = Math.max(0.0, node.activation - (this.temporal.decayRate * deltaTime));
      }
    });

    this.graph.edges.forEach((edge, edgeId) => {
      const src = this.graph.nodes.get(edge.source);
      const dst = this.graph.nodes.get(edge.target);

      if (src && dst) {
        // Regra Hebbiana Adaptada: Conexões entre nós simultaneamente ativos se fortalecem
        if (src.activation > 0.6 && dst.activation > 0.6) {
          edge.strength = Math.min(2.0, edge.strength + (0.05 * deltaTime));
        } else {
          // Depressão de longo termo por desuso ou desconexão temporal
          edge.strength = Math.max(0.1, edge.strength - (0.01 * deltaTime));
        }
      }
    });
  }

  // ==========================================================================
  // 14. CONTEXT PERSISTENCE & 23. SNAPSHOT SYSTEM
  // ==========================================================================

  persistContext() {
    if (typeof window.StateStore === 'undefined') return;
    
    const serializedNodes = Array.from(this.graph.nodes.entries());
    const serializedEdges = Array.from(this.graph.edges.entries());

    window.StateStore.set('neurograph.snapshot_nodes', serializedNodes);
    window.StateStore.set('neurograph.snapshot_edges', serializedEdges);
    this.traceContext('Topologia semântica congelada e espelhada no barramento persistente.');
  }

  snapshotGraph() {
    return {
      nodes: new Map(this.graph.nodes),
      edges: new Map(this.graph.edges),
      profile: this.currentProfile,
      timestamp: Date.now()
    };
  }

  restoreSnapshot(snapshot) {
    if (!snapshot) return;
    this.graph.nodes = new Map(snapshot.nodes);
    this.graph.edges = new Map(snapshot.edges);
    this.currentProfile = snapshot.profile;
    this.traceGraph('Topologia relacional restaurada via snapshot molecular.');
  }

  // ==========================================================================
  // 29. COGNITIVE EQUILIBRIUM ENGINE (Loop de Regulação Cibernética)
  // ==========================================================================

  maintainCognitiveEquilibrium() {
    const now = performance.now();
    const deltaTime = (now - this._lastPulseTime) / 1000;
    this._lastPulseTime = now;

    // 18. Modula sinapses e aplica decaimento Hebbiano baseado no tempo
    this.adaptRelationships(deltaTime);

    // Executa compressão periódica para evitar explosão combinatória ou saturação do grafo
    if (this.graph.nodes.size > 200) {
      this.compressGraph();
    }

    // Calcula métricas estruturais para alimentar a telemetria global do SENTINEL
    this._calculateGraphMetrics();
    
    // 21. Sincronização contínua com os subsistemas adjacentes
    this.synchronizeGraph();
  }

  _calculateGraphMetrics() {
    const totalNodes = this.graph.nodes.size;
    const totalEdges = this.graph.edges.size;

    this.metrics.activeNodes = Array.from(this.graph.nodes.values()).filter(n => n.activation > 0.4).length;
    // Cálculo clássico de densidade topológica para grafos direcionados: E / (V * (V - 1))
    this.metrics.graphDensity = totalNodes > 1 ? totalEdges / (totalNodes * (totalNodes - 1)) : 0.0;
    
    let weightSum = 0;
    this.graph.nodes.forEach(n => weightSum += n.weight * n.activation);
    this.metrics.semanticLoad = weightSum / (totalNodes || 1);
  }

  synchronizeGraph() {
    if (typeof window.StateStore !== 'undefined') {
      window.StateStore.set('telemetry.neuroDensity', this.metrics.graphDensity);
    }

    // Vincula a percepção tridimensional ativa ao mapa relacional do Orquestrador de Atenção
    if (window.SentinelAttention && window.SentinelAttention.attention.activeTarget) {
      const activeFocus = window.SentinelAttention.attention.activeTarget;
      if (this.graph.nodes.has(activeFocus)) {
        this.activateNode(activeFocus);
        this.attentionGraph.activeFocus = activeFocus;
      }
    }
  }

  applyNeuroProfile(mode) {
    this.currentProfile = mode;
    this.traceGraph(`Perfil topológico de processamento alterado para: [${mode}]`);

    if (mode === NEURO_PROFILES.FOCUS) {
      this.temporal.decayRate = 0.08; // Descarta distrações periféricas de forma acelerada
    } else if (mode === NEURO_PROFILES.EMERGENCY) {
      this.graph.nodes.forEach((node) => {
        if (node.type !== NODE_TYPES.MISSION && node.type !== NODE_TYPES.EVENT) {
          this.deactivateNode(node.id); // Força blecaute de nós secundários
        }
      });
    } else {
      this.temporal.decayRate = 0.02;
    }
  }

  // ==========================================================================
  // 22. RECOVERY ENGINE & SAFETY LAYER
  // ==========================================================================

  recoverGraph(reason) {
    this.traceGraph(`Colapso ou corrupção topológica interceptada: ${reason}. Forçando reset molecular de emergência.`, 'CRITICAL');
    this.safeGraph(() => {
      this.graph.nodes.clear();
      this.graph.edges.clear();
      this.semanticField.activationMap.clear();

      // Reconstrói a topologia axiomática elementar necessária para a sobrevivência da consciência do sistema
      this.registerNode('ROOT_CONTEXT', NODE_TYPES.CONTEXT, { weight: 2.0, activation: 1.0 });
      this.registerNode('CORE_MISSION', NODE_TYPES.MISSION, { weight: 2.0, activation: 1.0 });
      this.registerEdge('CORE_MISSION', 'ROOT_CONTEXT', EDGE_TYPES.DEPENDS_ON, 2.0);

      this.applyNeuroProfile(NEURO_PROFILES.NORMAL);
    });
  }

  safeGraph(executionBlock) {
    try {
      executionBlock();
    } catch (error) {
      this.traceGraph(`Camada de segurança isolou falha crônica no grafo: ${error.message}`, 'CRITICAL');
      this.recoverGraph('CRITICAL_DOM_EXPLOSION_EXCEPTION');
    }
  }

  _initializeNeurograph() {
    this.traceGraph('Iniciando Cognitive Topology Operating System (Malhas Relacionais)...', 'INFO');

    // Injeta os axiomas estruturais padrão do SENTINEL
    this.registerNode('GLOBAL_CONTEXT', NODE_TYPES.CONTEXT, { weight: 1.0, activation: 1.0 });
    this.registerNode('MAIN_MISSION', NODE_TYPES.MISSION, { weight: 1.5, activation: 1.0 });
    this.registerEdge('MAIN_MISSION', 'GLOBAL_CONTEXT', EDGE_TYPES.LINKED_TO, 1.0);

    // Amarra o batimento de plasticidade ao RequestAnimationFrame do Kernel
    this._lastPulseTime = performance.now();
    const neuroPulse = () => {
      if (!this.isActive) return;
      this.maintainCognitiveEquilibrium();
      requestAnimationFrame(neuroPulse);
    };
    requestAnimationFrame(neuroPulse);

    // Sincroniza com as transmissões do barramento de eventos do barramento central
    if (window.SentinelBus) {
      window.SentinelBus.on('performance:diagnostics', (data) => {
        if (data && data.profile === 'EMERGENCY' && this.currentProfile !== NEURO_PROFILES.EMERGENCY) {
          this.applyNeuroProfile(NEURO_PROFILES.EMERGENCY);
        }
      });
    }
  }

  traceGraph(msg, level = 'INFO')       { this.trace(`[CORE_TOPOLOGY] ${msg}`, level); }
  traceNode(msg, level = 'INFO')        { this.trace(`[NODE_SYSTEM] ${msg}`, level); }
  tracePropagation(msg, level = 'INFO') { this.trace(`[SYNAPTIC_SURGE] ${msg}`, level); }

  trace(message, level = 'INFO') {
    const formatted = `[${new Date().toISOString()}] [SENTINEL_NEUROGRAPH] [${level}] ${message}`;
    if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
    else if (level === 'WARN') console.warn(formatted);
    else console.log(formatted);
  }
}

// Instanciação e acoplamento no escopo operacional global do SENTINEL
const SovereignNeurographEngine = new SentinelNeurograph();
window.SentinelNeurograph = SovereignNeurographEngine;

export default SovereignNeurographEngine;