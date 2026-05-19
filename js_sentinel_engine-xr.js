// ============================================================================
// RUNTIME SPATIAL RUNTIME (v9.1-PATCH)
// Core Math Fixes & Zero-Allocation Systems
// ============================================================================

class SpatialRuntime {
  constructor() {
    this.isActive = false;
    this._currentSession = null;
    this._referenceSpace = null;
    
    // Problema #5 - Pré-alocação de Views (Zero GC Churn)
    this.MAX_VIEWS = 4; // Suporta estendido (Stereo, Quad-view, Foveated Layers)
    this.viewCache = Array.from({ length: this.MAX_VIEWS }, () => ({
      eye: 'none',
      projectionMatrix: new Float32Array(16),
      transformMatrix: new Float32Array(16),
      viewMatrix: new Float32Array(16)
    }));
    
    // Barramento de sinais interno e flags
    this.isRecoveryLoopRunning = false;
  }

  // --------------------------------------------------------------------------
  // CORREÇÃO CRÍTICA #1: Bug Matemático na mat4_multiply
  // --------------------------------------------------------------------------
  static mat4_multiply(out, a, b) {
    const a00 = a[0],  a01 = a[1],  a02 = a[2],  a03 = a[3];
    const a10 = a[4],  a11 = a[5],  a12 = a[6],  a13 = a[7];
    const a20 = a[8],  a21 = a[9],  a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache temporário de B para permitir multiplicação in-place safely
    let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    // CORRIGIDO: alterado a20 para a22
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32; 
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
  }

  // --------------------------------------------------------------------------
  // CORREÇÃO CRÍTICA #2: Plano Superior (Top) do Frustum Extractor
  // --------------------------------------------------------------------------
  static extractFrustumPlanes(planes, m) {
    // Left, Right, Bottom...
    // CORRIGIDO: Mudança da linha Z (m[12]) para a linha Y (m[13]) no componente W do plano TOP
    planes[3][0] = m[3]  - m[1];
    planes[3][1] = m[7]  - m[5];
    planes[3][2] = m[11] - m[9];
    planes[3][3] = m[15] - m[13]; 
    
    // Normalização sequencial downstream...
  }

  // --------------------------------------------------------------------------
  // CORREÇÃO CRÍTICA #3: Verificação Segura de ReferenceSpace
  // --------------------------------------------------------------------------
  getValidReferenceSpace() {
    // CORRIGIDO: Valida o ponteiro real do espaço em vez da assinatura estrutural do método
    const space = this._referenceSpace;
    if (!space) return null; 
    return space;
  }

  // --------------------------------------------------------------------------
  // CORREÇÃO CRÍTICA #6: Proteção contra Dangling Callbacks no RAF
  // --------------------------------------------------------------------------
  triggerEmergencySpatialRecovery() {
    this.isRecoveryLoopRunning = true;
    
    const checkRestore = () => {
      // CORRIGIDO: Short-circuit defensivo se a sessão cair ou o runtime for desativado
      if (!this.isActive || !this._currentSession) {
        this.isRecoveryLoopRunning = false;
        return;
      }

      if (this._detectSpatialDesync()) {
        this._reinitializeSpatialAnchors();
      }
      
      if (this.isRecoveryLoopRunning) {
        requestAnimationFrame(checkRestore);
      }
    };

    requestAnimationFrame(checkRestore);
  }

  // --------------------------------------------------------------------------
  // OPTIMIZATION #5: Ingestão de Views In-Place (Zero Allocation)
  // --------------------------------------------------------------------------
  processViewerPose(viewerPose) {
    const viewsCount = viewerPose.views.length;
    
    for (let i = 0; i < viewsCount; i++) {
      if (i >= this.MAX_VIEWS) break;
      
      const srcView = viewerPose.views[i];
      const targetCache = this.viewCache[i];
      
      targetCache.eye = srcView.eye;
      // Cópia direta de dados via TypedArray.set() - sem alocação de objetos
      targetCache.projectionMatrix.set(srcView.projectionMatrix);
      targetCache.transformMatrix.set(srcView.transformMatrix);
    }
  }

  _detectSpatialDesync() { return false; }
  _reinitializeSpatialAnchors() {}
}

// ----------------------------------------------------------------------------
// CORREÇÃO CRÍTICA #4 & #8: Scene Graph com Versionamento e Propagação Dirty Real
// ----------------------------------------------------------------------------
class SpatialNode {
  constructor() {
    this.localMatrix = new Float32Array(16);
    this.worldMatrix = new Float32Array(16);
    this.isDirty = true;
    this.parent = null;
    this.children = [];
    
    // Problema #8 - Versionamento de Transformações
    this.transformVersion = 0;
    this.lastParentVersion = -1;

    // Problema #7 - Bypass de Culling para elementos Head-Locked/Safe Zones
    this.bypassFrustum = false;
    this.renderLayer = 'WORLD_SPACE'; // 'WORLD_SPACE' ou 'HEAD_LOCKED'
  }

  invalidate() {
    if (!this.isDirty) {
      this.isDirty = true;
      this.transformVersion++; // Incrementa versão de controle local
      
      // Invalida a árvore descendente recursivamente
      const len = this.children.length;
      for (let i = 0; i < len; i++) {
        this.children[i].invalidate();
      }
    }
  }

  // Problema #4 - Propagação forçada e condicional robusta
  updateTransform(force = false) {
    let shouldUpdate = force || this.isDirty;

    // Verifica dessincronia de versão com o pai (caso o pai tenha mudado isoladamente)
    if (this.parent && this.lastParentVersion !== this.parent.transformVersion) {
      shouldUpdate = true;
      this.lastParentVersion = this.parent.transformVersion;
    }

    if (shouldUpdate) {
      if (this.parent) {
        SpatialRuntime.mat4_multiply(this.worldMatrix, this.parent.worldMatrix, this.localMatrix);
      } else {
        this.worldMatrix.set(this.localMatrix);
      }
      this.isDirty = false;
    }

    // Propaga o estado para os nós filhos na hierarquia do grafo
    const len = this.children.length;
    for (let i = 0; i < len; i++) {
      this.children[i].updateTransform(shouldUpdate);
    }
  }
}
