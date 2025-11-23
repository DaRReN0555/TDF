#define M_PI 3.14159

in vec2 vUV;

uniform float uTime;
uniform sampler2D uTexture;
uniform vec2 uResolution;

void main() {
    vec2 uv = vUV;
    uv -= 0.5;

    // Учитываем соотношение сторон (фиксируем масштаб)
    float aspect = uResolution.x / 1.6323287671 / uResolution.y;
    uv.x *= aspect;

    // Build a 3D rotation matrix.
    float yTheta = M_PI / 5.;
    mat3 yRot = mat3(
        cos(yTheta), 0, sin(yTheta),
        0, 1, 0,
        -sin(yTheta), 0, cos(yTheta)
    );

    // Rotate the uv.
    uv = (vec3(uv.x, 0, uv.y) * yRot).xz;

    const float waveStrenght = 0.25;

    float wave1 = sin(uv.x * 10.0 + uTime * 2.5) * 0.002 * waveStrenght;
    float wave2 = sin(uv.x * 12.0 - uTime * 3.0) * 0.003 * waveStrenght;
    float wave3 = sin((uv.x + uv.y) * 15.0 + uTime * 4.0) * 0.002 * waveStrenght;
    float wave4 = cos((uv.x - uv.y) * 18.0 - uTime * 2.8) * 0.001 * waveStrenght;
    uv += vec2(wave1 + wave3, wave2 + wave4);

    // Повторение
    uv = fract(uv * 8.0);

    //gl_FragColor = vec4(uv.x, uv.y, 0.0, 1.0);
    gl_FragColor = texture2D(uTexture, uv);
}
