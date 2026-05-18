/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE ENTITY RUNTIME INFRASTRUCTURE
 * Arquivo: xr/entities/core/base.entity.js
 * Papel: Classe Abstrata Fundamental, Componente A-Frame e Contratos de Gatilhos
 * Domínio: SPATIAL INTERFACE / PERCEPTUAL INHIBITION / AUTOMATED ACTION
 * Fix: Fusão da estrutura abstrata v9.0 com o componente de registro A-Frame
 * ═══════════════════════════════════════════════════════════════════════════
 */

if (typeof AFRAME === 'undefined') {
    throw new Error('[VR-OS ENTITY] A-Frame não detectado na inicialização da entidade base.');
}

/**
 * 1. CLASSE ABSTRATA SOBERANA (CONTRATOS LOGICOS E COMPORTAMENTAIS)
 */
class SentinelBaseEntity {
    constructor(entityId, entityType = 'GENERIC_COGNITIVE') {
        if (this.constructor === SentinelBaseEntity) {
            throw new TypeError('Não é possível instanciar a classe abstrata SentinelBaseEntity diretamente.');
        }

        // Identidade e Metadados Estruturais
        this.entityId = entityId;
        this.entityType = entityType;
        this.lifecycleState = 'UNLOADED'; // UNLOADED, SUSPENDED, ACTIVE, FOCUSING, DESTROYED
        this.visibilityState = 'HIDDEN';   // VISIBLE, SUPRESSED, HIDDEN, OCCLUDED, FOCUS-ONLY

        // Perfis de Controle Perceptivo e Semântico 
        this.profiles = {
            attentionProfile: {
                weight: 1.0,               // Multiplicador base de relevância atencional
                focusAffinity: 0.5,        // Afinidade com o centro da fóvea do operador
                semanticPriority: 1        // Rank de importância por significado tático
            },
            performanceProfile: {
                gpuCostFraction: 0.05,     // Estimativa de impacto no pipeline do fragment shader
                allocationBudgetMs: 0.2     // Fração máxima de processamento permitida por frame
            }
        };
    }

    // Handshake de Ativação Perceptiva
    activate() {
        this.lifecycleState = 'ACTIVE';
        this.visibilityState = 'VISIBLE';
    }

    suspend() {
        this.lifecycleState = 'SUSPENDED';
        this.visibilityState = 'SUPRESSED';
    }
}

// Registro na janela para heranças futuras e extensões de sistema
window.SentinelBaseEntity = SentinelBaseEntity;


/**
 * 2. COMPONENTE WEBXR A-FRAME (ACOPLAMENTO GEOMÉTRICO AO DOM ESPACIAL)
 */
AFRAME.registerComponent('sentinel-base-entity', {
    schema: {
        actionId: { type: 'string', default: 'generic-trigger' },
        latencyThreshold: { type: 'number', default: 100 },
        weight: { type: 'float', default: 1.0 },
        semanticPriority: { type: 'int', default: 1 }
    },

    // Inicialização nativa do ciclo de vida tridimensional
    init: function () {
        this.el.classList.add('cognitive-transition', 'layer-context');
        
        // Instanciação interna ligada à arquitetura de classes abstratas
        this.runtimeInstance = {
            entityId: this.data.actionId,
            lifecycleState: 'ACTIVE',
            visibilityState: 'VISIBLE',
            isFocused: false
        };

        // Cache de referências e binds para evitar alocações dinâmicas na memória (Anti-GC Jitter)
        this._boundFocusEnter = this.onFocusEnter.bind(this);
        this._boundFocusLeave = this.onFocusLeave.bind(this);
        this._boundExecuteAction = this.executeAction.bind(this);

        this.setupHardwareListeners();
    },

    // Registro estrito de listeners isolados por nó geométrico
    setupHardwareListeners: function () {
        this.el.addEventListener('mouseenter', this._boundFocusEnter);
        this.el.addEventListener('mouseleave', this._boundFocusLeave);
        this.el.addEventListener('click', this._boundExecuteAction);
    },

    // Remoção cirúrgica de eventos ao desincorporar o objeto (Prevenção de Memory Leaks)
    remove: function () {
        this.el.removeEventListener('mouseenter', this._boundFocusEnter);
        this.el.removeEventListener('mouseleave', this._boundFocusLeave);
        this.el.removeEventListener('click', this._boundExecuteAction);
    },

    // GATILHO: Intersecção do Olhar (Foco Foveal Ativado)
    onFocusEnter: function () {
        this.runtimeInstance.isFocused = true;
        this.runtimeInstance.lifecycleState = 'FOCUSING';
        
        // Modificação de estado estético via transformações aceleradas na GPU (Zero Reflow)
        this.el.setAttribute('animation__focus', 'property: scale; to: 1.05 1.05 1.05; dur: 120; easing: easeOutQuad');
        this._syncHardwareBridge(true);

        // Comunicação instantânea com o Barramento Central do Ecossistema
        if (window.SentinelBus) {
            window.SentinelBus.emit('xr:gaze_moved', {
                target: this.data.actionId,
                gazeVector: this.el.object3D.position,
                urgency: 0.5,
                distance: this.el.object3D.position.length()
            });
        }
        
        this._trace('FOCUS', `Foco foveal estabelecido na entidade ID: [${this.data.actionId}]`);
    },

    // GATILHO: Evasão do Olhar (Inibição Perceptual)
    onFocusLeave: function () {
        this.runtimeInstance.isFocused = false;
        this.runtimeInstance.lifecycleState = 'ACTIVE';
        
        this.el.setAttribute('animation__focus', 'property: scale; to: 1 1 1; dur: 120; easing: easeOutQuad');
        this._syncHardwareBridge(false);
        
        this._trace('FOCUS', `Foco evacuado da entidade ID: [${this.data.actionId}]`);
    },

    // GATILHO: Disparo de Ação Mecânica ou Intencional
    executeAction: function () {
        const timestamp = performance.now();

        // 1. Despacha evento de bolha nativo do DOM para árvores lógicas superiores
        const event = new CustomEvent('sentinel-trigger', {
            detail: { actionId: this.data.actionId, timestamp: timestamp },
            bubbles: true,
            composed: true
        });
        this.el.dispatchEvent(event);

        // 2. Acionamento assíncrono direto do Kernel através do barramento CMA (Ignora UI Central)
        if (window.SentinelBus) {
            window.SentinelBus.emit('nexus:command', {
                command: 'EXECUTE_AUTOMATION',
                payload: { actionId: this.data.actionId, initiatedAt: timestamp },
                source: 'SPATIAL_ENTITY_GATED'
            });
        }

        this._trace('AUTOMATION', `Gatilho acionado. Intenção mapeada diretamente para o Kernel: [${this.data.actionId}]`, 'SUCCESS');
    },

    // Ponte de Hardware: Sincroniza classes e variáveis CSS sem alocações pesadas
    _syncHardwareBridge: function (isFocused) {
        if (isFocused) {
            this.el.classList.add('layer-focus', 'hud-focus-lock');
            this.el.classList.remove('layer-context');
            this.el.style.setProperty('--hud-opacity', '1.0');
            this.el.style.setProperty('--hud-focus-strength', '1.00');
        } else {
            this.el.classList.remove('layer-focus', 'hud-focus-lock');
            this.el.classList.add('layer-context');
            this.el.style.setProperty('--hud-opacity', '0.78');
            this.el.style.setProperty('--hud-focus-strength', '0.50');
        }
    },

    _trace: function (subsystem, message, level = 'INFO') {
        console.log(`[${new Date().toISOString()}] [ENTITY_RUNTIME:${subsystem}] [${level}] ${message}`);
    }
});

console.log("%c[SENTINEL XR] Componente 'sentinel-base-entity' e blueprint de abstração instanciados com sucesso.", "color: #00D4FF; font-weight: bold;");
