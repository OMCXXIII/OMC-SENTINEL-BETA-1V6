/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE ATTENTION & COGNITION TRACKER (OPERATOR FOV)
 * Arquivo: sentinel-attention.js
 * Papel: Gestor de Atenção, Mapeamento Foveal e Rastreamento Cinetósico
 * Governança: Totalmente subordinado ao SovereignKernel e integrado ao Renderer
 * ═══════════════════════════════════════════════════════════════════════════
 */

console.log("[ATTENTION] Sentinel Attention System Online");

export class SentinelAttentionManager {
    constructor(rendererInstance = null) {
        this.version = "9.0-ATTENTION-MANAGER";
        this.renderer = rendererInstance; // Acoplamento dinâmico com o SovereignRenderer
        
        // Estado de Foco Cognitivo do Operador
        this.focusState = {
            normalizedCenter: { x: 0.5, y: 0.5 }, // Centro do olhar (padrão absoluto)
            stabilizationFactor: 0.85,            // Amortecimento para evitar micro-tremores (jitter)
            lastGazeTimestamp: performance.now(),
            blinkDetected: false
        };

        // Métricas de Fixação Ocular
        this.metrics = {
            fixationDurationMs: 0,
            saccadeCount: 0,
            currentZone: 'CENTER'
        };

        this.initialized = true;
        this._trace('INIT', 'Attention Manager iniciado e blindado para telemetria foveal.');
    }

    /**
     * Atualiza as coordenadas normalizadas do olhar detectado pelo hardware XR ou ponteiro tático
     * @param {number} x - Coordenada X normalizada (0.0 a 1.0)
     * @param {number} y - Coordenada Y normalizada (0.0 a 1.0)
     */
    updateGazeVector(x, y) {
        if (x < 0.0 || x > 1.0 || y < 0.0 || y > 1.0) {
            this._trace('WARN', `Coordenadas fora dos limites do viewport interceptadas: X=${x}, Y=${y}`);
            return;
        }

        const now = performance.now();
        const sFactor = this.focusState.stabilizationFactor;

        // Filtro passa-baixa linear para estabilização de amostragem foveal (Anti-Jitter)
        const smoothedX = (this.focusState.normalizedCenter.x * sFactor) + (x * (1.0 - sFactor));
        const smoothedY = (this.focusState.normalizedCenter.y * sFactor) + (y * (1.0 - sFactor));

        // Detecção analítica de Sacadas (movimentos oculares abruptos)
        const distance = Math.hypot(smoothedX - this.focusState.normalizedCenter.x, smoothedY - this.focusState.normalizedCenter.y);
        if (distance > 0.15) {
            this.metrics.saccadeCount++;
            this.metrics.fixationDurationMs = 0; // Reseta tempo de fixação
        } else {
            this.metrics.fixationDurationMs += (now - this.focusState.lastGazeTimestamp);
        }

        this.focusState.normalizedCenter.x = smoothedX;
        this.focusState.normalizedCenter.y = smoothedY;
        this.focusState.lastGazeTimestamp = now;

        // Injeção direta e atualização a quente no motor de Foveated Rendering do Renderer
        if (this.renderer && typeof this.renderer.configureFoveated === 'function') {
            this.renderer.configureFoveated(true, smoothedX, smoothedY);
        }

        this._evaluateAttentionZone(smoothedX, smoothedY);
    }

    /**
     * Vincula retroativamente um renderizador gráfico caso não tenha sido passado no construtor
     */
    bindRenderer(rendererInstance) {
        if (!rendererInstance) throw new Error("[ATTENTION] Instância de renderizador inválida para acoplamento.");
        this.renderer = rendererInstance;
        this._trace('COUPLING', 'Link dinâmico estabelecido com o SentinelSovereignRenderer.');
    }

    /**
     * Define o fator de interpolação e amortecimento do olhar
     */
    setStabilization(factor) {
        this.focusState.stabilizationFactor = Math.max(0.0, Math.min(1.0, factor));
    }

    /**
     * Mapeia a zona cartesiana de fixação do operador dentro da matriz FOV
     */
    _evaluateAttentionZone(x, y) {
        if (x > 0.35 && x < 0.65 && y > 0.35 && y < 0.65) {
            this.metrics.currentZone = 'CENTER_FOVEAL';
        } else if (x <= 0.35 || x >= 0.65 || y <= 0.35 || y >= 0.65) {
            this.metrics.currentZone = 'PERIPHERAL_FALLOFF';
        }
    }

    _trace(system, message) {
        console.log(
            `%c[SENTINEL-OS][ATTENTION][${system}] ${message}`, 
            'background: #020d08; color: #00ffee; font-family: monospace; padding: 2px 5px;'
        );
    }
}
