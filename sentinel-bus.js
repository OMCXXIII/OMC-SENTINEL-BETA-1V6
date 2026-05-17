/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — HIGH-PRECISION SIGNAL BUS (CMA AUDIO/VISUAL SYNCHRONIZER)
 * Arquivo: sentinel-bus.js
 * Papel: Barramento Assíncrono com Despacho por Quadros e Controle de Fluxo
 * Governança: Totalmente subordinado ao SovereignKernel. Sem auto-boot implícito.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const SentinelBus = (() => {
    'use strict';

    // 1. REGISTRY INTERNO, HISTÓRICO E COMPATIBILIDADE LEGADA
    const _handlers = Object.create(null);
    const _history = [];
    const _sticky = Object.create(null);
    const _domains = Object.create(null);
    const _metrics = Object.create(null);

    const MAX_HISTORY = 200;
    const MAX_BUFFER = 100;
    let _bootCompleted = false;

    // 2. ESTRUTURA E FILAS DE PRIORIDADES ESTREITAS (FRAME DISPATCH)
    const _queues = {
        CRITICAL:   [], // Sinais XR, Estabilização, Input Inercial (Imediato / Frame Target)
        HIGH:       [], // Mudanças de Foco Cognitivo, Updates Críticos do HUD, Alertas
        NORMAL:     [], // Render Sync, State Mutations, Cálculos Gerais de Subsistemas
        BACKGROUND: []  // Logs de Depuração, Persistência L2/L3, Telemetria Passiva
    };

    // Namespaces Mandatórios de Validação Semântica
    const MANDATORY_NAMESPACES = ['kernel', 'xr', 'hud', 'performance', 'attention', 'memory'];

    // 3. CONTROLE DE FLUXO (THROTTLING) POR ASSINATURA DE EVENTO
    // Teto de 5% reservado para BACKGROUND (Logs e Telemetrias) para mitigar overhead por spam
    const BUS_BANDWIDTH_LIMIT_PER_SEC = 2000; 
    const BACKGROUND_LIMIT_PER_SEC = Math.floor(BUS_BANDWIDTH_LIMIT_PER_SEC * 0.05); // 100 eventos/segundo max
    
    let _totalEventsEmittedInCurrentWindow = 0;
    let _backgroundEventsInCurrentWindow = 0;
    let _windowResetTimestamp = Date.now();

    /**
     * Mapeia dinamicamente e valida o namespace do sinal para determinar sua fila de prioridade
     * @param {string} eventName - Nome do evento no formato namespace:acao
     * @returns {string} Fila de prioridade correspondente (CRITICAL, HIGH, NORMAL, BACKGROUND)
     */
    const _resolvePriorityTier = (eventName) => {
        const splitIndex = eventName.indexOf(':');
        if (splitIndex === -1) {
            // Logs soltos ou eventos sem namespace entram como background
            return 'BACKGROUND';
        }

        const namespace = eventName.slice(0, splitIndex);
        
        // Atribuição de peso atencional e de hardware por namespace nativo
        switch (namespace) {
            case 'xr':
                return 'CRITICAL';
            case 'kernel':
            case 'attention':
                return 'HIGH';
            case 'hud':
            case 'performance':
                return 'NORMAL';
            case 'memory':
                return 'BACKGROUND';
            default:
                return 'BACKGROUND';
        }
    };

    /**
     * Reseta as janelas de medição de largura de banda a cada 1000ms
     */
    const _enforceRateLimits = () => {
        const now = Date.now();
        if (now - _windowResetTimestamp >= 1000) {
            _totalEventsEmittedInCurrentWindow = 0;
            _backgroundEventsInCurrentWindow = 0;
            _windowResetTimestamp = now;
        }
    };

    /**
     * Registra o escutador de eventos padrão (Assinatura Nativa)
     */
    const on = (eventName, handler) => {
        if (typeof handler !== 'function') return;
        if (!_handlers[eventName]) {
            _handlers[eventName] = [];
        }
        _handlers[eventName].push(handler);
    };

    /**
     * Remove o escutador de eventos
     */
    const off = (eventName, handler) => {
        if (!_handlers[eventName]) return;
        if (!handler) {
            delete _handlers[eventName];
            return;
        }
        const index = _handlers[eventName].indexOf(handler);
        if (index !== -1) {
            _handlers[eventName].splice(index, 1);
        }
    };

    /**
     * Escutador de disparo único (Self-Destructing Listener)
     */
    const once = (eventName, handler) => {
        const wrapper = (data) => {
            off(eventName, wrapper);
            handler(data);
        };
        on(eventName, wrapper);
    };

    /**
     * Armazena ou recupera um evento persistente na memória estática (Sticky Events)
     */
    const sticky = (eventName, data = null) => {
        if (data !== null) {
            _sticky[eventName] = data;
            emit(eventName, data); // Despacha imediatamente para a fila prioritária correspondente
        }
        return _sticky[eventName];
    };

    /**
     * Reposiciona e re-executa o histórico de sinais passados em handlers recém-acoplados
     */
    const replay = (eventName, handler) => {
        if (typeof handler !== 'function') return;
        _history.forEach(record => {
            if (record.name === eventName) {
                handler(record.data);
            }
        });
    };

    /**
     * Enfileira o sinal na infraestrutura com base em seu peso cognitivo e restrições de throttling
     * Substitui o antigo disparo síncrono imediato por agendamento escalonado
     */
    const emit = (eventName, data = {}) => {
        _enforceRateLimits();

        const tier = _resolvePriorityTier(eventName);

        // Aplicação estrita da trava de segurança de 5% para ruídos e telemetrias secundárias
        if (tier === 'BACKGROUND') {
            if (_backgroundEventsInCurrentWindow >= BACKGROUND_LIMIT_PER_SEC) {
                // Descarta silenciosamente ou atenua o sinal para proteger o barramento da GPU/CPU
                return;
            }
            _backgroundEventsInCurrentWindow++;
        }

        _totalEventsEmittedInCurrentWindow++;

        // Registra métricas e histórico operacional volátil
        _metrics[eventName] = (_metrics[eventName] || 0) + 1;
        _history.push({ name: eventName, data: data, ts: Date.now() });
        if (_history.length > MAX_HISTORY) {
            _history.shift();
        }

        // Enfileira na partição correspondente para consumo no próximo Frame Target
        _queues[tier].push({ name: eventName, data: data });
    };

    /**
     * ⚡ METODO dispatchFrame() — EXECUÇÃO CRÍTICA DO TIME BUDGET
     * Chamado de forma determinística pelo Scheduler do SovereignKernel.
     * Limpa as filas respeitando a ordem de soberania dos sinais: CRITICAL -> HIGH -> NORMAL -> BACKGROUND
     * @param {number} allocatedTimeMs - Tempo máximo em milissegundos permitido para despacho neste frame
     */
    const dispatchFrame = (allocatedTimeMs = 2.5) => {
        const startTime = performance.now();
        const tiers = ['CRITICAL', 'HIGH', 'NORMAL', 'BACKGROUND'];

        for (const tier of tiers) {
            const queue = _queues[tier];
            
            while (queue.length > 0) {
                // Validação contínua do tempo gasto para evitar estouro de frame (Frame Drop Prevention)
                if (performance.now() - startTime >= allocatedTimeMs) {
                    return; // Interrompe e posterga o restante da fila para o próximo ciclo
                }

                const event = queue.shift();
                const handlers = _handlers[event.name];

                if (handlers && handlers.length > 0) {
                    for (let i = 0; i < handlers.length; i++) {
                        try {
                            handlers[i](event.data);
                        } catch (err) {
                            console.error(`[BUS] Falha de execução no handler de [${event.name}]:`, err);
                        }
                    }
                }
            }
        }
    };

    // Preenche domínios e assinaturas legadas do ecossistema CMA
    _domains.SYSTEM = [
        'boot:start', 'boot:complete', 'boot:module-ready', 'boot:handshake',
        'nexus:command', 'system:error', 'system:warning'
    ];

    /**
     * Retorna instantaneamente o estado instantâneo das métricas e filas (Observabilidade)
     */
    const getDiagnostics = () => {
        return {
            queues: {
                critical: _queues.CRITICAL.length,
                high: _queues.HIGH.length,
                normal: _queues.NORMAL.length,
                background: _queues.BACKGROUND.length
            },
            traffic: {
                totalCurrentWindow: _totalEventsEmittedInCurrentWindow,
                backgroundCurrentWindow: _backgroundEventsInCurrentWindow,
                limitBackground: BACKGROUND_LIMIT_PER_SEC
            },
            historySize: _history.length,
            metrics: { ..._metrics }
        };
    };

    // Interface Limpa e Consolidada do Barramento Estrito
    return {
        on,
        off,
        once,
        emit,
        sticky,
        replay,
        dispatchFrame,
        getDiagnostics,
        getHistory: () => _history,
        getMetrics: () => _metrics,
        setBootCompleted: (val) => { _bootCompleted = val; }
    };
})();

// 4. ANCORAGEM LIMPA NO ESCOPO GLOBAL SEM EXECUÇÃO PREMATURA
(() => {
    window.SentinelBus = SentinelBus;
    window.SENTINEL_BOOTED = false;

    // Acoplamento passivo de segurança no SovereignKernel caso ele já coexista na janela
    if (window.SovereignKernel) {
        window.SovereignKernel.registerModule('sentinel-bus', SentinelBus);
    } else {
        Object.defineProperty(window, 'SovereignKernel', {
            configurable: true,
            enumerable: true,
            set: (kernelInstance) => {
                delete window.SovereignKernel;
                window.SovereignKernel = kernelInstance;
                window.SovereignKernel.registerModule('sentinel-bus', SentinelBus);
            }
        });
    }

    console.log(
        '%c OMC SENTINEL HIGH-PRECISION BUS v9.0 ONLINE [FRAME-PACED & CONTROLLED] ',
        'background:#000; color:#00FF41; border:1px solid #00FF41; padding:3px; font-family:monospace;'
    );
})();
