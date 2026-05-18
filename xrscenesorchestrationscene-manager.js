/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE XR SCENE RUNTIME ORCHESTRATOR
 * Arquivo: xr/scenes/orchestration/scene-manager.js
 * Papel: Governador Soberano de Estados Espaciais Cognitivos e Pressão GPU
 * ═══════════════════════════════════════════════════════════════════════════
 */

class SentinelSceneManager {
    constructor() {
        this.registry = new Map();
        this.activeScene = null;
        this.transitioning = false;
        this.bus = window.SentinelBus || null;
        
        this._initGlobalListeners();
    }

    /**
     * Registra uma cena na infraestrutura de runtime
     * @param {string} id - Identificador único da cena cognitiva
     * @param {Object} sceneInstance - Instância estendida da cena
     */
    registerScene(id, sceneInstance) {
        if (this.registry.has(id)) {
            console.warn(`[SCENE-MANAGER] Sobrescrevendo registro da cena: ${id}`);
        }
        this.registry.set(id, sceneInstance);
        console.log(`[SCENE-MANAGER] Estado espacial registrado: ${id}`);
    }

    /**
     * Muta o estado espacial atual do sistema com governança de transição e hardware
     * @param {string} targetId - ID da cena de destino
     * @param {string} transitionType - Tipo de transição cognitiva a aplicar
     */
    async activateScene(targetId, transitionType = 'focus') {
        if (this.transitioning) {
            console.warn('[SCENE-MANAGER] Ativação bloqueada: Transição concorrente em progresso.');
            return false;
        }

        const nextScene = this.registry.get(targetId);
        if (!nextScene) {
            console.error(`[SCENE-MANAGER] Falha catastrófica: Cena não encontrada -> ${targetId}`);
            this._triggerFallback();
            return false;
        }

        this.transitioning = true;
        const currentScene = this.activeScene;

        console.log(`[SCENE-MANAGER] Iniciando mutação de estado: ${currentScene?.identity || 'NULL'} ➔ ${targetId}`);

        try {
            // 1. Notifica o Barramento Global do Sistema
            this.bus?.emit('scene:transition-start', { from: currentScene?.identity, to: targetId, type: transitionType });

            // 2. Aplica Perfil de Transição Cognitiva Visual / Suprime Estresse Retiniano
            this._applyTransitionMetrics(transitionType, true);

            // 3. Executa Desativação da Cena Atual (onBlur -> onSuspend)
            if (currentScene) {
                await currentScene.onBlur();
                await currentScene.onSuspend();
                // Se a cena antiga for de baixa prioridade, descarrega entidades para liberar RAM/GPU
                if (currentScene.priorityProfile?.unloadOnSuspend) {
                    await currentScene.onDestroy();
                }
            }

            // 4. Carrega e Inicializa a Nova Cena se necessário
            if (!nextScene.initialized) {
                await nextScene.onLoad();
            }

            // 5. Aplica Restrições de Hardware e Perfis de Atenção na Pipeline antes da renderização
            this._enforceProfiles(nextScene);

            // 6. Ativa e Foca a Nova Cena
            await nextScene.onActivate();
            await nextScene.onFocus();

            this.activeScene = nextScene;

            // 7. Finaliza a Transição e Remove Mascaramento Visual
            this._applyTransitionMetrics(transitionType, false);
            this.bus?.emit('scene:transition-complete', { active: targetId });
            
            console.log(`%c [SCENE-MANAGER] Estado '${targetId}' assumiu a soberania do runtime visual. `, 'background:#000; color:#00D4FF;');

        } catch (error) {
            console.error(`[SCENE-MANAGER] Erro crítico durante ciclo de vida da cena:`, error);
            await this.recoverScene(targetId, error);
        } finally {
            this.transitioning = false;
        }
    }

    /**
     * Força a aplicação estrita de perfis de GPU, Atenção e XR no DOM/Renderer
     * @param {Object} scene - Instância da cena ativa
     */
    _enforceProfiles(scene) {
        const root = document.documentElement;

        // Injeção de Variáveis CSS de Controle de Fluxo Perceptivo (Ligar ao hud.css / fx.css)
        root.style.setProperty('--fx-intensity', scene.profiles.fxIntensity.toFixed(2));
        root.style.setProperty('--fx-density', scene.profiles.cognitiveDensity.toFixed(2));
        root.style.setProperty('--hud-opacity', scene.profiles.hudOpacity.toFixed(2));
        root.style.setProperty('--hud-density', scene.profiles.cognitiveDensity.toFixed(2));
        root.style.setProperty('--fx-motion-scale', scene.profiles.motionScale.toFixed(2));
        root.style.setProperty('--fx-immersion-scale', scene.profiles.xrDepthScale.toFixed(2));

        // Mutação de Classes Estruturais no Body para Chaveamento de Shader / Filtros CSS
        const body = document.body;
        
        // Remove classes adaptativas anteriores
        body.classList.remove('fx-degraded', 'fx-minimal', 'fx-recovery', 'fx-low-stimulation', 'hud-recovery', 'hud-minimal');
        
        // Injeta classes de densidade cognitiva baseadas no perfil da cena
        if (scene.profiles.cognitiveDensity < 0.3) {
            body.classList.add('fx-minimal', 'hud-minimal');
        }
        if (scene.identity === 'recovery') {
            body.classList.add('fx-recovery', 'fx-low-stimulation', 'hud-recovery');
        }

        // Informa o Renderer de Hardware (Three.js / A-Frame / WebGPU Bridge) sobre o orçamento de processamento
        if (window.SentinelEngineXR) {
            window.SentinelEngineXR.setGpuBudget(scene.profiles.gpuBudgetFraction);
            window.SentinelEngineXR.setTargetFps(scene.profiles.targetFps);
            window.SentinelEngineXR.togglePeripheralCulling(scene.profiles.cognitiveDensity < 0.6);
        }
    }

    /**
     * Executa protocolo de mitigação e recuperação em caso de travamento de frame ou exceção
     */
    async recoverScene(failedId, error) {
        console.error(`[SCENE-MANAGER] Ativando Protocolo de Recuperação Espacial para: ${failedId}`);
        this.bus?.emit('system:error-fallback', { scene: failedId, reason: error?.message });
        
        this.transitioning = false;
        // Salto direto para a cena de recuperação nativa de falhas do SENTINEL
        await this.activateScene('recovery', 'emergency');
    }

    _applyTransitionMetrics(type, isStart) {
        const overlay = document.getElementById('scene-transition-overlay') || this._createTransitionOverlay();
        if (isStart) {
            overlay.className = `transition-active mode-${type}`;
            overlay.style.opacity = '1';
        } else {
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.className = ''; }, 400);
        }
    }

    _createTransitionOverlay() {
        const el = document.createElement('div');
        el.id = 'scene-transition-overlay';
        el.style = 'position:fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:99999; transition: opacity 0.3s ease-in-out; opacity:0; background: #000408;';
        document.body.appendChild(el);
        return el;
    }

    _triggerFallback() {
        document.body.classList.add('fx-degraded', 'hud-minimal');
        document.documentElement.style.setProperty('--fx-intensity', '0.1');
    }

    _initGlobalListeners() {
        // Escuta o barramento para degradação forçada em caso de estresse de hardware (Telemetria do Kernel)
        this.bus?.on('performance:drop', (telemetry) => {
            if (telemetry.fps < 30 && this.activeScene?.identity !== 'recovery') {
                console.warn('[SCENE-MANAGER] Queda severa de FPS detectada. Forçando migração para micro-infraestrutura adaptativa.');
                this.activateScene('degraded', 'emergency');
            }
        });

        this.bus?.on('system:nsdr-trigger', () => {
            console.log('[SCENE-MANAGER] Sinal de exaustão biológica recebido. Forçando transição para Recovery Scene.');
            this.activateScene('recovery', 'semantic');
        });
    }
}

// Inicialização Global no Contexto Soberano
window.SentinelSceneManager = new SentinelSceneManager();
