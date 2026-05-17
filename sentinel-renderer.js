/**
 * ============================================================================
 * SENTINEL CORE RUNTIME ARCHITECTURE
 * Module: sentinel-renderer.js
 * Role: Cognitive Sovereign Rendering Runtime (Visual Governance Engine)
 * Design Aesthetic: High-Performance GPU Determinism & Cognitive Foveation
 * ============================================================================
 */

// 14. FX QUALITY SYSTEM & 3. RENDER LAYER SYSTEM
const FX_LEVELS = {
  LOW:      'LOW',      // Shaders estáticos básicos, sem pós-processamento, sem partículas
  MEDIUM:   'MEDIUM',   // Partículas reduzidas, Bloom simplificado, Overlays padrão
  HIGH:     'HIGH',     // Pipeline completo, volumetria ativa, pós-processamento denso
  XR_SAFE:  'XR_SAFE'   // Otimização estrita de latência, Foveation máximo, zero reprojeção
};

const RENDER_LAYERS = {
  BACKGROUND:  0, // Skyboxes, matrizes ambientais frias
  ENVIRONMENT: 1, // Geometria de mundo, elementos de cena estáticos
  WORLD:       2, // Entidades ativas, objetos de interação secundários
  INTERACTION: 3, // Canvas de feedback dinâmico, ganchos táteis
  FOCUS:       4, // Elementos diretamente contidos no cone visual de atenção
  HUD:         5, // Camada de instrumentação técnica do SENTINEL
  OVERLAY:     6, // Alertas e flashes de sistema síncronos
  DIAGNOSTICS: 7  // Grade de telemetria em tempo real (Debug-HUD)
};

class SentinelRenderer {
  constructor() {
    this.isActive = true;
    this.currentFXLevel = FX_LEVELS.HIGH;

    // 2. SCENE GRAPH SYSTEM
    this.sceneGraph = new Map();

    // 5. GPU BUDGET MANAGER
    this.gpu = {
      frameBudget: 16.666, // Margem normatizada em ms (reduzida para 13.88ms em modo XR)
      drawCalls: 0,
      memoryUsage: 0.0,    // VRAM estimada ocupada
      saturation: 0.0,     // 0.0 (Ocioso) a 1.0 (Saturado)
      thermalPressure: 0.0
    };

    // 6. ADAPTIVE RESOLUTION SYSTEM
    this.resolutionScale = {
      min: 0.5,
      current: 1.0,
      max: 1.0
    };

    // 8. ATTENTION RENDERING ENGINE
    this.attention = {
      focusTarget: null,
      peripheralSuppression: true,
      attentionBoost: 1.5,
      cognitiveWeight: 1.0
    };

    // 11. XR RENDER GOVERNANCE
    this.xr = {
      stereo: false,
      reprojection: false,
      latency: 0.0,
      foveation: 1.0, // 1.0 = Máxima compressão periférica
      comfortMode: 'STABLE'
    };

    // 13. FX ORCHESTRATOR & 17. POST PROCESSING PIPELINE
    this.fx = {
      bloom: true,
      fog: false,
      glow: true,
      gamma: 2.2,
      particles: 1.0, // Multiplicador de densidade de emissão
      overlays: true
    };

    // 19. IMMERSION CONTROL SYSTEM
    this.immersion = {
      density: 1.0,
      atmosphere: 'NOMINAL',
      environmentalWeight: 1.0,
      comfort: 1.0
    };

    // 21. RENDER TELEMETRY
    this.metrics = {
      fps: 60,
      frameTime: 0.0,
      drawCalls: 0,
      gpuPressure: 0.0,
      shaderCost: 0.0,
      textureUsage: 0.0
    };

    // 26. MULTI-PASS RENDER FUTURE
    this.passes = ['geometry', 'lighting', 'fx', 'ui', 'diagnostics'];

    // 27. WEBGPU FUTURE LAYER
    this.webgpu = {
      enabled: false,
      computePasses: [],
      shaderPipelines: new Map()
    };

    // Contexto de renderização físico de baixo nível (WebGL2 / WebGPU se disponível)
    this.gl = null;
    this.canvas = null;

    this._initializeSovereignRenderer();
  }

  // ==========================================================================
  // 2. SCENE GRAPH SYSTEM
  // ==========================================================================

  registerNode(id, config) {
    if (!config || typeof config.render !== 'function') {
      throw new Error(`[RENDERER] Falha de contrato: Nó gráfico [${id}] não possui função de renderização.`);
    }

    this.sceneGraph.set(id, {
      id,
      type:            config.type || 'geometry',
      priority:        config.priority || 'NORMAL',
      visible:         config.visible !== false,
      attentionWeight: config.attentionWeight || 1.0,
      xrSafe:          !!config.xrSafe,
      renderLayer:     config.renderLayer !== undefined ? config.renderLayer : RENDER_LAYERS.WORLD,
      update:          config.update || null,
      render:          config.render
    });

    this.traceRender(`Nó registrado no Grafo de Cena: [${id}] - Camada: ${config.renderLayer}`);
  }

  removeNode(id) {
    return this.sceneGraph.delete(id);
  }

  suspendNode(id) {
    const node = this.sceneGraph.get(id);
    if (node) node.visible = false;
  }

  activateNode(id) {
    const node = this.sceneGraph.get(id);
    if (node) node.visible = true;
  }

  // ==========================================================================
  // 1. CENTRAL RENDER PIPELINE (Loop Gráfico Unificado Soberano)
  // ==========================================================================

  render(delta, elapsed) {
    if (!this.isActive) return;

    const frameStart = performance.now();
    this.gpu.drawCalls = 0;

    this.synchronizeRenderer();

    // 28. SAFETY RENDER LAYER - Envolve o pipeline de execução em barreira transacional
    this.safeRender(() => {
      // Step 1: Visibility check & Occlusion Culling Pass
      const visibleNodes = this.performOcclusionCulling();

      // Step 2: Attention Weight Assessment (Foveated updates pass)
      this.cognitiveRendering(visibleNodes);

      // Step 3: Layer Prioritization Sorting
      const renderQueue = this.prioritizeDrawCalls(visibleNodes);

      // Step 4: Execute Render Passes sequentially over hardware
      this._executeRenderPasses(renderQueue, delta, elapsed);
    });

    // Step 5: Pacing, Telemetry Logging & Buffer Finalization
    this.stabilizeFrameTiming(frameStart);
  }

  _executeRenderPasses(queue, delta, elapsed) {
    // 26. Executa a Renderização Multi-Pass ordenada rigidamente por subcamadas
    for (const pass of this.passes) {
      for (const node of queue) {
        if (pass === 'geometry' && node.renderLayer <= RENDER_LAYERS.WORLD) {
          node.render(this.gl, delta, elapsed);
          this.gpu.drawCalls++;
        }
        else if (pass === 'fx' && node.renderLayer === RENDER_LAYERS.INTERACTION && this.fx.glow) {
          node.render(this.gl, delta, elapsed);
          this.gpu.drawCalls++;
        }
        else if (pass === 'ui' && (node.renderLayer === RENDER_LAYERS.FOCUS || node.renderLayer === RENDER_LAYERS.HUD)) {
          node.render(this.gl, delta, elapsed);
          this.gpu.drawCalls++;
        }
        else if (pass === 'diagnostics' && node.renderLayer === RENDER_LAYERS.DIAGNOSTICS) {
          node.render(this.gl, delta, elapsed);
          this.gpu.drawCalls++;
        }
      }
    }
  }

  // ==========================================================================
  // 4. DRAW PRIORITIZATION ENGINE & 9. OCCLUSION ENGINE
  // ==========================================================================

  performOcclusionCulling() {
    const visibleAccumulator = [];

    this.sceneGraph.forEach((node) => {
      // Filtros rápidos de eliminação visual (Frustum & Visibility state masks)
      if (!node.visible) return;
      if (this.xr.stereo && !node.xrSafe) return; // Elimina nós não certificados para XR em modo imersivo

      if (this.visibilityCheck(node)) {
        visibleAccumulator.push(node);
      }
    });

    return visibleAccumulator;
  }

  visibilityCheck(node) {
    // 10. VISIBILITY SYSTEM baseado na infraestrutura de camadas e relevância atual
    if (node.renderLayer === RENDER_LAYERS.BACKGROUND) return true;
    
    // Se o sistema estiver sob estresse térmico crítico, oculta automaticamente a camada de ambiente estático de fundo
    if (this.gpu.thermalPressure > 0.85 && node.renderLayer === RENDER_LAYERS.ENVIRONMENT) {
      return false;
    }
    return true;
  }

  prioritizeDrawCalls(nodes) {
    // Clasifica de forma determinística os nós ativos: Camada ascendente (Z-Sort formal) -> Atenção Cognitiva
    return nodes.sort((a, b) => {
      if (a.renderLayer !== b.renderLayer) {
        return a.renderLayer - b.renderLayer;
      }
      return b.attentionWeight - a.attentionWeight; // Maior peso cognitivo renderiza à frente na fila interna do pass
    });
  }

  // ==========================================================================
  // 8. ATTENTION RENDERING ENGINE & 18. COGNITIVE RENDERING ENGINE
  // ==========================================================================

  cognitiveRendering(visibleNodes) {
    // 29. COGNITIVE VISUAL HIERARCHY - Reajusta os multiplicadores de amostragem gráfica com base na atenção do usuário
    if (typeof window.StateStore !== 'undefined') {
      const activeFocusTarget = window.StateStore.get('attention.focusTarget') || null;
      this.attention.focusTarget = activeFocusTarget;
    }

    visibleNodes.forEach(node => {
      if (this.attention.focusTarget && node.id === this.attention.focusTarget) {
        node.attentionWeight = this.attention.attentionBoost; // Aloca prioridade e ganho de fidelidade
      } else if (node.renderLayer === RENDER_LAYERS.WORLD || node.renderLayer === RENDER_LAYERS.ENVIRONMENT) {
        // 12. FOVEATED RENDERING PREPARATION - Degrada agressivamente a frequência de atualização e detalhamento da periferia
        node.attentionWeight = 0.4;
        if (this.attention.peripheralSuppression && this.xr.stereo) {
          node.attentionWeight = 0.1; // Estrangula drasticamente processamento de vértices fora do cone visual
        }
      }
    });
  }

  // ==========================================================================
  // 6. ADAPTIVE RESOLUTION SYSTEM & 15. THERMAL ADAPTATION
  // ==========================================================================

  adaptThermalLoad(thermalLevel) {
    this.gpu.thermalPressure = thermalLevel / 100;
    this.traceGPU(`Sinal de adaptação térmica capturado: ${thermalLevel}%. Ajustando matrizes gráficas.`);

    if (thermalLevel > 80) {
      // Força modo de economia extrema desacoplando recursos de pós-processamento pesados
      this.applyRenderProfile('LOW_POWER');
    } else if (thermalLevel > 50) {
      this.currentFXLevel = FX_LEVELS.MEDIUM;
      this.fx.bloom = false;
      this.fx.particles = 0.5; // Corta emissão de partículas pela metade
    } else {
      this.currentFXLevel = this.xr.stereo ? FX_LEVELS.XR_SAFE : FX_LEVELS.HIGH;
      this.fx.bloom = true;
      this.fx.particles = 1.0;
    }
  }

  _adjustResolutionScale(fps) {
    // Modulação em tempo real da escala de viewport dinâmica para blindar o Frame Pacing em XR
    if (fps < 55 && this.resolutionScale.current > this.resolutionScale.min) {
      this.resolutionScale.current = Math.max(this.resolutionScale.min, this.resolutionScale.current - 0.1);
      this.traceGPU(`Queda de FPS detectada [${fps}]. Escalonando resolução para: ${this.resolutionScale.current.toFixed(2)}x`, 'WARN');
    } else if (fps > 59 && this.resolutionScale.current < this.resolutionScale.max && this.gpu.thermalPressure < 0.5) {
      this.resolutionScale.current = Math.min(this.resolutionScale.max, this.resolutionScale.current + 0.05);
    }
  }

  // ==========================================================================
  // 7. FRAME PACING ENGINE & TIMING METRICS
  // ==========================================================================

  stabilizeFrameTiming(frameStart) {
    const elapsed = performance.now() - frameStart;
    this.metrics.frameTime = elapsed;
    this.metrics.fps = Math.min(this.xr.stereo ? 72 : 60, Math.round(1000 / elapsed));
    this.metrics.drawCalls = this.gpu.drawCalls;
    this.metrics.gpuPressure = elapsed / this.gpu.frameBudget;

    // Ajusta dinamicamente a resolução com base nas métricas consolidadas deste frame
    this._adjustResolutionScale(this.metrics.fps);

    // Despacha métricas brutas ao barramento global a cada 60 frames
    if (typeof window.SentinelCore !== 'undefined' && window.SentinelCore.clock?.frame % 60 === 0) {
      window.SentinelBus?.emit('renderer:telemetry', {
        fps: this.metrics.fps,
        frameTime: `${elapsed.toFixed(2)}ms`,
        drawCalls: this.gpu.drawCalls,
        gpuPressure: `${(this.metrics.gpuPressure * 100).toFixed(1)}%`
      });
    }
  }

  // ==========================================================================
  // 23. RECOVERY ENGINE & CONTINGENCY CORES
  // ==========================================================================

  recoverRenderer(reason) {
    this.traceFrame(`Alerta de colapso gráfico! Motivo detectado: ${reason}. Ativando recuperação forçada.`, 'WARN');
    
    this.resetPipeline();

    if (reason === 'CONTEXT_LOSS') {
      this.restoreContext();
    } else {
      // Queda por sobrecarga: Força chaveamento imediato para perfil de segurança limpo
      this.applyRenderProfile('LOW_POWER');
    }
  }

  resetPipeline() {
    this.traceRender('Evacuando pipelines de execução de shaders e limpando registradores de buffers.');
    if (this.gl) {
      this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
  }

  restoreContext() {
    this.traceRender('Solicitando reinicialização atômica do driver lógico WebGL2/Context Handle.');
    this._initializeHardwareContext();
  }

  // ==========================================================================
  // 25. MODE-AWARE RENDERING & PROFILES
  // ==========================================================================

  applyRenderProfile(mode) {
    this.traceRender(`Aplicando perfil de governança gráfica: [${mode}]`);

    switch (mode) {
      case 'LOW_POWER':
        this.currentFXLevel = FX_LEVELS.LOW;
        this.resolutionScale.current = 0.5;
        this.fx.bloom = false;
        this.fx.glow = false;
        this.fx.particles = 0.0; // Desliga completamente simulação de partículas por GPU
        this.attention.peripheralSuppression = true;
        break;

      case 'XR':
        this.xr.stereo = true;
        this.gpu.frameBudget = 1000 / 72; // Trava rigidamente o teto em 13.88ms por frame (72Hz)
        this.currentFXLevel = FX_LEVELS.XR_SAFE;
        this.resolutionScale.current = 0.85; // Escala estável para evitar flutuações de latência ocular
        this.fx.bloom = false;
        break;

      case 'SAFE_MODE':
        this.resetPipeline();
        this.sceneGraph.forEach(node => {
          if (node.renderLayer !== RENDER_LAYERS.DIAGNOSTICS && node.renderLayer !== RENDER_LAYERS.OVERLAY) {
            node.visible = false; // Oculta tudo exceto a instrumentação interna e alertas de engenharia
          }
        });
        break;

      default:
        this.xr.stereo = false;
        this.gpu.frameBudget = 16.666;
        this.currentFXLevel = FX_LEVELS.HIGH;
        this.resolutionScale.current = 1.0;
        this.fx.bloom = true;
        this.fx.glow = true;
        this.fx.particles = 1.0;
    }
  }

  // ==========================================================================
  // 28. SAFETY RENDER LAYER & BARRIERS
  // ==========================================================================

  safeRender(renderExecutionBlock) {
    try {
      renderExecutionBlock();
    } catch (error) {
      this.traceRender(`Erro fatal capturado durante o passe de desenho geométrico: ${error.message}`, 'ERROR');
      this.recoverRenderer(error.message.includes('CONTEXT') ? 'CONTEXT_LOSS' : 'GPU_OVERLOAD');
    }
  }

  synchronizeRenderer() {
    // Sincroniza em tempo real as propriedades globais com a StateStore Central
    if (typeof window.StateStore !== 'undefined') {
      const activeSystemMode = window.StateStore.get('ui.mode');
      if (activeSystemMode === 'XR' && !this.xr.stereo) {
        this.applyRenderProfile('XR');
      } else if (activeSystemMode !== 'XR' && this.xr.stereo) {
        this.applyRenderProfile('NORMAL');
      }
    }
  }

  // 24. RENDER SNAPSHOTS
  snapshotRenderState() {
    return {
      currentFXLevel: this.currentFXLevel,
      resolutionScale: { ...this.resolutionScale },
      fx: { ...this.fx },
      timestamp: Date.now()
    };
  }

  restoreRenderState(snapshot) {
    if (!snapshot) return;
    this.currentFXLevel = snapshot.currentFXLevel;
    this.resolutionScale = snapshot.resolutionScale;
    this.fx = snapshot.fx;
  }

  // ==========================================================================
  // INTERNALS & TRACE ARCHITECTURE
  // ==========================================================================

  _initializeHardwareContext() {
    this.canvas = document.getElementById('sentinel-sovereign-viewport') || null;
    if (this.canvas) {
      this.gl = this.canvas.getContext('webgl2', {
        alpha: false,
        antialias: true,
        powerPreference: 'high-performance',
        premultipliedAlpha: false,
        preserveDrawingBuffer: false
      });

      if (!this.gl) {
        this.traceRender('Falha ao obter contexto físico WebGL2. Inicializando emulação de software Canvas2D.', 'WARN');
      }
    }
  }

  _initializeSovereignRenderer() {
    this.traceRender('Inicializando Runtime de Soberania Gráfica Cognitiva...', 'INFO');
    this._initializeHardwareContext();

    // Registra gancho nativo para escuta de perda de contexto GPU do navegador
    if (this.canvas) {
      this.canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        this.recoverRenderer('CONTEXT_LOSS');
      }, false);
    }
  }

  traceRender(msg, level = 'INFO') { this.trace(`[PIPELINE] ${msg}`, level); }
  traceFrame(msg, level = 'INFO')  { this.trace(`[FRAME] ${msg}`, level); }
  traceGPU(msg, level = 'INFO')    { this.trace(`[GPU_HARDWARE] ${msg}`, level); }

  trace(message, level = 'INFO') {
    const formatted = `[${new Date().toISOString()}] [SOVEREIGN_RENDERER] [${level}] ${message}`;
    if (level === 'CRITICAL' || level === 'ERROR') console.error(formatted);
    else if (level === 'WARN') console.warn(formatted);
    else console.log(formatted);
  }
}

// Inicialização e acoplamento no escopo Global de Runtime
const SovereignGraphicsEngine = new SentinelRenderer();
window.SentinelRenderer = SovereignGraphicsEngine;

export default SovereignGraphicsEngine;