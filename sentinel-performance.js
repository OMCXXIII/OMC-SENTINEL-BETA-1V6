/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — ADAPTIVE HOMEOSTASIS ENGINE (PERFORMANCE GOVERNOR)
 * Arquivo: sentinel-performance.js
 * Papel: Homeostase Operacional, Perfilamento Térmico e Prevenção de Colapso
 * Governança: Totalmente subordinado ao SovereignKernel; dita regras de Throttling.
 * Fix: Implementação de Thermal Estimation, GPU Saturation Index, Adaptive
 * Degradation, Predictive Collapse Logic e Escalonamento Estrito de Tiers.
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
        this.version = "9.0-HOMEOSTASIS-GOVERNOR";
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

        this.bus = null;
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
    // METRIC COLLECTION INPUTS & B) GPU SATURATION INDEXING
    // ═══════════════════════════════════════════════════════════════════════
    recordFrameMetrics(actualFrameTimeMs, targetIntervalMs) {
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

        // Executa estimadores de hardware complementares
        this._estimateThermalLoad(actualFrameTimeMs);
        this._evaluatePredictiveCollapse(actualFrameTimeMs, targetIntervalMs);
        
        // Dispara ciclo homeostático adaptativo
        this._performHomeostaticArbitration();
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
        if (this.prediction.collapseProbability > 0.80 && this.currentTier === PERFORMANCE_TIERS.XR) {
            this._trace('COLLAPSE_PREVENTION', 'Risco iminente de desassociação vestibular detectado. Disparando interrupção de emergência.', 'CRITICAL');
            if (window.SentinelEngineXR) {
                window.SentinelEngineXR.triggerEmergencySpatialRecovery();
            }
            this.prediction.consecutiveFrameDrops = 0; // Reseta após a interrupção
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
    // F) PERFORMANCE TIERS CONTROL HANDLERS (AÇÕES DE THROTTLING)
    // ═══════════════════════════════════════════════════════════════════════
    enforcePerformanceTier(tier) {
        this.currentTier = tier;
        this._trace('GOVERNOR', `Nível de homeostase reconfigurado com sucesso para: [${tier}]`);

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
    }
}

// Instanciação e exposição única na infraestrutura do ecossistema
const SovereignPerformance = new SentinelPerformanceGovernor();
window.SovereignPerformance = SovereignPerformance;

export default SovereignPerformance;
