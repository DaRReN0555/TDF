#define M_PI 3.14159

in vec2 vUV;

uniform float uTime;
uniform sampler2D uTexture;
uniform sampler2D uTexture2;
uniform vec2 uResolution;

void main() {
    vec2 uv = vUV;
    vec2 uv2 = vUV;

    uv -= 0.5;
    uv2 -= 0.5;

    float aspect = uResolution.x / 1.6323287671 / uResolution.y;
    uv.x *= aspect;
    uv2.x *= aspect;

    float yTheta = M_PI / 5.0;
    mat3 yRot = mat3(
        cos(yTheta), 0, sin(yTheta),
        0, 1, 0,
        -sin(yTheta), 0, cos(yTheta)
    );
    uv = (vec3(uv.x,0,uv.y) * yRot).xz;
    uv2 = (vec3(uv2.x,0,uv2.y) * yRot).xz;

    float waveStr = 0.3;
    float w1 = sin(uv.x*10.0+uTime*5.0)*0.002*waveStr;
    float w2 = sin(uv.x*12.0-uTime*6.0)*0.003*waveStr;
    float w3 = sin((uv.x+uv.y)*15.0+uTime*8.0)*0.002*waveStr;
    float w4 = cos((uv.x-uv.y)*18.0-uTime*5.6)*0.001*waveStr;
    uv += vec2(w1+w3, w2+w4);

    float waveStr2 = 0.25;
    float w12 = sin(uv2.x*10.0+uTime*2.5)*0.002*waveStr2;
    float w22 = sin(uv2.x*12.0-uTime*3.0)*0.003*waveStr2;
    float w32 = sin((uv2.x+uv2.y)*15.0+uTime*4.0)*0.002*waveStr2;
    float w42 = cos((uv2.x-uv2.y)*18.0-uTime*2.8)*0.001*waveStr2;
    uv2 += vec2(w12+w32, w22+w42);

    uv  = fract(uv  * 8.0);
    uv2 = fract(uv2 * 8.0);

    vec4 img1 = texture2D(uTexture,  uv);
    vec4 img2 = texture2D(uTexture2, uv2);

    vec4 water = mix(img1, img2, 0.5);

    gl_FragColor = water;
}