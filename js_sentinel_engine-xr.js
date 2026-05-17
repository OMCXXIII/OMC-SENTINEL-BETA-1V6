// ✅ DEPOIS (com proteção de segurança):
_bindCoreCommunication() {
    if (window.SentinelBus) {
      window.SentinelBus.once('boot:complete', () => {
        this.traceXR('Sinal boot:complete interceptado via Bus. XR aguardando ativação manual.', 'INFO');
        
        // Verifica suporte XR
        if (navigator.xr) {
          navigator.xr.isSessionSupported('immersive-vr').then(supported => {
            if (supported) {
              this.xr.supportsImmersive = true;
              this._createXRActivationButton();
            }
          }).catch(e => {
            this.traceXR(`Falha ao verificar suporte WebXR: ${e.message}`, 'WARN');
          });
        }
      });

      // Hook de escuta nativa para reajustes térmicos
      window.SentinelBus.on('renderer:thermal_load', (data) => {
        if (data?.level) this.stabilizeComfort(data.level / 10);
      });
    }
}

// ✅ NOVO: Cria botão que aguarda clique do usuário
_createXRActivationButton() {
    if (document.getElementById('xr-activate-btn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'xr-activate-btn';
    btn.textContent = '🥽 ATIVAR XR';
    
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '12px 24px',
      backgroundColor: '#00D4FF',
      color: '#000408',
      border: 'none',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontWeight: 'bold',
      cursor: 'pointer',
      zIndex: '10000',
      fontSize: '14px',
      boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
      transition: 'all 0.3s ease'
    });
    
    btn.addEventListener('mouseover', () => {
      btn.style.transform = 'scale(1.05)';
      btn.style.boxShadow = '0 0 30px rgba(0, 212, 255, 0.8)';
    });
    
    btn.addEventListener('mouseout', () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.5)';
    });
    
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = '⏳ INICIANDO XR...';
      
      try {
        await this.startXRSession();
        btn.style.display = 'none'; // Desaparece se XR iniciou
      } catch (e) {
        this.traceXR(`Erro ao iniciar XR: ${e.message}`, 'ERROR');
        btn.disabled = false;
        btn.textContent = '🥽 ATIVAR XR (Erro)';
        
        setTimeout(() => {
          btn.textContent = '🥽 ATIVAR XR';
        }, 2000);
      }
    });
    
    document.body.appendChild(btn);
    this.traceXR('Botão de ativação XR criado. Aguardando gesto do usuário.', 'INFO');
}

// ✅ ATUALIZADO: Trata erro graciosamente
async startXRSession() {
    if (!this.xr.supported || !navigator.xr) {
      this.traceXR('Abortando: WebXR não suportado no hardware.', 'ERROR');
      this.degradeXR('HARDWARE_MISSING');
      return false;
    }

    try {
      await this.safeXR(async () => {
        const session = await navigator.xr.requestSession('immersive-vr', {
          requiredFeatures: ['local-floor', 'bounded-floor'],
          optionalFeatures: ['hand-tracking', 'layers']
        });

        this.xr.active = true;
        this.xr.session = session;
        this.xr.mode = 'IMMERSIVE_VR';

        this.session.immersive = true;
        this.session.inline = false;
        this.session.visibility = session.visibilityState;

        const refSpace = await session.requestReferenceSpace('local-floor');
        this.session.referenceSpace = refSpace;

        session.addEventListener('visibilitychange', (e) => this._handleVisibilityChange(e));
        session.addEventListener('end', () => this.stopXRSession());

        session.requestAnimationFrame((t, f) => this.paceXRFrames(t, f));
        
        window.SentinelBus?.emit('xr:activated', { sessionID: `XR_${Date.now()}` });
        this.rememberSpatialState();
        
        this.traceXR('✓ Sessão WebXR iniciada com sucesso (IMMERSIVE_VR).', 'INFO');
      });
      return true;
    } catch (e) {
      if (e.name === 'SecurityError') {
        this.traceXR('SecurityError: requer ativação do usuário. Botão XR criado.', 'WARN');
      } else {
        this.traceXR(`Erro ao iniciar XR: ${e.message}`, 'ERROR');
      }
      return false;
    }
}
