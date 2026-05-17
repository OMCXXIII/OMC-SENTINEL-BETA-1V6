/**
 * ============================================================================
 * SENTINEL CORE RUNTIME ARCHITECTURE
 * Module: sentinel-attention.js
 * Role: Cognitive Attention Orchestration Engine (Operational Attention OS)
 * Design Aesthetic: High-Determinism Cognitive Salience & Perceptual Inhibition
 * ============================================================================
 */

// 8. ATTENTION ZONES - Geografia Cognitiva Operacional
const ATTENTION_ZONES = {
  PRIMARY:    'PRIMARY',    // Alvo foveal direto, processamento em resolução máxima
  SECONDARY:  'SECONDARY',  // Contexto operacional adjacente, prontidão de interação
  PERIPHERAL: 'PERIPHERAL', // Estímulo atenuado, taxa de atualização degradada para alívio mental
  SUPPRESSED: 'SUPPRESSED', // Ruído ou elemento decorativo totalmente ocultado/silenciado
  IMMERSIVE:  'IMMERSIVE'   // Matriz ambiental volumétrica de fundo estabilizada
};

// 25. MODE-AWARE ATTENTION PROFILES
const ATTENTION_PROFILES = {
  NORMAL:    'NORMAL',    // Alocação balanceada padrão de relevância contextual
  FOCUS:     'FOCUS',     // Maximização de persistência, supressão drástica de distrações periféricas
  LOW_POWER: 'LOW_POWER', // Redução severa da densidade cognitiva global para evitar fadiga
  XR:        'XR',        // Sincronização estrita com conforto vestibular e rastreamento ocular
  EMERGENCY: 'EMERGENCY'  // Isolamento cognitivo crítico: hud e missão absorvem 100% do peso
};

class SentinelAttentionEngine {
  constructor() {
    this.version = '1.0.0';
    this.isActive = true;
    this.currentProfile = ATTENTION_PROFILES.NORMAL;

    // 1. ATTENTION CORE STATE
    this.attention = {
      activeTarget: null,
      focusState: 'STABLE',
      cognitiveLoad: 0.0, // Escala normalizada de 0.0 a 1.0
      salienceMap: new Map()
    };

    // 2. FOCUS ENGINE
    this.focus = {
      target: null,
      strength: 1.0,
      persistence: 1.0,
      urgency: 0.0,
      decay: 0.05 // Taxa incremental de enfraquecimento atencional por segundo
    };

    // 3. SALIENCE ENGINE
    this.salience = { visual: 1.0, auditory: 1.0, contextual: 1.0, missionCritical: 1.0 };

    // 4. ATTENTION WEIGHT SYSTEM
    this.weights = { focus: 1.0, context: 1.0, urgency: 1.0, immersion: 1.0, interaction: 1.0 };

    // 6. SUPPRESSION ENGINE & 7. PERIPHERAL INHIBITION
    this.suppression = { distractions: true, peripheralNoise: true, redundantSignals: true };
    this.peripheral = { blur: 0.0, dimming: 0.0, reducedUpdates: true, reducedFX: true };

    // 9. COGNITIVE LOAD ANALYZER
    this.cognitiveLoad = { density: 0.0, overloadRisk: false, attentionSpread: 0.0, fatigue: 0.0 };

    // 10. FOCUS PERSISTENCE ENGINE
    this.persistence = { duration: 0.0, stability: 1.0, interruptionResistance: 1.0 };

    // 12. INTENT DETECTION ENGINE (Estrutura preditiva cognitiva)
    this.intent = { predictedAction: null, interactionTrend: 'STABLE', focusTrajectory: [] };

    // 13. SPATIAL ATTENTION SYSTEM & 14. XR ATTENTION LAYER
    this.spatial = { gaze: { x: 0, y: 0, z: -1 }, proximity: 0.0, directionality: 0.0, spatialPriority: 1.0 };
    this.xr = { gazeFocus: true, immersionAttention: 1.0, comfortPriority: 1.0 };

    // 15. MISSION PRIORITY ENGINE
    this.mission = { activeObjectives: [], criticalSignals: [], contextualWeight: 1.0 };

    // 17. ATTENTION TELEMETRY
    this.metrics = { focusStrength: 1.0, attentionSpread: 0.0, distractionRate: 0.0, immersionDepth: 1.0 };

    // 26. ATTENTION DOMAINS
    this.domains = { hud: 1.0, xr: 1.0, environment: 1.0, diagnostics: 1.0, mission: 1.0, overlays: 1.0 };

    // 29. COGNITIVE FIELD MODEL
    this.cognitiveField = { densityMap: new Map(), salienceMap: new Map(), suppressionMap: new Map() };

    this._lastPulseTime = performance.now();
    this._initializeAttentionEngine();
  }

  // ==========================================================================
  // 2. FOCUS ENGINE (Governança e Transições de Alvos de Atenção)
  // ==========================================================================

  setFocus(targetId, initialStrength = 1.0, urgency = 0.0) {
    this.safeAttention(() => {
      if (this.attention.activeTarget === targetId) {
        // Reforça a persistência se o alvo for mantido
        this.persistence.duration += (performance.now() - this._lastPulseTime) / 1000;
        this.focus.strength = Math.min(2.0, this.focus.strength + 0.1);
        return;
      }

      // Aplica barreira de resistência a interrupções caos-atencionais se o foco atual for estável
      if (this.attention.activeTarget && this.persistence.stability > 0.8 && urgency < this.focus.urgency) {
        this.traceAttention(`Tentativa de desvio bloqueada por barreira de persistência cognitiva para o alvo: [${targetId}]`);
        return;
      }

      this.shiftFocus(targetId, initialStrength, urgency);
    });
  }

  lockFocus(targetId) {
    this.traceFocus(`Forçando travamento atômico de foco inabalável sobre o nó: [${targetId}]`);
    this.attention.activeTarget = targetId;
    this.persistence.interruptionResistance = 2.0; // Imune a distrações transitórias
    this.focus.strength = 2.0;
  }

  releaseFocus() {
    if (!this.attention.activeTarget) return;
    this.traceFocus(`Liberando foco do alvo anterior: [${this.attention.activeTarget}]`);
    this.attention.activeTarget = null;
    this.focus.strength = 0.0;
    this.persistence.duration = 0.0;
  }

  shiftFocus(newTargetId, strength, urgency) {
    const oldTarget = this.attention.activeTarget;
    this.rememberFocus(oldTarget);

    this.attention.activeTarget = newTargetId;
    this.focus.strength = strength;
    this.focus.urgency = urgency;
    this.persistence.duration = 0.0;
    this.persistence.stability = 1.0;

    this.traceFocus(`Chaveamento perceptual executado de [${oldTarget}] para [${newTargetId}]`);
    this.propagateAttention();
  }

  // ==========================================================================
  // 3. SALIENCE ENGINE & 5. CONTEXT PRIORITIZATION ENGINE
  // ==========================================================================

  calculateSalience(entityId, attributes = {}) {
    // Modelo matemático analítico de cálculo de saliência multiespectral
    const motionScore     = (attributes.motion || 0.0) * 0.25;
    const proximityScore  = (1.0 - (attributes.distance || 1.0)) * 0.20;
    const contrastScore   = (attributes.contrast || 0.0) * 0.15;
    const operationalWeight = (attributes.isMissionCritical ? 2.0 : 0.5) * 0.40;

    const totalSalience = (motionScore + proximityScore + contrastScore + operationalWeight) * this.weights.urgency;
    this.attention.salienceMap.set(entityId, totalSalience);

    this.prioritizeContext();
    return totalSalience;
  }

  prioritizeContext() {
    this.safeAttention(() => {
      // Ordena e distribui a relevância das zonas baseado nos objetivos de missão e telemetria XR
      if (this.currentProfile === ATTENTION_PROFILES.EMERGENCY) {
        this.domains.mission = 2.0;
        this.domains.hud = 1.5;
        this.domains.environment = 0.0; // Purga total de elementos decorativos da consciência operacional
      } else {
        this.domains.mission = 1.0;
        this.domains.hud = 1.0;
        this.domains.environment = 1.0;
      }
    });
  }

  // ==========================================================================
  // 6. SUPPRESSION ENGINE & 7. PERIPHERAL INHIBITION
  // ==========================================================================

  suppress() {
    if (!this.suppression.distractions) return;

    // Atualiza os mapas lógicos de inibição periférica ativa
    this.cognitiveField.suppressionMap.clear();

    this.attention.salienceMap.forEach((salienceScore, entityId) => {
      if (entityId === this.attention.activeTarget) return;

      if (salienceScore < 0.35 && this.currentProfile === ATTENTION_PROFILES.FOCUS) {
        // Classifica o elemento na zona suprimida se a saliência for inferior ao limiar do filtro
        this.cognitiveField.suppressionMap.set(entityId, ATTENTION_ZONES.SUPPRESSED);
        this.filterDistractions(entityId);
      } else if (salienceScore < 0.6) {
        this.cognitiveField.suppressionMap.set(entityId, ATTENTION_ZONES.PERIPHERAL);
      } else {
        this.cognitiveField.suppressionMap.set(entityId, ATTENTION_ZONES.SECONDARY);
      }
    });
  }

  filterDistractions(entityId) {
    // Intercepta e drena sub-estímulos, efeitos de pós-processamento secundários e notificações redundantes
    if (window.SentinelRenderer && typeof window.SentinelRenderer.muteNodeVisibility === 'function') {
      window.SentinelRenderer.muteNodeVisibility(entityId, true);
    }
  }

  // ==========================================================================
  // 11. ATTENTION DECAY SYSTEM & 19. ADAPTIVE ATTENTION ENGINE
  // ==========================================================================

  decayAttention(deltaTime) {
    if (this.attention.activeTarget && this.currentProfile !== ATTENTION_PROFILES.FOCUS) {
      // Decaimento natural e progressivo de foco se o usuário não interagir ativamente
      this.focus.strength = Math.max(0.0, this.focus.strength - (this.focus.decay * deltaTime));
      
      if (this.focus.strength <= 0.1) {
        this.traceFocus(`Alvo [${this.attention.activeTarget}] atingiu o limiar de fading cognitivo extremo.`);
        this.releaseFocus();
      }
    }
  }

  adaptAttention() {
    this.safeAttention(() => {
      this.cognitiveLoadAnalyzer();

      // Ajusta dinamicamente a densidade visual periférica baseado no estresse mental mapeado
      if (this.attention.cognitiveLoad > 0.8) {
        this.peripheral.blur = 1.0; // Força desfoque gaussiano na periferia visual para alívio focal
        this.peripheral.dimming = 0.75; // Reduz a luminosidade lateral
        if (this.currentProfile !== ATTENTION_PROFILES.EMERGENCY) {
          this.applyAttentionProfile(ATTENTION_PROFILES.LOW_POWER);
        }
      } else {
        this.peripheral.blur = 0.0;
        this.peripheral.dimming = 0.0;
      }
    });
  }

  cognitiveLoadAnalyzer() {
    const spreadFactor = this.attention.salienceMap.size > 0 ? (1 / this.attention.salienceMap.size) : 1.0;
    this.cognitiveLoad.attentionSpread = spreadFactor;
    
    // Equação intrínseca de saturação: mais alvos concorrentes com alta saliência aumentam o risco de colapso cognitivo
    let aggregateSalience = 0;
    this.attention.salienceMap.forEach(v => aggregateSalience += v);

    this.attention.cognitiveLoad = Math.min(1.0, (aggregateSalience * 0.15) + (this.persistence.duration * 0.01));
    this.cognitiveLoad.density = this.attention.cognitiveLoad;

    if (this.attention.cognitiveLoad > 0.85) {
      this.cognitiveLoad.overloadRisk = true;
      this.recoverAttention();
    } else {
      this.cognitiveLoad.overloadRisk = false;
    }
  }

  // ==========================================================================
  // 27. ATTENTION PROPAGATION ENGINE & 28. NEUROGRAPH INTEGRATION
  // ==========================================================================

  propagateAttention() {
    // Alimenta de forma soberana os orçamentos computacionais de outros módulos do Kernel do SENTINEL
    if (window.SentinelSpatialEngine) {
      // Sincroniza a malha tridimensional de zonas espaciais cognitivas baseada na intenção atual
      window.SentinelSpatialEngine.attention.gazeTarget = this.attention.activeTarget;
      window.SentinelSpatialEngine.attention.focusStrength = this.focus.strength;
    }

    if (window.SentinelPerformance) {
      // Injeta métricas atencionais no barramento de telemetria homeostática de hardware
      window.SentinelPerformance.cognitive.attentionDensity = this.cognitiveLoad.density;
    }

    this.linkNeurograph();
  }

  linkNeurograph() {
    // Anexa e estrutura os vetores de foco de curto prazo no grafo sináptico persistente do sistema
    if (window.NeuroGraphEngine && typeof window.NeuroGraphEngine.injectCognitiveLink === 'function') {
      window.NeuroGraphEngine.injectCognitiveLink({
        source: 'ATTENTION_CORE',
        target: this.attention.activeTarget || 'COGNITIVE_VOID',
        weight: this.focus.strength,
        profile: this.currentProfile,
        timestamp: Date.now()
      });
    }
  }

  // ==========================================================================
  // 21. ATTENTION MEMORY LINKING & 22. ATTENTION SNAPSHOTS
  // ==========================================================================

  rememberFocus(targetId) {
    if (!targetId || typeof window.SentinelMemory === 'undefined') return;
    window.SentinelMemory.store('last_active_focus_target', {
      target: targetId,
      strength: this.focus.strength,
      duration: this.persistence.duration
    }, 'attention', 'SESSION', 'TRANSIENT');
  }

  restoreFocus() {
    if (typeof window.SentinelMemory !== 'undefined') {
      const savedFocus = window.SentinelMemory.retrieve('last_active_focus_target');
      if (savedFocus && savedFocus.target) {
        this.shiftFocus(savedFocus.target, savedFocus.strength, 0.5);
        this.traceAttention('Foco anterior ressuscitado via canal de memória transiente síncrona.');
      }
    }
  }

  snapshotAttention() {
    return {
      activeTarget: this.attention.activeTarget,
      profile: this.currentProfile,
      cognitiveLoad: this.attention.cognitiveLoad,
      salienceSnapshot: new Map(this.attention.salienceMap),
      timestamp: Date.now()
    };
  }

  restoreAttention(snapshot) {
    if (!snapshot) return;
    this.currentProfile = snapshot.profile;
    this.attention.cognitiveLoad = snapshot.cognitiveLoad;
    this.attention.salienceMap = snapshot.salienceSnapshot;
    this.setFocus(snapshot.activeTarget, 1.0, 1.0);
  }

  // ==========================================================================
  // 23. ATTENTION RECOVERY ENGINE & BALANCE
  // ==========================================================================

  recoverAttention() {
    this.traceAttention('Iniciando protocolo atômico contra sobrecarga visual ou dispersão extrema.', 'WARN');
    this.safeAttention(() => {
      // Força purga imediata de alvos secundários com saliência irrelevante
      this.attention.salienceMap.clear();
      this.releaseFocus();
      this.applyAttentionProfile(ATTENTION_PROFILES.FOCUS); // Trava o sistema em modo de absorção limpa
      
      this.peripheral.blur = 1.5;
      this.peripheral.dimming = 0.90;
    });
  }

  maintainAttentionEquilibrium() {
    const now = performance.now();
    const deltaTime = (now - this._lastPulseTime) / 1000;
    this._lastPulseTime = now;

    // 11. Processa decaimento atencional e obsolescência contextual
    this.decayAttention(deltaTime);
    
    // 6. Executa varredura profunda do motor de supressão de ruído perceptual
    this.suppress();

    // 19. Adapta os alertas, os blurs periféricos e os perfis de carga com base na fadiga
    this.adaptAttention();

    // 20. Sincronização Cognitiva Estrita com o Barramento Central do Sistema
    this.synchronizeAttention();
  }

  synchronizeAttention() {
    if (typeof window.StateStore !== 'undefined') {
      // Absorve as prioridades de missão ditadas pelas diretrizes do Kernel Central
      const isMissionActive = window.StateStore.get('ops.activeMission');
      this.mission.activeObjectives = isMissionActive ? ['CORE_OBJECTIVE_ALPHA'] : [];
      
      // Alimenta o StateStore com o índice de fadiga calculado na GPU/CPU
      window.StateStore.set('telemetry.cognitiveDensity', this.attention.cognitiveLoad);
    }
  }

  applyAttentionProfile(mode) {
    this.currentProfile = mode;
    this.traceAttention(`Perfil operacional de orquestração atencional chaveado para: [${mode}]`);

    switch (mode) {
      case ATTENTION_PROFILES.FOCUS:
        this.suppression.distractions = true;
        this.suppression.peripheralNoise = true;
        this.focus.decay = 0.01; // Reduz a velocidade de perda de foco
        break;
      case ATTENTION_PROFILES.LOW_POWER:
        this.focus.decay = 0.15; // Descarta atenção rapidamente para evitar estafa mental
        this.suppression.distractions = true;
        break;
      case ATTENTION_PROFILES.XR:
        this.xr.gazeFocus = true;
        this.focus.decay = 0.05;
        break;
      default:
        this.suppression.distractions = true;
        this.focus.decay = 0.05;
    }
    this.propagateAttention();
  }

  // ==========================================================================
  // 24. ATTENTION SAFETY LAYER BARRIER
  // ==========================================================================

  safeAttention(executionBlock) {
    try {
      executionBlock();
    } catch (error) {
      this.traceAttention(`Exceção interceptada na barreira de proteção de orquestração cognitiva: ${error.message}`, 'CRITICAL');
      this.recoverAttention();
    }
  }

  _initializeAttentionEngine() {
    this.traceAttention('Inicializando Orquestrador de Atenção Cognitiva e Mapas de Saliência...', 'INFO');

    // Acopla o loop dinâmico ao ciclo principal de atualização nativa do RequestAnimationFrame
    const attentionPulse = () => {
      if (!this.isActive) return;
      this.maintainAttentionEquilibrium();
      requestAnimationFrame(attentionPulse);
    };
    requestAnimationFrame(attentionPulse);

    if (window.SentinelBus) {
      window.SentinelBus.on('boot:complete', () => {
        this.traceAttention('Barramento sínclito ativado. Orquestração de relevância unificada.');
        this.restoreFocus();
      });

      // Captura feixes de olhar ou inputs mecânicos emitidos por rastreadores espaciais (XR Eyetracking)
      window.SentinelBus.on('xr:gaze_moved', (data) => {
        if (data && data.target) {
          this.spatial.gaze = data.gazeVector || this.spatial.gaze;
          this.calculateSalience(data.target, { motion: 0.8, distance: data.distance || 0.1, isMissionCritical: true });
          this.setFocus(data.target, 1.2, data.urgency || 0.0);
        }
      });
    }
  }

  traceAttention(msg, level = 'INFO')   { this.trace(`[CORE_RELEVANCE] ${msg}`, level); }
  traceFocus(msg, level = 'INFO')       { this.trace(`[FOCUS_ENGINE] ${msg}`, level); }
  traceSuppression(msg, level = 'INFO') { this.trace(`[SUPPRESSION] ${msg}`, level); }

  trace(message, level = 'INFO') {
    const formatted = `[${new Date().toISOString()}] [SENTINEL_ATTENTION] [${level}] ${message}`;
    if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
    else if (level === 'WARN') console.warn(formatted);
    else console.log(formatted);
  }
}

// Instanciação e injeção do barramento no ecossistema global do SENTINEL
const CognitiveAttentionEngine = new SentinelAttentionEngine();
window.SentinelAttention = CognitiveAttentionEngine;

export default CognitiveAttentionEngine;