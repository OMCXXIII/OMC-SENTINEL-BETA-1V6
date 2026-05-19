/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.5 — ADAPTIVE HOMEOSTASIS ENGINE (PERFORMANCE GOVERNOR)
 * Arquivo: sentinel-performance.js
 * Papel: Homeostase Operacional, Perfilamento Térmico e Prevenção de Colapso
 * Governança: Totalmente subordinado ao SovereignKernel; dita regras de Throttling.
 * Fix: Implementação de Thermal Estimation, GPU Saturation Index, Adaptive
 * Degradation, Predictive Collapse Logic e Escalonamento Estrito de Tiers.
 * Integração: Three.js r164 Legacy Lights Detection, A-Frame 1.6.0, Dynamic Pixel Ratio.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// F) PERFORMANCE TIERS: Matriz Homologada de Operação do Sistema
export const PERFORMANCE_TIERS = Object.freeze({
    LOW:    'LOW',    // Modo sobrevivência. Suspensão de efeitos e renderização básica de HUD
    MEDIUM: 'MEDIUM', // Equilíbrio tático. Filtros reduzidos à metade e amostragem nominal
    HIGH:   'HIGH',   // Fidelidade total. Volumetria complexa e buffers sem restrição
    XR:     'XR'      // Prioridade absoluta. Trava determinística de latência ocular e clock
});

class SentinelPerformanceGovernor {
    constructor() {
        this.version = "9.5-HOMEOSTASIS-GOVERNOR";
        this.isActive = false;
        this.currentTier = PERFORMANCE_TIERS.HIGH;

        // METRIC BUFFER & WINDOWS
        this._frameTimeHistory = [];
        this.historyWindowSize = 60; // Janela de análise móvel de 1 segundo a 60Hz

        // A) THERMAL ESTIMATION (Cálculo derivado de dissipação passiva por silício)
        this.thermal = {
            estimatedTemperatureC: 38.0,
            ambientTemperatureC: 24.0,
            criticalThresholdC: 75.0,
            warningThresholdC: 60.0,
            thermalDissipationFactor: 0.0015 // Coeficiente metabólico de resfriamento
        };

        // B) GPU SATURATION INDEX (Gargalo de Render Target e Fillrate)
        this.gpu = {
            saturationIndex: 0.0,        // 0.0 (Ocioso) a 1.0+ (Saturado/Gargalo)
            averageFrameTimeMs: 0.0,
            vertexLoadFactor: 0.0,
            fillratePressure: 0.0
        };

        // E) PREDICTIVE COLLAPSE DETECTION SYSTEM
        this.prediction = {
            collapseProbability: 0.0,    // Probabilidade percentual de desassociação vestibular
            timeToThermalThrottlingSec: 999,
            consecutiveFrameDrops: 0
        };

        // C) ADAPTIVE DEGRADATION MATRIX
        this.degradation = {
            lastDegradationTimestamp: 0,
            cooldownPeriodMs: 2000,      // Evita oscilação frenética de resolução (Jitter visual)
            forceMinimalHud: false
        };

        // V9.5 HARDWARE INTERFACES & PROFILER ADDITIONS
        this.threeRenderer = null;
        this.aframeScene = null;
        this.capabilities = {
            isWebGL2: false,
            maxTextures: 0,
            maxUniforms: 0,
            xrSupported: false,
            legacyLightsDetected: false
        };

        this.profiler = {
            cpuFrameCostMs: 0.0,
            gpuFrameCostMs: 0.0,
            drawCalls: 0,
            geometriesCount: 0,
            texturesCount: 0
        };

        this.emergency = {
            engaged: false,
            blackoutTriggered: false
        };

        this.bus = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // KERNEL RUNTIME CONTRACT (v9.5) & AUTO-REGISTRO SOBERANO
    // ═══════════════════════════════════════════════════════════════════════
    async initialize() {
        this._trace('LIFECYCLE', 'Iniciando handshake do regulador homeostático v9.5...');
        
        // Auto-acoplagem ao barramento nervoso global
        if (window.SentinelBus) {
            this._attachSignalBus(window.SentinelBus);
        } else {
            this._trace('LIFECYCLE', 'Barramento global não detectado durante init. Aguardando injeção.', 'WARN');
        }

        // Tenta capturar contextos gráficos globais persistentes pré-existentes
        this._scanGlobalContexts();

        this.initializeGovernor();
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

    shutdown() {
        this._trace('LIFECYCLE', 'Comando de purga de estado recebido pelo SovereignKernel.');
        this.shutdownGovernor();
        
        // Desvinculação total das escutas físicas
        this.bus = null;
        this.threeRenderer = null;
        this.aframeScene = null;
        this.emergency.engaged = false;
        this.emergency.blackoutTriggered = false;
        
        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // THREE.JS R164 & A-FRAME 1.6.0 ENGINE INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════
    detectRendererCapabilities(renderer) {
        if (!renderer) return;
        this.threeRenderer = renderer;

        const gl = renderer.getContext();
        this.capabilities.isWebGL2 = (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext);
        this.capabilities.maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        this.capabilities.maxUniforms = gl.getParameter(this.capabilities.isWebGL2 ? gl.MAX_VERTEX_UNIFORM_BLOCKS : gl.MAX_VERTEX_UNIFORM_VECTORS);
        this.capabilities.xrSupported = !!navigator.xr;
        
        // r164 deprecation split detection (.useLegacyLights removido em builds estritas)
        this.capabilities.legacyLightsDetected = (renderer.useLegacyLights !== undefined);

        this._trace('CAPABILITIES', `WebGL2: ${this.capabilities.isWebGL2} | MaxTextures: ${this.capabilities.maxTextures} | LegacyLights: ${this.capabilities.legacyLightsDetected}`);
    }

    attachAFrameScene(sceneEl) {
        if (!sceneEl) return;
        this.aframeScene = sceneEl;
        this._trace('AFRAME_INTEGRATION', 'Cena A-Frame 1.6.0 mapeada e ancorada ao Governor.');

        if (sceneEl.hasLoaded) {
            this._bindAFrameStructures();
        } else {
            sceneEl.addEventListener('loaded', () => this._bindAFrameStructures());
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
    // A) THERMAL ESTIMATION ENGINE (ALGORITMO METABÓLICO)
    // ═══════════════════════════════════════════════════════════════════════
    _estimateThermalLoad(frameTimeMs) {
        // Equação de geração de calor simplificada: Trabalho da GPU eleva a temperatura
        const workDone = frameTimeMs * (this.currentTier === PERFORMANCE_TIERS.XR ? 1.4 : 1.0);
        
        // Dissipação passiva em direção à temperatura ambiente do ecossistema
        const dissipation = (this.thermal.estimatedTemperatureC - this.thermal.ambientTemperatureC) * this.thermal.thermalDissipationFactor;
        
        // Nova estimativa acumulada de calor por pulso de amostragem
        this.thermal.estimatedTemperatureC += (workDone * 0.005) - dissipation;
        this.thermal.estimatedTemperatureC = Math.max(this.thermal.ambientTemperatureC, this.thermal.estimatedTemperatureC);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // METRIC COLLECTION INPUTS, RENDERING PROFILER & B) GPU SATURATION INDEXING
    // ═══════════════════════════════════════════════════════════════════════
    recordFrameMetrics(actualFrameTimeMs, targetIntervalMs, cpuTimeSplitMs = 0) {
        if (!this.isActive) return;

        // Mantém a janela móvel limpa
        this._frameTimeHistory.push(actualFrameTimeMs);
        if (this._frameTimeHistory.length > this.historyWindowSize) {
            this._frameTimeHistory.shift();
        }

        // Calcula média móvel linear
        const sum = this._frameTimeHistory.reduce((a, b) => a + b, 0);
        this.gpu.averageFrameTimeMs = sum / this._frameTimeHistory.length;

        // B) GPU SATURATION: Proporção entre tempo de desenho consumido e o intervalo físico alvo
        this.gpu.saturationIndex = this.gpu.averageFrameTimeMs / targetIntervalMs;
        this.gpu.fillratePressure = Math.min(1.5, actualFrameTimeMs / (targetIntervalMs * 0.85));

        // Profiler avançado de engine em tempo real
        this.profiler.cpuFrameCostMs = cpuTimeSplitMs;
        this.profiler.gpuFrameCostMs = Math.max(0, actualFrameTimeMs - cpuTimeSplitMs);

        this._harvestRendererTelemetry();

        // Executa estimadores de hardware complementares
        this._estimateThermalLoad(actualFrameTimeMs);
        this._evaluatePredictiveCollapse(actualFrameTimeMs, targetIntervalMs);
        
        // Dispara ciclo homeostático adaptativo
        this._performHomeostaticArbitration();
    }

    _harvestRendererTelemetry() {
        if (this.threeRenderer && this.threeRenderer.info) {
            const info = this.threeRenderer.info;
            this.profiler.drawCalls = info.render.calls || 0;
            this.profiler.geometriesCount = info.memory.geometries || 0;
            this.profiler.texturesCount = info.memory.textures || 0;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // E) PREDICTIVE COLLAPSE DETECTION (PREVENÇÃO DE CINETOSE PREEMPTIVA)
    // ═══════════════════════════════════════════════════════════════════════
    _evaluatePredictiveCollapse(frameTimeMs, targetIntervalMs) {
        if (frameTimeMs > targetIntervalMs * 1.2) {
            this.prediction.consecutiveFrameDrops++;
        } else {
            this.prediction.consecutiveFrameDrops = Math.max(0, this.prediction.consecutiveFrameDrops - 1);
        }

        // Fatores de risco cumulativos: frames perdidos em sequência + temperatura em elevação
        const frameDropRisk = Math.min(0.6, (this.prediction.consecutiveFrameDrops / 5));
        const thermalRisk = this.thermal.estimatedTemperatureC > this.thermal.warningThresholdC ? 0.3 : 0.0;
        
        this.prediction.collapseProbability = Math.min(1.0, frameDropRisk + thermalRisk);

        // Se a probabilidade de colapso cinestésico ultrapassar 80%, aciona o escudo de blackout tático
        if (this.prediction.collapseProbability > 0.80) {
            if (this.currentTier === PERFORMANCE_TIERS.XR) {
                this._trace('COLLAPSE_PREVENTION', 'Risco iminente de desassociação vestibular detectado. Disparando interrupção de emergência.', 'CRITICAL');
                if (window.SentinelEngineXR) {
                    window.SentinelEngineXR.triggerEmergencySpatialRecovery();
                }
                this.prediction.consecutiveFrameDrops = 0; // Reseta após a interrupção
            } else if (this.prediction.consecutiveFrameDrops >= 8 && !this.emergency.engaged) {
                this.engageEmergencyRenderMode();
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // C) ADAPTIVE DEGRADATION ARBITRATION (MALHA FECHADA HOMEOSTÁTICA)
    // ═══════════════════════════════════════════════════════════════════════
    _performHomeostaticArbitration() {
        const now = performance.now();
        if (now - this.degradation.lastDegradationTimestamp < this.degradation.cooldownPeriodMs) {
            return; // Bloqueia oscilação contínua para preservar estabilidade semântica visual
        }

        let desiredTier = this.currentTier;

        // Regra 1: Intervenção Térmica Crítica
        if (this.thermal.estimatedTemperatureC >= this.thermal.criticalThresholdC) {
            desiredTier = PERFORMANCE_TIERS.LOW;
            this._trace('HOMEOSTASIS', `Emergência Térmica (${this.thermal.estimatedTemperatureC.toFixed(1)}°C). Rebaixando para nível mínimo de consumo.`, 'WARN');
        }
        // Regra 2: Saturação Severa de GPU ou Queda drástica de Frame Pacing
        else if (this.gpu.saturationIndex > 1.05 || this.prediction.consecutiveFrameDrops >= 4) {
            if (this.currentTier === PERFORMANCE_TIERS.HIGH) desiredTier = PERFORMANCE_TIERS.MEDIUM;
            else if (this.currentTier === PERFORMANCE_TIERS.MEDIUM) desiredTier = PERFORMANCE_TIERS.LOW;
            this._trace('HOMEOSTASIS', `Saturação Crítica detectada (GPU Index: ${this.gpu.saturationIndex.toFixed(2)}). Degradando tier operacional.`, 'WARN');
        }
        // Regra 3: Reidratação Gradual sob folga estável de hardware
        else if (this.gpu.saturationIndex < 0.60 && this.thermal.estimatedTemperatureC < this.thermal.warningThresholdC) {
            if (this.emergency.engaged) {
                this.disengageEmergencyRenderMode();
            }
            if (this.currentTier === PERFORMANCE_TIERS.LOW) desiredTier = PERFORMANCE_TIERS.MEDIUM;
            else if (this.currentTier === PERFORMANCE_TIERS.MEDIUM && !this._isXRSessionActive()) desiredTier = PERFORMANCE_TIERS.HIGH;
        }

        // Executa mutação se houver divergência estrita com o estado atual
        if (desiredTier !== this.currentTier) {
            this.enforcePerformanceTier(desiredTier);
            this.degradation.lastDegradationTimestamp = now;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // F) PERFORMANCE TIERS CONTROL HANDLERS & PIXEL RATIO SCALING
    // ═══════════════════════════════════════════════════════════════════════
    enforcePerformanceTier(tier) {
        this.currentTier = tier;
        this._trace('GOVERNOR', `Nível de homeostase reconfigurado com sucesso para: [${tier}]`);

        // Ajusta dinamicamente a amostragem física de fragmentos (Pixel Ratio Adaptivo)
        this._scaleRendererPixelRatio();

        if (!this.bus) return;

        // Propaga ordens de restrição e compressão de fragmentos por todo o ecossistema
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
                // D) XR PERFORMANCE PROFILE: Trava compulsória de fidelidade com foco em latência zero
                this.bus.emit('system:state_changed', { to: 'XR' });
                document.documentElement.style.setProperty('--fx-quality', '0.75'); // Margem de segurança de hardware
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
            case PERFORMANCE_TIERS.XR: targetPixelRatio = Math.min(targetPixelRatio, 1.25); break; // Teto para evitar estouro de fillrate ocular
        }

        if (this.emergency.engaged) targetPixelRatio *= 0.70; // Penalização nuclear cumulativa

        this.threeRenderer.setPixelRatio(targetPixelRatio);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODO "EMERGENCY SAFE RENDER" (NUCLEAR FALLBACK)
    // ═══════════════════════════════════════════════════════════════════════
    engageEmergencyRenderMode() {
        this.emergency.engaged = true;
        this._trace('HOMEOSTASIS', 'ATIVANDO PROTOCOLO NUCLEAR RESTRITO: EMERGENCY SAFE RENDER.', 'CRITICAL');
        
        if (this.bus) {
            this.bus.emit('performance:emergency_engaged', { thermal: this.thermal.estimatedTemperatureC });
        }

        // Força compressão instantânea de viewport e interface via CSS Reativo
        document.documentElement.style.setProperty('--fx-quality', '0.05');
        document.documentElement.style.setProperty('--hud-density', '0.10');
        
        this._scaleRendererPixelRatio();

        // Intervenção direta nos pipelines e mapas do Three.js para alívio tático imediato
        if (this.threeRenderer) {
            this.threeRenderer.shadowMap.enabled = false; // Desliga mapeamento de sombras em runtime
        }
    }

    disengageEmergencyRenderMode() {
        this.emergency.engaged = false;
        this._trace('HOMEOSTASIS', 'Desativando modo de emergência. Restaurando subsistemas de renderização padrão.');

        if (this.threeRenderer) {
            // Restaura mapeamento de sombras caso a cena exija
            this.threeRenderer.shadowMap.enabled = true;
        }
        this.enforcePerformanceTier(this.currentTier);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LIFECYCLE E HANDSHAKES
    // ═══════════════════════════════════════════════════════════════════════
    initializeGovernor() {
        this.isActive = true;
        this._trace('LIFECYCLE', 'Loops homeostáticos integrados e liberados para monitoramento contínuo.');
    }

    shutdownGovernor() {
        this.isActive = false;
        this._frameTimeHistory = [];
    }

    _isXRSessionActive() {
        return window.SentinelEngineXR && window.SentinelEngineXR.isActive;
    }

    _trace(subsystem, message, level = 'INFO') {
        const formatted = `[${new Date().toISOString()}] [PERFORMANCE-GOVERNOR:${subsystem}] [${level}] ${message}`;
        if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
        else if (level === 'WARN') console.warn(formatted);
        else console.log(formatted);
    }

    _attachSignalBus(busInstance) {
        this.bus = busInstance;

        // Sincroniza dinamicamente a ativação física do modo espacial
        this.bus.on('xr:session_start', () => {
            this.enforcePerformanceTier(PERFORMANCE_TIERS.XR);
            this.historyWindowSize = 90; // Alarga a janela para se adequar ao barramento de 90Hz
        });

        this.bus.on('xr:session_end', () => {
            this.enforcePerformanceTier(PERFORMANCE_TIERS.HIGH);
            this.historyWindowSize = 60;
        });

        // Escuta gatilhos de acoplamento tardio vindos do motor gráfico
        this.bus.on('renderer:hardware_bound', (data) => {
            if (data && data.renderer) this.detectRendererCapabilities(data.renderer);
        });
    }
}

// Instanciação e exposição única na infraestrutura do ecossistema
const SovereignPerformance = new SentinelPerformanceGovernor();
window.SovereignPerformance = SovereignPerformance;

// Auto-registro soberano direto no kernel central
if (window.SovereignKernel) {
    window.SovereignKernel.registerModule('sentinel-performance', SovereignPerformance);
}

export default SovereignPerformance;
