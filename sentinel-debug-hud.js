/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.5 — COGNITIVE OBSERVABILITY HUDBACKBONE (CENTRO OPERACIONAL)
 * Arquivo: sentinel-debug-hud.js
 * Papel: Painel Analítico, Telemetria de Hardware, Rastreamento Perceptivo
 * Governança: Totalmente subordinado ao SovereignKernel. Sem auto-boot implícito.
 * Fix Sênior: Correção de rAF leaks, eliminação de childNodes via nós nomeados,
 *              inicialização de Delta, Ring Buffers reais e Monitor de Heap.
 * ═══════════════════════════════════════════════════════════════════════════
 */

class SentinelCognitiveObservatory {
    constructor() {
        this.version = "9.5-OPERATIONAL-CENTER";
        
        // A) DEFERRED INIT CONTROL
        this.isInitialized = false;
        this.isActive = false;
        this.rafId = null;

        // B) RUNTIME PANELS DATA STRUCTURES & SCORE
        this.panels = {
            fps: { current: 60.0, target: 90.0 },
            gpu: { executionShaderMs: 0.0 },
            xr:  { activeSession: false, trackingStatus: 'STABLE', resolutionScale: 1.0 },
            scheduler: { activeTasksCount: 0, frameUtilizationFraction: 0.0 },
            attention: { currentFocusId: 'NONE', cognitiveLoadScore: 0.0, suppressedNodesCount: 0 },
            memory: { usedHeapMb: 0.0, heapLimitMb: 0.0, allocationRate: 0.0 },
            health: { score: 100 }
        };

        // C) ACTIVE MODULES MAPPING & ELEMENT CACHE (INCREMENTAL DIFF)
        this.activeModules = new Map();
        this.renderedModulesCache = new Map(); // Evita rebuild de DOM para os módulos

        // D) EVENT TRACE VIEW (FIXED ARRAY-BASED CIRCULAR RING BUFFER)
        this.maxTraceLogs = 40;
        this.eventTraceRingBuffer = new Array(this.maxTraceLogs).fill("");
        this.ringWriteIndex = 0;
        this.ringTotalLogsCount = 0;

        // E) PERFORMANCE TIMELINE (FRAME BUDGET GRAPH)
        this.timelineBuffer = new Uint8Array(120); 
        this.timelineIndex = 0;

        // F) THERMAL ALERTS TELEMETRY
        this.thermal = {
            level: 'NOMINAL', 
            temperatureCelsius: 36.5,
            uiBlinkState: false
        };

        // G) DOM ELEMENT REFERENCES
        this.dom = {
            rootContainer: null,
            traceLogContainer: null,
            modulesContainer: null,
            timelineContainer: null,
            thermalBadge: null,
            healthText: null
        };

        // H) STRICT TARGETED ELEMENT REF MAP (ZERO CHILDNODES INDEXING)
        this.refs = {
            fpsNumber: null,
            gpuNumber: null,
            gpuFill: null,
            xrValue: null,
            xrSubtext: null,
            schedulerNumber: null,
            schedulerSubtext: null,
            attentionValue: null,
            attentionSubtext: null,
            memoryNumber: null,
            memorySubtext: null
        };

        // I) THROTTLING, BUS & TIME ANCHORS
        this.bus = null;
        this.lastUIUpdate = 0;
        this.uiRefreshRateMs = 100; // 10Hz UI Throttling
        this.traceCounter = 0;
        
        // Correção de Bug Real: Inicialização determinística do frame-time anchor
        this._lastFrameTime = performance.now();
        this._lastHeapCheckTime = performance.now();
        this._lastMemoryUsage = 0;

        // Bindings estáveis
        this.boundUpdateFrame = this._updateFrame.bind(this);
        this.boundVisibilityChange = this._handleVisibilityChange.bind(this);
        this.registeredListeners = new Map();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // A) DEFERRED INIT (MONTAGEM E ASSEMBLEIA DIRECIONADA DO DOM)
    // ═══════════════════════════════════════════════════════════════════════
    deferredInitialize() {
        if (this.isInitialized) return;

        this._trace('LIFECYCLE', 'Executando Deferred Init v9.5...');
        performance.mark('sentinel-hud-init-start');
        
        this._injectCoreStyleOverride();

        this.dom.rootContainer = document.createElement('div');
        this.dom.rootContainer.id = 'sentinel-operational-center-hud';
        this.dom.rootContainer.className = 'sentinel-hud-root-canvas';
        
        this.dom.rootContainer.innerHTML = `
            <div class="hud-operational-header">
                <span class="hud-title">SENTINEL // OPERATIONAL_CENTER v${this.version}</span>
                <span id="hud-health-score-badge" class="hud-badge status-nominal" style="margin-right: 6px;">HEALTH: 100%</span>
                <span id="hud-thermal-badge" class="hud-badge status-nominal">THERMAL: NOMINAL</span>
            </div>
            <div class="hud-main-grid">
                <div class="hud-grid-left" id="hud-runtime-panels-root">
                    <!-- FPS Card -->
                    <div class="hud-panel-metric-card">
                        <div class="metric-label">FPS // SYSTEM PULSE</div>
                        <div class="metric-value text-nominal"><span id="ref-fps-number">0.0</span> <span class="metric-unit">HZ</span></div>
                    </div>
                    <!-- GPU Card -->
                    <div class="hud-panel-metric-card">
                        <div class="metric-label">GPU // COGNITIVE SHADER LOAD</div>
                        <div class="metric-value"><span id="ref-gpu-number">0.00</span> <span class="metric-unit">MS</span></div>
                        <div class="hud-mini-progress-bar"><div id="ref-gpu-fill" class="hud-mini-progress-fill" style="width: 0%"></div></div>
                    </div>
                    <!-- Memory Card -->
                    <div class="hud-panel-metric-card">
                        <div class="metric-label">HEAP // MEMORY PRESSURE</div>
                        <div class="metric-value"><span id="ref-memory-number">0.0</span> <span class="metric-unit">MB</span></div>
                        <div id="ref-memory-subtext" class="metric-subtext">Taxa de Alocação: 0.0 MB/s</div>
                    </div>
                    <!-- XR Card -->
                    <div class="hud-panel-metric-card">
                        <div class="metric-label">XR // IMERSÃO ESPACIAL</div>
                        <div id="ref-xr-value" class="metric-value">2D_STABLE_HUD</div>
                        <div id="ref-xr-subtext" class="metric-subtext">Resolução Retiniana: 100%</div>
                    </div>
                    <!-- Scheduler Card -->
                    <div class="hud-panel-metric-card">
                        <div class="metric-label">SCHEDULER // TEMPORAL BUDGET</div>
                        <div class="metric-value"><span id="ref-scheduler-number">0</span> <span class="metric-unit">TASKS</span></div>
                        <div id="ref-scheduler-subtext" class="metric-subtext">Uso do Laço: 0%</div>
                    </div>
                    <!-- Attention Card -->
                    <div class="hud-panel-metric-card">
                        <div class="metric-label">ATTENTION // PERCEPTUAL PROFILE</div>
                        <div id="ref-attention-value" class="metric-value" style="color:#D4AF37;">ID: [NONE]</div>
                        <div id="ref-attention-subtext" class="metric-subtext">Carga Mental: 0% | Supressões: 0</div>
                    </div>
                </div>
                <div class="hud-grid-right">
                    <div class="hud-subpanel-title">C) ACTIVE MODULE VIEW</div>
                    <div id="hud-modules-root" class="hud-module-list-container"></div>
                    <div class="hud-subpanel-title" style="margin-top:12px;">D) EVENT TRACE VIEW</div>
                    <div id="hud-trace-root" class="hud-trace-log-container"></div>
                </div>
            </div>
            <div class="hud-operational-footer">
                <div class="hud-subpanel-title" style="font-size: 9px; margin-bottom: 2px;">E) PERFORMANCE TIMELINE (FRAME BUDGET GRAPH)</div>
                <div id="hud-timeline-canvas-container" class="hud-timeline-bar-wrapper"></div>
            </div>
        `;

        document.body.appendChild(this.dom.rootContainer);

        // Resolução de Referências Globais
        this.dom.traceLogContainer = document.getElementById('hud-trace-root');
        this.dom.modulesContainer = document.getElementById('hud-modules-root');
        this.dom.timelineContainer = document.getElementById('hud-timeline-canvas-container');
        this.dom.thermalBadge = document.getElementById('hud-thermal-badge');
        this.dom.healthText = document.getElementById('hud-health-score-badge');

        // Resolução Direta de IDs de Texto (Proteção Máxima contra Mudanças de Espaço em Branco)
        this.refs.fpsNumber = document.getElementById('ref-fps-number');
        this.refs.gpuNumber = document.getElementById('ref-gpu-number');
        this.refs.gpuFill = document.getElementById('ref-gpu-fill');
        this.refs.memoryNumber = document.getElementById('ref-memory-number');
        this.refs.memorySubtext = document.getElementById('ref-memory-subtext');
        this.refs.xrValue = document.getElementById('ref-xr-value');
        this.refs.xrSubtext = document.getElementById('ref-xr-subtext');
        this.refs.schedulerNumber = document.getElementById('ref-scheduler-number');
        this.refs.schedulerSubtext = document.getElementById('ref-scheduler-subtext');
        this.refs.attentionValue = document.getElementById('ref-attention-value');
        this.refs.attentionSubtext = document.getElementById('ref-attention-subtext');

        // Inicialização estática dos nós de fatias da timeline
        if (this.dom.timelineContainer) {
            let slicesHtml = '';
            for (let i = 0; i < this.timelineBuffer.length; i++) {
                slicesHtml += `<div class="hud-timeline-slice bar-nominal" style="height: 2%;"></div>`;
            }
            this.dom.timelineContainer.innerHTML = slicesHtml;
        }

        // Ativação da Page Visibility API para economia drástica de recursos
        document.addEventListener('visibilitychange', this.boundVisibilityChange);

        this.isInitialized = true;
        this.isActive = true;
        this._lastFrameTime = performance.now();

        performance.mark('sentinel-hud-init-end');
        performance.measure('SENTINEL_HUD_BOOTSTRAP_TIME', 'sentinel-hud-init-start', 'sentinel-hud-init-end');
        
        // Disparo seguro do laço de renderização
        this.rafId = requestAnimationFrame(this.boundUpdateFrame);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // D) EVENT TRACE RING BUFFER (ALOCAÇÃO FIXA DE MEMÓRIA - SEM MOVE ARRAY)
    // ═══════════════════════════════════════════════════════════════════════
    pushEventTrace(eventName, payload) {
        const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0');
        
        let cleanPayload = {};
        if (payload) {
            const keys = Object.keys(payload);
            for (let i = 0; i < Math.min(keys.length, 4); i++) {
                cleanPayload[keys[i]] = payload[keys[i]];
            }
        }

        const logString = `[${timestamp}] ➔ ${eventName} | ${JSON.stringify(cleanPayload)}`;
        
        // Escrita direta no slot do Ring Buffer circular
        this.eventTraceRingBuffer[this.ringWriteIndex] = logString;
        this.ringWriteIndex = (this.ringWriteIndex + 1) % this.maxTraceLogs;
        this.ringTotalLogsCount++;
    }

    updateModuleStatus(moduleName, statusObj) {
        this.activeModules.set(moduleName, {
            status: statusObj.status || 'UNKNOWN',
            errors: statusObj.errors !== undefined ? statusObj.errors : 0,
            lastSeen: performance.now()
        });
    }

    recordFrameTimeDelta(elapsedMs) {
        if (!this.isInitialized) return;
        const normalizedLoad = Math.min(100, Math.floor((elapsedMs / 33.3) * 100));
        this.timelineBuffer[this.timelineIndex] = normalizedLoad;
        this.timelineIndex = (this.timelineIndex + 1) % this.timelineBuffer.length;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LOOP PRINCIPAL E CAPTURA DE TELEMETRIA AVANÇADA
    // ═══════════════════════════════════════════════════════════════════════
    _updateFrame() {
        if (!this.isActive || !this.isInitialized) return;

        const now = performance.now();
        const frameDelta = now - this._lastFrameTime;
        this._lastFrameTime = now;

        this.panels.fps.current = 1000 / Math.max(1, frameDelta);
        this.recordFrameTimeDelta(frameDelta);

        // A) DETECTOR DE FRAME DROP (HITCHING / BUDGET EXCEEDED EM XR)
        // 25ms representa uma queda abrupta para abaixo de 40Hz (Risco crítico de cinetose em XR)
        if (frameDelta > 25.0) {
            performance.mark('sentinel-hitch-detected');
            this.pushEventTrace('FRAME_BUDGET_EXCEEDED', { frameTimeMs: frameDelta.toFixed(1), thresholdMs: 25 });
        }

        // B) INGESTÃO DO MONITOR DE PERFORMANCE DE MEMÓRIA (HEAP REALS)
        this._pollMemoryTelemetry(now);

        // C) COLETA DE MÉTRICAS EXTERNAS
        this._harvestGlobalTelemetry();

        // D) CÁLCULO DO SCORE AGREGADO DE SAÚDE (HEALTH SCORE GLOBAL)
        this._calculateGlobalHealthScore();

        // E) THROTTLED INTERFACE REDRAW (10Hz)
        if (now - this.lastUIUpdate >= this.uiRefreshRateMs) {
            this._syncViewDOM();
            this.lastUIUpdate = now;
        }

        this.rafId = requestAnimationFrame(this.boundUpdateFrame);
    }

    _pollMemoryTelemetry(now) {
        if (performance && performance.memory) {
            const mem = performance.memory;
            const currentHeap = mem.usedJSHeapSize / (1024 * 1024);
            this.panels.memory.usedHeapMb = currentHeap;
            this.panels.memory.heapLimitMb = mem.jsHeapLimit / (1024 * 1024);

            const timePassed = (now - this._lastHeapCheckTime) / 1000;
            if (timePassed >= 1.0) { // Amostragem de taxa a cada 1 segundo completo
                const heapDiff = currentHeap - this._lastMemoryUsage;
                this.panels.memory.allocationRate = heapDiff > 0 ? heapDiff / timePassed : 0.0;
                this._lastMemoryUsage = currentHeap;
                this._lastHeapCheckTime = now;

                if (this.panels.memory.allocationRate > 15.0) { // Alocação maior que 15MB/s aciona suspeita
                    this.pushEventTrace('MEMORY_LEAK_SUSPICION', { rateMbSec: this.panels.memory.allocationRate.toFixed(1) });
                }
            }
        }
    }

    _calculateGlobalHealthScore() {
        let score = 100;

        // Penalização por taxa de quadros (FPS) caótica
        if (this.panels.fps.current < 45.0) score -= 25;
        else if (this.panels.fps.current < 75.0) score -= 10;

        // Penalização por estresse térmico do hardware
        if (this.thermal.level === 'CRITICAL') score -= 40;
        else if (this.thermal.level === 'THROTTLED') score -= 15;

        // Penalização por vazamento de memória ou alocação violenta
        if (this.panels.memory.allocationRate > 20.0) score -= 15;

        this.panels.health.score = Math.max(0, score);
    }

    _harvestGlobalTelemetry() {
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

        if (window.SentinelScheduler) {
            this.panels.scheduler.activeTasksCount = window.SentinelScheduler.tasks?.size || 0;
            this.panels.scheduler.frameUtilizationFraction = window.SentinelScheduler.frameBudget?.usedTimeFraction || 0.0;
        }

        if (window.SentinelEngineXR) {
            this.panels.xr.activeSession = !!window.SentinelEngineXR._currentSession || window.SentinelEngineXR.isActive || false;
            this.panels.xr.resolutionScale = window.SentinelEngineXR.resolution?.viewportMultiplier || 1.0;
        }

        if (window.SentinelShaderRuntime) {
            this.panels.gpu.executionShaderMs = window.SentinelShaderRuntime.budget?.currentLoadMs || 0.0;
        }

        if (window.SovereignKernel) {
            const modulesList = ['sentinel-bus', 'sentinel-state-machine', 'sentinel-scheduler', 'sentinel-core', 'sentinel-performance', 'sentinel-renderer', 'attention-manager', 'memory-vault', 'engine-xr'];
            for (let i = 0; i < modulesList.length; i++) {
                const status = window.SovereignKernel.getModuleStatus?.(modulesList[i]);
                if (status) this.updateModuleStatus(modulesList[i], status);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RENDERIZAÇÃO INCREMENTAL E RECONCILIAÇÃO DO DOM (SEM CHURN)
    // ═══════════════════════════════════════════════════════════════════════
    _syncViewDOM() {
        const p = this.panels;

        // 1. Atualizações Diretas por Nós Alvo (Imunes a quebras de nós de texto externos)
        if (this.refs.fpsNumber) {
            this.refs.fpsNumber.textContent = p.fps.current.toFixed(1);
            const parentCard = this.refs.fpsNumber.parentElement;
            if (parentCard) {
                parentCard.className = p.fps.current < 45.0 ? "metric-value alert-critical" : "metric-value text-nominal";
            }
        }

        if (this.refs.gpuNumber) this.refs.gpuNumber.textContent = p.gpu.executionShaderMs.toFixed(2);
        if (this.refs.gpuFill) this.refs.gpuFill.style.width = `${Math.min(100, (p.gpu.executionShaderMs / 4.5) * 100)}%`;

        if (this.refs.memoryNumber) this.refs.memoryNumber.textContent = p.memory.usedHeapMb.toFixed(1);
        if (this.refs.memorySubtext) {
            this.refs.memorySubtext.textContent = p.memory.heapLimitMb > 0 
                ? `Taxa: +${p.memory.allocationRate.toFixed(1)} MB/s | Teto: ${p.memory.heapLimitMb.toFixed(0)} MB`
                : `Taxa: +${p.memory.allocationRate.toFixed(1)} MB/s | API Indisponível`;
        }

        if (this.refs.xrValue) this.refs.xrValue.textContent = p.xr.activeSession ? 'WEBXR_ACTIVE_SESSION' : '2D_STABLE_HUD';
        if (this.refs.xrSubtext) this.refs.xrSubtext.textContent = `Resolução Espacial Retiniana: ${(p.xr.resolutionScale * 100).toFixed(0)}%`;

        if (this.refs.schedulerNumber) this.refs.schedulerNumber.textContent = p.scheduler.activeTasksCount;
        if (this.refs.schedulerSubtext) this.refs.schedulerSubtext.textContent = `Uso de Janela Temporal: ${(p.scheduler.frameUtilizationFraction * 100).toFixed(0)}%`;

        if (this.refs.attentionValue) this.refs.attentionValue.textContent = `ID: [${p.attention.currentFocusId}]`;
        if (this.refs.attentionSubtext) this.refs.attentionSubtext.textContent = `Carga Mental: ${(p.attention.cognitiveLoadScore * 100).toFixed(0)}% | Supressões: ${p.attention.suppressedNodesCount}`;

        // 2. Health Score Aggregator Sync
        if (this.dom.healthText) {
            this.dom.healthText.textContent = `HEALTH: ${p.health.score}%`;
            if (p.health.score < 50) this.dom.healthText.className = 'hud-badge status-critical';
            else if (p.health.score < 85) this.dom.healthText.className = 'hud-badge status-warning';
            else this.dom.healthText.className = 'hud-badge status-nominal';
        }

        // 3. Render Incremental Baseado em Mudança Real (Evita mutação de nós repetidos dos Módulos)
        if (this.dom.modulesContainer) {
            let containerModified = false;
            
            this.activeModules.forEach((data, name) => {
                const cached = this.renderedModulesCache.get(name);
                if (!cached || cached.status !== data.status || cached.errors !== data.errors) {
                    containerModified = true;
                }
            });

            if (containerModified || this.activeModules.size !== this.renderedModulesCache.size) {
                let htmlBuffer = '';
                this.activeModules.forEach((data, name) => {
                    const statusClass = data.status === 'NOMINAL' ? 'status-nominal-tag' : 'status-critical-tag';
                    htmlBuffer += `
                        <div class="hud-module-entry">
                            <span class="hud-module-name">${name}</span>
                            <span class="hud-module-badge ${statusClass}">${data.status} [E:${data.errors}]</span>
                        </div>
                    `;
                    // Atualiza cache de estado para o próximo ciclo diferencial
                    this.renderedModulesCache.set(name, { status: data.status, errors: data.errors });
                });
                this.dom.modulesContainer.innerHTML = htmlBuffer;
            }
        }

        // 4. Desenho Linear do Ring Buffer Deslocado na Trace View (Sem mutação destrutiva do array)
        if (this.dom.traceLogContainer) {
            let logHtmlBuffer = '';
            const logsToRender = Math.min(this.ringTotalLogsCount, this.maxTraceLogs);
            
            // Leitura de trás para frente a partir do último índice de escrita real
            for (let i = 0; i < logsToRender; i++) {
                const readIndex = (this.ringWriteIndex - 1 - i + this.maxTraceLogs) % this.maxTraceLogs;
                logHtmlBuffer += `<div class="hud-trace-line">${this.eventTraceRingBuffer[readIndex]}</div>`;
            }
            this.dom.traceLogContainer.innerHTML = logHtmlBuffer;
        }

        // 5. Estilos Estáticos da Timeline (Mutação direta das fatias persistentes)
        if (this.dom.timelineContainer) {
            const childSlices = this.dom.timelineContainer.children;
            const totalElements = this.timelineBuffer.length;
            if (childSlices.length === totalElements) {
                for (let i = 0; i < totalElements; i++) {
                    const targetIdx = (this.timelineIndex + i) % totalElements;
                    const hValue = this.timelineBuffer[targetIdx];
                    const sliceEl = childSlices[i];

                    sliceEl.style.height = `${Math.max(2, hValue)}%`;
                    if (hValue > 75) sliceEl.className = "hud-timeline-slice bar-critical";
                    else if (hValue > 45) sliceEl.className = "hud-timeline-slice bar-warning";
                    else sliceEl.className = "hud-timeline-slice bar-nominal";
                }
            }
        }

        // 6. Monitoramento Térmico e Alarme Intermitente (Blink)
        if (this.dom.thermalBadge) {
            this.dom.thermalBadge.textContent = `THERMAL: ${this.thermal.level} (${this.thermal.temperatureCelsius.toFixed(1)}°C)`;
            if (this.thermal.level === 'CRITICAL' || this.thermal.level === 'THROTTLED') {
                this.dom.thermalBadge.className = `hud-badge status-critical ${this.thermal.uiBlinkState ? 'blink-off' : ''}`;
                this.traceCounter++;
                if (this.traceCounter % 10 === 0) this.thermal.uiBlinkState = !this.thermal.uiBlinkState;
            } else {
                this.dom.thermalBadge.className = 'hud-badge status-nominal';
            }
        }
    }

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
    // D) INTERRUPÇÃO POR VISIBILITY API & WEBXR SESSION SYNC
    // ═══════════════════════════════════════════════════════════════════════
    _handleVisibilityChange() {
        if (document.hidden) {
            this.isActive = false;
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
            this._trace('LIFECYCLE', 'Aba em segundo plano detectada. Laço rAF suspenso temporariamente.');
        } else {
            if (!this.isActive && this.isInitialized) {
                this.isActive = true;
                this._lastFrameTime = performance.now();
                this.rafId = requestAnimationFrame(this.boundUpdateFrame);
                this._trace('LIFECYCLE', 'Aba focada novamente. Laço rAF restabelecido.');
            }
        }
    }

    _setupXrSessionListeners(session) {
        if (!session) return;
        
        const onSessionVisibility = (event) => {
            this.pushEventTrace('XR_VISIBILITY_MUTATION', { state: event.session.visibilityState });
        };
        const onSessionEnd = () => {
            this.pushEventTrace('XR_SESSION_TERMINATED', { reason: 'USER_OR_ENGINE_EXIT' });
        };

        session.addEventListener('visibilitychange', onSessionVisibility);
        session.addEventListener('end', onSessionEnd);

        // Guardar referências caso precise desvincular fora do ciclo global de fim de sessão
        this._xrSessionCleanup = () => {
            session.removeEventListener('visibilitychange', onSessionVisibility);
            session.removeEventListener('end', onSessionEnd);
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DESTRUTOR E GERENCIAMENTO DE CICLO DE VIDA DOS SINAIS
    // ═══════════════════════════════════════════════════════════════════════
    _attachSignalBus(busInstance) {
        this.bus = busInstance;

        const onPhaseSync = (data) => {
            this.pushEventTrace('KERNEL_PHASE_CHANGE', data);
            if (data.to === 'INIT' || data.to === 'READY') this.deferredInitialize();
        };
        const onStateChanged = (state) => this.pushEventTrace('STATE_MUTATION', state);
        
        const onGazeMoved = (data) => {
            this.traceCounter++;
            if (this.traceCounter % 10 === 0) { // Throttling determinístico do log de rastreamento ocular
                this.pushEventTrace('GAZE_STREAM_MOVE', { target: data.target });
            }
        };
        const onTelemetrySync = (metrics) => {
            if (metrics && metrics.temperatureC) this.injectThermalMetrics(metrics.temperatureC);
        };
        const onXrSessionStarted = (evt) => {
            this.pushEventTrace('XR_SESSION_LAUNCHED', { mode: evt.mode });
            if (evt.session) this._setupXrSessionListeners(evt.session);
        };

        this.bus.on('kernel:phase-synchronized', onPhaseSync);
        this.bus.on('system:state_changed', onStateChanged);
        this.bus.on('xr:gaze_moved', onGazeMoved);
        this.bus.on('performance:telemetry-sync', onTelemetrySync);
        this.bus.on('xr:session-established', onXrSessionStarted);

        this.registeredListeners.set('kernel:phase-synchronized', onPhaseSync);
        this.registeredListeners.set('system:state_changed', onStateChanged);
        this.registeredListeners.set('xr:gaze_moved', onGazeMoved);
        this.registeredListeners.set('performance:telemetry-sync', onTelemetrySync);
        this.registeredListeners.set('xr:session-established', onXrSessionStarted);
    }

    _detachSignalBus() {
        if (!this.bus || this.registeredListeners.size === 0) return;

        this.registeredListeners.forEach((listener, eventName) => {
            this.bus.off(eventName, listener);
        });

        this.registeredListeners.clear();
        this.bus = null;
    }

    destroy() {
        // 1. Interrupção imediata do laço de execução (Previne execução órfã de 1 frame)
        this.isActive = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        // 2. Desconexão total de barramentos de sinais e eventos do DOM global
        this._detachSignalBus();
        document.removeEventListener('visibilitychange', this.boundVisibilityChange);
        
        if (this._xrSessionCleanup) {
            this._xrSessionCleanup();
            this._xrSessionCleanup = null;
        }

        // 3. Limpeza estrutural da UI da árvore ativa
        if (this.dom.rootContainer && this.dom.rootContainer.parentNode) {
            this.dom.rootContainer.parentNode.removeChild(this.dom.rootContainer);
        }

        const styleEl = document.getElementById('sentinel-hud-core-injected-css');
        if (styleEl && styleEl.parentNode) {
            styleEl.parentNode.removeChild(styleEl);
        }

        // 4. Liberação das estruturas de dados internas para o GC
        this.activeModules.clear();
        this.renderedModulesCache.clear();
        this.eventTraceRingBuffer.fill("");
        this.isInitialized = false;
        
        this._trace('LIFECYCLE', 'Instância limpa e destruída de forma síncrona.');
    }

    _injectCoreStyleOverride() {
        const styleId = 'sentinel-hud-core-injected-css';
        if (document.getElementById(styleId)) return;

        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = `
            .sentinel-hud-root-canvas {
                position: fixed; top: 12px; right: 12px; width: 450px;
                background: rgba(3, 7, 12, 0.88); backdrop-filter: blur(12px);
                border: 1px solid rgba(0, 255, 136, 0.18); border-radius: 4px;
                font-family: 'Courier New', monospace; color: #E2E8F0;
                padding: 12px; z-index: 999999; box-shadow: 0 12px 40px rgba(0,0,0,0.7);
            }
            .hud-operational-header { display: flex; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px; margin-bottom: 8px; }
            .hud-title { font-size: 11px; font-weight: bold; color: #00FF88; letter-spacing: 0.05em; flex: 1; }
            .hud-badge { font-size: 8px; font-weight: bold; padding: 1px 4px; border-radius: 2px; text-transform: uppercase; }
            .status-nominal { background: rgba(0, 255, 136, 0.12); color: #00FF88; border: 1px solid rgba(0, 255, 136, 0.4); }
            .status-warning { background: rgba(212, 175, 55, 0.15); color: #D4AF37; border: 1px solid rgba(212, 175, 55, 0.4); }
            .status-critical { background: rgba(255, 62, 62, 0.18); color: #FF3E3E; border: 1px solid rgba(255, 62, 62, 0.4); }
            .blink-off { opacity: 0.2; }
            .hud-main-grid { display: flex; gap: 10px; height: 280px; }
            .hud-grid-left { flex: 1.1; display: flex; flex-direction: column; gap: 5px; }
            .hud-grid-right { flex: 1.2; display: flex; flex-direction: column; background: rgba(0,0,0,0.3); padding: 6px; border-radius: 3px; overflow: hidden; }
            .hud-subpanel-title { font-size: 9px; font-weight: bold; color: rgba(255,255,255,0.35); letter-spacing: 0.04em; margin-bottom: 4px; }
            .hud-panel-metric-card { background: rgba(255,255,255,0.02); padding: 4px 8px; border-radius: 3px; border-left: 2px solid rgba(0, 255, 136, 0.25); }
            .metric-label { font-size: 8px; color: rgba(255,255,255,0.35); }
            .metric-value { font-size: 13px; font-weight: bold; margin: 1px 0; }
            .metric-unit { font-size: 9px; color: rgba(255,255,255,0.25); }
            .metric-subtext { font-size: 8px; color: rgba(255,255,255,0.25); white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
            .text-nominal { color: #00FF88; }
            .alert-critical { color: #FF3E3E; text-shadow: 0 0 5px rgba(255,62,62,0.3); }
            .hud-mini-progress-bar { width: 100%; height: 2px; background: rgba(255,255,255,0.04); margin-top: 2px; overflow: hidden; }
            .hud-mini-progress-fill { height: 100%; background: #00FF88; }
            .hud-module-list-container { flex: 1; overflow-y: auto; font-size: 9px; display: flex; flex-direction: column; gap: 3px; margin-bottom: 8px; }
            .hud-module-entry { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 2px 4px; border-radius: 2px; }
            .hud-module-name { color: rgba(255,255,255,0.65); }
            .status-nominal-tag { color: #00FF88; }
            .status-critical-tag { color: #FF3E3E; font-weight: bold; }
            .hud-trace-log-container { flex: 1.4; overflow-y: auto; font-family: monospace; font-size: 8px; color: rgba(255,255,255,0.45); display: flex; flex-direction: column; gap: 2px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px; }
            .hud-trace-line { white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
            .hud-operational-footer { border-top: 1px solid rgba(255,255,255,0.08); margin-top: 6px; padding-top: 4px; }
            .hud-timeline-bar-wrapper { display: flex; align-items: flex-end; gap: 1px; height: 22px; background: rgba(0,0,0,0.5); border-radius: 2px; padding: 2px; overflow: hidden; }
            .hud-timeline-slice { flex: 1; width: 2px; }
            .bar-nominal { background: #00FF88; }
            .bar-warning { background: #D4AF37; }
            .bar-critical { background: #FF3E3E; }
        `;
        document.head.appendChild(styleEl);
    }

    _trace(subsystem, message, level = 'INFO') {
        console.log(`[${new Date().toISOString()}] [DEBUG-HUD:${subsystem}] [${level}] ${message}`);
    }
}

// Inicialização segura anexada à árvore global do runtime
const SovereignHUDViewer = new SentinelCognitiveObservatory();
window.SentinelHUD = SovereignHUDViewer;

if (window.SentinelBus) {
    SovereignHUDViewer._attachSignalBus(window.SentinelBus);
}

export default SovereignHUDViewer;
// ═══════════════════════════════════════════════════════════════════════
// KERNEL RUNTIME CONTRACT
// ═══════════════════════════════════════════════════════════════════════

initialize() {
    this._trace('RUNTIME', 'Contrato initialize() executado.');
    this.deferredInitialize();

    return {
        status: 'NOMINAL'
    };
}

heartbeat(deltaTime = 0) {
    return {
        fps: this.panels.fps.current,
        active: this.isActive,
        delta: deltaTime,
        thermal: this.thermal.level
    };
}

shutdown() {
    this._trace('RUNTIME', 'Contrato shutdown() executado.');
    this.destroy();

    return {
        status: 'OFFLINE'
    };
}
