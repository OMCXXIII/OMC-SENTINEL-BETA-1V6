/* ═══════════════════════════════════════════════════════════════════════════
   OMC VR-OS | SENTINEL KERNEL v7.0 — CORE ARCHITECT
   Responsabilidade: Orquestração de Estados, Alocação de Recursos e ENE
   ═══════════════════════════════════════════════════════════════════════════ */

const SentinelKernel = (() => {
    'use strict';

    let _bootSealed = false;
    let _activeMode = 'BOOT'; // MODOS: BOOT, IDLE, FOCUS, DEEPFLOW, RECOVERY
    const ENERGY_BUDGET_LIMIT = 0.20; // 20% Threshold Metabólico

    const _bindEvents = () => {
        if (!window.SentinelBus) return;

        // Monitor de Carga Metabólica (Prevenção de PFC-BRUT)
        window.SentinelBus.on('state:changed', (data) => {
            if (data.path === 'system:mental-battery' && data.value < ENERGY_BUDGET_LIMIT) {
                _enterMode('RECOVERY');
            }
        });

        // Listener para Trava de Missão
        window.SentinelBus.on('mission:locked', (mission) => {
            console.log(`%c[KERNEL] Mission Lock Engaged: ${mission.id}`, 'color: #00FF41;');
            _enterMode('DEEPFLOW');
        });
    };

    const _enterMode = (newMode) => {
        if (_activeMode === newMode) return;
        const oldMode = _activeMode;
        _activeMode = newMode;

        console.log(`%c[KERNEL] Context Swap: ${oldMode} ──> ${newMode}`, 'color: #00D4FF; font-weight: bold;');
        
        if (window.SentinelBus) {
            window.SentinelBus.emit('kernel:mode-changed', { oldMode, newMode });
            window.StateStore?.set('system:active-mode', newMode); // Persistência L1/L2[cite: 1, 2]
        }

        _applyExecutionPolicies(newMode);
    };

    const _applyExecutionPolicies = (mode) => {
        const body = document.body;
        if (!body) return;

        switch (mode) {
            case 'DEEPFLOW':
                body.classList.add('ene-active', 'neural-silence'); // Ativa Estado Natural de Execução[cite: 1, 2]
                body.classList.remove('low-power-mode');
                break;
            case 'RECOVERY':
                body.classList.add('low-power-mode', 'nsdr-cooling'); // Resfriamento Metabólico
                body.classList.remove('ene-active', 'neural-silence');[cite: 1, 2]
                break;
            default:
                body.classList.remove('ene-active', 'neural-silence', 'low-power-mode', 'nsdr-cooling');[cite: 1, 2]
        }
    };

    const init = () => {
        if (_bootSealed) return;
        _bootSealed = true;

        console.log('%c[KERNEL] Inicializando Sistema Operacional Cognitivo...', 'color: #7F00FF; font-weight: bold;');
        _bindEvents();
        _enterMode('IDLE');
        
        if (window.SentinelBus) {
            window.SentinelBus.emit('boot:complete', { ts: Date.now() });
        }
    };

    return {
        init,
        enterMode: _enterMode,
        getActiveMode: () => _activeMode
    };
})();

// Inicialização segura atrelada ao ciclo de vida do Core/Bus
window.addEventListener('DOMContentLoaded', () => {
    if (window.SentinelBus) {
        window.SentinelBus.on('boot:start', () => SentinelKernel.init());
    } else {
        window.addEventListener('load', () => SentinelKernel.init());
    }
});

window.SentinelKernel = SentinelKernel;
