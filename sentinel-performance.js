/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.5 — HARDENED HOMEOSTASIS ENGINE (PERFORMANCE GOVERNOR)
 * Arquivo: sentinel-performance.js
 * Papel: Homeostase Operacional, Perfilamento Térmico e Prevenção de Colapso
 * Estado: Produção / Hardened (Resistente a falhas e vazamentos)
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const PERFORMANCE_TIERS = Object.freeze({
    LOW:    'LOW',    // Modo sobrevivência. Suspensão de efeitos e renderização básica de HUD
    MEDIUM: 'MEDIUM', // Equilíbrio tático. Filtros reduzidos à metade e amostragem nominal
    HIGH:   'HIGH',   // Fidelidade total. Volumetria complexa e buffers sem restrição
    XR:     'XR'      // Prioridade absoluta. Trava determinística de latência ocular e clock
});

class SentinelPerformanceGovernor {
    constructor() {
        this.version = "9.5-PROD-HARDENED";
        this.isActive = false;
        this.currentTier = PERFORMANCE_TIERS.HIGH;
        this._preEmergencyTier = PERFORMANCE_TIERS.HIGH; // Correção 4: Preservação de estado pré-colapso

        // METRIC BUFFER & WINDOWS
        this._frameTimeHistory = [];
        this.historyWindowSize = 60;

        // REGISTROS DE SEGURANÇA & MEMÓRIA (Fix 1)
        this.bus = null;
        this._busListeners = [];
        this._canvasListeners = [];

        // THERMAL ESTIMATION & HYSTERESIS (Fix 5)
        this.thermal = {
            estimatedTemperatureC: 38.0,
            ambientTemperatureC: 24.0,
            criticalThresholdC: 75.0,
            warningThresholdC: 60.0,
            thermalRecoveryThresholdC: 52.0, // Zona de histerese para evitar oscilação espástica
            thermalDissipationFactor: 0.0015
        };

        // GPU METRICS (Fix 10)
        this.gpu = {
            saturationIndex: 0.0,
            averageFrameTimeMs: 0.0,
            vertexLoadFactor: 0.0, // Estimativa matemática baseada em complexidade geométrica/chamadas
            fillratePressure: 0.0
        };

        // PREDICTIVE COLLAPSE DETECTION SYSTEM
        this.prediction = {
            collapseProbability: 0.0,
            timeToThermalThrottlingSec: 999,
            consecutiveFrameDrops: 0
        };

        // ADAPTIVE DEGRADATION MATRIX
        this.degradation = {
            lastDegradationTimestamp: 0,
            cooldownPeriodMs: 2000,
            forceMinimalHud: false
        };

        // HARDWARE INTERFACES & PROFILER
        this.threeRenderer = null;
        this.aframeScene = null;
        this._originalShadowState = false; // Armazenamento seguro de estado gráfico (Fix 3)
        
        this.capabilities = {
            isWebGL2: false,
            maxTextures: 0,
            maxUniforms: 0,
            xrSupported: false,
            legacyLightsDetected: false, // Correção 5: r164 WebGLRenderer deprecation safeguard
            contextLost: false
        };

        this.profiler = {
            cpuFrameCostMs: 0.0,
            gpuFrameCostMs: 0.0,
            drawCalls: 0,
            geometriesCount: 0,
            texturesCount: 0
        };

        // EMERGENCY LOCK (Fix 2 & Fix 9)
        this.emergency = {
            engaged: false,
            blackoutTriggered: false // Sincronizado ao colapso crítico
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // KERNEL RUNTIME CONTRACT (v9.5) & AUTO-REGISTRO SOBERANO
    // ═══════════════════════════════════════════════════════════════════════
    async initialize() {
        this._trace('LIFECYCLE', 'Iniciando handshake do regulador homeostático endurecido v9.5...');
        
        if (window.SentinelBus) {
            this._attachSignalBus(window.SentinelBus);
        } else {
            this._trace('LIFECYCLE', 'Barramento global não detectado durante init. Aguardando injeção.', 'WARN');
        }

        this._scanGlobalContexts();
        this.isActive = true;
        return true;
    }

    heartbeat() {
        return {
            active: this.isActive,
            tier: this.currentTier,
            saturation: this.gpu.saturationIndex,
            thermal: this.thermal.estimatedTemperatureC,
            emergencyEngaged: this.emergency.engaged,
            profiler: {
                drawCalls: this.profiler.drawCalls,
                cpuCost: this.profiler.cpuFrameCostMs
            }
        };
    }

    // DIAGNOSTICS COMPLETO PADRONIZADO (Fix 7)
    getDiagnostics() {
        return {
            tier: this.currentTier,
            thermal: { ...this.thermal },
            gpu: { ...this.gpu },
            prediction: { ...this.prediction },
            emergency: { ...this.emergency },
            capabilities: { ...this.capabilities },
            profiler: { ...this.profiler },
            historyDepth: this._frameTimeHistory.length
        };
    }

    shutdown() {
        this._trace('LIFECYCLE', 'Comando de purga de estado e desalocação estrita de memória iniciado.');
        
        // Fix 1: Purga determinística de Listeners do EventBus
        if (this.bus) {
            for (const { event, handler } of this._busListeners) {
                this.bus.off(event, handler);
            }
        }
        this._busListeners = [];

        // Fix 8: Purga de Listeners de Contexto do Canvas Dom
        this._detachCanvasWatchdogs();

        this.isActive = false;
        this._frameTimeHistory = [];
        this.threeRenderer = null;
        this.aframeScene = null;
        this.bus = null;
        this.emergency.engaged = false;
        this.emergency.blackoutTriggered = false;
        
        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELPER DE MEMÓRIA PARA O BARRAMENTO (Fix 1)
    // ═══════════════════════════════════════════════════════════════════════
    _bindBus(event, handler) {
        if (!this.bus) return;
        this.bus.on(event, handler);
        this._busListeners.push({ event, handler });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GRAPHIC CONTEXT INTERFACES & CONTEXT LOSS WATCHDOGS (Fix 8)
    // ═══════════════════════════════════════════════════════════════════════
    detectRendererCapabilities(renderer) {
        if (!renderer) return;
        this.threeRenderer = renderer;

        // Fix 3: Preserva o estado original de sombras antes de qualquer interferência
        this._originalShadowState = renderer.shadowMap.enabled;

        const gl = renderer.getContext();
        this.capabilities.isWebGL2 = (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext);
        this.capabilities.maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        this.capabilities.maxUniforms = gl.getParameter(this.capabilities.isWebGL2 ? gl.MAX_VERTEX_UNIFORM_BLOCKS : gl.MAX_VERTEX_UNIFORM_VECTORS);
        this.capabilities.xrSupported = !!navigator.xr;
        
        // Correção 5: Prevenção do aviso de depreciação do Three.js (r164+) referente a useLegacyLights
        this.capabilities.legacyLightsDetected = !!renderer.useLegacyLights;

        // Acopla watchdogs de perda de hardware ao elemento de desenho
        this._attachCanvasWatchdogs(gl.canvas);

        this._trace('CAPABILITIES', `Mapeamento concluído. WebGL2: ${this.capabilities.isWebGL2} | Sombras Originais: ${this._originalShadowState}`);
    }

    _attachCanvasWatchdogs(canvas) {
        if (!canvas || this._canvasListeners.length > 0) return;

        const onContextLost = (e) => {
            e.preventDefault();
            this.capabilities.contextLost = true;
            this._trace('HARDWARE_WATCHDOG', 'Contexto WebGL perdido catastroficamente. Congelando loops operacionais.', 'CRITICAL');
            if (this.bus) this.bus.emit('performance:context_lost', { timestamp: performance.now() });
            this.engageEmergencyRenderMode();
        };

        const onContextRestored = () => {
            this.capabilities.contextLost = false;
            this._trace('HARDWARE_WATCHDOG', 'Contexto WebGL restaurado pelo hardware. Reiniciando subsistema gráfico.');
            if (this.threeRenderer) {
                this.detectRendererCapabilities(this.threeRenderer);
            }
            this.disengageEmergencyRenderMode();
            if (this.bus) this.bus.emit('performance:context_restored', { timestamp: performance.now() });
        };

        canvas.addEventListener('webglcontextlost', onContextLost, false);
        canvas.addEventListener('webglcontextrestored', onContextRestored, false);

        this._canvasListeners.push(
            { element: canvas, event: 'webglcontextlost', handler: onContextLost },
            { element: canvas, event: 'webglcontextrestored', handler: onContextRestored }
        );
    }

    _detachCanvasWatchdogs() {
        for (const { element, event, handler } of this._canvasListeners) {
            if (element) {
                element.removeEventListener(event, handler, false);
            }
        }
        this._canvasListeners = [];
    }

    attachAFrameScene(sceneEl) {
        if (!sceneEl) return;
        this.aframeScene = sceneEl;

        if (sceneEl.hasLoaded) {
            this._bindAFrameStructures();
        } else {
            sceneEl.addEventListener('loaded', () => this._bindAFrameStructures(), { once: true });
        }
    }

    _bindAFrameStructures() {
        if (this.aframeScene && this.aframeScene.renderer) {
            this.detectRendererCapabilities(this.aframeScene.renderer);
        }
    }

    _scanGlobalContexts() {
        if (window.AFRAME && window.AFRAME.scenes && window.AFRAME.scenes[0]) {
            this.attachAFrameScene(window.AFRAME.scenes[0]);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // METRICS PROCESSING ENGINE
    // ═══════════════════════════════════════════════════════════════════════
    recordFrameMetrics(actualFrameTimeMs, targetIntervalMs, cpuTimeSplitMs = 0) {
        if (!this.isActive || this.capabilities.contextLost) return;

        // Fix 6: Proteção matemática estrita contra divisão por zero ou intervalos inválidos
        if (!targetIntervalMs || targetIntervalMs <= 0) {
            this._trace('METRICS', 'Intervalo alvo inválido ou zero recebido em recordFrameMetrics. Ignorando tick.', 'WARN');
            return;
        }

        this._frameTimeHistory.push(actualFrameTimeMs);
        if (this._frameTimeHistory.length > this.historyWindowSize) {
            this._frameTimeHistory.shift();
        }

        const sum = this._frameTimeHistory.reduce((a, b) => a + b, 0);
        this.gpu.averageFrameTimeMs = sum / this._frameTimeHistory.length;

        // Saturação e pressão de fillrate protegidas por barreira lógica
        this.gpu.saturationIndex = this.gpu.averageFrameTimeMs / targetIntervalMs;
        this.gpu.fillratePressure = Math.min(1.5, actualFrameTimeMs / (targetIntervalMs * 0.85));

        this.profiler.cpuFrameCostMs = cpuTimeSplitMs;
        this.profiler.gpuFrameCostMs = Math.max(0, actualFrameTimeMs - cpuTimeSplitMs);

        this._harvestRendererTelemetry();
        this._estimateThermalLoad(actualFrameTimeMs);
        this._evaluatePredictiveCollapse(actualFrameTimeMs, targetIntervalMs);
        this._performHomeostaticArbitration();
    }

    _harvestRendererTelemetry() {
        if (this.threeRenderer && this.threeRenderer.info) {
            const info = this.threeRenderer.info;
            this.profiler.drawCalls = info.render.calls || 0;
            this.profiler.geometriesCount = info.memory.geometries || 0;
            this.profiler.texturesCount = info.memory.textures || 0;

            // Fix 10: Cálculo preditivo do fator de carga de vértices baseado em amostragem por DrawCall
            if (this.profiler.drawCalls > 0) {
                this.gpu.vertexLoadFactor = Math.min(1.0, (this.profiler.geometriesCount * 0.05) + (this.profiler.drawCalls / 500));
            } else {
                this.gpu.vertexLoadFactor = 0.0;
            }
        }
    }

    _estimateThermalLoad(frameTimeMs) {
        const workDone = frameTimeMs * (this.currentTier === PERFORMANCE_TIERS.XR ? 1.4 : 1.0);
        const dissipation = (this.thermal.estimatedTemperatureC - this.thermal.ambientTemperatureC) * this.thermal.thermalDissipationFactor;
        
        this.thermal.estimatedTemperatureC += (workDone * 0.005) - dissipation;
        this.thermal.estimatedTemperatureC = Math.max(this.thermal.ambientTemperatureC, this.thermal.estimatedTemperatureC);
    }

    _evaluatePredictiveCollapse(frameTimeMs, targetIntervalMs) {
        if (frameTimeMs > targetIntervalMs * 1.2) {
            this.prediction.consecutiveFrameDrops++;
        } else {
            this.prediction.consecutiveFrameDrops = Math.max(0, this.prediction.consecutiveFrameDrops - 1);
        }

        const frameDropRisk = Math.min(0.6, (this.prediction.consecutiveFrameDrops / 5));
        const thermalRisk = this.thermal.estimatedTemperatureC > this.thermal.warningThresholdC ? 0.3 : 0.0;
        
        this.prediction.collapseProbability = Math.min(1.0, frameDropRisk + thermalRisk);

        if (this.prediction.collapseProbability > 0.80) {
            if (this.currentTier === PERFORMANCE_TIERS.XR) {
                this._trace('COLLAPSE_PREVENTION', 'Risco cinestésico crítico detectado em ambiente espacial. Forçando recuperação ocular.', 'CRITICAL');
                if (window.SentinelEngineXR) {
                    window.SentinelEngineXR.triggerEmergencySpatialRecovery();
                }
                this.prediction.consecutiveFrameDrops = 0;
            } else if (this.prediction.consecutiveFrameDrops >= 8 && !this.emergency.engaged) {
                this.engageEmergencyRenderMode();
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ARBITRAGEM HOMEOSTÁTICA & TRAVA DE EMERGÊNCIA
    // ═══════════════════════════════════════════════════════════════════════
    _performHomeostaticArbitration() {
        // Fix 2: Se o modo de emergência estiver ativo, o Governor trava no estado mínimo e pula a arbitragem normal
        if (this.emergency.engaged) return;

        const now = performance.now();
        if (now - this.degradation.lastDegradationTimestamp < this.degradation.cooldownPeriodMs) {
            return;
        }

        let desiredTier = this.currentTier;

        // Regra de Degradação Térmica Crítica
        if (this.thermal.estimatedTemperatureC >= this.thermal.criticalThresholdC) {
            desiredTier = PERFORMANCE_TIERS.LOW;
            this._trace('HOMEOSTASIS', `Emergência Térmica Extrema (${this.thermal.estimatedTemperatureC.toFixed(1)}°C). Rebaixando para subsistência.`, 'WARN');
        }
        // Regra de Degradação por Carga Gráfica / Gargalo
        else if (this.gpu.saturationIndex > 1.05 || this.prediction.consecutiveFrameDrops >= 4) {
            if (this.currentTier === PERFORMANCE_TIERS.HIGH) desiredTier = PERFORMANCE_TIERS.MEDIUM;
            else if (this.currentTier === PERFORMANCE_TIERS.MEDIUM) desiredTier = PERFORMANCE_TIERS.LOW;
            this._trace('HOMEOSTASIS', `Saturação Crítica (GPU Index: ${this.gpu.saturationIndex.toFixed(2)}). Rebaixando tier operacional.`, 'WARN');
        }
        // Fix 5: Incorporação de Histerese Térmica e de Carga para evitar oscilações frenéticas
        else if (this.gpu.saturationIndex < 0.55 && this.thermal.estimatedTemperatureC <= this.thermal.thermalRecoveryThresholdC) {
            if (this.currentTier === PERFORMANCE_TIERS.LOW) desiredTier = PERFORMANCE_TIERS.MEDIUM;
            else if (this.currentTier === PERFORMANCE_TIERS.MEDIUM && !this._isXRSessionActive()) desiredTier = PERFORMANCE_TIERS.HIGH;
        }

        if (desiredTier !== this.currentTier) {
            this.enforcePerformanceTier(desiredTier);
            this.degradation.lastDegradationTimestamp = now;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONTROLE DE TIERS E REDENSIONAMENTO FÍSICO (Fix 4)
    // ═══════════════════════════════════════════════════════════════════════
    enforcePerformanceTier(tier) {
        this.currentTier = tier;
        this._trace('GOVERNOR', `Mudança autorizada de tier de hardware: [${tier}]`);

        this._scaleRendererPixelRatio();

        if (!this.bus) return;

        switch (tier) {
            case PERFORMANCE_TIERS.LOW:
                this.bus.emit('system:state_changed', { to: 'LOW_POWER' });
                document.documentElement.style.setProperty('--fx-quality', '0.10');
                document.documentElement.style.setProperty('--hud-density', '0.30');
                break;
            case PERFORMANCE_TIERS.MEDIUM:
                this.bus.emit('system:state_changed', { to: 'DEGRADED' });
                document.documentElement.style.setProperty('--fx-quality', '0.50');
                document.documentElement.style.setProperty('--hud-density', '0.70');
                break;
            case PERFORMANCE_TIERS.HIGH:
                this.bus.emit('system:state_changed', { to: 'READY' });
                document.documentElement.style.setProperty('--fx-quality', '1.00');
                document.documentElement.style.setProperty('--hud-density', '1.00');
                break;
            case PERFORMANCE_TIERS.XR:
                this.bus.emit('system:state_changed', { to: 'XR' });
                document.documentElement.style.setProperty('--fx-quality', '0.75');
                document.documentElement.style.setProperty('--hud-density', '1.00');
                break;
        }
    }

    _scaleRendererPixelRatio() {
        if (!this.threeRenderer) return;

        let targetPixelRatio = window.devicePixelRatio || 1;
        switch (this.currentTier) {
            case PERFORMANCE_TIERS.LOW: targetPixelRatio *= 0.50; break;
            case PERFORMANCE_TIERS.MEDIUM: targetPixelRatio *= 0.75; break;
            case PERFORMANCE_TIERS.HIGH: targetPixelRatio = Math.min(targetPixelRatio, 2.0); break;
            case PERFORMANCE_TIERS.XR: targetPixelRatio = Math.min(targetPixelRatio, 1.25); break;
        }

        if (this.emergency.engaged) targetPixelRatio *= 0.70;

        this.threeRenderer.setPixelRatio(targetPixelRatio);

        // Correção 6: Proteção do pipeline XR contra jitter de framebuffer e reallocations pesadas
        if (!this._isXRSessionActive()) {
            // Fix 4: Força desalocação/reajuste interno no framebuffer do WebGL prevenindo borrões residuais e mismatches
            const width = window.innerWidth;
            const height = window.innerHeight;
            this.threeRenderer.setSize(width, height, false);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PROTOCOLOS DE EMERGÊNCIA NUCLEARES (Fix 2, Fix 3, Fix 9)
    // ═══════════════════════════════════════════════════════════════════════
    engageEmergencyRenderMode() {
        // Correção 3: Bloqueio contra loops destrutivos, spam de resize e disparo massivo de eventos
        if (this.emergency.engaged) return;

        this._preEmergencyTier = this.currentTier; // Armazena o estado real imediatamente anterior ao desastre
        this.emergency.engaged = true;
        this.emergency.blackoutTriggered = true;   // Fix 9: Sincronização do estado real de colapso visual
        this.currentTier = PERFORMANCE_TIERS.LOW;   // Fix 2: Força trava de infraestrutura
        
        this._trace('HOMEOSTASIS', 'PROTOCOLO NUCLEAR RESTRITO ATIVADO: EMERGENCY SAFE RENDER COMPRESS.', 'CRITICAL');
        
        if (this.bus) {
            this.bus.emit('performance:emergency_engaged', { thermal: this.thermal.estimatedTemperatureC });
        }

        document.documentElement.style.setProperty('--fx-quality', '0.05');
        document.documentElement.style.setProperty('--hud-density', '0.10');
        
        this._scaleRendererPixelRatio();

        // Desativação cirúrgica de geradores de sombra sob estresse extremo
        if (this.threeRenderer) {
            this.threeRenderer.shadowMap.enabled = false;
        }
    }

    disengageEmergencyRenderMode() {
        if (!this.emergency.engaged) return;

        this.emergency.engaged = false;
        this.emergency.blackoutTriggered = false; // Libera barreira de blackout
        this._trace('HOMEOSTASIS', 'Desativando modo nuclear de emergência. Restaurando sanidade e pipelines originais.');

        // Fix 3: Restaura o pipeline gráfico exatamente ao comportamento que a cena possuía originalmente
        if (this.threeRenderer) {
            this.threeRenderer.shadowMap.enabled = this._originalShadowState;
        }
        
        // Correção 4: Garante que o governor recupere a sanidade de hardware voltando ao tier anterior e não ficando preso em LOW
        this.enforcePerformanceTier(this._preEmergencyTier);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HANDSHAKE DO BARRAMENTO & INTERFACES
    // ═══════════════════════════════════════════════════════════════════════
    _isXRSessionActive() {
        return !!(window.SentinelEngineXR && window.SentinelEngineXR.isActive);
    }

    _trace(subsystem, message, level = 'INFO') {
        const formatted = `[${new Date().toISOString()}] [PERFORMANCE-GOVERNOR:${subsystem}] [${level}] ${message}`;
        if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
        else if (level === 'WARN') console.warn(formatted);
        else console.log(formatted);
    }

    _attachSignalBus(busInstance) {
        // Correção 7: Proteção absoluta contra duplo anexo / vazamento de memória no Kernel Handshake
        if (this.bus === busInstance) return;
        
        this.bus = busInstance;

        // Fix 1: Vinculação usando o Helper de rastreamento para expurgo posterior
        this._bindBus('xr:session_start', () => {
            this.enforcePerformanceTier(PERFORMANCE_TIERS.XR);
            this.historyWindowSize = 90; 
        });

        this._bindBus('xr:session_end', () => {
            this.enforcePerformanceTier(PERFORMANCE_TIERS.HIGH);
            this.historyWindowSize = 60;
        });

        // Correção 1: Ajuste de Namespace corporativo ilegal. Modificado de 'renderer:hardware_bound' para 'performance:hardware_bound'
        this._bindBus('performance:hardware_bound', (data) => {
            if (data && data.renderer) this.detectRendererCapabilities(data.renderer);
        });
    }
}

const SovereignPerformance = new SentinelPerformanceGovernor();

// Correção 2: Unificação e consistência com os bindings globais do ecossistema do Kernel e HUD
window.SovereignPerformance = SovereignPerformance;
window.SentinelPerformance  = SovereignPerformance;

if (window.SovereignKernel) {
    window.SovereignKernel.registerModule('sentinel-performance', SovereignPerformance);
}

export default SovereignPerformance;
