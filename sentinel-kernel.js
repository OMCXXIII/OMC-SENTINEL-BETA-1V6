/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — SOVEREIGN CORE RUNTIME OPERATING KERNEL
 * Arquivo: sentinel-kernel.js
 * Papel: Centro Absoluto de Governança, Arbitragem de Hardware e Ciclo de Vida
 * ═══════════════════════════════════════════════════════════════════════════
 */

const SentinelKernel = (() => {
    'use strict';

    // 1. REGISTRY, DEPENDENCY GRAPH & HEALTH MATRIX
    const _registry = new Map();
    const _moduleHealth = new Map();
    
    const _dependencies = {
        'sentinel-bus': [],
        'sentinel-state-machine': ['sentinel-bus'],
        'sentinel-scheduler':     ['sentinel-state-machine'],
        'sentinel-core':          ['sentinel-scheduler'],
        'sentinel-performance':   ['sentinel-core'],
        'sentinel-renderer':      ['sentinel-core'],
        'attention-manager':      ['sentinel-core'],
        'memory-vault':           ['sentinel-core'],
        'engine-xr':              ['sentinel-renderer', 'sentinel-performance'],
        'sentinel-hud':           ['engine-xr', 'attention-manager']
    };

    // 2. BOOT LOCKS E ESTADOS SOBERANOS
    let _bootLock = false;
    let _phaseLock = false;
    let _transitionLock = false;
    let _activePhase = 'SHUTDOWN'; // BOOT, INIT, READY, FOCUS, FLOW, XR, LOW_POWER, RECOVERY, SAFE_MODE, EMERGENCY, SHUTDOWN

    // 3. TELEMETRIA VOLÁTIL DE COMPORTAMENTO DE HARDWARE
    const _telemetry = {
        fps: 90.0,
        gpuCostFraction: 0.0,
        memoryUsedMb: 0.0,
        temperatureC: 36.6,
        pressureFraction: 0.0,
        latencyMs: 0.0,
        cognitiveLoad: 0.0
    };

    // Limits Estruturais de Proteção de Silício e Biologia
    const METABOLIC_ENERGY_CRITICAL = 0.20; // 20% PFC-BRUT Limit
    const THERMAL_THROTTLING_LIMIT = 45.0;  // 45°C teto de processamento móvel

    // 4. TRACE ENGINE UNIFICADO
    const _trace = (namespace, message, level = 'INFO') => {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        const colorMap = {
            'INFO': 'color: #00D4FF;',
            'WARN': 'color: #FFC400; font-weight: bold;',
            'ERROR': 'color: #FF3E3E; font-weight: bold;',
            'CRITICAL': 'background: #FF3E3E; color: #FFF; font-weight: bold; padding: 2px;'
        };
        console.log(`%c[${timestamp}] [${namespace}] [${level}] ${message}`, colorMap[level] || 'color: #FFF;');
    };

    // 5. RUNTIME MODES & INTERFACES DE FASE (onEnter, onExit, validation, rollback)
    const _phases = {
        'BOOT': {
            onEnter: async () => { _trace('BOOT', 'Iniciando varredura e sequenciamento de módulos primários.', 'INFO'); },
            validation: () => true,
            onExit: async () => true,
            rollback: async () => _enterSafeMode('Falha crítica na fase de BOOT.')
        },
        'INIT': {
            onEnter: async () => {
                _trace('INIT', 'Alocando infraestrutura e resolvendo grafo de dependências.', 'INFO');
                await _executeLoadSequence();
            },
            validation: () => {
                for (const [mod, status] of _moduleHealth.entries()) {
                    if (status === 'FAILED') return false;
                }
                return true;
            },
            onExit: async () => true,
            rollback: async () => _enterSafeMode('Dependências violadas ou módulos corrompidos na inicialização.')
        },
        'READY': {
            onEnter: async () => {
                _trace('READY', 'Sistema nominal estável. Liberando controle ao operador.', 'INFO');
                _getBus()?.emit('kernel:runtime-ready', { ts: Date.now() });
                _updateDOMStateClass('ready-active');
            },
            validation: () => _telemetry.fps >= 30.0,
            onExit: async () => true,
            rollback: async () => _enterSafeMode('Queda crítica de responsividade pós-inicialização.')
        },
        'FLOW': {
            onEnter: async () => {
                _trace('KERNEL', 'Estado Natural de Execução (DEEPFLOW) engajado.', 'INFO');
                _updateDOMStateClass('ene-active', ['neural-silence']);
            },
            validation: () => _telemetry.cognitiveLoad < 0.85,
            onExit: async () => { _updateDOMStateClass(null, null, ['ene-active', 'neural-silence']); },
            rollback: async () => _transitionToPhase('READY')
        },
        'XR': {
            onEnter: async () => {
                _trace('XR', 'Arbitragem de hardware: Ativando projeção estereoscópica e tracking foveal.', 'INFO');
                _getBus()?.emit('xr:activated', { framePacing: '90Hz' });
            },
            validation: () => _telemetry.fps >= 60.0 && _telemetry.temperatureC < THERMAL_THROTTLING_LIMIT,
            onExit: async () => { _getBus()?.emit('xr:suspended', { reason: 'Exit Phase' }); },
            rollback: async () => _transitionToPhase('LOW_POWER')
        },
        'LOW_POWER': {
            onEnter: async () => {
                _trace('PERFORMANCE', 'Controle de energia: Forçando rebaixamento de FX e corte de drawcalls.', 'WARN');
                _updateDOMStateClass('low-power-mode');
                _getBus()?.emit('performance:degrade-visuals', { scale: 0.5, shaderQuality: 'LOW' });
            },
            validation: () => true,
            onExit: async () => { _updateDOMStateClass(null, null, ['low-power-mode']); },
            rollback: async () => _transitionToPhase('EMERGENCY')
        },
        'RECOVERY': {
            onEnter: async () => {
                _trace('RECOVERY', 'Gatilho de Resfriamento Metabólico ativo. Forçando supressão visual.', 'WARN');
                _updateDOMStateClass('nsdr-cooling');
                _getBus()?.emit('system:nsdr-trigger', { mentalBattery: _telemetry.mentalBattery });
            },
            validation: () => true,
            onExit: async () => { _updateDOMStateClass(null, null, ['nsdr-cooling']); },
            rollback: async () => _transitionToPhase('SAFE_MODE')
        },
        'SAFE_MODE': {
            onEnter: async () => {
                _trace('KERNEL', '!! MODO DE SEGURANÇA SEPARADO — ISOLAMENTO MÁXIMO DO RUNTIME !!', 'CRITICAL');
                _degradeAllModules();
            },
            validation: () => true,
            onExit: async () => true,
            rollback: async () => _transitionToPhase('EMERGENCY')
        },
        'EMERGENCY': {
            onEnter: async () => {
                _trace('KERNEL', '!!! COLAPSO DE HARDWARE OU BIOMETRIA DETECTADO !!!', 'CRITICAL');
                _getBus()?.emit('kernel:emergency-shutdown', { code: 'CRITICAL_SILICON_STRESS' });
                await _transitionToPhase('SHUTDOWN');
            },
            validation: () => true,
            onExit: async () => true,
            rollback: async () => true
        },
        'SHUTDOWN': {
            onEnter: async () => {
                _trace('BOOT', 'Desligando instâncias e liberando handles de GPU.', 'WARN');
                _registry.clear();
                _moduleHealth.clear();
                _bootLock = false;
            },
            validation: () => true,
            onExit: async () => true,
            rollback: async () => true
        }
    };

    // 6. MODULE REGISTRY INTERFACE
    const _registerModule = (name, instance) => {
        if (_registry.has(name)) {
            _trace('KERNEL', `Tentativa de re-registro anulada para o módulo: ${name}`, 'WARN');
            return;
        }
        _registry.set(name, instance);
        _moduleHealth.set(name, 'READY');
        _trace('KERNEL', `Módulo ancorado no registro do Kernel: ${name}`, 'INFO');
    };

    const _unregisterModule = (name) => {
        if (_registry.has(name)) {
            _registry.delete(name);
            _moduleHealth.delete(name);
            _trace('KERNEL', `Módulo ejetado do registro: ${name}`, 'WARN');
        }
    };

    const _getModule = (name) => _registry.get(name);
    const _hasModule = (name) => _registry.has(name);

    // 7. LOAD ORCHESTRATION & DEPENDENCY RESOLUTION
    const _executeLoadSequence = async () => {
        for (const moduleName in _dependencies) {
            _moduleHealth.set(moduleName, 'BOOTING');
            _trace('BOOT', `Resolvendo pré-requisitos para: ${moduleName}`, 'INFO');
            
            // Valida se as dependências do módulo já estão registradas e saudáveis
            const deps = _dependencies[moduleName];
            for (const dep of deps) {
                if (!_registry.has(dep) || _moduleHealth.get(dep) === 'FAILED') {
                    _moduleHealth.set(moduleName, 'FAILED');
                    _trace('BOOT', `Falha de dependência: [${moduleName}] requer [${dep}]`, 'ERROR');
                    throw new Error(`DependencyResolutionException: ${moduleName}`);
                }
            }

            // Simula o bootstrap lógico interno ou acopla se a instância global existir
            try {
                await _loadModuleMockOrHook(moduleName);
                _moduleHealth.set(moduleName, 'READY');
            } catch (err) {
                _moduleHealth.set(moduleName, 'FAILED');
                throw err;
            }
        }
    };

    const _loadModuleMockOrHook = async (name) => {
        // Vincula instâncias voláteis da janela ao registro oficial do Kernel se disponíveis
        if (name === 'sentinel-bus' && window.SentinelBus) _registerModule(name, window.SentinelBus);
        else if (name === 'engine-xr' && window.SentinelEngineXR) _registerModule(name, window.SentinelEngineXR);
        else {
            // Cria um placeholder operacional para blindagem de chamadas vazias
            _registerModule(name, { _isKernelStub: true });
        }
        return true;
    };

    // 8. TRANSITION ENGINE (FASES INTEGRADAS COM A STATE MACHINE SOBERANA)
    const _transitionToPhase = async (targetPhase) => {
        if (_transitionLock) {
            _trace('KERNEL', `Transição bloqueada. Já existe uma mutação de fase em andamento. Alvo negado: ${targetPhase}`, 'WARN');
            return false;
        }
        if (!_phases[targetPhase]) {
            _trace('KERNEL', `Fase desconhecida rejeitada pela infraestrutura: ${targetPhase}`, 'ERROR');
            return false;
        }

        _transitionLock = true;
        _trace('KERNEL', `Iniciando transição de fase: ${_activePhase} ──> ${targetPhase}`, 'INFO');

        try {
            // 1. Executa saída da fase atual
            if (_phases[_activePhase]) {
                await _phases[_activePhase].onExit();
            }

            // 2. Valida pré-requisitos da nova fase
            if (!_phases[targetPhase].validation()) {
                _trace('KERNEL', `Validação falhou ao tentar entrar na fase: ${targetPhase}. Executando Rollback.`, 'ERROR');
                _transitionLock = false;
                await _phases[targetPhase].rollback();
                return false;
            }

            // 3. Aplica modificação de estado de forma soberana
            const oldPhase = _activePhase;
            _activePhase = targetPhase;
            
            // Tenta sincronizar com a Máquina de Estado do sistema se registrada
            const stateMachine = _getModule('sentinel-state-machine');
            if (stateMachine && typeof stateMachine.transition === 'function') {
                stateMachine.transition(targetPhase);
            }

            // 4. Dispara ganchos de entrada da nova fase
            await _phases[targetPhase].onEnter();
            
            _transitionLock = false;
            _getBus()?.emit('kernel:phase-changed', { from: oldPhase, to: targetPhase });
            return true;

        } catch (error) {
            _trace('KERNEL', `Erro catastrófico no loop de transição: ${error.message}`, 'CRITICAL');
            _transitionLock = false;
            await _phases[targetPhase].rollback();
            return false;
        }
    };

    // 9. GOVERNANÇA DE HARDWARE E ADAPTABILIDADE DINÂMICA
    const _updateHardwareTelemetry = (metrics) => {
        Object.assign(_telemetry, metrics);

        // Sistema de Proteção Térmica Ativa e Queda de Quadros
        if (_telemetry.temperatureC > THERMAL_THROTTLING_LIMIT && _activePhase === 'XR') {
            _trace('PERFORMANCE', `Teto térmico atingido (${_telemetry.temperatureC}°C). Abortando XR para poupar silício.`, 'CRITICAL');
            _transitionToPhase('LOW_POWER');
            return;
        }

        if (_telemetry.fps < 45.0 && _activePhase === 'READY') {
            _trace('PERFORMANCE', `Frame pacing instável (${_telemetry.fps} FPS). Forçando rebaixamento preventivo.`, 'WARN');
            _transitionToPhase('LOW_POWER');
        }
    };

    // 10. RECOVERY ENGINE
    const _recoverModule = async (name) => {
        _trace('KERNEL', `Tentando re-inicialização forçada do módulo falho: ${name}`, 'WARN');
        _moduleHealth.set(name, 'RECOVERING');
        try {
            // Força expurgo e recarga
            _unregisterModule(name);
            await _loadModuleMockOrHook(name);
            _moduleHealth.set(name, 'READY');
            _trace('KERNEL', `Módulo restaurado com sucesso: ${name}`, 'INFO');
            return true;
        } catch (e) {
            _moduleHealth.set(name, 'FAILED');
            _trace('KERNEL', `Falha persistente na recuperação de: ${name}. Entrando em modo de segurança.`, 'CRITICAL');
            _enterSafeMode(`Recovery Failure: ${name}`);
            return false;
        }
    };

    const _enterSafeMode = (reason) => {
        _trace('KERNEL', `Acionando Protocolo de Emergência Interno. Motivo: ${reason}`, 'CRITICAL');
        _transitionToPhase('SAFE_MODE');
    };

    const _degradeAllModules = () => {
        _moduleHealth.forEach((status, modName) => {
            _moduleHealth.set(modName, 'DEGRADED');
        });
        _getBus()?.emit('performance:emergency-fallback', { coreLock: true });
    };

    // Auxiliares internos para amarração e barramento seguro
    const _getBus = () => _registry.get('sentinel-bus') || window.SentinelBus;

    const _updateDOMStateClass = (addClass, extraClasses = [], removeClasses = []) => {
        const body = document.body;
        if (!body) return;
        
        removeClasses.forEach(cls => body.classList.remove(cls));
        if (addClass) body.classList.add(addClass);
        if (extraClasses && extraClasses.length) {
            extraClasses.forEach(cls => body.classList.add(cls));
        }
    };

    const _bindEvents = () => {
        const bus = _getBus();
        if (!bus) return;

        // Escuta centralizada de telemetria biológica e de barramento
        bus.on('state:changed', (data) => {
            if (data.path === 'system:mental-battery') {
                _telemetry.cognitiveLoad = (100 - data.value) / 100;
                if (data.value < METABOLIC_ENERGY_CRITICAL && _activePhase !== 'RECOVERY') {
                    _transitionToPhase('RECOVERY');
                }
            }
        });

        // Intercepta solicitações de atenção para ajustar as prioridades do Scheduler
        bus.on('entity:focus-locked', (data) => {
            _trace('ATTENTION', `Foco travado na entidade ${data.focusedId}. Repriorizando tarefas.`, 'INFO');
            if (_activePhase === 'READY') {
                _transitionToPhase('FOCUS');
            }
        });
    };

    // 11. O REAL BOOT SOBERANO (Ponto único de entrada da aplicação)
    const boot = async () => {
        if (_bootLock) {
            _trace('BOOT', 'Ignorando chamada de boot duplicada. Kernel já inicializado ou travado.', 'WARN');
            return false;
        }
        _bootLock = true;
        
        _trace('KERNEL', '=== EXECUÇÃO SOBERANA ACIONADA: INICIANDO ENGINE SENTINEL v9.0 ===', 'INFO');
        
        try {
            await _transitionToPhase('BOOT');
            await _transitionToPhase('INIT');
            
            // Amarração segura de eventos pós-inicialização do Barramento
            _bindEvents();
            
            await _transitionToPhase('READY');
            return true;
        } catch (fatalError) {
            _trace('KERNEL', `Falha de inicialização crítica irremediável: ${fatalError.message}`, 'CRITICAL');
            _enterSafeMode(fatalError.message);
            return false;
        }
    };

    // Interface Pública da Autoridade do Runtime
    return {
        boot,
        registerModule: _registerModule,
        unregisterModule: _unregisterModule,
        getModule: _getModule,
        hasModule: _hasModule,
        updateHardwareTelemetry: _updateHardwareTelemetry,
        recoverModule: _recoverModule,
        transitionToPhase: _transitionToPhase,
        getActivePhase: () => _activePhase,
        getModuleStatus: (name) => _moduleHealth.get(name),
        trace: _trace
    };
})();

// Escopo global limpo apenas para exposição do Kernel Soberano
window.SovereignKernel = SentinelKernel;
