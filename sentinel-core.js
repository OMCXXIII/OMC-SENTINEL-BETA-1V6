/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — SHARED SERVICES BACKBONE (CORE)
 * Arquivo: sentinel-core.js
 * Papel: Infraestrutura de Composição, Runtime Store L1/L2 e Service Bridge
 * Governança: Totalmente desestatizado. Subordinado ao SovereignKernel.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const StateStore = (() => {
    'use strict';

    // Chaves únicas de persistência (Espelhamento L2)
    const ROOT_KEY = 'SENTINEL_STATE_ROOT';
    const MISSION_LOCK_KEY = 'SENTINEL_MISSION_LOCK';

    // 1. RUNTIME STORE (Memória L1 - Acesso Volátil de Ultra-Alta Velocidade < 1μs)
    let _state = {
        session: {
            active: false,
            operatorId: 'OPERATOR_UNKNOWN',
            startTimestamp: null
        },
        ops: {
            latency: 0,
            mission: 'NULL',
            cycles: 0
        },
        telemetry: {
            cpuLoad: 0.0,
            gpuFrameTimeMs: 0.0,
            thermalState: 'NOMINAL'
        }
    };

    /**
     * Hidratação Atômica da Memória L3 (Camada de Recuperação Pós-Boot)
     */
    const _hydrateL3Cache = () => {
        try {
            const raw = localStorage.getItem(ROOT_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Realiza um merge profundo apenas nos nós de dados estruturais
                _state = { ..._state, ...parsed };
                console.log('[CORE:STORE] Camada L3 recuperada e integrada à memória L1 com sucesso.');
            }
        } catch (e) {
            console.error('[CORE:STORE] Falha crítica ao ler a camada de recuperação L3:', e);
        }
    };

    /**
     * Sincronização L2 (Espelhamento Persistente Assíncrono)
     */
    const _commitL2Mirror = () => {
        try {
            localStorage.setItem(ROOT_KEY, JSON.stringify(_state));
        } catch (e) {
            console.error('[CORE:STORE] Falha de gravação no espelho persistente L2:', e);
        }
    };

    // Interfaces Públicas do Armazenamento Volátil e Persistente
    return {
        version: '9.0.0-BACKBONE',
        
        get: (path) => {
            const parts = path.split('.');
            let current = _state;
            for (const part of parts) {
                if (current[part] === undefined) return undefined;
                current = current[part];
            }
            return current;
        },

        set: (path, value) => {
            const parts = path.split('.');
            let current = _state;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) current[parts[i]] = {};
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = value;
            
            // Agenda persistência L2 e notifica barramento através da Service Bridge
            _commitL2Mirror();
            window.SentinelBus?.emit('state:changed', { path, value });
        },

        missionLock: (missionId = null) => {
            if (missionId) {
                localStorage.setItem(MISSION_LOCK_KEY, missionId);
                _state.ops.mission = missionId;
                _commitL2Mirror();
                return missionId;
            }
            return localStorage.getItem(MISSION_LOCK_KEY) || _state.ops.mission;
        },

        clearMissionLock: () => {
            localStorage.removeItem(MISSION_LOCK_KEY);
            _state.ops.mission = 'NULL';
            _commitL2Mirror();
        },

        initializeInfrastructure: () => {
            _hydrateL3Cache();
            return true;
        }
    };
})();

/**
 * 2. COMPOSITION LAYER & SERVICE BRIDGE
 * Fábrica estrutural de componentes, injeção de dependências e barramento secundário
 */
class SentinelCoreComposition {
    constructor() {
        this.componentRegistry = new Map();
        this.sharedReferences = new Map();
        this.isComposing = false;
    }

    /**
     * Service Bridge: Registra uma referência de serviço compartilhado cruzado para os módulos
     * @param {string} token - Identificador único do serviço abstrato
     * @param {Object} reference - Instância ou API exposta
     */
    exposeService(token, reference) {
        if (this.sharedReferences.has(token)) {
            console.warn(`[CORE:BRIDGE] Sobrescrita de serviço detectada para o token: ${token}`);
        }
        this.sharedReferences.set(token, reference);
        console.log(`[CORE:BRIDGE] Infraestrutura mapeou barramento secundário para: ${token}`);
    }

    /**
     * Service Bridge: Recupera uma chamada abstrata do sistema operacional ou serviço cruzado
     * @param {string} token - Identificador do serviço
     */
    getService(token) {
        const service = this.sharedReferences.get(token);
        if (!service) {
            throw new Error(`ServiceBridgeMissingException: O serviço solicitado '${token}' não está disponível.`);
        }
        return service;
    }

    /**
     * Composition Layer: Registra um blueprint/fábrica estrutural de componente injetável
     * @param {string} componentName - Nome do componente tático
     * @param {Function} factoryFn - Função de montagem
     */
    defineComponent(componentName, factoryFn) {
        this.componentRegistry.set(componentName, factoryFn);
    }

    /**
     * Composition Layer: Monta e injeta dependências estruturais em uma entidade sob comando do Kernel
     * @param {string} componentName - Nome do componente
     * @param {Object} contextOverrides - Parâmetros extras de runtime
     */
    assemble(componentName, contextOverrides = {}) {
        const factory = this.componentRegistry.get(componentName);
        if (!factory) {
            console.error(`[CORE:COMPOSITION] Fábrica de componente não encontrada: ${componentName}`);
            return null;
        }

        try {
            this.isComposing = true;
            
            // Força a injeção da infraestrutura básica comum do Core (Runtime Store + Bus Secundário)
            const baseContext = {
                store: StateStore,
                bus: window.SentinelBus || null,
                bridge: this,
                ...contextOverrides
            };

            const instance = factory(baseContext);
            this.isComposing = false;
            return instance;

        } catch (error) {
            this.isComposing = false;
            console.error(`[CORE:COMPOSITION] Erro catastrófico na montagem de [${componentName}]:`, error);
            return null;
        }
    }

    /**
     * Execução de ticks de subsistemas passivos gerenciados pela infraestrutura.
     * NÃO possui laço autoregulado (requestAnimationFrame removido). É chamado explicitamente pelo Scheduler do Kernel.
     */
    tick() {
        // Ciclo estrito para processos passivos e coletores de lixo da memória volátil L1
        const activeCycles = StateStore.get('ops.cycles') || 0;
        StateStore.set('ops.cycles', activeCycles + 1);
    }
}

// 3. EXPOSIÇÃO EXCLUSIVA DE ENGENHARIA DE INFRAESTRUTURA
(() => {
    // Vinculação determinística das ferramentas no escopo de runtime
    const SovereignCore = new SentinelCoreComposition();
    
    window.StateStore = StateStore;
    window.StateVault = StateStore; // Alias legado preservado para compatibilidade atômica
    window.SentinelCore = SovereignCore;

    // Registra o próprio Core como um módulo de infraestrutura disponível para o Kernel Soberano
    if (window.SovereignKernel) {
        window.SovereignKernel.registerModule('sentinel-core', SovereignCore);
    } else {
        // Se o Kernel ainda não foi montado na janela, monitora e aguarda o acoplamento passivo
        Object.defineProperty(window, 'SovereignKernel', {
            configurable: true,
            enumerable: true,
            set: (kernelInstance) => {
                delete window.SovereignKernel;
                window.SovereignKernel = kernelInstance;
                window.SovereignKernel.registerModule('sentinel-core', SovereignCore);
            }
        });
    }

    console.log(
        '%c OMC SENTINEL CORE & COMPOSITION BACKBONE v9.0 ONLINE [PURE-INFRASTRUCTURE-MODE] ',
        'background:#000; color:#00D4FF; font-weight:bold;'
    );
})();
