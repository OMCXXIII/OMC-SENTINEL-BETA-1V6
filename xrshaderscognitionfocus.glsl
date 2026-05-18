/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SENTINEL v9.0 — COGNITIVE GPU PERCEPTION INFRASTRUCTURE
 * Arquivo: xr/shaders/cognition/focus.glsl
 * Papel: Isolador Focal Avançado (Modulador Atencional de Contraste e Nitidez)
 * ═══════════════════════════════════════════════════════════════════════════
 */

#version 300 es
precision highp float;

// 1. Uniformes Universais de Controle Perceptivo do SENTINEL
uniform sampler2D u_scene_texture;        // Textura base capturada da cena tridimensional (FBO)
uniform vec2 u_resolution;                // Resolução física em pixels do display XR
uniform vec2 u_foveal_center;             // Coordenadas normalizadas (X, Y) do olhar do operador (Gaze Tracker)

// 2. Uniformes Injetados e Monitorados pelo Shader-Runtime
uniform float u_attention_weight;         // Multiplicador de relevância atencional ativa (0.0 a 1.0)
uniform float u_focus_intensity;          // Intensidade de isolamento de ruído e claridade focal
uniform bool u_degraded_mode;             // Sinalizador de sobrevivência para desativação de passes pesados

in vec2 v_tex_coord;
out vec4 frag_color;

/**
 * Filtro de Nitidez de Alta Velocidade (Laplacian Kernel Simplificado) para Isolamento Foveal
 */
vec3 applyAdaptiveSharpen(sampler2D tex, vec2 coord, float strength) {
    vec2 step = 1.0 / u_resolution;
    vec3 center = texture(tex, coord).rgb;
    
    // Amostragem de cruz periférica imediata
    vec3 left  = texture(tex, coord + vec2(-step.x, 0.0)).rgb;
    vec3 right = texture(tex, coord + vec2(step.x, 0.0)).rgb;
    vec3 top   = texture(tex, coord + vec2(0.0, step.y)).rgb;
    vec3 bottom= texture(tex, coord + vec2(0.0, -step.y)).rgb;
    
    vec3 laplacian = 4.0 * center - (left + right + top + bottom);
    return clamp(center + laplacian * strength * 0.5, 0.0, 1.0);
}

void main() {
    // Se o modo degradado estiver ativo, executa passagem direta (Passthrough) para aliviar a GPU
    if (u_degraded_mode) {
        frag_color = texture(u_scene_texture, v_tex_coord);
        return;
    }

    // Calcula a distância do pixel atual em relação ao centro do olhar do operador
    vec2 aspect_corrected_coord = v_tex_coord;
    aspect_corrected_coord.x *= (u_resolution.x / u_resolution.y);
    vec2 corrected_fovea = u_foveal_center;
    corrected_fovea.x *= (u_resolution.x / u_resolution.y);
    
    float distance_from_gaze = distance(aspect_corrected_coord, corrected_fovea);

    // 3. Modulação de Nitidez e Acuidade Baseada no Foco do Operador
    // O ponto foveal exato ganha nitidez adaptativa; a periferia é levemente suavizada
    float foveal_mask = smoothstep(0.15 * u_attention_weight, 0.45 * u_attention_weight, distance_from_gaze);
    float sharpen_strength = (1.0 - foveal_mask) * u_focus_intensity;
    
    vec3 base_color = applyAdaptiveSharpen(u_scene_texture, v_tex_coord, sharpen_strength);

    // 4. Modulação de Contraste e Dessaturação Periférica Coerente
    // Elementos distantes do ponto de atenção perdem contraste para reduzir a carga informativa mental
    vec3 grayscale = vec3(dot(base_color, vec3(0.2126, 0.7152, 0.0722)));
    
    // Multiplicador de supressão atencional periférica
    float saturation_factor = mix(1.0, 0.35, foveal_mask * u_focus_intensity);
    vec3 final_chroma = mix(grayscale, base_color, saturation_factor);
    
    // Ajuste dinâmico de contraste tático no centro do olhar
    float contrast_modifier = mix(1.1, 0.85, foveal_mask * u_focus_intensity);
    final_chroma = clamp((final_chroma - 0.5) * contrast_modifier + 0.5, 0.0, 1.0);

    // Injeção de uma leve assinatura ciana tática nas bordas de foco se a prioridade for máxima
    if (u_attention_weight > 0.8) {
        float ring_glow = smoothstep(0.14, 0.15, distance_from_gaze) * (1.0 - smoothstep(0.15, 0.16, distance_from_gaze));
        final_chroma += vec3(0.0, 0.83, 1.0) * ring_glow * u_focus_intensity * 0.4;
    }

    frag_color = vec4(final_chroma, 1.0);
}
