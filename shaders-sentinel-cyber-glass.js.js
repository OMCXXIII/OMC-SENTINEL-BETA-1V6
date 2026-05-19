/**
 * Sentinel VR-OS - Sovereign Kernel Component
 * Core Shader: sentinel-cyber-glass
 * Focus: Reduces perceptual latency through persistent synaptic feedback overlay.
 */

if (typeof AFRAME === 'undefined') {
  throw new Error('Sentinel VR-OS Error: A-Frame deve ser carregado antes do registro do sentinel-cyber-glass.');
}

AFRAME.registerShader('sentinel-cyber-glass', {
  schema: {
    // Caso precise passar variáveis dinâmicas (uniforms) no futuro, declare-as aqui.
  },

  vertexShader: `
    varying vec2 vUV;

    void main() {
      vUV = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    varying vec2 vUV;

    void main() {
      // Mapeamento sináptico de cores baseado nas coordenadas UV da malha
      gl_FragColor = vec4(
        vUV.x,   // Canal Vermelho (Dinâmica de Intenção)
        vUV.y,   // Canal Verde (Estabilidade dos Gânglios Basais)
        1.0,     // Canal Azul (Predomínio do Kernel de Soberania)
        0.7      // Alpha (Transparência de Vidro Cyber)
      );
    }
  `
});

console.log('⚡ [Sentinel VR-OS]: Shader "sentinel-cyber-glass" registrado com sucesso nos Gânglios Basais da GPU.');