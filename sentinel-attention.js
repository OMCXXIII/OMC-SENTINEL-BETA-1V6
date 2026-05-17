/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE ATTENTION OS (FILTRO DE INIBIÇÃO PERIFÉRICA)
 * Arquivo: sentinel-attention.js
 * Papel: Focus Lock, Supressão de Ruído Cognitivo e Salience Mapping
 * Governança: Totalmente subordinado ao SovereignKernel. Sem auto-boot implícito.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// 1. GEOGRAFIA COGNITIVA OPERACIONAL ESTREITA
const ATTENTION_ZONES = Object.freeze({
  PRIMARY:    'PRIMARY',    // Alvo foveal direto, processamento em resolução máxima
  SECONDARY:  'SECONDARY',  // Contexto operacional adjacente, prontidão de interação
  PERIPHERAL: 'PERIPHERAL', // Estímulo atenuado, taxa de atualização degradada para alívio mental
  SUPPRESSED: 'SUPPRESSED', // Ruído ou elemento decorativo totalmente ocultado/silenciado
  IMMERSIVE:  'IMMERSIVE'   // Matriz ambiental volumétrica de fundo estabilizada
});

// 2. MODE-AWARE ATTENTION PROFILES
const ATTENTION_PROFILES = Object.freeze({
  NORMAL:    'NORMAL',    // Alocação balanceada padrão de relevância contextual
  FOCUS:     'FOCUS',     // Maximização de persistência, supressão drástica de distrações periféricas
  LOW_POWER: 'LOW_POWER', // Redução severa da densidade cognitiva global para evitar fadiga
  XR:        'XR',        // Sincronização estrita com conforto vestibular e rastreamento ocular
  EMERGENCY: 'EMERGENCY'  // Isolamento cognitivo crítico: HUD e missão absorvem 100% do peso
});

class SentinelAttentionEngine {
  constructor() {
    this.version = '9.0-SOVEREIGN';
    this.currentProfile = ATTENTION_PROFILES.NORMAL;
    
    // 3. CORE ATTENTION MECHANICS (ESTADOS DE TRAVA E FOCO)
    this.attentionLock = false; // Flag do Focus Lock Atômico
    this.activeFocusTarget = null;
    this.focusIntensity = 1.0;

    this.spatial = {
      gaze: [0.0, 0.0, -1.0], // Vetor tridimensional do olhar em tempo real
      blinkRateMinute: 12
    };

    // 4. MAPA DE RELEVÂNCIA COGNITIVA (SALIENCE CONFIG)
    this.salienceMap = new Map();
    this.zoneStates = {
      [ATTENTION_ZONES.PRIMARY]:    { opacity: 1.0, saturation: 1.0,  allowSignals: true },
      [ATTENTION_ZONES.SECONDARY]:  { opacity: 0.6, saturation: 0.5,  allowSignals: true },
      [ATTENTION_ZONES.PERIPHERAL]: { opacity: 0.15, saturation: 0.0, allowSignals: false }, // Inibição estrita
      [ATTENTION_ZONES.SUPPRESSED]: { opacity: 0.0, saturation: 0.0,  allowSignals: false }
    };

    this._initializeAttentionGovernor();
  }

  /**
   * TRACE ENGINE UNIFICADO INTERNO DA ATENÇÃO
   */
  trace(message, level = 'INFO') {
    if (window.SovereignKernel && typeof window.SovereignKernel.trace === 'function') {
      window.SovereignKernel.trace('ATTENTION', message, level);
    } else {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
      console.log(`%c[${timestamp}] [ATTENTION] [${level}] ${message}`, 'color: #D400FF; font-weight: bold;');
    }
  }

  traceAttention(msg, level = 'INFO')   { this.trace(`[CORE_RELEVANCE] ${msg}`, level); }
  traceFocus(msg, level = 'INFO')       { this.trace(`[FOCUS_ENGINE] ${msg}`, level); }
  traceSuppression(msg, level = 'INFO') { this.trace(`[SUPPRESSION] ${msg}`, level); }

  /**
   * ⚡ FOCUS LOCK — ISOLAMENTO ATÔMICO DE COMPONENTES E EVENTOS
   * Tranca o vetor de intenção operacional, interceptando e descartando eventos secundários
   */
  setFocus(targetId, intensity = 1.0, urgency = 0.0) {
    if (this.attentionLock && urgency < 0.8) {
      this.traceFocus(`Focus Lock Ativo. Bloqueada tentativa de desvio foveal para: [${targetId}]`, 'WARN');
      return false;
    }

    this.activeFocusTarget = targetId;
    this.focusIntensity = intensity;

    if (urgency >= 0.8) {
      this.attentionLock = true; // Engaja trava atômica para operações críticas (ex: Mission-critical)
      this.currentProfile = ATTENTION_PROFILES.FOCUS;
      this.traceFocus(`🔒 FOCUS LOCK ENGATADO de forma absoluta sobre [${targetId}]. Urgência: ${urgency}`, 'CRITICAL');
      this._enforceInhibitionTopology();
    } else {
      this.traceFocus(`Foco estabelecido no alvo [${targetId}] com intensidade ${intensity}`, 'INFO');
    }

    window.SentinelBus?.emit('ui:nexus-update', { text: `FOCUS_TARGET: ${targetId}\nLOCK_STATE: ${this.attentionLock}` });
    return true;
  }

  /**
   * Destranca o Focus Lock liberando o barramento cognitivo
   */
  restoreFocus() {
    this.attentionLock = false;
    this.activeFocusTarget = null;
    this.currentProfile = ATTENTION_PROFILES.NORMAL;
    this.traceFocus('🔓 Focus Lock desativado de forma limpa. Atenção rebalanceada para malha nominal.', 'INFO');
    this._resetInhibitionTopology();
  }

  /**
   * ⚡ SALIENCE MAPPING — ATRIBUIÇÃO DINÂMICA DE CONTRASTE E SATURAÇÃO
   * Modifica a visibilidade cromática de dados estruturais na memória com base na urgência de leitura
   */
  calculateSalience(elementId, physicalParameters = {}) {
    const motionWeight = physicalParameters.motion || 0.0;
    const distanceToGaze = physicalParameters.distance || 0.5;
    const isCritical = physicalParameters.isMissionCritical || false;

    // Fórmula Operacional de Saliência: Urgência estrutural decai com a distância angular do olhar
    let salienceScore = (motionWeight * 0.4) + (isCritical ? 0.6 : 0.0);
    salienceScore -= (distanceToGaze * 0.3);
    salienceScore = Math.min(1.0, Math.max(0.0, salienceScore));

    this.salienceMap.set(elementId, salienceScore);

    // Se o escore for massivo, promove dinamicamente a zona de atenção do elemento
    if (salienceScore > 0.75) {
      this.traceAttention(`Elemento [${elementId}] promovido por Saliência Elevada (${salienceScore.toFixed(2)}).`, 'INFO');
      this._applyVisualTokenOverride(elementId, ATTENTION_ZONES.PRIMARY);
    } else if (salienceScore < 0.25 && this.currentProfile === ATTENTION_PROFILES.FOCUS) {
      this._applyVisualTokenOverride(elementId, ATTENTION_ZONES.PERIPHERAL);
    }

    return salienceScore;
  }

  /**
   * ⚡ COGNITIVE SUPPRESSION & PERIPHERAL INHIBITION — ENFORCEMENT TOPOLÓGICO
   * Suprime e atenua fisicamente o DOM/Shaders que estão fora do campo de atenção direto
   */
  _enforceInhibitionTopology() {
    this.traceSuppression('Aplicando Engenharia de Maestria de Ruído. Executando atenuação periférica total.', 'WARN');
    
    if (typeof document === 'undefined') return;

    // Aplica classes de opacidade reduzida e dessaturação direto nas camadas CSS através dos tokens do sistema
    const body = document.body;
    if (body) {
      body.classList.add('sentinel-focus-lock-active');
      if (this.currentProfile === ATTENTION_PROFILES.FOCUS) {
        body.style.setProperty('--pulvinar-opacity', '1.0');
        body.style.setProperty('--gamma-scale', '1.03');
      }
    }

    // Alimenta o barramento para que o SentinelRenderer cesse o processamento de FX periféricos
    window.SentinelBus?.emit('attention:suppression-trigger', {
      profile: this.currentProfile,
      zones: this.zoneStates
    });
  }

  /**
   * Reseta as deformações visuais e filtros de inibição do layout
   */
  _resetInhibitionTopology() {
    if (typeof document === 'undefined') return;
    const body = document.body;
    if (body) {
      body.classList.remove('sentinel-focus-lock-active');
      body.style.removeProperty('--pulvinar-opacity');
      body.style.removeProperty('--gamma-scale');
    }
  }

  /**
   * Injeta os modificadores gráficos diretamente no elemento manipulado
   */
  _applyVisualTokenOverride(elementId, zoneKey) {
    if (typeof document === 'undefined') return;
    const element = document.getElementById(elementId);
    if (!element) return;

    const config = this.zoneStates[zoneKey];
    if (config) {
      element.style.opacity = config.opacity.toString();
      element.style.filter = `saturate(${config.saturation})`;
      element.style.pointerEvents = config.allowSignals ? 'auto' : 'none';
    }
  }

  /**
   * Força a inibição forçada de uma zona completa de visualização (Método Legado Ampliado)
   */
  suppressZone(zoneKey) {
    if (this.zoneStates[zoneKey]) {
      this.zoneStates[zoneKey].opacity = 0.0;
      this.zoneStates[zoneKey].allowSignals = false;
      this.traceSuppression(`Zona [${zoneKey}] forçada para isolamento total em runtime.`, 'WARN');
      this._enforceInhibitionTopology();
    }
  }

  /**
   * Acoplamento interno e escuta do Barramento Central
   */
  _initializeAttentionGovernor() {
    this.traceAttention('Estruturando Malha de Inibição Periférica...', 'INFO');

    window.SentinelBus?.on('boot:complete', () => {
      this.traceAttention('Barramento sínclito ativado. Orquestração de relevância unificada operacional.');
      this.restoreFocus();
    });

    // Captura feixes de olhar emitidos por rastreadores espaciais (XR Eyetracking) do engine-xr.js
    window.SentinelBus?.on('xr:gaze_moved', (data) => {
      if (data && data.target) {
        this.spatial.gaze = data.gazeVector || this.spatial.gaze;
        this.calculateSalience(data.target, { 
          motion: data.motion || 0.0, 
          distance: data.distance || 0.1, 
          isMissionCritical: data.critical || false 
        });
        this.setFocus(data.target, 1.2, data.urgency || 0.0);
      }
    });

    // Interceptador contra vazamentos: Cancela notificações de baixa prioridade em Focus Lock
    window.SentinelBus?.on('ui:notification-triggered', (notification) => {
      if (this.attentionLock && (!notification || notification.priority !== 'CRITICAL')) {
        // Bloqueio físico por interrupção do Focus Lock
        if (notification) notification.canceled = true; 
        this.traceSuppression(`NOTIFICAÇÃO SUPRIMIDA PELO FOCUS LOCK: [${notification?.title || 'Conteúdo Ocultado'}]`, 'WARN');
      }
    });
  }
}

// 5. EXPOSIÇÃO OPERACIONAL E ANCORAGEM PASSIVA NO KERNEL SOBERANO
(() => {
  const AttentionEngineInstance = new SentinelAttentionEngine();
  
  window.SentinelAttentionClass = SentinelAttentionEngine; // Exposição estrutural da Classe
  window.SentinelAttention = AttentionEngineInstance;       // Instância operacional ativa

  // Vinculação determinística como subsistema direto do Kernel Soberano
  if (window.SovereignKernel) {
    window.SovereignKernel.registerModule('attention', AttentionEngineInstance);
  } else {
    Object.defineProperty(window, 'SovereignKernel', {
      configurable: true,
      enumerable: true,
      set: (kernelInstance) => {
        delete window.SovereignKernel;
        window.SovereignKernel = kernelInstance;
        window.SovereignKernel.registerModule('attention', AttentionEngineInstance);
      }
    });
  }

  console.log(
    '%c OMC SENTINEL ATTENTION OS v9.0 ONLINE [INHIBITION-FILTER-ON] ',
    'background:#550055; color:#fff; font-weight:bold; padding:3px; border-right:4px solid #D400FF;'
  );
})();
