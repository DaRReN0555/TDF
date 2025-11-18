#define M_PI 3.14159

in vec2 vUV;

uniform sampler2D uTexture;
uniform vec2 resolution;

void main() {
    vec2 uv = vUV;
    uv -= 0.5;

    // Учитываем соотношение сторон (фиксируем масштаб)
    float aspect = resolution.x / 1.79 / resolution.y;
    uv.x *= aspect;

    // Build a 3D rotation matrix.
    float yTheta = M_PI / 4.;
    mat3 yRot = mat3(
        cos(yTheta), 0, sin(yTheta),
        0, 1, 0,
        -sin(yTheta), 0, cos(yTheta)
    );

    // Rotate the uv.
    uv = (vec3(uv.x, 0, uv.y) * yRot).xz;

    // Повторение
    uv = fract(uv * 10.0);

    //gl_FragColor = vec4(uv.x, uv.y, 0.0, 1.0);
    gl_FragColor = texture2D(uTexture, uv);
}
