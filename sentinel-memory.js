/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE RUNTIME MEMORY SYSTEM (STATE VAULT)
 * Arquivo: sentinel-memory.js
 * Papel: Persistência de Missão, Micro-Dumps JSON e Restauração de Baixa Latência
 * Governança: Totalmente subordinado ao SovereignKernel. Sem auto-boot implícito.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// 1. MEMORY TIERS — Camadas de Persistência Física
const MEMORY_TIERS = Object.freeze({
  VOLATILE:    'VOLATILE',    // Dados efêmeros em RAM de alta velocidade (Sub-μs)
  SESSION:     'SESSION',     // Persistente em sessionStorage (Coordenadas/HUD)
  PERSISTENT:  'PERSISTENT',  // Espelhado rigidamente em localStorage (Missão/Objetivos)
  ARCHIVAL:    'ARCHIVAL'     // Armazenamento frio compactado para análise histórica (Focus Logs)
});

// 2. MEMORY PRIORITIES — Escalonamento de Retenção
const MEMORY_PRIORITIES = Object.freeze({
  CRITICAL:   'CRITICAL',   // Snapshots de recuperação, estados mutacionais XR
  IMPORTANT:  'IMPORTANT',  // Estado da missão ativa, objetivos estruturados, checkpoints
  CONTEXTUAL: 'CONTEXTUAL', // Mapas de calor de atenção, logs analíticos de foco
  DISPOSABLE: 'DISPOSABLE'  // Telemetria bruta secundária, buffers de partículas
});

class SentinelMemorySystem {
  constructor() {
    this.version = '9.0-SOVEREIGN';
    this.schemaVersion = 'v9.0-SOVEREIGN';

    // 3. INTERNAL MEMORY REGISTRY (RAM L1 Cache)
    this.memory = new Map();

    // Domínios Isolados de Contexto
    this.domains = {
      SESSION: new Map(),     // Estado imediato das visualizações e coordenadas do HUD
      MISSION: new Map(),     // Objetivos consolidados e rotinas ativas estruturadas
      FOCUS_HISTORY: [],      // Logs analíticos de desvios de atenção para calibração
      SNAPSHOTS: []           // Capturas de estado em micro-dumps JSON
    };

    this._initializeMemorySystem();
  }

  /**
   * TRACE ENGINE UNIFICADO INTERNO DA MEMÓRIA
   */
  trace(message, level = 'INFO') {
    if (window.SovereignKernel && typeof window.SovereignKernel.trace === 'function') {
      window.SovereignKernel.trace('MEMORY', message, level);
    } else {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
      console.log(`%c[${timestamp}] [MEMORY] [${level}] ${message}`, 'color: #00D4FF; font-weight: bold;');
    }
  }

  /**
   * ⚡ GRAVAÇÃO E PERSISTÊNCIA ESTRUTURADA (RAM L1 ──► STORAGE L2)
   */
  store(key, value, tier = MEMORY_TIERS.VOLATILE, priority = MEMORY_PRIORITIES.CONTEXTUAL) {
    const memoryEntry = {
      value,
      tier,
      priority,
      timestamp: Date.now(),
      schema: this.schemaVersion
    };

    // Escrita imediata em RAM L1 (< 1μs)
    this.memory.set(key, memoryEntry);

    // Roteamento físico de acordo com a Estrutura de Armazenamento designada
    switch (tier) {
      case MEMORY_TIERS.SESSION:
        this.domains.SESSION.set(key, memoryEntry);
        this._writeToHardware(sessionStorage, `SENTINEL_S1_${key}`, memoryEntry);
        break;

      case MEMORY_TIERS.PERSISTENT:
        this.domains.MISSION.set(key, memoryEntry);
        this._writeToHardware(localStorage, `SENTINEL_L2_${key}`, memoryEntry);
        break;

      case MEMORY_TIERS.ARCHIVAL:
        if (key.includes('focus_deviation')) {
          this.domains.FOCUS_HISTORY.push(memoryEntry);
          // Mantém cap de segurança em RAM para histórico de foco (evita estouro de heap)
          if (this.domains.FOCUS_HISTORY.length > 200) this.domains.FOCUS_HISTORY.shift();
        }
        break;
    }
  }

  /**
   * ⚡ RECUPERAÇÃO HIDRATADA DE ESTADO COMPLETO
   */
  retrieve(key, tier = MEMORY_TIERS.VOLATILE) {
    // Tenta ler do cache L1 em RAM para performance máxima
    if (this.memory.has(key)) {
      return this.memory.get(key).value;
    }

    // Fallback: Busca física na camada L2 persistente
    let entry = null;
    if (tier === MEMORY_TIERS.SESSION) {
      entry = this._readFromHardware(sessionStorage, `SENTINEL_S1_${key}`);
    } else if (tier === MEMORY_TIERS.PERSISTENT) {
      entry = this._readFromHardware(localStorage, `SENTINEL_L2_${key}`);
    }

    if (entry) {
      this.memory.set(key, entry); // Hidrata o cache L1
      return entry.value;
    }

    return null;
  }

  /**
   * ⚡ RUNTIME SNAPSHOTS — MICRO-DUMPS DE CONFIGURAÇÃO IMEDIATA (< 12ms)
   * Captura o estado atômico atual do sistema para recuperação instantânea contra falhas
   */
  createRuntimeSnapshot() {
    const startTime = performance.now();
    
    // Varre e condensa o estado consolidado da memória ativa L1
    const serializedState = {};
    this.memory.forEach((entry, key) => {
      if (entry.priority === MEMORY_PRIORITIES.CRITICAL || entry.priority === MEMORY_PRIORITIES.IMPORTANT) {
        serializedState[key] = entry.value;
      }
    });

    const snapshotDump = {
      id: `snapshot_${Date.now()}`,
      timestamp: Date.now(),
      kernelMode: window.SovereignKernel?.getActiveMode?.() || 'IDLE',
      payload: serializedState
    };

    // Armazena o dump JSON diretamente no topo do armazenamento local persistente
    localStorage.setItem('SENTINEL_L3_EMERGENCY_DUMP', JSON.stringify(snapshotDump));
    this.domains.SNAPSHOTS.push(snapshotDump);
    
    // Rotatividade: mantém apenas as duas últimas capturas estruturais de emergência
    if (this.domains.SNAPSHOTS.length > 2) this.domains.SNAPSHOTS.shift();

    const duration = performance.now() - startTime;
    this.trace(`[SNAPSHOT] Micro-dump JSON executado. Latência de gravação: ${duration.toFixed(2)}ms (Alvo: < 12ms)`, 'INFO');
    return snapshotDump.id;
  }

  /**
   * ⚡ EXECUÇÃO DE RESTAURAÇÃO COMPLETA PÓS-COLAPSO
   * Hidrata todo o ecossistema do OS a partir do último micro-dump válido
   */
  restoreFromEmergencyDump() {
    const startTime = performance.now();
    try {
      const rawDump = localStorage.getItem('SENTINEL_L3_EMERGENCY_DUMP');
      if (!rawDump) return false;

      const snapshot = JSON.parse(rawDump);
      this.trace(`[RECOVERY] Micro-dump de emergência localizado. ID: ${snapshot.id}. Remontando OS...`, 'WARN');

      // Loop de hidratação forçada síncrona
      Object.keys(snapshot.payload).forEach(key => {
        this.store(key, snapshot.payload[key], MEMORY_TIERS.PERSISTENT, MEMORY_PRIORITIES.IMPORTANT);
      });

      const duration = performance.now() - startTime;
      this.trace(`[RECOVERY] Restauração concluída em ${duration.toFixed(2)}ms. Sistema operacional estabilizado.`, 'INFO');
      
      window.SentinelBus?.emit('memory:state-restored', { timestamp: snapshot.timestamp, durationMs: duration });
      return true;
    } catch (err) {
      this.trace(`Falha catastrófica ao descriptografar e injetar dump JSON: ${err.message}`, 'CRITICAL');
      return false;
    }
  }

  /**
   * Gravação direta de registros históricos e eventos analíticos
   */
  recordEvent(eventType, payload = {}) {
    const logKey = `focus_deviation_${Date.now()}`;
    if (eventType === 'ATTENTION_DIVERTED' || eventType === 'FOCUS_DROP') {
      // Aloca na subestrutura de logs de foco para calibração analítica
      this.store(logKey, payload, MEMORY_TIERS.ARCHIVAL, MEMORY_PRIORITIES.CONTEXTUAL);
    } else {
      this.store(`evt_${Date.now()}`, payload, MEMORY_TIERS.VOLATILE, MEMORY_PRIORITIES.DISPOSABLE);
    }
  }

  /**
   * ⚡ POLÍTICA DE RETENÇÃO E DIETA DE MEMÓRIA (RETENTION POLICY)
   * Expura registros de telemetria descartáveis para impedir vazamento de memória e lentidão
   */
  retentionPolicy() {
    this.trace('[RETENTION] Iniciando varredura cíclica de eliminação de lixo em cache...', 'INFO');
    const now = Date.now();
    let evictions = 0;

    this.memory.forEach((entry, key) => {
      // Filtra entradas de telemetria bruta e descartável com mais de 45 segundos de vida
      if (entry.priority === MEMORY_PRIORITIES.DISPOSABLE && (now - entry.timestamp > 45000)) {
        this.memory.delete(key);
        evictions++;
      }
    });

    if (evictions > 0) {
      this.trace(`[RETENTION] Purga concluída. Evictadas ${evictions} entradas obsoletas de telemetria de L1 RAM.`, 'INFO');
    }
  }

  // --- MÉTODOS COMPLEMENTARES DE ACESSO LEGADO COMPATÍVEL ---
  _writeToPersistentHardware(key, memoryEntry) { this._writeToHardware(localStorage, `SENTINEL_L2_MEM_${key}`, memoryEntry); }
  _readFromPersistentHardware(key) {
    const entry = this._readFromHardware(localStorage, `SENTINEL_L2_MEM_${key}`);
    return entry ? entry.value : null;
  }

  // --- DRIVERS FÍSICOS DE HARDWARE INTERNOS ---
  _writeToHardware(storageAPI, namespaceKey, entry) {
    try {
      storageAPI.setItem(namespaceKey, JSON.stringify(entry));
    } catch (e) {
      this.trace(`Falha física na escrita sobre o barramento do navegador: ${e.message}`, 'ERROR');
    }
  }

  _readFromHardware(storageAPI, namespaceKey) {
    try {
      const raw = storageAPI.getItem(namespaceKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      return null;
    }
    return null;
  }

  _initializeMemorySystem() {
    this.trace('Estruturando Canais Síncronos/Assíncronos de Continuidade Cognitiva...', 'INFO');

    // Varredura de retenção periódica de lixo em L1 (A cada 30 segundos)
    setInterval(() => this.retentionPolicy(), 30000);

    // Auto-captura periódica de micro-dumps preventivos (A cada 60 segundos) se o Kernel estiver pronto
    setInterval(() => {
      if (window.SovereignKernel && window.SovereignKernel.getActiveMode() !== 'BOOT') {
        this.createRuntimeSnapshot();
      }
    }, 60000);

    // Captura eventos síncronos de desvio do Filtro de Inibição Periférica
    window.SentinelBus?.on('attention:suppression-trigger', (data) => {
      this.recordEvent('ATTENTION_DIVERTED', { timestamp: Date.now(), focusProfile: data.profile });
    });

    // Escuta sinalizações de erro crítico vindas do Kernel ou do State Governor para disparar dump imediato
    window.SentinelBus?.on('state:phase-synchronized', (data) => {
      if (data.to === 'EMERGENCY' || data.to === 'SAFE_MODE') {
        this.createRuntimeSnapshot();
      }
    });

    this.recordEvent('MEMORY_SYSTEM_ONLINE', { version: this.version });
  }
}

// 5. EXPOSIÇÃO OPERACIONAL E ANCORAGEM PASSIVA NO KERNEL SOBERANO
(() => {
  const MemorySystemInstance = new SentinelMemorySystem();
  
  window.SentinelMemorySystemClass = SentinelMemorySystem; // Exposição estrutural da Classe
  window.SentinelMemory = MemorySystemInstance;            // Instância operacional ativa

  // Vinculação determinística como subsistema direto do Kernel Soberano
  if (window.SovereignKernel) {
    window.SovereignKernel.registerModule('memory', MemorySystemInstance);
    // Executa reconstituição imediata de boot caso haja um dump persistido em disco
    MemorySystemInstance.restoreFromEmergencyDump();
  } else {
    Object.defineProperty(window, 'SovereignKernel', {
      configurable: true,
      enumerable: true,
      set: (kernelInstance) => {
        delete window.SovereignKernel;
        window.SovereignKernel = kernelInstance;
        window.SovereignKernel.registerModule('memory', MemorySystemInstance);
        MemorySystemInstance.restoreFromEmergencyDump();
      }
    });
  }

  console.log(
    '%c OMC SENTINEL STATE VAULT & COGNITIVE MEMORY v9.0 ONLINE [PERSISTENCE-SECURED] ',
    'background:#003344; color:#fff; font-weight:bold; padding:3px; border-left:4px solid #00D4FF;'
  );
})();
