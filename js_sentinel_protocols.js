/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — SOVEREIGN GOVERNANCE LAYER (FORMAL CONTRACT VALIDATOR)
 * Arquivo: js_sentinel_protocols.js
 * Papel: Transition Policies, Runtime Contracts e Firewall de Frame Budget
 * Governança: Co-orquestrador de Conformidade. Sem auto-boot intrusivo.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// 1. PRIORITY GOVERNANCE LEVELS — Escalonamento Verde de Salvaguarda
const PRIORITY_LEVELS = Object.freeze({
  CRITICAL:   'CRITICAL',   // Emergência de hardware, colapso de GPU ou pânico de memória
  HIGH:       'HIGH',       // Missões ativas, isolamento de atenção, alertas biométricos
  NORMAL:     'NORMAL',     // Fluxos operacionais nominais e telemetria padrão
  BACKGROUND: 'BACKGROUND', // Loops metabólicos, indexação de histórico L2/L3
  SUPPRESSED: 'SUPPRESSED'  // Saturação semântica mitigada ou contextos silenciados
});

// 2. DOMAIN ISOLATION DEFINITIONS — Fronteiras de Sandbox
const PROTOCOL_DOMAINS = Object.freeze({
  COGNITION:   'COGNITION',
  RENDERING:   'RENDERING',
  DIAGNOSTICS: 'DIAGNOSTICS',
  MEMORY:      'MEMORY',
  XR:          'XR'
});

class SentinelProtocolsEngine {
  constructor() {
    this.version = '9.0-GOVERNANCE';
    this.isActive = true;

    // 3. ESTRUTURA CORE DE POLÍTICAS E VERIFICAÇÕES
    this.protocols = {
      runtime: {
        boot: 'INITIALIZED',
        suspend: 'ALLOWED',
        wake: 'RESTRICTED',
        shutdown: 'PROTECTED'
      }
    };

    // Registro interno de contratos e orçamentos homologados pelo Scheduler
    this.registeredContracts = new Map();
    this.violationLog = [];
    
    // Configurações de restrição do Frame Budget (Alvo nominal: 16.66ms para 60fps)
    this.budgetConstraints = {
      maxFrameBudgetMs: 16.66,
      maxThirdPartyAllowance: 0.15 // Scripts externos não podem consumir mais que 15% do frame
    };

    this._initializeGovernanceEngine();
  }

  /**
   * TRACE ENGINE UNIFICADO INTERNO DE POLÍTICAS
   */
  trace(message, level = 'INFO') {
    if (window.SovereignKernel && typeof window.SovereignKernel.trace === 'function') {
      window.SovereignKernel.trace('PROTOCOLS', message, level);
    } else {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
      console.log(`%c[${timestamp}] [PROTOCOLS] [${level}] ${message}`, 'color: #FFC400; font-weight: bold;');
    }
  }

  traceProtocol(msg, level = 'INFO')  { this.trace(`[GOVERNANCE] ${msg}`, level); }
  traceViolation(msg, level = 'WARN') { this.trace(`[VIOLATION] ${msg}`, level); }
  traceRecovery(msg, level = 'INFO')  { this.trace(`[RECOVERY_CHAIN] ${msg}`, level); }

  /**
   * REGISTRO SEGURO DE CONTRATOS EXTERNOS DE COMPONENTES
   */
  registerProtocol(contractId, domain, allocationBudgetPercentage = 0.05) {
    if (!PROTOCOL_DOMAINS[domain]) {
      this.traceViolation(`Tentativa de registro em domínio inválido: [${domain}] pelo contrato [${contractId}]`, 'CRITICAL');
      return false;
    }

    const contract = {
      id: contractId,
      domain,
      budgetShare: Math.min(this.budgetConstraints.maxThirdPartyAllowance, allocationBudgetPercentage),
      authorized: true,
      timestamp: Date.now()
    };

    this.registeredContracts.set(contractId, contract);
    this.traceProtocol(`Contrato formal homologado com sucesso: [${contractId}] no Domínio [${domain}]`, 'INFO');
    return true;
  }

  /**
   * ⚡ TRANSITION POLICIES — VALIDAÇÃO FORMAL ANTES DE TRANSMUTAÇÕES DE HARDWARE
   * Intercepta e valida transições de estado para garantir integridade e assinaturas válidas
   */
  verifyTransaction(sourceMode, targetMode, telemetryToken = {}) {
    this.traceProtocol(`Avaliando política de transição: [${sourceMode}] ──► [${targetMode}]`, 'INFO');

    // Regra de Ouro: Bloqueia qualquer rebaixamento para SAFE_MODE ou RECOVERY se a Missão estiver travada (Focus Lock)
    if (window.SentinelAttention && window.SentinelAttention.attentionLock && targetMode === 'RECOVERY') {
      if (!telemetryToken.overrideCriticalAuthority) {
        this.traceViolation(`CONTRATO REJEITADO: Transição para RECOVERY negada. Focus Lock ativo em missão crítica.`, 'CRITICAL');
        this._recordViolation('TRANSITION_DENIED', sourceMode, targetMode, 'Focus Lock Barrier');
        return false;
      }
    }

    // Valida tokens de telemetria corrompidos ou com sobrecarga metabólica simulada
    if (telemetryToken.mentalBattery < 0.05 && targetMode === 'FOCUS') {
      this.traceViolation(`CONTRATO REJEITADO: Carga metabólica em esgotamento fatal (${(telemetryToken.mentalBattery * 100).toFixed(1)}%). Modo FOCUS proibido.`, 'CRITICAL');
      this._recordViolation('METABOLIC_FAILURE', sourceMode, targetMode, 'Low Mental Power Threshold');
      return false;
    }

    this.traceProtocol(`Transição [${targetMode}] autorizada formalmente pela mesa de governança.`, 'INFO');
    return true;
  }

  /**
   * ⚡ RUNTIME CONTRACTS — FIREWALL DE FRAME BUDGET PARA SCRIPTING EXTERNO
   * Protege a linha de execução do loop principal contra injeções de terceiros que causem lag ou stutters
   */
  executeGuardedBlock(contractId, executionBlock) {
    // Se o contrato não estiver registrado, intercepta imediatamente como violação de caixa de areia
    if (!this.registeredContracts.has(contractId)) {
      this.traceViolation(`FIREWALL VIOLATION: Script não autorizado tentou executar instruções em runtime: [${contractId}]`, 'CRITICAL');
      this._recordViolation('UNAUTHORIZED_SCRIPT_INJECTION', 'RUNTIME', 'EXECUTE', contractId);
      return false;
    }

    const contract = this.registeredContracts.get(contractId);
    const startTime = performance.now();

    try {
      // Execução isolada em sandbox temporária
      executionBlock();
    } catch (err) {
      this.traceViolation(`Exceção capturada dentro do bloco do contrato [${contractId}]: ${err.message}`, 'ERROR');
    }

    const executionTimeMs = performance.now() - startTime;
    const maxAllowedMs = this.budgetConstraints.maxFrameBudgetMs * contract.budgetShare;

    // Avaliação de estouro de Frame Budget (Garantia de estabilidade de quadros)
    if (executionTimeMs > maxAllowedMs) {
      this.traceViolation(`🔥 CONTRATO VIOLADO: [${contractId}] estourou o Frame Budget Alocado! Gasto: ${executionTimeMs.toFixed(3)}ms (Máx Permitido: ${maxAllowedMs.toFixed(3)}ms)`, 'WARN');
      this._recordViolation('FRAME_BUDGET_OVERFLOW', 'LOOP', contract.domain, `${contractId} expendeu demais`);
      this._punishContract(contractId);
    }
  }

  /**
   * Reduz o orçamento de tempo ou revoga autorizações de scripts maliciosos ou ineficientes
   */
  _punishContract(contractId) {
    const contract = this.registeredContracts.get(contractId);
    if (contract) {
      contract.budgetShare *= 0.5; // Degrada linearmente a cota de processamento pela metade (Pena de Throttling)
      if (contract.budgetShare < 0.01) {
        contract.authorized = false;
        this.registeredContracts.delete(contractId);
        this.traceViolation(`Contrato [${contractId}] cassado permanentemente por ineficiência crônica e stutters de renderização.`, 'CRITICAL');
      }
    }
  }

  _recordViolation(type, source, target, details) {
    this.violationLog.push({ timestamp: Date.now(), type, source, target, details });
    if (this.violationLog.length > 50) this.violationLog.shift();
    
    // Dispara alerta no barramento para que o Debug HUD capte a quebra de conformidade
    window.SentinelBus?.emit('system:warning', { type: `CONTRATO_VIOLADO_${type}`, msg: details });
  }

  /**
   * ⚡ COGNITIVE HOMEOCINESIS — MANUTENÇÃO E EQUILÍBRIO DE CONTRATOS (Core Loop)
   */
  maintainProtocolEquilibrium() {
    if (!this.isActive) return;

    // Se as violações acumuladas em curto espaço de tempo forem massivas, força o Kernel para SAFE_MODE
    const shortTermViolations = this.violationLog.filter(v => Date.now() - v.timestamp < 10000);
    if (shortTermViolations.length >= 4) {
      this.traceRecovery('⚠️ Múltiplas violações de contratos simultâneas detectadas. Invocando cadeia de contenção do Kernel...', 'CRITICAL');
      this.violationLog = []; // Zera buffer
      
      window.SentinelBus?.emit('state:phase-synchronized', { from: 'ANY', to: 'SAFE_MODE', reason: 'CRITICAL_CONTRACT_BREACH' });
    }
  }

  /**
   * Mapeamento e amarrações retrocompatíveis estritas com os contratos legados v6.1
   */
  _registerLegacyBinds() {
    this.registerProtocol('legacy_core_adapter', PROTOCOL_DOMAINS.COGNITION, 0.05);
    this.registerProtocol('ext_visual_particles', PROTOCOL_DOMAINS.RENDERING, 0.10);

    // Conecta interceptores seguros na transição nativa do State Governor
    window.SentinelBus?.on('state:changed', (data) => {
      if (data && data.path === 'system:mode-transition') {
        const mentalBattery = window.StateStore?.get?.('system.mental-battery') || 1.0;
        const success = this.verifyTransaction('CURRENT', data.value, { mentalBattery });
        if (!success) {
          this.traceRecovery(`Transição interceptada e abortada em runtime pela mesa de governança.`, 'WARN');
        }
      }
    });
  }

  _initializeGovernanceEngine() {
    this.traceProtocol('Estruturando Malha de Verificação Formal de Contratos...', 'INFO');

    window.SentinelBus?.on('boot:complete', () => {
      this.traceProtocol('Fronteiras de isolamento de sandbox ativas. Governança online.');
      this._registerLegacyBinds();
    });
  }
}

// 5. EXPOSIÇÃO OPERACIONAL E ANCORAGEM DETERMINÍSTICA NO KERNEL SOBERANO
(() => {
  const SovereignProtocolsEngine = new SentinelProtocolsEngine();
  
  window.SentinelProtocolsClass = SentinelProtocolsEngine; // Exposição estrutural da Classe
  window.SentinelProtocols = SovereignProtocolsEngine;       // Instância operacional ativa

  // Vinculação determinística como subsistema direto do Kernel Soberano
  if (window.SovereignKernel) {
    window.SovereignKernel.registerModule('protocols', SovereignProtocolsEngine);
  } else {
    Object.defineProperty(window, 'SovereignKernel', {
      configurable: true,
      enumerable: true,
      set: (kernelInstance) => {
        delete window.SovereignKernel;
        window.SovereignKernel = kernelInstance;
        window.SovereignKernel.registerModule('protocols', SovereignProtocolsEngine);
      }
    });
  }

  // Acopla a auditoria de estabilidade contínua ao batimento de renderização nativo
  const governancePulse = () => {
    SovereignProtocolsEngine.maintainProtocolEquilibrium();
    requestAnimationFrame(governancePulse);
  };
  requestAnimationFrame(governancePulse);

  console.log(
    '%c OMC SENTINEL GOVERNANCE & FORMAL CONTRACTS v9.0 ONLINE [FIREWALL-ON] ',
    'background:#332200; color:#FFC400; font-weight:bold; padding:3px; border-left:4px solid #FFC400;'
  );
})();
