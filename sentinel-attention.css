/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE ATTENTION ORCHESTRATION ENGINE (ATTENTION OS)
 * Arquivo: sentinel-attention.js
 * Papel: Cognição Operacional, Filtragem Perceptiva e Gestão de Carga Mental
 * Governança: Totalmente subordinado ao SovereignKernel; dita regras de Saliência.
 * Fix: Resolução de Module Mismatch via padronização ESM nativa. Implementação
 * de Focus Lock, Distraction Filtering, Cognitive Load Map e Attention Graph.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// G) ATTENTION PRIORITY ENGINE: Níveis Estritos de Alocação de Atenção
export const ATTENTION_PRIORITIES = Object.freeze({
    PRIMARY:    'PRIMARY',    // Fóvea central ativa. Processamento e taxa de atualização máximos
    SECONDARY:  'SECONDARY',  // Contexto periférico imediato. Prontidão de interação funcional
    PERIPHERAL: 'PERIPHERAL', // Zona atenuada. Baixa amostragem para alívio ciliar/retiniano
    SUPPRESSED: 'SUPPRESSED'  // Elementos totalmente silenciados/ocultados por saturação
});

class AttentionNode {
    constructor(id, priority = ATTENTION_PRIORITIES.SECONDARY) {
        this.id = id;
        this.priority = priority;
        this.salienceScore = 0.5;    // Mapeamento dinâmico de 0.0 a 1.0+
        this.lastFocusTimestamp = performance.now();
        
        // A) FOCUS LOCK REGISTRY
        this.isLocked = false;
        this.lockDurationMs = 0;
    }
}

class SentinelAttentionEngine {
    constructor() {
        this.version = "9.0-COGNITIVE-ATTENTION";
        this.isActive = false;

        // E) ATTENTION GRAPH: Grafo Relacional de Nós Cognitivos
        this.attentionGraph = new Map();

        // D) COGNITIVE LOAD MAP: Telemetria de saturação sensorial do operador
        this.cognitiveLoad = {
            currentScore: 0.0,       // 0.0 (Ocioso) a 1.0 (Exaustão/Sobrecarga)
            activeFocusId: null,
            maxSimultaneousInputs: 7, // Limite mágico cognitivo (Número de Miller)
            distractionCount: 0
        };

        // B) DISTRACTION FILTERING CONTROLS
        this.filtering = {
            noiseThreshold: 0.35,    // Sinais abaixo deste peso são preemptados e expurgados
            filterActive: true,
            suppressionAggression: 1.0
        };

        this.bus = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // E) ATTENTION GRAPH MANAGEMENT & LIFE CYCLE
    // ═══════════════════════════════════════════════════════════════════════
    registerCognitiveNode(id, initialPriority = ATTENTION_PRIORITIES.SECONDARY) {
        const node = new AttentionNode(id, initialPriority);
        this.attentionGraph.set(id, node);
        this._trace('GRAPH', `Nó cognitivo [${id}] acoplado ao grafo de relevância.`);
        return node;
    }

    unregisterCognitiveNode(id) {
        if (this.cognitiveLoad.activeFocusId === id) {
            this.cognitiveLoad.activeFocusId = null;
        }
        this._trace('GRAPH', `Nó [${id}] cortado do grafo de atenção.`);
        return this.attentionGraph.delete(id);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // A) FOCUS LOCK & G) ATTENTION PRIORITY ENGINE
    // ═══════════════════════════════════════════════════════════════════════
    acquireFocusLock(id, durationMs = 0) {
        const node = this.attentionGraph.get(id);
        if (!node) return false;

        // Se houver um nó travado ativo diferente, rejeita sobreposição reativa
        if (this.cognitiveLoad.activeFocusId && this.cognitiveLoad.activeFocusId !== id) {
            const currentActive = this.attentionGraph.get(this.cognitiveLoad.activeFocusId);
            if (currentActive && currentActive.isLocked) {
                this._trace('FOCUS_LOCK', `Tentativa de foco em [${id}] rejeitada. Nó [${currentActive.id}] retém o Focus Lock Absoluto.`, 'WARN');
                return false;
            }
        }

        node.isLocked = true;
        node.priority = ATTENTION_PRIORITIES.PRIMARY;
        node.salienceScore = 1.5; // Sobreeleva o sinal acima da barreira de filtragem
        node.lastFocusTimestamp = performance.now();
        
        this.cognitiveLoad.activeFocusId = id;

        if (durationMs > 0) {
            setTimeout(() => this.releaseFocusLock(id), durationMs);
        }

        this._trace('FOCUS_LOCK', `Focus Lock adquirido determinidicamente para o nó: [${id}]`);
        this._evaluateGraphEquilibrium();
        return true;
    }

    releaseFocusLock(id) {
        const node = this.attentionGraph.get(id);
        if (node && node.isLocked) {
            node.isLocked = false;
            this._trace('FOCUS_LOCK', `Focus Lock liberado de forma passiva para o nó: [${id}]`);
            this._evaluateGraphEquilibrium();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // B) DISTRACTION FILTERING & C) CONTEXT SUPPRESSION LOGIC
    // ═══════════════════════════════════════════════════════════════════════
    processGazeInput(targetId, rawUrgencyScore = 0.5) {
        if (!this.isActive) return;

        // B) DISTRACTION FILTERING: Bloqueia micro-saccades e ruídos de input oscilantes
        if (this.filtering.filterActive && rawUrgencyScore < this.filtering.noiseThreshold) {
            this.cognitiveLoad.distractionCount++;
            if (this.cognitiveLoad.distractionCount % 10 === 0) {
                this._trace('FILTER', `Filtro Cognitivo interceptou e suprimiu ${this.cognitiveLoad.distractionCount} anomalias oculares periféricas.`, 'INFO');
            }
            return; // Aborta propagação de sinal poluído
        }

        // Tenta migrar o foco para o novo alvo alvo
        const success = this.acquireFocusLock(targetId, 0);
        if (!success) {
            // Se falhar devido a um Lock ativo, degrada passivamente o sinal colateral
            const colateralNode = this.attentionGraph.get(targetId);
            if (colateralNode) {
                colateralNode.salienceScore = Math.max(0.1, colateralNode.salienceScore - 0.1);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // D) COGNITIVE LOAD MAP & F) PERIPHERAL INHIBITION METER
    // ═══════════════════════════════════════════════════════════════════════
    _evaluateGraphEquilibrium() {
        let totalSalienceAccumulator = 0;
        const totalNodes = this.attentionGraph.size;

        if (totalNodes === 0) {
            this.cognitiveLoad.currentScore = 0.0;
            return;
        }

        // Primeiro passo: Computa acúmulo de energia cognitiva total e varre locks expirados
        for (const [id, node] of this.attentionGraph.entries()) {
            totalSalienceAccumulator += node.salienceScore;
        }

        // D) COGNITIVE LOAD MAP: Razão matemática de pressão sob os canais neurais
        this.cognitiveLoad.currentScore = Math.min(1.0, totalSalienceAccumulator / this.cognitiveLoad.maxSimultaneousInputs);

        // Se o estresse atencional passar de 75%, eleva agressividade de supressão periférica
        if (this.cognitiveLoad.currentScore > 0.75) {
            this.filtering.suppressionAggression = 1.8;
            this._trace('COMPRESSION', `Saturação Atencional Crítica (${(this.cognitiveLoad.currentScore*100).toFixed(0)}%). Disparando Inibição Periférica e Supressão de Contexto.`, 'WARN');
        } else {
            this.filtering.suppressionAggression = 1.0;
        }

        // Segundo passo: Distribuição de Tiers e C) CONTEXT SUPPRESSION / F) PERIPHERAL INHIBITION
        for (const [id, node] of this.attentionGraph.entries()) {
            if (node.isLocked || id === this.cognitiveLoad.activeFocusId) {
                node.priority = ATTENTION_PRIORITIES.PRIMARY;
                this._applyCssFoveationTokens(id, 'PRIMARY');
                continue;
            }

            // Atenuação baseada na agressividade de supressão atual do governador
            node.salienceScore -= (0.05 * this.filtering.suppressionAggression);
            node.salienceScore = Math.max(0.0, node.salienceScore);

            // Rebaixamento estrito por inibição com base no score residual do nó
            if (node.salienceScore < 0.15) {
                node.priority = ATTENTION_PRIORITIES.SUPPRESSED;
                this._applyCssFoveationTokens(id, 'SUPPRESSED');
            } else if (node.salienceScore < 0.40) {
                // F) PERIPHERAL INHIBITION: Reduz taxa de desenho e aplica desfoque retiniano
                node.priority = ATTENTION_PRIORITIES.PERIPHERAL;
                this._applyCssFoveationTokens(id, 'PERIPHERAL');
            } else {
                node.priority = ATTENTION_PRIORITIES.SECONDARY;
                this._applyCssFoveationTokens(id, 'SECONDARY');
            }
        }
    }

    _applyCssFoveationTokens(nodeId, priorityTier) {
        // Vinculação reflexiva direta nos seletores injetados nos arquivos css_sentinel_hud e fx
        const element = document.getElementById(nodeId);
        if (!element) return;

        switch (priorityTier) {
            case 'PRIMARY':
                element.style.setProperty('--hud-opacity', '1.00');
                element.style.setProperty('--hud-focus-strength', '1.20');
                element.style.setProperty('--fx-quality', '1.00');
                element.classList.remove('hud-attention-suppressed', 'hud-attention-peripheral');
                break;

            case 'SECONDARY':
                element.style.setProperty('--hud-opacity', '0.75');
                element.style.setProperty('--hud-focus-strength', '0.60');
                element.classList.remove('hud-attention-suppressed', 'hud-attention-peripheral');
                break;

            case 'PERIPHERAL':
                // Força estrangulamento perceptual via variáveis de ambiente CSS
                element.style.setProperty('--hud-opacity', '0.35');
                element.style.setProperty('--hud-focus-strength', '0.00');
                element.classList.add('hud-attention-peripheral');
                element.classList.remove('hud-attention-suppressed');
                break;

            case 'SUPPRESSED':
                // C) CONTEXT SUPPRESSION: Ocultação absoluta de render target
                element.style.setProperty('--hud-opacity', '0.00');
                element.classList.add('hud-attention-suppressed');
                element.classList.remove('hud-attention-peripheral');
                break;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ORCHESTRATION TOKENS & ORCHESTRATOR HANDSHAKES
    // ═══════════════════════════════════════════════════════════════════════
    initializeEngine() {
        this.isActive = true;
        this._trace('LIFECYCLE', 'Mecanismos de mitigação atencional ativados sob protocolo ESM.');
    }

    shutdownEngine() {
        this.isActive = false;
        this.attentionGraph.clear();
    }

    _trace(subsystem, message, level = 'INFO') {
        const formatted = `[${new Date().toISOString()}] [ATTENTION-MANAGER:${subsystem}] [${level}] ${message}`;
        if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
        else if (level === 'WARN') console.warn(formatted);
        else console.log(formatted);
    }

    _attachSignalBus(busInstance) {
        this.bus = busInstance;

        // Conecta ganchos de telemetria baseados em hardware e rastreamento ocular
        this.bus.on('xr:gaze_moved', (data) => {
            if (data && data.target) {
                this.processGazeInput(data.target, data.urgency || 0.5);
            }
        });

        // Intercepta resets de contexto ou pânicos para liberar travas remanescentes
        this.bus.on('system:state_changed', (state) => {
            if (state.to === 'LOW_POWER' || state.to === 'EMERGENCY') {
                this.filtering.noiseThreshold = 0.55; // Eleva barra de ruído drasticamente
                this._evaluateGraphEquilibrium();
            } else {
                this.filtering.noiseThreshold = 0.35;
            }
        });
    }
}

// Instanciação e exposição única em conformidade com o ecossistema v9.0
const SovereignAttention = new SentinelAttentionEngine();
window.AttentionManager = SovereignAttention;

export default SovereignAttention;
