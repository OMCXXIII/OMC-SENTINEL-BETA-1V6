/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE RUNTIME MEMORY SYSTEM (STATE VAULT)
 * Arquivo: sentinel-memory.js
 * Papel: Continuidade Cognitiva, Snapshots Atômicos e Recuperação de Desastres
 * Governança: Totalmente subordinado ao SovereignKernel; dita regras de Persistência.
 * Fix: Refatoração integral para ESM. Implementação de Session Memory,
 * XR Recovery Vault, Mission Persistence, Attention History e State Recovery.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Chaves normativas imutáveis para persistência física em L2/L3
const STORAGE_KEYS = Object.freeze({
    SESSION:     'SENTINEL_SESSION_L1',
    RECOVERY:    'SENTINEL_XR_RECOVERY_CRASH_DUMP',
    MISSION:     'SENTINEL_MISSION_PERSISTENCE_L3',
    ATTENTION:   'SENTINEL_ATTENTION_HISTORY_L2'
});

class SentinelMemorySystem {
    constructor() {
        this.version = "9.0-COGNITIVE-CONTINUITY";
        this.isActive = false;

        // A) SESSION MEMORY: Memória volátil operacional de altíssima velocidade
        this.sessionStorage = new Map();

        // D) ATTENTION HISTORY: Buffer circular de telemetria foveal e fixação do olhar
        this.attentionHistory = [];
        this.maxAttentionHistorySize = 150; // Mantém histórico das últimas ~3 fixações profundas

        // B) XR RECOVERY MEMORY & E) MEMORY SNAPSHOTS METADATA
        this.recoveryRegistry = {
            lastSnapshotTimestamp: 0,
            consecutiveRecoveries: 0,
            isHydrating: false
        };

        this.bus = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // A) SESSION MEMORY (L1 IN-MEMORY STORAGE)
    // ═══════════════════════════════════════════════════════════════════════
    setSessionData(key, value) {
        this.sessionStorage.set(key, value);
        
        // Espelhamento volátil não-bloqueante na SessionStorage nativa do navegador
        try {
            sessionStorage.setItem(`${STORAGE_KEYS.SESSION}_${key}`, JSON.stringify(value));
        } catch (e) {
            this._trace('SESSION', 'Falha na serialização assíncrona em L1.', 'WARN');
        }
    }

    getSessionData(key) {
        if (this.sessionStorage.has(key)) {
            return this.sessionStorage.get(key);
        }
        // Fallback de reidratação tardia
        try {
            const raw = sessionStorage.getItem(`${STORAGE_KEYS.SESSION}_${key}`);
            if (raw) {
                const parsed = JSON.parse(raw);
                this.sessionStorage.set(key, parsed);
                return parsed;
            }
        } catch (e) {}
        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // C) MISSION PERSISTENCE (L3 COLD STORAGE HARDENING)
    // ═══════════════════════════════════════════════════════════════════════
    writeMissionState(missionId, payload) {
        const packageData = {
            missionId,
            timestamp: Date.now(),
            checksum: this._generateSimpleChecksum(payload),
            data: payload
        };

        try {
            localStorage.setItem(STORAGE_KEYS.MISSION, JSON.stringify(packageData));
            this._trace('MISSION', `Estado tático da missão [${missionId}] persistido rigidamente em L3.`);
            return true;
        } catch (error) {
            this._trace('MISSION', `Falha crítica ao gravar persistência de missão em disco: ${error.message}`, 'ERROR');
            return false;
        }
    }

    readMissionState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.MISSION);
            if (!raw) return null;

            const packageData = JSON.parse(raw);
            const currentChecksum = this._generateSimpleChecksum(packageData.data);

            // Validação de Integridade Estrutural contra corrupção de setores
            if (currentChecksum !== packageData.checksum) {
                this._trace('MISSION', 'CORRUPÇÃO DE DADOS DETECTADA EM L3. Checksum inválido.', 'CRITICAL');
                return null;
            }

            return packageData;
        } catch (error) {
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // D) ATTENTION HISTORY (BUFFER CIRCULAR ANALÍTICO)
    // ═══════════════════════════════════════════════════════════════════════
    recordAttentionFixation(nodeId, durationMs, priorityTier) {
        const logEntry = {
            id: nodeId,
            duration: durationMs,
            tier: priorityTier,
            ts: Date.now()
        };

        this.attentionHistory.push(logEntry);

        // Estrangulamento do tamanho máximo para evitar vazamento de heap na RAM
        if (this.attentionHistory.length > this.maxAttentionHistorySize) {
            this.attentionHistory.shift();
        }

        // Despacha persistência em lote a cada 10 registros
        if (this.attentionHistory.length % 10 === 0) {
            try {
                localStorage.setItem(STORAGE_KEYS.ATTENTION, JSON.stringify(this.attentionHistory));
            } catch (e) {}
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // E) MEMORY SNAPSHOTS & B) XR RECOVERY VAULT (PROTEÇÃO CONTRA QUEDAS)
    // ═══════════════════════════════════════════════════════════════════════
    createImmutableSnapshot(reason = 'ROUTINE') {
        if (!this.isActive) return null;

        // Captura o estado atômico de todos os subsistemas vivos do ecossistema
        const snapshot = {
            timestamp: Date.now(),
            reason,
            sessionStoreDump: Array.from(this.sessionStorage.entries()),
            kernelPhase: window.SovereignKernel ? window.SovereignKernel.getActivePhase() : 'UNKNOWN',
            attentionActiveFocus: window.AttentionManager?.cognitiveLoad?.activeFocusId || null,
            xrResolutionMultiplier: window.SentinelEngineXR?.resolution?.viewportMultiplier || 1.0
        };

        try {
            // B) XR RECOVERY MEMORY: Escrita síncrona emergencial em área isolada
            localStorage.setItem(STORAGE_KEYS.RECOVERY, JSON.stringify(snapshot));
            this.recoveryRegistry.lastSnapshotTimestamp = snapshot.timestamp;
            this._trace('SNAPSHOT', `Snapshot de contingência imutável selado em L2. Motivo: [${reason}]`);
            return snapshot;
        } catch (err) {
            this._trace('SNAPSHOT', `Aborto de salvamento de emergência: ${err.message}`, 'ERROR');
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // F) STATE RECOVERY (REIDRATAÇÃO OPERACIONAL)
    // ═══════════════════════════════════════════════════════════════════════
    executeStateRecovery() {
        if (this.recoveryRegistry.isHydrating) return false;
        this.recoveryRegistry.isHydrating = true;

        this._trace('STATE_RECOVERY', 'INICIANDO PROTOCOLO DE RECONSTITUIÇÃO COGNITIVA POST-CRASH...', 'WARN');

        try {
            const rawDump = localStorage.getItem(STORAGE_KEYS.RECOVERY);
            if (!rawDump) {
                this._trace('STATE_RECOVERY', 'Nenhum dump de colapso localizado em L2. Abortando reidratação.', 'INFO');
                this.recoveryRegistry.isHydrating = false;
                return false;
            }

            const snapshot = JSON.parse(rawDump);

            // 1. Reidrata a Session Memory L1
            if (snapshot.sessionStoreDump) {
                this.sessionStorage = new Map(snapshot.sessionStoreDump);
                // Restaura o espelhamento volátil físico
                for (const [k, v] of snapshot.sessionStoreDump) {
                    sessionStorage.setItem(`${STORAGE_KEYS.SESSION}_${k}`, JSON.stringify(v));
                }
            }

            // 2. Reidrata cruzado no Attention Manager se ele coexistir
            if (snapshot.attentionActiveFocus && window.AttentionManager) {
                window.AttentionManager.registerCognitiveNode(snapshot.attentionActiveFocus, 'PRIMARY');
                window.AttentionManager.acquireFocusLock(snapshot.attentionActiveFocus, 0);
            }

            // 3. Reidrata cruzado as propriedades de Viewport do Engine XR
            if (snapshot.xrResolutionMultiplier && window.SentinelEngineXR) {
                window.SentinelEngineXR.resolution.viewportMultiplier = snapshot.xrResolutionMultiplier;
            }

            this.recoveryRegistry.consecutiveRecoveries++;
            this._trace('STATE_RECOVERY', `RECONSTITUIÇÃO COMPLETA. Malha restaurada com sucesso. Restauros seguidos: ${this.recoveryRegistry.consecutiveRecoveries}`);
            
            if (this.bus) {
                this.bus.emit('memory:state_recovered', { ts: snapshot.timestamp, count: this.recoveryRegistry.consecutiveRecoveries });
            }

            this.recoveryRegistry.isHydrating = false;
            return true;
        } catch (fatalError) {
            this._trace('STATE_RECOVERY', `Falha crítica irreversível na descompressão do snapshot: ${fatalError.message}`, 'CRITICAL');
            this.recoveryRegistry.isHydrating = false;
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INTERFACES INTERNAS E AUXILIARES
    // ═══════════════════════════════════════════════════════════════════════
    _generateSimpleChecksum(obj) {
        const stringified = JSON.stringify(obj || {});
        let hash = 0;
        for (let i = 0; i < stringified.length; i++) {
            hash = (hash << 5) - hash + stringified.charCodeAt(i);
            hash |= 0; // Converte para inteiro de 32 bits
        }
        return hash;
    }

    initializeMemory() {
        this.isActive = true;
        this._trace('LIFECYCLE', 'Cofre de persistência integrado e escutando canais operacionais.');
        
        // Executa auto-recuperação preemptiva no boot se houver registro de falha remanescente
        this.executeStateRecovery();
    }

    shutdownMemory() {
        this.isActive = false;
        this.sessionStorage.clear();
    }

    _trace(subsystem, message, level = 'INFO') {
        const formatted = `[${new Date().toISOString()}] [MEMORY-VAULT:${subsystem}] [${level}] ${message}`;
        if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
        else if (level === 'WARN') console.warn(formatted);
        else console.log(formatted);
    }

    _attachSignalBus(busInstance) {
        this.bus = busInstance;

        // Escuta gatilhos de pane iminente do governador de performance para gerar snapshot preventivo
        this.bus.on('system:state_changed', (state) => {
            if (state.to === 'LOW_POWER' || state.to === 'DEGRADED') {
                this.createImmutableSnapshot('PREEMPTIVE_HARDWARE_STRESS');
            }
        });

        // Se o motor XR for forçado ao Blackout Técnico, gera snapshot imediato
        this.bus.on('kernel:emergency_fallback', (evt) => {
            this.createImmutableSnapshot(`KERNEL_PANIC_${evt.reason}`);
        });
    }
}

// Instanciação e exposição única em total conformidade com o ecossistema v9.0
const SovereignMemory = new SentinelMemorySystem();
window.SentinelMemory = SovereignMemory;

export default SovereignMemory;
