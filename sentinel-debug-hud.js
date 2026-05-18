/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE OBSERVABILITY HUDBACKBONE (CENTRO OPERACIONAL)
 * Arquivo: sentinel-debug-hud.js
 * Papel: Painel Analítico, Telemetria de Hardware, Rastreamento Perceptivo
 * Governança: Totalmente subordinado ao SovereignKernel. Sem auto-boot implícito.
 * Fix: Implementação de DEFERRED INIT para sanar quebras de inicialização precoce.
 * Integrando: Runtime Panels, Active Modules, Event Trace, Perf Timeline e Thermal.
 * ═══════════════════════════════════════════════════════════════════════════
 */

class SentinelCognitiveObservatory {
    constructor() {
        this.version = "9.0-OPERATIONAL-CENTER";
        
        // A) DEFERRED INIT: Trava de prontidão operativa para evitar injeção antes da montagem da DOM
        this.isInitialized = false;
        this.isActive = false;

        // B) RUNTIME PANELS: Estruturas de dados para os indicadores táticos
        this.panels = {
            fps: { current: 60.0, target: 90.0, history: [] },
            gpu: { frameTimeMs: 0.0, maxBudgetMs: 11.1, executionShaderMs: 0.0 },
            xr:  { activeSession: false, trackingStatus: 'STABLE', resolutionScale: 1.0 },
            scheduler: { activeTasksCount: 0, pendingTasksCount: 0, frameUtilizationFraction: 0.0 },
            attention: { currentFocusId: 'NONE', cognitiveLoadScore: 0.0, suppressedNodesCount: 0 }
        };

        // C) ACTIVE MODULE VIEW
        this.activeModules = new Map(); // Armazena estado de saúde de cada módulo do Kernel

        // D) EVENT TRACE VIEW: Registro circular de alta fidelidade do barramento
        this.eventTrace = [];
        this.maxTraceLogs = 40;

        // E) PERFORMANCE TIMELINE: Amostragem temporal de micro-stutters (Frame Budget)
        this.timelineBuffer = new Uint8Array(120); // Janela móvel de 120 quadros (~2 segundos a 60Hz)
        this.timelineIndex = 0;

        // F) THERMAL ALERTS: Telemetria de estresse térmico de hardware imersivo
        this.thermal = {
            level: 'NOMINAL', // NOMINAL, THROTTLED, CRITICAL
            temperatureCelsius: 36.5,
            uiBlinkState: false
        };

        this.dom = {
            rootContainer: null,
            panelsContainer: null,
            traceLogContainer: null
        };

        this.bus = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // A) DEFERRED INIT (CORREÇÃO DE INICIALIZAÇÃO PRECOCE)
    // ═══════════════════════════════════════════════════════════════════════
    deferredInitialize() {
        if (this.isInitialized) return;

        this._trace('LIFECYCLE', 'Executando Deferred Init: Injetando infraestrutura visual na árvore DOM ativa...');
        
        // 1. Constrói contêiner físico seguro e isolado
        this.dom.rootContainer = document.createElement('div');
        this.dom.rootContainer.id = 'sentinel-operational-center-hud';
        this.dom.rootContainer.className = 'sentinel-hud-root-canvas';
        
        // Injeta a folha de estilo estrutural mínima diretamente se necessário
        this._injectCoreStyleOverride();

        // 2. Monta o esqueleto da interface de diagnóstico
        this.dom.rootContainer.innerHTML = `
            <div class="hud-operational-header">
                <span class="hud-title">SENTINEL // OPERATIONAL_CENTER v${this.version}</span>
                <span id="hud-thermal-badge" class="hud-badge status-nominal">THERMAL: NOMINAL</span>
            </div>
            <div class="hud-main-grid">
                <div class="hud-grid-left" id="hud-runtime-panels-root"></div>
                <div class="hud-grid-right">
                    <div class="hud-subpanel-title">C) ACTIVE MODULE VIEW</div>
                    <div id="hud-modules-root" class="hud-module-list-container"></div>
                    <div class="hud-subpanel-title" style="margin-top:12px;">D) EVENT TRACE VIEW</div>
                    <div id="hud-trace-root" class="hud-trace-log-container"></div>
                </div>
            </div>
            <div class="hud-operational-footer">
                <div class="hud-subpanel-title" style="font-size: 9px; margin-bottom: 2px;">E) PERFORMANCE TIMELINE (FRAME BUDGET BUDGET GRAPH)</div>
                <div id="hud-timeline-canvas-container" class="hud-timeline-bar-wrapper"></div>
            </div>
        `;

        document.body.appendChild(this.dom.rootContainer);
        this.dom.panelsContainer = document.getElementById('hud-runtime-panels-root');
        this.dom.traceLogContainer = document.getElementById('hud-trace-root');

        this.isInitialized = true;
        this.isActive = true;

        this._trace('LIFECYCLE', 'Infraestrutura visual montada e acoplada à viewport física com sucesso.');
        
        // Inicializa o loop de redesenho sínclito
        this._startRenderLoop();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // D) EVENT TRACE VIEW & C) ACTIVE MODULE VIEW MATION
    // ═══════════════════════════════════════════════════════════════════════
    pushEventTrace(eventName, payload) {
        const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0');
        const logString = `[${timestamp}] ➔ ${eventName} | ${JSON.stringify(payload || {})}`;
        
        this.eventTrace.unshift(logString); // Insere no topo
        
        if (this.eventTrace.length > this.maxTraceLogs) {
            this.eventTrace.pop();
        }
    }

    updateModuleStatus(moduleName, statusObj) {
        // Mapeia e atualiza a saúde de um componente com base nas leituras do Kernel
        this.activeModules.set(moduleName, {
            status: statusObj.status || 'UNKNOWN',
            errors: statusObj.errors !== undefined ? statusObj.errors : 0,
            lastSeen: performance.now()
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // E) PERFORMANCE TIMELINE TRACKER
    // ═══════════════════════════════════════════════════════════════════════
    recordFrameTimeDelta(elapsedMs) {
        if (!this.isInitialized) return;

        // Transforma o tempo do frame em uma escala de 0 a 100 (onde 16.6ms mapeia para ~50)
        const normalizedLoad = Math.min(100, Math.floor((elapsedMs / 33.3) * 100));
        this.timelineBuffer[this.timelineIndex] = normalizedLoad;
        
        this.timelineIndex = (this.timelineIndex + 1) % this.timelineBuffer.length;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ENGINE DE ATUALIZAÇÃO VISUAL (REDESENHO COGNITIVO)
    // ═══════════════════════════════════════════════════════════════════════
    _startRenderLoop() {
        let lastTimestamp = performance.now();

        const updateFrame = () => {
            if (!this.isActive) return;

            const now = performance.now();
            const delta = now - lastTimestamp;
            lastTimestamp = now;

            // Calcula dinamicamente o FPS bruto instantâneo
            this.panels.fps.current = delta > 0 ? 1000 / delta : 60.0;
            this.recordFrameTimeDelta(delta);

            // Coleta métricas cruzadas dos subsistemas anexados à janela
            this._harvestGlobalTelemetry();

            // Sincroniza os dados com os elementos DOM injetados
            this._syncViewDOM();

            requestAnimationFrame(updateFrame);
        };

        requestAnimationFrame(updateFrame);
    }

    _harvestGlobalTelemetry() {
        // Intercepta e sincroniza estados do Attention Manager se disponível
        if (window.AttentionManager) {
            this.panels.attention.currentFocusId = window.AttentionManager.cognitiveLoad?.activeFocusId || 'NONE';
            this.panels.attention.cognitiveLoadScore = window.AttentionManager.cognitiveLoad?.currentScore || 0.0;
            
            let suppressedCount = 0;
            if (window.AttentionManager.attentionGraph) {
                for (const [id, node] of window.AttentionManager.attentionGraph.entries()) {
                    if (node.priority === 'SUPPRESSED') suppressedCount++;
                }
            }
            this.panels.attention.suppressedNodesCount = suppressedCount;
        }

        // Intercepta estados do Scheduler Temporário
        if (window.SentinelScheduler) {
            this.panels.scheduler.activeTasksCount = window.SentinelScheduler.tasks?.size || 0;
            this.panels.scheduler.frameUtilizationFraction = window.SentinelScheduler.frameBudget?.usedTimeFraction || 0.0;
        }

        // Intercepta estados do Motor XR Espacial
        if (window.SentinelEngineXR) {
            this.panels.xr.activeSession = window.SentinelEngineXR.xr?.sessionActive || false;
            this.panels.xr.resolutionScale = window.SentinelEngineXR.resolution?.viewportMultiplier || 1.0;
        }

        // Intercepta telemetria de Shaders da GPU
        if (window.SentinelShaderRuntime) {
            this.panels.gpu.executionShaderMs = window.SentinelShaderRuntime.budget?.currentLoadMs || 0.0;
        }

        // Atualiza a visualização da saúde dos módulos direto da matriz do Kernel Soberano
        if (window.SovereignKernel) {
            const modulesList = ['sentinel-bus', 'sentinel-state-machine', 'sentinel-scheduler', 'sentinel-core', 'sentinel-performance', 'sentinel-renderer', 'attention-manager', 'memory-vault', 'engine-xr'];
            modulesList.forEach(modName => {
                const status = window.SovereignKernel.getModuleStatus?.(modName);
                if (status) this.updateModuleStatus(modName, status);
            });
        }
    }

    _syncViewDOM() {
        // B) RENDERING RUNTIME PANELS
        if (this.dom.panelsContainer) {
            const p = this.panels;
            this.dom.panelsContainer.innerHTML = `
                <div class="hud-panel-metric-card">
                    <div class="metric-label">FPS // RASTREAMENTO REALTIME</div>
                    <div class="metric-value ${p.fps.current < 45 ? 'alert-critical' : 'text-nominal'}">${p.fps.current.toFixed(1)} <span class="metric-unit">HZ</span></div>
                </div>
                <div class="hud-panel-metric-card">
                    <div class="metric-label">GPU // COGNITIVE SHADER LOAD</div>
                    <div class="metric-value">${p.gpu.executionShaderMs.toFixed(2)} <span class="metric-unit">MS</span></div>
                    <div class="hud-mini-progress-bar"><div class="hud-mini-progress-fill" style="width: ${Math.min(100, (p.gpu.executionShaderMs/4.5)*100)}%"></div></div>
                </div>
                <div class="hud-panel-metric-card">
                    <div class="metric-label">XR // IMERSÃO ESPACIAL</div>
                    <div class="metric-value">${p.xr.activeSession ? 'WEBXR_ACTIVE' : '2D_STABLE_HUD'}</div>
                    <div class="metric-subtext">Escala de Resolução Retiniana: ${(p.xr.resolutionScale * 100).toFixed(0)}%</div>
                </div>
                <div class="hud-panel-metric-card">
                    <div class="metric-label">SCHEDULER // TEMPORAL BUDGET</div>
                    <div class="metric-value">${p.scheduler.activeTasksCount} <span class="metric-unit">TASKS</span></div>
                    <div class="metric-subtext">Uso do Laço: ${(p.scheduler.frameUtilizationFraction * 100).toFixed(0)}%</div>
                </div>
                <div class="hud-panel-metric-card">
                    <div class="metric-label">ATTENTION // PERCEPTUAL PROFILE</div>
                    <div class="metric-value" style="color:#D4AF37;">ID: [${p.attention.currentFocusId}]</div>
                    <div class="metric-subtext">Carga Mental: ${(p.attention.cognitiveLoadScore * 100).toFixed(0)}% | Supressões Ativas: ${p.attention.suppressedNodesCount}</div>
                </div>
            `;
        }

        // C) RENDERING ACTIVE MODULE VIEW
        const mRoot = document.getElementById('hud-modules-root');
        if (mRoot) {
            let htmlBuffer = '';
            for (const [name, data] of this.activeModules.entries()) {
                const statusClass = data.status === 'NOMINAL' ? 'status-nominal-tag' : 'status-critical-tag';
                htmlBuffer += `
                    <div class="hud-module-entry">
                        <span class="hud-module-name">${name}</span>
                        <span class="hud-module-badge ${statusClass}">${data.status} [E:${data.errors}]</span>
                    </div>
                `;
            }
            mRoot.innerHTML = htmlBuffer || '<div class="metric-subtext">Nenhum módulo orquestrado localizado.</div>';
        }

        // D) RENDERING EVENT TRACE VIEW
        if (this.dom.traceLogContainer) {
            this.dom.traceLogContainer.innerHTML = this.eventTrace.map(log => `<div class="hud-trace-line">${log}</div>`).join('');
        }

        // E) RENDERING PERFORMANCE TIMELINE GRAPH
        const tContainer = document.getElementById('hud-timeline-canvas-container');
        if (tContainer) {
            let barsHtml = '';
            const totalElements = this.timelineBuffer.length;
            
            // Loop para desenhar as barras da janela deslizante ordenadas temporalmente
            for (let i = 0; i < totalElements; i++) {
                const targetIdx = (this.timelineIndex + i) % totalElements;
                const hValue = this.timelineBuffer[targetIdx];
                
                // Determina cor com base no estouro de orçamento
                let colorClass = 'bar-nominal';
                if (hValue > 70) colorClass = 'bar-critical';
                else if (hValue > 45) colorClass = 'bar-warning';

                barsHtml += `<div class="hud-timeline-slice ${colorClass}" style="height: ${Math.max(2, hValue)}%;"></div>`;
            }
            tContainer.innerHTML = barsHtml;
        }

        // F) THERMAL ALERTS MANAGEMENT
        const thermalBadge = document.getElementById('hud-thermal-badge');
        if (thermalBadge) {
            thermalBadge.innerHTML = `THERMAL: ${this.thermal.level} (${this.thermal.temperatureCelsius.toFixed(1)}°C)`;
            
            // Gerencia classes e alarmes intermitentes em caso de superaquecimento
            if (this.thermal.level === 'CRITICAL' || this.thermal.level === 'THROTTLED') {
                thermalBadge.className = `hud-badge status-critical ${this.thermal.uiBlinkState ? 'blink-off' : ''}`;
                if (Math.random() < 0.1) this.thermal.uiBlinkState = !this.thermal.uiBlinkState; // Alternância assíncrona simples
            } else {
                thermalBadge.className = 'hud-badge status-nominal';
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // F) THERMAL ALERTS RECEPTOR
    // ═══════════════════════════════════════════════════════════════════════
    injectThermalMetrics(temperatureC) {
        this.thermal.temperatureCelsius = temperatureC;
        if (temperatureC > 48.0) {
            this.thermal.level = 'CRITICAL';
            this.pushEventTrace('HARDWARE_PANIC', { thermalStress: 'CRITICAL', temp: temperatureC });
        } else if (temperatureC > 41.0) {
            this.thermal.level = 'THROTTLED';
            this.pushEventTrace('HARDWARE_WARNING', { thermalStress: 'THROTTLED', temp: temperatureC });
        } else {
            this.thermal.level = 'NOMINAL';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INJEÇÃO DE INFRAESTRUTURA CSS DINÂMICA
    // ═══════════════════════════════════════════════════════════════════════
    _injectCoreStyleOverride() {
        const styleId = 'sentinel-hud-core-injected-css';
        if (document.getElementById(styleId)) return;

        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = `
            .sentinel-hud-root-canvas {
                position: fixed; top: 10px; right: 10px; width: 440px;
                background: rgba(4, 8, 14, 0.85); backdrop-filter: blur(10px);
                border: 1px solid rgba(0, 255, 136, 0.15); border-radius: 6px;
                font-family: 'Courier New', monospace; color: #E2E8F0;
                padding: 12px; z-index: 999999; box-shadow: 0 10px 30px rgba(0,0,0,0.6);
            }
            .hud-operational-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; margin-bottom: 8px; }
            .hud-title { font-size: 11px; font-weight: bold; color: #00FF88; letter-spacing: 0.05em; }
            .hud-badge { font-size: 9px; font-weight: bold; padding: 2px 5px; border-radius: 3px; }
            .status-nominal { background: rgba(0, 255, 136, 0.15); color: #00FF88; border: 1px solid #00FF88; }
            .status-critical { background: rgba(255, 62, 62, 0.2); color: #FF3E3E; border: 1px solid #FF3E3E; }
            .blink-off { opacity: 0.3; }
            .hud-main-grid { display: flex; gap: 10px; height: 260px; }
            .hud-grid-left { flex: 1.1; display: flex; flex-direction: column; gap: 6px; }
            .hud-grid-right { flex: 1.2; display: flex; flex-direction: column; background: rgba(0,0,0,0.2); padding: 6px; border-radius: 4px; overflow: hidden; }
            .hud-subpanel-title { font-size: 10px; font-weight: bold; color: rgba(255,255,255,0.4); letter-spacing: 0.04em; margin-bottom: 4px; }
            .hud-panel-metric-card { background: rgba(255,255,255,0.03); padding: 5px 8px; border-radius: 4px; border-left: 2px solid rgba(0,255,136,0.3); }
            .metric-label { font-size: 8px; color: rgba(255,255,255,0.4); }
            .metric-value { font-size: 14px; font-weight: bold; margin: 1px 0; }
            .metric-unit { font-size: 9px; color: rgba(255,255,255,0.3); }
            .metric-subtext { font-size: 8px; color: rgba(255,255,255,0.3); }
            .text-nominal { color: #00FF88; }
            .alert-critical { color: #FF3E3E; text-shadow: 0 0 6px rgba(255,62,62,0.4); }
            .hud-mini-progress-bar { width: 100%; height: 2px; background: rgba(255,255,255,0.05); margin-top: 3px; overflow: hidden; }
            .hud-mini-progress-fill { height: 100%; background: #00FF88; }
            .hud-module-list-container { flex: 1; overflow-y: auto; font-size: 9px; display: flex; flex-direction: column; gap: 3px; margin-bottom: 8px; }
            .hud-module-entry { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 2px 4px; border-radius: 2px; }
            .hud-module-name { color: rgba(255,255,255,0.7); }
            .status-nominal-tag { color: #00FF88; }
            .status-critical-tag { color: #FF3E3E; font-weight: bold; }
            .hud-trace-log-container { flex: 1.4; overflow-y: auto; font-size: 8px; color: rgba(255,255,255,0.5); display: flex; flex-direction: column; gap: 2px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px; }
            .hud-trace-line { white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
            .hud-operational-footer { border-top: 1px solid rgba(255,255,255,0.1); margin-top: 8px; padding-top: 6px; }
            .hud-timeline-bar-wrapper { display: flex; align-items: flex-end; gap: 1px; height: 25px; background: rgba(0,0,0,0.4); border-radius: 3px; padding: 2px; overflow: hidden; }
            .hud-timeline-slice { flex: 1; width: 2px; border-radius: 1px; transition: height 0.05s ease; }
            .bar-nominal { background: #00FF88; }
            .bar-warning { background: #D4AF37; }
            .bar-critical { background: #FF3E3E; }
        `;
        document.head.appendChild(styleEl);
    }

    _trace(subsystem, message, level = 'INFO') {
        const formatted = `[${new Date().toISOString()}] [DEBUG-HUD:${subsystem}] [${level}] ${message}`;
        if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
        else if (level === 'WARN') console.warn(formatted);
        else console.log(formatted);
    }

    _attachSignalBus(busInstance) {
        this.bus = busInstance;

        // Escuta o barramento geral de telemetria e o mapeia para o histórico analítico de logs (Trace)
        this.bus.on('kernel:phase-synchronized', (data) => {
            this.pushEventTrace('KERNEL_PHASE_CHANGE', data);
            
            // A) DEFERRED INIT: Aciona a construção imediata do DOM assim que o Kernel estiver em INIT ou READY
            if (data.to === 'INIT' || data.to === 'READY') {
                this.deferredInitialize();
            }
        });

        this.bus.on('system:state_changed', (state) => {
            this.pushEventTrace('STATE_MUTATION', state);
        });

        this.bus.on('xr:gaze_moved', (data) => {
            // Suprime rastreio excessivo para não sobrecarregar o painel visual
            if (Math.random() < 0.15) {
                this.pushEventTrace('GAZE_STREAM_MOVE', { target: data.target });
            }
        });

        this.bus.on('performance:telemetry-sync', (metrics) => {
            if (metrics && metrics.temperatureC) {
                this.injectThermalMetrics(metrics.temperatureC);
            }
        });
    }
}

// Instanciação e exposição única em total conformidade com o ecossistema v9.0
const SovereignHUDViewer = new SentinelCognitiveObservatory();
window.SentinelHUD = SovereignHUDViewer;

// Hook de segurança redundante: Caso a página já tenha carregado o barramento
if (window.SentinelBus) {
    SovereignHUDViewer._attachSignalBus(window.SentinelBus);
}

export default SovereignHUDViewer;
