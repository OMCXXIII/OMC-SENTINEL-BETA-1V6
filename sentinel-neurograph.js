/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — SOVEREIGN TOPOLOGY ENGINE (NEUROGRAPH OPERATING SYSTEM)
 * Arquivo: sentinel-neurograph.js
 * Papel: Grafo Relacional Semântico, Topologia de Missão e Atalhos Sinápticos
 * Governança: Totalmente subordinado ao SovereignKernel. Sem auto-boot implícito.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// 1. GRAPH NODE TYPES — Geografia de Entidades Cognitivas Reais
const NODE_TYPES = Object.freeze({
  CONTEXT:   'CONTEXT',   // Cenários operacionais macro e ambientes ativos
  MISSION:   'MISSION',   // Objetivos consolidados, tarefas e rotinas de usuário
  ATTENTION: 'ATTENTION', // Nós capturados sob foco foveal ou supressão periférica
  MEMORY:    'MEMORY',    // Registros persistentes, blocos de notas e arquivos locais
  SPATIAL:   'SPATIAL',   // Vetores, zonas tridimensionais e matrizes WebXR
  ENTITY:    'ENTITY',    // Elementos lógicos da interface ou objetos de renderização
  EVENT:     'EVENT'      // Ocorrências críticas, exceções e gatilhos de barramento
});

// 2. EDGE RELATIONSHIP TYPES — Vínculos de Conectividade Lógica
const EDGE_TYPES = Object.freeze({
  RELATED_TO:      'RELATED_TO',       // Associação livre por proximidade de leitura
  DEPENDS_ON:      'DEPENDS_ON',       // Bloqueio cronológico estrutural de tarefas
  FOCUSES_ON:      'FOCUSES_ON',       // Vinculação imediata com o vetor do olhar
  ORIGINATED_FROM: 'ORIGINATED_FROM',  // Linhagem histórica de criação do nó
  LINKED_TO:       'LINKED_TO',        // Conexão direta entre arquivos e metas de missão
  SUPPRESSES:      'SUPPRESSES',       // Inibição ativa (Filtro de Atenção)
  ACTIVATES:       'ACTIVATES'         // Disparo de eventos adjacentes automáticos
});

// 3. MODE-AWARE NEUROGRAPH PROFILES — Regime de Plasticidade
const NEURO_PROFILES = Object.freeze({
  NORMAL:    'NORMAL',    // Propagação padrão balanceada de impulsos
  FOCUS:     'FOCUS',     // Poda de caminhos secundários (Pruning), aceleração de foco
  LOW_POWER: 'LOW_POWER', // Hibernação de conexões frias para alívio de memória CPU/GPU
  XR:        'XR',        // Sincronização espacial de nós com o campo de visão estereoscópico
  EMERGENCY: 'EMERGENCY'  // Isolamento estrito de nós de missão; congela caminhos heurísticos
});

class SentinelNeuroGraphEngine {
  constructor() {
    this.version = '9.0-SOVEREIGN';
    this.isActive = true;
    this.currentProfile = NEURO_PROFILES.NORMAL;

    // 4. ESTRUTURA CORE DO GRAFO COGNITIVO
    this.nodes = new Map(); // Id -> Objeto do Nó { id, type, label, weight, metadata }
    this.edges = new Map(); // Id composto -> Objeto da Aresta { source, target, type, strength }
    
    this._lastPulseTime = performance.now();
    this._initializeNeuroEngine();
  }

  /**
   * TRACE ENGINE UNIFICADO INTERNO DO GRAFO
   */
  trace(message, level = 'INFO') {
    if (window.SovereignKernel && typeof window.SovereignKernel.trace === 'function') {
      window.SovereignKernel.trace('NEUROGRAPH', message, level);
    } else {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
      console.log(`%c[${timestamp}] [NEUROGRAPH] [${level}] ${message}`, 'color: #00FF88; font-weight: bold;');
    }
  }

  traceGraph(msg, level = 'INFO')       { this.trace(`[SEMANTIC_MAP] ${msg}`, level); }
  traceNode(msg, level = 'INFO')        { this.trace(`[NODE_LAYER] ${msg}`, level); }
  tracePropagation(msg, level = 'INFO') { this.trace(`[SYNAPTIC_SURGE] ${msg}`, level); }

  /**
   * INSERÇÃO ATÔMICA DE NÓS NA GEOMETRIA SEMÂNTICA
   */
  addNode(id, type = NODE_TYPES.ENTITY, label = '', metadata = {}) {
    if (this.nodes.has(id)) return this.nodes.get(id);

    const node = {
      id,
      type,
      label,
      weight: 1.0, // Peso inicial nominal de relevância cognitiva
      lastAccessed: Date.now(),
      metadata: metadata || {}
    };

    this.nodes.set(id, node);
    this.traceNode(`Nó semântico injetado: [${id}] do tipo [${type}]`, 'INFO');
    return node;
  }

  /**
   * ESTABELECIMENTO DE ARESTAS RELACIONAIS (CONEXÃO CONTEXTUAL)
   */
  addEdge(sourceId, targetId, type = EDGE_TYPES.RELATED_TO, strength = 0.5) {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      this.traceGraph(`Falha ao ligar aresta: Nós [${sourceId}] ou [${targetId}] inexistentes.`, 'WARN');
      return null;
    }

    const edgeId = `${sourceId}->${targetId}`;
    const edge = {
      id: edgeId,
      source: sourceId,
      target: targetId,
      type,
      strength: Math.min(1.0, Math.max(0.0, strength)),
      lastPulse: Date.now()
    };

    this.edges.set(edgeId, edge);
    return edge;
  }

  /**
   * ⚡ SEMANTIC GRAPH & MISSION TOPOLOGY — CARREGAMENTO E CONSTRUÇÃO DE DEPENDÊNCIAS
   * Constrói o mapa de significados e a hierarquia sequencial de metas de trabalho
   */
  buildMissionTopology(missionData) {
    this.traceGraph('🚧 Reconstruindo Topologia de Missão e Matriz Semântica...', 'INFO');
    
    if (!missionData || !missionData.blocks) return;

    // Injeta o nó central da missão
    const missionNodeId = `mission_${missionData.id || 'root'}`;
    this.addNode(missionNodeId, NODE_TYPES.MISSION, missionData.title || 'Tarefa Mestre', { status: 'ACTIVE' });

    let previousBlockId = null;

    // Varre sequencialmente os blocos de trabalho para estruturar a hierarquia de dependências
    missionData.blocks.forEach((block, index) => {
      const blockNodeId = `block_${block.id}`;
      this.addNode(blockNodeId, NODE_TYPES.MISSION, block.name, { fileAnchor: block.fileAnchor });
      
      // Vincula o bloco de trabalho à missão mestre
      this.addEdge(missionNodeId, blockNodeId, EDGE_TYPES.LINKED_TO, 0.9);

      // Se houver arquivos ou notas de desenvolvimento anexadas, cria o acoplamento semântico
      if (block.fileAnchor) {
        const fileNodeId = `file_${block.fileAnchor}`;
        this.addNode(fileNodeId, NODE_TYPES.MEMORY, `Ref: ${block.fileAnchor}`, { extension: 'js' });
        this.addEdge(blockNodeId, fileNodeId, EDGE_TYPES.RELATED_TO, 0.85);
      }

      // Mission Topology: Aplica restrição linear temporal (DEPENDS_ON) entre blocos subsequentes
      if (previousBlockId) {
        this.addEdge(blockNodeId, previousBlockId, EDGE_TYPES.DEPENDS_ON, 1.0);
      }
      previousBlockId = blockNodeId;
    });

    this.traceGraph(`Topologia estabelecida com sucesso. Nós ativos: ${this.nodes.size} | Conexões: ${this.edges.size}`, 'INFO');
  }

  /**
   * ⚡ ATTENTION LINKS — PROPAGAÇÃO SINÁPTICA PREDITIVA (SURGE PROPAGATION)
   * Dispara um surto elétrico a partir de um nó ativo, aproximando e aquecendo dados correlatos
   */
  propagateSurge(rootNodeId, intensity = 1.0, depth = 0) {
    if (depth > 2 || !this.nodes.has(rootNodeId)) return; // Trava contra estouro de pilha recursiva (Cap em 2 níveis)

    const sourceNode = this.nodes.get(rootNodeId);
    sourceNode.weight = Math.min(2.0, sourceNode.weight + (intensity * 0.3));
    sourceNode.lastAccessed = Date.now();

    if (depth === 0) {
      this.tracePropagation(`⚡ SURTO SINÁPTICO originado em [${rootNodeId}]. Propagando predição de dados...`, 'INFO');
    }

    // Varre as arestas em busca de adjacências para aquecimento preditivo
    this.edges.forEach((edge) => {
      if (edge.source === rootNodeId) {
        const targetNode = this.nodes.get(edge.target);
        if (targetNode) {
          // Peso calculado com base na força da aresta e atenuação por profundidade angular
          const attenuationFactor = 0.7;
          const prefetchWeight = intensity * edge.strength * attenuationFactor;
          
          targetNode.weight = Math.min(2.0, targetNode.weight + prefetchWeight);
          edge.lastPulse = Date.now();

          // Attention Links: Se a conexão estiver muito quente, puxa os metadados do cache em background
          if (targetNode.weight > 1.35 && targetNode.type === NODE_TYPES.MEMORY) {
            this.tracePropagation(`[ATTENTION_LINK] Relevância secundária crítica em [${targetNode.id}] (${targetNode.weight.toFixed(2)}). Pré-carregando buffers.`, 'WARN');
            this._preheatHardwareCache(targetNode.id, targetNode.metadata);
          }

          // Propaga recursivamente para o próximo nível da malha
          this.propagateSurge(targetNode.id, prefetchWeight, depth + 1);
        }
      }
    });
  }

  /**
   * Aciona de forma antecipada as camadas de persistência de L1/L2 antes da requisição explícita do usuário
   */
  _preheatHardwareCache(nodeId, metadata) {
    if (!window.SentinelMemory) return;
    
    const cleanKey = nodeId.replace('file_', '');
    // Executa a leitura fria de disco de forma assíncrona inerte para hidratar a RAM L1 do cofre
    window.SentinelMemory.retrieve(cleanKey, 'PERSISTENT');
  }

  /**
   * ⚡ COGNITIVE PLASTICITY — LEI DE DECAIMENTO E MANUTENÇÃO (MAINTAIN EQUILIBRIUM)
   * Resfria nós inativos e executa a poda (Pruning) de caminhos mortos para estabilização de runtime
   */
  maintainCognitiveEquilibrium() {
    if (!this.isActive) return;

    const now = Date.now();
    const elapsed = now - this._lastPulseTime;
    if (elapsed < 2000) return; // Limita a varredura regulatória a cada 2 segundos para poupar ciclos
    this._lastPulseTime = now;

    let prunedEdges = 0;
    const cooldownRate = this.currentProfile === NEURO_PROFILES.FOCUS ? 0.08 : 0.03;

    // 1. Aplica decaimento linear nos pesos dos nós baseados no tempo de ociosidade
    this.nodes.forEach((node, key) => {
      if (node.type !== NODE_TYPES.MISSION) { // Nós de missão mestre possuem imunidade a podas
        const idleTime = now - node.lastAccessed;
        if (idleTime > 15000) {
          node.weight = Math.max(0.2, node.weight - cooldownRate);
        }
      }
    });

    // 2. PRUNING: Remove conexões de atalhos dinâmicos secundários obsoletos (Arestas fracas)
    this.edges.forEach((edge, key) => {
      if (edge.type === EDGE_TYPES.RELATED_TO && edge.strength < 0.15) {
        this.edges.delete(key);
        prunedEdges++;
      }
    });

    if (prunedEdges > 0) {
      this.traceGraph(`[PLASTICITY] Poda neural executada: ${prunedEdges} arestas obsoletas colapsadas para alívio de memória.`, 'INFO');
    }
  }

  /**
   * Altera dinamicamente o comportamento de propagação do grafo baseado no estado macro do OS
   */
  applyNeuroProfile(profileKey) {
    if (NEURO_PROFILES[profileKey]) {
      this.currentProfile = profileKey;
      this.traceGraph(`Perfil topológico alterado para: [${profileKey}]`, 'WARN');
      
      if (profileKey === NEURO_PROFILES.EMERGENCY) {
        // Isola e zera pesos secundários imediatamente
        this.nodes.forEach(n => { if (n.type !== NODE_TYPES.MISSION) n.weight = 0.2; });
      }
    }
  }

  /**
   * Acoplamento reativo e amarração no Barramento Central de Eventos
   */
  _initializeNeuroEngine() {
    this.traceGraph('Construindo Malha Relacional de Plasticidade Heurística...', 'INFO');

    // Conecta as reações do grafo com base na atenção do usuário capturada pelo filtro periférico
    window.SentinelBus?.on('ui:nexus-update', (data) => {
      if (data && data.text && data.text.includes('FOCUS_TARGET')) {
        const match = data.text.match(/FOCUS_TARGET:\s*([^\n]+)/);
        if (match && match[1]) {
          const targetId = match[1].trim();
          
          // Registra o evento de foco como um nó físico no grafo temporal
          const attentionNodeId = `focus_${targetId}`;
          this.addNode(attentionNodeId, NODE_TYPES.ATTENTION, `Foco ativo: ${targetId}`);
          this.addEdge(attentionNodeId, targetId, EDGE_TYPES.FOCUSES_ON, 1.0);
          
          // Provoca surto sináptico de aquecimento relacional
          this.propagateSurge(targetId, 1.2);
        }
      }
    });

    // Escuta mudanças de fase do Kernel para reconfigurar os perfis de busca do grafo
    window.SentinelBus?.on('state:phase-synchronized', (data) => {
      if (data.to === 'DEEPFLOW' || data.to === 'FOCUS') {
        this.applyNeuroProfile(NEURO_PROFILES.FOCUS);
      } else if (data.to === 'EMERGENCY') {
        this.applyNeuroProfile(NEURO_PROFILES.EMERGENCY);
      } else {
        this.applyNeuroProfile(NEURO_PROFILES.NORMAL);
      }
    });

    // Hidratação Heurística Inicial: Conecta os arquivos principais do núcleo SENTINEL
    window.SentinelBus?.on('boot:complete', () => {
      this.addNode('file_sentinel-kernel.js', NODE_TYPES.MEMORY, 'Kernel Core');
      this.addNode('file_sentinel-renderer.js', NODE_TYPES.MEMORY, 'Orquestrador GPU');
      this.addNode('file_sentinel-performance.js', NODE_TYPES.MEMORY, 'Governador de Hardware');
      this.addNode('file_sentinel-attention.js', NODE_TYPES.MEMORY, 'Filtro Cognitivo');
      this.addNode('file_sentinel-memory.js', NODE_TYPES.MEMORY, 'Cofre de Estado');
      
      this.addEdge('file_sentinel-kernel.js', 'file_sentinel-renderer.js', EDGE_TYPES.ACTIVATES, 1.0);
      this.addEdge('file_sentinel-performance.js', 'file_sentinel-renderer.js', EDGE_TYPES.SUPPRESSES, 0.9);
    });
  }
}

// 5. EXPOSIÇÃO OPERACIONAL E ANCORAGEM DETERMINÍSTICA NO KERNEL SOBERANO
(() => {
  const NeuroGraphInstance = new SentinelNeuroGraphEngine();
  
  window.SentinelNeuroGraphClass = SentinelNeuroGraphEngine; // Exposição estrutural da Classe
  window.SentinelNeuroGraph = NeuroGraphInstance;            // Instância operacional ativa

  // Vinculação determinística como subsistema direto do Kernel Soberano
  if (window.SovereignKernel) {
    window.SovereignKernel.registerModule('neurograph', NeuroGraphInstance);
  } else {
    Object.defineProperty(window, 'SovereignKernel', {
      configurable: true,
      enumerable: true,
      set: (kernelInstance) => {
        delete window.SovereignKernel;
        window.SovereignKernel = kernelInstance;
        window.SovereignKernel.registerModule('neurograph', NeuroGraphInstance);
      }
    });
  }

  // Acopla o batimento de plasticidade ao requestAnimationFrame unificado através do Core Loop
  window.addEventListener('load', () => {
    const plasticLoop = () => {
      NeuroGraphInstance.maintainCognitiveEquilibrium();
      requestAnimationFrame(plasticLoop);
    };
    requestAnimationFrame(plasticLoop);
  });

  console.log(
    '%c OMC SENTINEL SEMANTIC NEUROGRAPH v9.0 ONLINE [GRAPH-METRICS-ENGAGED] ',
    'background:#004d26; color:#00FF88; font-weight:bold; padding:3px; border-left:4px solid #00FF88;'
  );
})();
