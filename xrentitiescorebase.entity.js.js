/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE ENTITY RUNTIME INFRASTRUCTURE
 * Arquivo: xr/entities/core/base.entity.js
 * Papel: Classe Abstrata Fundamental e Contratos de Ciclo de Vida Cognitivo
 * ═══════════════════════════════════════════════════════════════════════════
 */

class SentinelBaseEntity {
    constructor(entityId, entityType = 'GENERIC_COGNITIVE') {
        if (this.constructor === SentinelBaseEntity) {
            throw new TypeError('Não é possível instanciar a classe abstrata SentinelBaseEntity diretamente.');
        }

        // 1. Identidade e Metadados Estruturais
        this.entityId = entityId;
        this.entityType = entityType;
        this.lifecycleState = 'UNLOADED'; // UNLOADED, SUSPENDED, ACTIVE, FOCUSING, DESTROYED
        this.visibilityState = 'HIDDEN';   // VISIBLE, SUPRESSED, HIDDEN, OCCLUDED, FOCUS-ONLY

        // 2. Perfis de Controle Perceptivo e Semântico (Devem ser sobrescritos pelas subclasses)
        this.profiles = {
            attentionProfile: {
                weight: 1.0,               // Multiplicador base de relevância atencional
                focusAffinity: 0.5,        // Afinidade com o centro da fóvea do operador
                semanticPriority: 1        // Rank de importância por significado tático
            },
            performanceProfile: {
                gpuCostFraction: 0.01,     // Fração máxima estimada de consumo do tempo de frame da GPU
                performanceBudget: 16.6,   // Tempo alvo de execução em ms (Nominal para 60-90Hz)
                lodLevel: 0                // Nível de Detalhe Ativo (0 = Máximo, 3 = Mínimo/Texto)
            },
            xrProfile: {
                depthZ: -2.0,              // Projeção de distância padrão em metros no espaço XR
                motionLevel: 1.0,          // Escala de movimento interno permissível (anti-jitter)
                stabilizationSafe: true    // Travamento de segurança vestibular ativo
            },
            semanticProfile: {
                missionContextId: 'NULL',  // Vínculo direto com o ID da missão global ativa
                relevanceScore: 0.5        // Pontuação volátil de utilidade imediata para o operador
            }
        };

        // 3. Estado Físico e Acopladores de Efeitos (Ponte com WebGL/CSS)
        this.spatialState = { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } };
        this.fxAffinity = { intensity: 1.0, glowColor: 'var(--cyan)' };
        this.audioAffinity = { track: null, spatialized: true, gain: 1.0 };
        this.domReference = null;          // Referência opcional de elemento do DOM (A-Frame / Elemento Customizado)
    }

    // 4. Métodos do Ciclo de Vida Semântico Operacional (A serem customizados)

    async onCreate() {
        this.lifecycleState = 'SUSPENDED';
        this.visibilityState = 'HIDDEN';
        console.log(`[ENTITY] Unidade inicializada em cache: ${this.entityId} [${this.entityType}]`);
        return true;
    }

    async onActivate() {
        this.lifecycleState = 'ACTIVE';
        this.visibilityState = 'VISIBLE';
        this._syncHardwareBridge();
        return true;
    }

    async onFocus() {
        this.lifecycleState = 'FOCUSING';
        this.visibilityState = 'FOCUS-ONLY';
        this.profiles.attentionProfile.focusAffinity = 1.0;
        this._applyVisualStateFeedback(true);
        return true;
    }

    async onBlur() {
        this.lifecycleState = 'ACTIVE';
        this.visibilityState = 'VISIBLE';
        this.profiles.attentionProfile.focusAffinity = 0.5;
        this._applyVisualStateFeedback(false);
        return true;
    }

    async onSuspend() {
        this.lifecycleState = 'SUSPENDED';
        this.visibilityState = 'HIDDEN';
        this._syncHardwareBridge();
        return true;
    }

    async onRecover() {
        console.warn(`[ENTITY:RECOVER] Reajustando restrições de sanidade para a unidade: ${this.entityId}`);
        this.profiles.performanceProfile.lodLevel = 2; // Degrada visual para salvar processamento
        this.profiles.attentionProfile.weight = 0.8;
        return this.onActivate();
    }

    async onDestroy() {
        this.lifecycleState = 'DESTROYED';
        this.visibilityState = 'HIDDEN';
        if (this.domReference && this.domReference.parentNode) {
            this.domReference.parentNode.removeChild(this.domReference);
        }
        this.domReference = null;
        return true;
    }

    // 5. Auxiliares de Sincronização do Motor (Ponte Interna)

    /**
     * Sincroniza estados lógicos com classes CSS do SENTINEL (`hud.css`, `fx.css`) e atributos XR físicos
     */
    _syncHardwareBridge() {
        if (!this.domReference) return;

        // Gerencia visibilidade física baseada no estado perceptivo
        if (this.visibilityState === 'HIDDEN' || this.visibilityState === 'OCCLUDED') {
            this.domReference.setAttribute('visible', 'false');
            this.domReference.classList.add('hud-attention-suppressed');
        } else {
            this.domReference.setAttribute('visible', 'true');
            this.domReference.classList.remove('hud-attention-suppressed');
            
            // Injeta variáveis CSS diretamente no escopo da entidade para manipulação de Shaders e Efeitos
            this.domReference.style.setProperty('--hud-opacity', this.visibilityState === 'SUPRESSED' ? '0.2' : '1.0');
            this.domReference.style.setProperty('--hud-focus-strength', this.profiles.attentionProfile.focusAffinity.toFixed(2));
        }
    }

    _applyVisualStateFeedback(isFocused) {
        if (!this.domReference) return;
        if (isFocused) {
            this.domReference.classList.add('hud-attention-primary', 'hud-focus-lock');
            this.domReference.classList.remove('hud-attention-secondary');
        } else {
            this.domReference.classList.remove('hud-attention-primary', 'hud-focus-lock');
            this.domReference.classList.add('hud-attention-secondary');
        }
    }
}

// Exportação global para vinculação arquitetural
window.SentinelBaseEntity = SentinelBaseEntity;