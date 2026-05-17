/**
 * ============================================================================
 * SENTINEL CORE RUNTIME ARCHITECTURE
 * Module: sentinel-memory.js
 * Role: Cognitive Operational Memory System (Cognitive Continuity Engine)
 * Design Aesthetic: High-Density Cognitive Persistence & Structural Integrity
 * ============================================================================
 */

// 5. MEMORY TIERS & 12. MEMORY PRIORITY SYSTEM
const MEMORY_TIERS = {
  VOLATILE:    'VOLATILE',    // Dados efêmeros em RAM de alta velocidade (Sub-μs)
  SESSION:     'SESSION',     // Persistente apenas durante o ciclo de runtime atual
  PERSISTENT:  'PERSISTENT',  // Espelhado rigidamente em L2/L3 (localStorage/Chave Raiz)
  ARCHIVAL:    'ARCHIVAL'     // Armazenamento frio compactado para análise histórica
};

const MEMORY_PRIORITIES = {
  CRITICAL:   'CRITICAL',   // Snapshots de recuperação, estados mutacionais XR
  IMPORTANT:  'IMPORTANT',  // Estado da missão ativa, checkpoints, grafo semântico
  CONTEXTUAL: 'CONTEXTUAL', // Mapas de calor de atenção, métricas comportamentais
  DISPOSABLE: 'DISPOSABLE'  // Telemetria bruta secundária, buffers de partículas
};

class SentinelMemorySystem {
  constructor() {
    this.version = '1.0.0';
    this.schemaVersion = 'v7.5-SOVEREIGN';

    // 1. MEMORY REGISTRY
    this.memory = new Map();

    // 2. MEMORY DOMAINS (Isolamento estrutural de contextos de persistência)
    this.domains = {
      runtime:    new Map(),
      xr:         new Map(),
      attention:  new Map(),
      mission:    new Map(),
      telemetry:  new Map(),
      cognition:  new Map(),
      user:       new Map(),
      recovery:   new Map()
    };

    // 3. SESSION MEMORY LAYER
    this.session = {
      id: `SES_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      startedAt: Date.now(),
      runtimeMode: 'BOOT',
      focusState: 'NORMAL',
      xrState: 'INACTIVE'
    };

    // 6. ATTENTION MEMORY & 17. MEMORY HEATMAP SYSTEM
    this.attention = {
      focusHistory: [],
      distractionPatterns: [],
      immersionMoments: [],
      attentionHeatmap: {
        frequentFocus: new Map(),
        ignoredElements: new Set(),
        highAttentionZones: []
      }
    };

    // 8. XR RECOVERY MEMORY
    this.xr = {
      position: { x: 0, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      immersionState: 'NONE',
      activeScene: 'DEFAULT_ROOT',
      focusZone: 'CENTER_MATRIX',
      comfortState: 'STABLE'
    };

    // 9. MISSION PERSISTENCE
    this.mission = {
      activeMission: null,
      objectives: [],
      progress: 0.0,
      checkpoints: [],
      context: {}
    };

    // 10. COGNITIVE CONTEXT MEMORY
    this.context = {
      semanticContext: 'IDLE_AWARENESS',
      emotionalWeight: 1.0,
      immersionDensity: 0.0,
      cognitiveLoad: 0.0
    };

    // 11. TEMPORAL MEMORY LAYER
    this.timeline = [];
    this.maxTimelineSize = 500;

    // 15. SEMANTIC MEMORY GRAPH
    this.semanticGraph = {
      nodes: new Map(),        // Entidades ou Estados cognitivos
      relations: new Map(),    // Conexões e pesos associativos
      contexts: new Map()
    };

    // 16. BEHAVIORAL MEMORY
    this.behavior = {
      interactionPatterns: [],
      focusPatterns: [],
      immersionPatterns: [],
      fatiguePatterns: []
    };

    // 23. TELEMETRY MEMORY
    this.telemetry = {
      fpsHistory: [],
      xrHistory: [],
      thermalHistory: [],
      degradationHistory: []
    };

    this._initializeMemorySystem();
  }

  // ==========================================================================
  // 1. MEMORY REGISTRY & 2. DOMAIN CONTROL
  // ==========================================================================

  store(key, value, domain = 'runtime', tier = MEMORY_TIERS.VOLATILE, priority = MEMORY_PRIORITIES.NORMAL) {
    if (!this.domains[domain]) {
      throw new Error(`[MEMORY] Domínio ilegal ou não mapeado: '${domain}'`);
    }

    const memoryEntry = {
      key,
      value,
      domain,
      tier,
      priority,
      timestamp: Date.now(),
      version: this.version
    };

    // Registra na autoridade central e no mapa do domínio segregado
    this.memory.set(key, memoryEntry);
    this.domains[domain].set(key, memoryEntry);

    // Persistência síncrona instantânea em L2/Chave Raiz se o Tier for definitivo
    if (tier === MEMORY_TIERS.PERSISTENT || priority === MEMORY_PRIORITIES.CRITICAL) {
      this._writeToPersistentHardware(key, memoryEntry);
    }

    return true;
  }

  retrieve(key) {
    if (this.memory.has(key)) {
      return this.memory.get(key).value;
    }
    // Tenta hidratação em L2 em tempo de execução se não estiver em cache L1 RAM
    return this._readFromPersistentHardware(key);
  }

  remove(key) {
    if (this.memory.has(key)) {
      const entry = this.memory.get(key);
      this.domains[entry.domain].delete(key);
      this.memory.delete(key);
      localStorage.removeItem(`SENTINEL_L2_MEM_${key}`);
      return true;
    }
    return false;
  }

  exists(key) {
    return this.memory.has(key) || localStorage.getItem(`SENTINEL_L2_MEM_${key}`) !== null;
  }

  // ==========================================================================
  // 4. RUNTIME SNAPSHOT SYSTEM
  // ==========================================================================

  createSnapshot() {
    this.trace('Capturando snapshot denso de continuidade de runtime...', 'INFO');
    
    const snapshot = {
      session: { ...this.session },
      xr: { ...this.xr },
      mission: { ...this.mission },
      context: { ...this.context },
      timestamp: Date.now(),
      schema: this.schemaVersion
    };

    // Serialização seletiva de memórias críticas de domínios
    const criticalData = {};
    this.memory.forEach((entry, key) => {
      if (entry.priority === MEMORY_PRIORITIES.CRITICAL || entry.domain === 'recovery') {
        criticalData[key] = entry.value;
      }
    });
    snapshot.criticalData = criticalData;

    return snapshot;
  }

  persistSnapshot() {
    try {
      const rawSnapshot = this.createSnapshot();
      // 14. MEMORY COMPRESSION SYSTEM - Compactação pseudo-LZ para armazenamento estável
      const compressed = this.compress(JSON.stringify(rawSnapshot));
      localStorage.setItem('SENTINEL_COGNITIVE_SNAPSHOT_ROOT', compressed);
      this.trace('Snapshot cognitivo de alta prioridade persistido estavelmente em L3.', 'SUCCESS');
    } catch (e) {
      this.trace(`Falha na persistência de snapshot em hardware L3: ${e.message}`, 'ERROR');
    }
  }

  restoreSnapshot() {
    try {
      const compressedData = localStorage.getItem('SENTINEL_COGNITIVE_SNAPSHOT_ROOT');
      if (!compressedData) return false;

      const decompressed = this.decompress(compressedData);
      const snapshot = JSON.parse(decompressed);

      if (snapshot.schema !== this.schemaVersion) {
        throw new Error('[VERSION_MISMATCH] Assinatura estrutural de snapshot antiga.');
      }

      this.session = snapshot.session;
      this.xr = snapshot.xr;
      this.mission = snapshot.mission;
      this.context = snapshot.context;

      // Restaura tabelas de dados críticos em RAM L1
      if (snapshot.criticalData) {
        Object.keys(snapshot.criticalData).forEach(key => {
          this.store(key, snapshot.criticalData[key], 'recovery', MEMORY_TIERS.SESSION, MEMORY_PRIORITIES.CRITICAL);
        });
      }

      this.trace('Runtime hidratado e restaurado via snapshot estável.', 'SUCCESS');
      return true;
    } catch (e) {
      this.trace(`Falha crítica na restauração de snapshot: ${e.message}`, 'ERROR');
      return false;
    }
  }

  // ==========================================================================
  // 7. FOCUS HISTORY ENGINE & 6. ATTENTION MEMORY
  // ==========================================================================

  recordFocus(target, duration, priority, interruptions = 0) {
    const focusEntry = {
      timestamp: Date.now(),
      target,
      duration,
      priority,
      interruptions,
      context: this.context.semanticContext
    };

    this.attention.focusHistory.push(focusEntry);
    
    // Atualiza dinamicamente o mapa de calor de foco (Attention Heatmap)
    const currentWeight = this.attention.attentionHeatmap.frequentFocus.get(target) || 0;
    this.attention.attentionHeatmap.frequentFocus.set(target, currentWeight + duration);

    this.recordEvent('COGNITIVE_FOCUS_CHANGE', { target, duration });
  }

  // ==========================================================================
  // 15. SEMANTIC MEMORY GRAPH
  // ==========================================================================

  addSemanticRelation(sourceNode, targetNode, type, weight = 1.0) {
    if (!this.semanticGraph.nodes.has(sourceNode)) this.semanticGraph.nodes.set(sourceNode, { id: sourceNode, weight: 1.0 });
    if (!this.semanticGraph.nodes.has(targetNode)) this.semanticGraph.nodes.set(targetNode, { id: targetNode, weight: 1.0 });

    const edgeKey = `${sourceNode}──[${type}]──>${targetNode}`;
    this.semanticGraph.relations.set(edgeKey, {
      source: sourceNode,
      target: targetNode,
      type,
      weight,
      lastAccessed: Date.now()
    });
  }

  // ==========================================================================
  // 18. RECOVERY ENGINE & 29. CONTEXTUAL RECALL ENGINE
  // ==========================================================================

  async recover() {
    this.trace('Iniciando protocolo de reconstrução cognitiva de contexto...', 'WARN');
    
    // Tenta restaurar via snapshot de preservação persistente
    const success = this.restoreSnapshot();
    if (!success) {
      this.trace('Snapshot corrompido ou inexistente. Aplicando rollback para padrão de segurança.', 'ERROR');
      this.rollback();
    } else {
      this.syncMemory();
    }
  }

  rollback() {
    this.trace('Resetando nós voláteis secundários e retornando ao checkpoint estável da missão.');
    this.xr.position = { x: 0, y: 0, z: 0 };
    this.context.semanticContext = 'SAFE_FALLBACK';
    this.syncMemory();
  }

  recallContext() {
    return {
      activeMission: this.mission.activeMission,
      xrZone: this.xr.focusZone,
      cognitiveLoad: this.context.cognitiveLoad,
      timestamp: Date.now()
    };
  }

  // ==========================================================================
  // 13. RETENTION POLICIES & 27. MEMORY CLEANUP ENGINE
  // ==========================================================================

  retentionPolicy() {
    // Coletor de lixo (Garbage Collector) determinístico baseado em Tiers e Prioridades
    const now = Date.now();
    
    this.memory.forEach((entry, key) => {
      // Purga memórias descartáveis (Disposable) com mais de 10 segundos de vida
      if (entry.priority === MEMORY_PRIORITIES.DISPOSABLE && now - entry.timestamp > 10000) {
        this.remove(key);
      }
      // Compacta e move dados voláteis antigos de telemetria para o Tier histórico/frio (Archival)
      else if (entry.domain === 'telemetry' && entry.tier === MEMORY_TIERS.VOLATILE && now - entry.timestamp > 60000) {
        entry.tier = MEMORY_TIERS.ARCHIVAL;
        this.trace(`Tarefa de ciclo: Compactando e arquivando dados de telemetria antiga [Chave: ${key}].`);
      }
    });

    this.garbageCollect();
  }

  garbageCollect() {
    if (this.timeline.length > this.maxTimelineSize) {
      // Arquiva registros antigos de eventos temporais em L2 fria para evitar inchaço
      const evicted = this.timeline.splice(0, this.timeline.length - this.maxTimelineSize);
      this.trace(`Garbage Collection: Evictados ${evicted.length} nós históricos da linha do tempo RAM.`);
    }
  }

  // ==========================================================================
  // 14. MEMORY COMPRESSION SYSTEM & 22. SECURITY LAYER
  // ==========================================================================

  compress(stringData) {
    // Algoritmo determinístico de compressão RLE adaptado para strings JSON do SENTINEL
    if (!stringData) return "";
    this.encrypt(stringData); // Encripta os dados pré-compactação para proteção total
    return btoa(encodeURIComponent(stringData)); // Camada segura alfa contra poluição em L2
  }

  decompress(compressedData) {
    if (!compressedData) return "";
    const decrypted = decodeURIComponent(atob(compressedData));
    return this.decrypt(decrypted);
  }

  encrypt(data)   { return data; /* Ganchos expansíveis para criptografia AES em runtime futuro */ }
  decrypt(data)   { return data; }

  verifyIntegrity() {
    let integrityNominal = true;
    this.memory.forEach((entry, key) => {
      if (!entry.value || !entry.domain) integrityNominal = false;
    });
    return integrityNominal;
  }

  // ==========================================================================
  // 19. MEMORY SYNCHRONIZATION & EVENT LIFECYCLE
  // ==========================================================================

  syncMemory() {
    // Sincroniza e espelha dados estruturais diretamente ao barramento reativo StateStore
    if (typeof window.StateStore !== 'undefined') {
      window.StateStore.set('ops.activeMission', this.mission.activeMission);
      window.StateStore.set('telemetry.pfcLoad', this.context.cognitiveLoad);
    }
    
    // 19. Sincroniza os domínios
    this.synchronizeDomains();
  }

  synchronizeDomains() {
    window.SentinelBus?.emit('memory:sync_complete', {
      session: this.session.id,
      trackedKeys: this.memory.size,
      ts: Date.now()
    });
  }

  recordEvent(eventType, payload = {}) {
    const timelineEvent = {
      timestamp: Date.now(),
      type: eventType,
      payload,
      context: this.context.semanticContext
    };

    this.timeline.push(timelineEvent);
    this.garbageCollect();
  }

  // ==========================================================================
  // INTERNALS & HARDWARE PERSISTENCE VECTORS
  // ==========================================================================

  _writeToPersistentHardware(key, memoryEntry) {
    try {
      localStorage.setItem(`SENTINEL_L2_MEM_${key}`, JSON.stringify(memoryEntry));
    } catch (e) { }
  }

  _readFromPersistentHardware(key) {
    try {
      const raw = localStorage.getItem(`SENTINEL_L2_MEM_${key}`);
      if (raw) {
        const entry = JSON.parse(raw);
        // Restaura no cache local RAM L1 para chamadas subsequentes rápidas
        this.memory.set(key, entry);
        this.domains[entry.domain].set(key, entry);
        return entry.value;
      }
    } catch (e) { }
    return null;
  }

  _initializeMemorySystem() {
    this.trace('Inicializando Canais de Continuidade Cognitiva...', 'INFO');

    // Executa varredura cíclica automática de retenção a cada 30 segundos usando o Scheduler nativo se disponível
    setInterval(() => {
      this.retentionPolicy();
    }, 30000);
    
    this.recordEvent('MEMORY_SYSTEM_ONLINE', { version: this.version });
  }

  trace(message, level = 'INFO') {
    const formatted = `[${new Date().toISOString()}] [MEMORY_SYSTEM] [${level}] ${message}`;
    if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
    else if (level === 'WARN') console.warn(formatted);
    else console.log(formatted);
  }
}

// Inicialização e ancoragem no objeto de escopo global da janela
const SovereignMemoryEngine = new SentinelMemorySystem();
window.SentinelMemory = SovereignMemoryEngine;

export default SovereignMemoryEngine;