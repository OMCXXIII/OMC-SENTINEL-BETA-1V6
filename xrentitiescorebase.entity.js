/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE ENTITY RUNTIME INFRASTRUCTURE
 * Arquivo: xr/entities/core/base.entity.js
 * Papel: Classe Abstrata Fundamental e Contratos de Ciclo de Vida Cognitivo
 * Domínio: ENTITY GOVERNANCE / ATTACHMENT / PERCEPTUAL WEIGHT / RENDERING TIERS
 * * COMPLIANCE DE ARQUITETURA DE DADOS:
 * ✓ A) ENTITY LIFECYCLE: Estados rígidos de inicialização, suspensão e purga.
 * ✓ B) ATTENTION WEIGHT: Cálculo dinâmico de afinidade foveal e carga atencional.
 * ✓ C) RENDER PRIORITY: Vínculo explícito de buffers de rasterização acoplados à GPU.
 * ✓ D) MEMORY ATTACHMENT: Sincronização direta com a memória L1/L2 e snapshots de dump.
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
        
        /**
         * A) ENTITY LIFECYCLE
         * Estados: UNLOADED ──► INITIALIZED ──► ACTIVE ◄──► SUSPENDED ──► DESTROYED
         */
        this.lifecycleState = 'UNLOADED'; 
        this.visibilityState = 'HIDDEN';   // VISIBLE, SUPRESSED, HIDDEN, OCCLUDED, FOCUS-ONLY

        // 2. B) ATTENTION WEIGHT & PERCEPTUAL PROFILE
        this.profiles = {
            attentionProfile: {
                weight: 1.0,               // Multiplicador base de relevância atencional
                focusAffinity: 0.5,        // Afinidade matemática com o centro da fóvea do operador
                semanticPriority: 1,       // Rank de importância por significado tático
                calculatedAttentionWeight: 0.5 // Peso composto atualizado pelo runtime
            },
            /**
             * C) RENDER PRIORITY
             * Camadas: 0 (BACKGROUND), 1 (ENVIRONMENT), 2 (WORLD), 3 (INTERACTION), 4 (FOCUS)
             */
            performanceProfile: {
                gpuCostFraction: 0.01,     // Fração presumida de consumo da GPU
                renderPriorityLayer: 2,    // Camada padrão (WORLD) mapeada no sentinel-renderer.js
                refreshRateHz: 90          // Frequência de atualização de transformações
            }
        };

        // 3. D) MEMORY ATTACHMENT CONFIGURATION
        this.memoryAttachment = {
            tier: 'VOLATILE',              // VOLATILE, SESSION, PERSISTENT, ARCHIVAL
            autoSaveIntervalMs: 5000,
            lastSyncedTimestamp: null,
            isDirty: false
        };

        this.domReference = null;
        this.bus = window.SentinelBus || null;
    }

    /**
     * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     * A) ENTITY LIFECYCLE MANAGEMENT
     * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    initializeEntity(domElementNode = null) {
        if (this.lifecycleState !== 'UNLOADED') return false;
        
        this.domReference = domElementNode;
        this.lifecycleState = 'INITIALIZED';
        this.visibilityState = 'HIDDEN';
        
        this.onInitialize();
        this._syncHardwareBridge();
        this._trace('LIFECYCLE', `Entidade instanciada com sucesso no pipeline.`);
        return true;
    }

    activateEntity() {
        if (this.lifecycleState !== 'INITIALIZED' && this.lifecycleState !== 'SUSPENDED') return false;
        
        this.lifecycleState = 'ACTIVE';
        this.visibilityState = 'VISIBLE';
        
        this.onActivate();
        this._syncHardwareBridge();
        this._attachToMemorySystems();
        this._trace('LIFECYCLE', `Entidade promovida ao estado ativo de processamento.`);
        return true;
    }

    suspendEntity() {
        if (this.lifecycleState !== 'ACTIVE') return false;
        
        this.lifecycleState = 'SUSPENDED';
        this.visibilityState = 'SUPRESSED';
        
        this.onSuspend();
        this._syncHardwareBridge();
        this._trace('LIFECYCLE', `Entidade suspensa por ociosidade ou limiar de hardware.`);
        return true;
    }

    destroyEntity() {
        this.lifecycleState = 'DESTROYED';
        this.visibilityState = 'HIDDEN';
        
        this.onDestroy();
        this._detachFromMemorySystems();
        
        if (this.domReference) {
            this.domReference.remove();
            this.domReference = null;
        }
        
        this._trace('LIFECYCLE', `Entidade purgada e removida completamente da memória volátil.`);
        return true;
    }

    /**
     * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     * B) ATTENTION WEIGHT MATHEMATICAL CALCULUS
     * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    recalculateAttentionWeight(gazeVectorX, gazeVectorY) {
        if (this.lifecycleState !== 'ACTIVE') return 0.0;

        // Recupera coordenadas físicas se o nó A-Frame estiver anexado
        let distanceMultiplier = 1.0;
        if (this.domReference) {
            const position = this.domReference.getAttribute('position') || { x: 0, y: 0, z: -1 };
            // Calcula a divergência angular ou distância escalar simples em relação ao foco foveal
            const deltaX = position.x - gazeVectorX;
            const deltaY = position.y - gazeVectorY;
            const angularDeviation = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Inverte para que desvios menores gerem afinidade atencional mais alta
            this.profiles.attentionProfile.focusAffinity = Math.max(0.0, 1.0 - (angularDeviation * 0.4));
            
            // Amostragem de profundidade para balanceamento de escala
            distanceMultiplier = Math.min(1.0, 1.0 / Math.abs(position.z || 1.0));
        }

        // Equação de composição de relevância perceptiva
        const baseWeight = this.profiles.attentionProfile.weight;
        const affinity = this.profiles.attentionProfile.focusAffinity;
        const semantic = this.profiles.attentionProfile.semanticPriority;

        const calculated = (baseWeight * 0.4) + (affinity * 0.4) + (semantic * 0.2) * distanceMultiplier;
        this.profiles.attentionProfile.calculatedAttentionWeight = Math.min(1.0, Math.max(0.0, calculated));

        // Feedback reativo de comportamento de camada se houver trava de foco
        const isFocused = this.profiles.attentionProfile.calculatedAttentionWeight > 0.78;
        this._applyVisualStateFeedback(isFocused);

        return this.profiles.attentionProfile.calculatedAttentionWeight;
    }

    /**
     * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     * C) RENDER PRIORITY MANAGEMENT
     * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    setRenderLayerPriority(targetLayerId) {
        if (targetLayerId < 0 || targetLayerId > 4) {
            this._trace('RENDER_ERROR', `Camada de desenho inválida: ${targetLayerId}`);
            return false;
        }

        this.profiles.performanceProfile.renderPriorityLayer = targetLayerId;
        
        // Se ativo, notifica o sentinel-renderer.js para re-ordenar a árvore de desenho imediatamente
        if (this.lifecycleState === 'ACTIVE' && this.bus) {
            this.bus.emit('renderer:layer_rebound', {
                entityId: this.entityId,
                newLayer: targetLayerId
            });
        }
        
        this._syncHardwareBridge();
        return true;
    }

    /**
     * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     * D) MEMORY ATTACHMENT & CACHE SYNCHRONIZATION
     * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    _attachToMemorySystems() {
        const attachedTier = this.memoryAttachment.tier;
        this._trace('MEMORY_ATTACH', `Vinculando barramento de persistência ao Tier: [${attachedTier}]`);
        
        // Injeta gatilho de escuta no StateStore global (L1/L2)
        if (window.StateStore) {
            const currentCache = window.StateStore.get(`entities.${this.entityId}`) || null;
            if (currentCache) {
                this.hydrateFromMemorySnapshot(currentCache);
            }
        }
    }

    _detachFromMemorySystems() {
        if (this.memoryAttachment.tier === 'PERSISTENT' && window.StateStore) {
            // Garante gravação estrita em disco L3 (localStorage) antes da remoção final do nó
            this.commitToPersistentStore();
        }
    }

    commitToPersistentStore() {
        const snapshot = this.createMemorySnapshot();
        if (window.StateStore) {
            window.StateStore.set(`entities.${this.entityId}`, snapshot);
            this.memoryAttachment.lastSyncedTimestamp = performance.now();
            this.memoryAttachment.isDirty = false;
            return true;
        }
        return false;
    }

    createMemorySnapshot() {
        return {
            entityId: this.entityId,
            entityType: this.entityType,
            lifecycleState: this.lifecycleState,
            attentionProfile: { ...this.profiles.attentionProfile },
            performanceProfile: { ...this.profiles.performanceProfile },
            timestamp: Date.now()
        };
    }

    hydrateFromMemorySnapshot(snapshot) {
        if (!snapshot || snapshot.entityId !== this.entityId) return false;
        
        if (snapshot.attentionProfile) {
            this.profiles.attentionProfile = { ...this.profiles.attentionProfile, ...snapshot.attentionProfile };
        }
        if (snapshot.performanceProfile) {
            this.profiles.performanceProfile = { ...this.profiles.performanceProfile, ...snapshot.performanceProfile };
        }
        
        this.memoryAttachment.lastSyncedTimestamp = performance.now();
        this._trace('MEMORY_HYDRATE', `Memória do componente re-constituída via snapshot ativo.`);
        return true;
    }

    /**
     * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     * MÉTODOS PRIVADOS E COMPONENTES DE DRIVER INTERNO
     * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
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
            this.domReference.style.setProperty('--hud-render-priority', this.profiles.performanceProfile.renderPriorityLayer.toString());
        }
    }

    _applyVisualStateFeedback(isFocused) {
        if (!this.domReference) return;
        if (isFocused) {
            this.domReference.classList.add('hud-attention-primary', 'hud-focus-lock');
            this.domReference.classList.remove('hud-attention-secondary');
            
            // Eleva dinamicamente a prioridade de renderização para a camada FOCUS se o operador travar o olhar
            if (this.profiles.performanceProfile.renderPriorityLayer !== 4) {
                this.setRenderLayerPriority(4);
            }
        } else {
            this.domReference.classList.remove('hud-attention-primary', 'hud-focus-lock');
            this.domReference.classList.add('hud-attention-secondary');
            
            // Restaura para a camada normal de mundo (WORLD) se perder a centralidade do olhar
            if (this.profiles.performanceProfile.renderPriorityLayer === 4) {
                this.setRenderLayerPriority(2);
            }
        }
    }

    // Métodos abstratos gancho (Hook Interface) que serão implementados pelas subclasses
    onInitialize() {}
    onActivate() {}
    onSuspend() {}
    onDestroy() {}

    _trace(action, msg) {
        console.log(`%c[SENTINEL_ENTITY] [${action}] [${this.entityId}] ${msg}`, 'color:#FFC400; font-style: italic;');
    }
}

// Exportação global para vinculação arquitetural
window.SentinelBaseEntity = SentinelBaseEntity;
