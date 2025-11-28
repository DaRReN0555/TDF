#define M_PI 3.14159

in vec2 vUV;

uniform sampler2D uTexture;
uniform sampler2D uTexture2;
uniform float uTime;
uniform vec2 uResolution;

float islandMask(vec2 uv){
    uv = (uv - 0.5) * 2.0;                 // [-1..1]
    float w = 0.58;     // половина ширины прямоугольника (0 = узко, 1 = до краёв)
    float h = 0.65;     // половина высоты (0 = плоский, 1 = до краёв)
    return smoothstep(0.0, 0.02, w - abs(uv.x)) * 
           smoothstep(0.0, 0.02, h - abs(uv.y));
}

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

float noise (vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f*f*(3.0-2.0*f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

void main() {

    vec2 uv  = vUV - 0.5;
    vec2 uv2 = vUV - 0.5;

    vec2 foam1 = vUV - 0.5;
    vec2 foam2 = vUV - 0.5;
    vec2 foam3 = vUV - 0.5;
    vec2 foam4 = vUV - 0.5;

    float aspect = uResolution.x / 1.6323287671 / uResolution.y;
    uv.x  *= aspect;
    uv2.x *= aspect;

    float yTheta = M_PI / 4.0;
    mat3 yRot = mat3(
        cos(yTheta), 0.0,  sin(yTheta),
        0.0,         1.0,  0.0,
       -sin(yTheta), 0.0,  cos(yTheta)
    );

    uv  = (vec3(uv.x,  0.0, uv.y)  * yRot).xz;
    uv2 = (vec3(uv2.x, 0.0, uv2.y) * yRot).xz;

    vec2 st = gl_FragCoord.xy/uResolution.xy - 0.5;
    st.x *= aspect;
    st = (vec3(st.x, 0.0, st.y) * yRot).xz;
    st += 0.5;


    float waveStr  = 0.3;
    float waveStr2 = 0.25;

    uv  += vec2(
        sin(uv.x *10.0 + uTime*5.0)*0.002*waveStr  + sin((uv.x + uv.y)*15.0 + uTime*8.0)*0.002*waveStr,
        sin(uv.x *12.0 - uTime*6.0)*0.003*waveStr  + cos((uv.x - uv.y)*18.0 - uTime*5.6)*0.001*waveStr
    );

    uv2 += vec2(
        sin(uv2.x*10.0 + uTime*2.5)*0.002*waveStr2 + sin((uv2.x+uv2.y)*15.0 + uTime*4.0)*0.002*waveStr2,
        sin(uv2.x*12.0 - uTime*3.0)*0.003*waveStr2 + cos((uv2.x-uv2.y)*18.0 - uTime*2.8)*0.001*waveStr2
    );

    uv  = fract(uv  * 8.0);
    uv2 = fract(uv2 * 8.0);

    vec4 img1 = texture(uTexture,  uv);
    vec4 img2 = texture(uTexture2, uv2);

    float num1 = step(noise(vec2(st.x * 10.0, uTime * 1.3)) * 0.01, st.y - 0.215);
    float num2 = step(st.y - 0.79, noise(vec2(st.x * 10.0, uTime * 1.7)) * 0.01);
    float num3 = step(noise(vec2(st.y * 10.0, uTime * 1.36)) * 0.01 + 0.1, st.x - 0.12);
    float num4 = step(st.x - 0.8, noise(vec2(st.y * 10.0, uTime * 1.1)) * 0.01); 

    float mask = num1 * num2 * num3 * num4;
    vec4 wave = mix(mix(img1, img2, 0.5), img1, mask);
    
    float mix = num1 * num2 * num3 * num4;

    gl_FragColor = wave + mix * 0.6;
}