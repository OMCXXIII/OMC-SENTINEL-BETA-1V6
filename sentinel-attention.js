/* ═══════════════════════════════════════════════════════════════════════════
   OMC VR-OS | ATTENTION-SYSTEM v9.0 — COGNITIVE HUD VISUAL LAYER
   Papel: Instanciação da Interface Espacial e Telas de Gestão de Atenção
   Estética: Dark Mode Scientific / Cyber-Glass Determinism / Dourado Metálico
   Domínio: PERCEPTUAL INTERFACE / COGNITIVE LOAD REDUCTION
   Fix: Correção de extensão dupla (.css.css) para vinculação direta em index.html
═══════════════════════════════════════════════════════════════════════════ */

/* 1. CONFIGURAÇÃO DO AMBIENTE BASE (DEEP BLACK ROOT) */
body {
    background-color: #020408 !important; /* Preto profundo para maximizar contraste OLED e XR */
    color: #E2E8F0;
    font-family: 'Courier New', Courier, Roboto, monospace;
    overflow: hidden;
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
}

/* 2. INFRAESTRUTURA CYBER GLASS (GLASSMORPHIC PANELS) */
.hud-panel,
.glass-card,
.cyber-glass-viewport {
    background: rgba(4, 8, 12, 0.65);
    
    /* Filtragem espacial dupla contra sangramento de luz de fundo */
    backdrop-filter: blur(14px) saturate(140%);
    -webkit-backdrop-filter: blur(14px) saturate(140%);
    
    /* Delimitação por ouro metálico sutil e translúcido */
    border: 1px solid rgba(212, 175, 55, 0.18);
    box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.75),
                inset 0 1px 2px rgba(255, 255, 255, 0.05);
                
    border-radius: 4px;
    box-sizing: border-box;
    
    /* Alinhamento ao motor de renderização acelerada por GPU */
    isolation: isolate;
    transform: translate3d(0, 0, 0);
    will-change: opacity, transform;
}

/* Painel Ativo sob Foco do Olhar (Gaze Focus Overdrive) */
.hud-panel.focus-active {
    border-color: rgba(212, 175, 55, 0.55);
    box-shadow: 0 16px 48px 0 rgba(212, 175, 55, 0.12),
                0 0 15px rgba(0, 212, 255, 0.05);
}

/* 3. ELEMENTOS DE SINALIZAÇÃO CIENTÍFICA (INDICATORS & NEON) */
.latency-indicator,
.telemetry-value-gold {
    color: #D4AF37; /* Dourado Metálico Homologado */
    font-weight: bold;
    letter-spacing: 0.08em;
    
    /* Brilho neon cirúrgico de frequência controlada para evitar estresse retiniano */
    text-shadow: 0 0 6px rgba(212, 175, 55, 0.5),
                 0 0 12px rgba(212, 175, 55, 0.2);
}

.latency-indicator.critical {
    color: #FF3E3E;
    text-shadow: 0 0 8px rgba(255, 62, 62, 0.6);
}

.latency-indicator.nominal {
    color: #00FF88;
    text-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
}

/* 4. COMPOSIÇÃO DOS VETORES DE INTEGRIDADE DO PROCESSO */
.attention-meter-bar {
    width: 100%;
    height: 3px;
    background: rgba(255, 255, 255, 0.05);
    position: relative;
    overflow: hidden;
    margin-top: 6px;
}

.attention-meter-fill {
    height: 100%;
    background: linear-gradient(90deg, #D4AF37, #00D4FF);
    width: 0%;
    transition: width var(--transition-fast, 0.08s) cubic-bezier(0.16, 1, 0.3, 1);
}

/* HUD Textures e linhas de varredura científicas estáveis */
.hud-panel::before {
    content: " ";
    display: block;
    position: absolute;
    top: 0; left: 0; bottom: 0; right: 0;
    background: linear-gradient(rgba(18, 24, 32, 0) 50%, rgba(0, 4, 8, 0.15) 50%),
                linear-gradient(90deg, rgba(255, 0, 0, 0.01), rgba(0, 255, 0, 0.005), rgba(0, 0, 255, 0.01));
    z-index: -1;
    background-size: 100% 4px, 6px 100%;
    pointer-events: none;
    opacity: 0.4;
}
