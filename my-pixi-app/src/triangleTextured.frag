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
    foam1.x *= aspect;
    foam2.x *= aspect;
    foam3.x *= aspect;
    foam4.x *= aspect;

    float yTheta = M_PI / 4.0;
    mat3 yRot = mat3(
        cos(yTheta), 0.0,  sin(yTheta),
        0.0,         1.0,  0.0,
       -sin(yTheta), 0.0,  cos(yTheta)
    );

    uv  = (vec3(uv.x,  0.0, uv.y)  * yRot).xz;
    uv2 = (vec3(uv2.x, 0.0, uv2.y) * yRot).xz;
    foam1 = (vec3(foam1.x,  1.0, foam1.y)  * yRot).xz;
    foam2 = (vec3(foam2.x,  0.0, foam2.y)  * yRot).xz;
    foam3 = (vec3(foam3.x,  0.0, foam3.y)  * yRot).xz;
    foam4 = (vec3(foam4.x,  0.0, foam4.y)  * yRot).xz;

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

    foam1 += vec2(
        sin(foam1.x*10.0 + uTime*2.5)*0.002*waveStr2 + sin((foam1.x+foam1.y)*15.0 + uTime*4.0)*0.002*waveStr2,
        sin(foam1.x*12.0 - uTime*3.0)*0.003*waveStr2 + cos((foam1.x-foam1.y)*18.0 - uTime*2.8)*0.001*waveStr2
    );

    foam2 += vec2(
        sin(foam2.x*10.0 + uTime*2.5)*0.002*waveStr2 + sin((foam2.x+foam2.y)*15.0 + uTime*4.0)*0.002*waveStr2,
        sin(foam2.x*12.0 - uTime*3.0)*0.003*waveStr2 + cos((foam2.x-foam2.y)*18.0 - uTime*2.8)*0.001*waveStr2
    );

    foam3 += vec2(
        sin(foam3.x*10.0 + uTime*2.5)*0.002*waveStr2 + sin((foam3.x+foam3.y)*15.0 + uTime*4.0)*0.002*waveStr2,
        sin(foam3.x*12.0 - uTime*3.0)*0.003*waveStr2 + cos((foam3.x-foam3.y)*18.0 - uTime*2.8)*0.001*waveStr2
    );

    foam4 += vec2(
        sin(foam4.x*10.0 + uTime*2.5)*0.002*waveStr2 + sin((foam4.x+foam4.y)*15.0 + uTime*4.0)*0.002*waveStr2,
        sin(foam4.x*12.0 - uTime*3.0)*0.003*waveStr2 + cos((foam4.x-foam4.y)*18.0 - uTime*2.8)*0.001*waveStr2
    );

    uv  = fract(uv  * 8.0);
    uv2 = fract(uv2 * 8.0);

    vec4 img1 = texture(uTexture,  uv);
    vec4 img2 = texture(uTexture2, uv2);

    vec4 wave = mix(img1, img2, 0.5);

// =================  РУЧКИ  =================
float _length  = 0.21;      // длина одной полоски (в мирах)
float _width   = 0.005;     // ширина (тоньше → меньше)
float _sharp   = 0.0000001;   // резкость краёв (0.001 = железо)
vec2  _pos     = vec2(1.0, 0.0); // центр всей решётки (x,y)
float _gap     = -0.2;      // расстояние между центрами
float _count   = 0.5;      // сколько линий
float _amp     = 0.055;      // амплитуда искривления (0 = прямые)
float _freq    = 0.0001;      // частота искривления (больше → чаще зигзаги)

vec2  _fadeCenter = vec2(0.0);   // центр круга-области
float _fadeR      = 0.5;        // радиус круга
float _fadeSoft   = 0.01;        // ширина мягкого края (0 = железо)

float _maskAngle = 47.5;   // ← меняй здесь (градусы)
// ===========================================

float fx  = foam1.x - _pos.x;
float fy  = foam1.y - _pos.y;

// искривление (амплитуда + частота)
float bend = sin((fx + fy)*_freq + uTime*3.0) * _amp;

// 1. индекс полоски (0.._count-1)
int   id  = int(floor((fx + bend) / (_length + _gap) * _count));
float fid = float(id);

// 2. центр своей полоски
float center = fid * (_length + _gap) / _count;
float phase  = (fx + bend - center) / _length;   // -1..1 внутри полоски

// 3. строим синус нужной длины
float line = sin(phase * M_PI);
line = 1.0 - abs(line);
line = pow(max(line,0.0), 1.0/_width);
line = smoothstep(0.0, _sharp, line);

// 4. вырезаем только внутри полоски
float inside = smoothstep(-1.0, -0.98, phase) *
              (1.0 - smoothstep(0.98, 1.0, phase));
line *= inside;

// 5. КРУГЛАЯ маска плавного исчезновения (остров)
vec2  d = (vUV - 0.5) * aspect - _fadeCenter;
float dist = length(d);
float mask = smoothstep(_fadeR + _fadeSoft, _fadeR, dist);
line *= mask;

// если хоть один конец вне круга – полоска исчезает
vec2 uvMask = vUV - 0.5;
uvMask.y += 0.032;              // ← чем больше, тем выше
uvMask.x -= 0.016;    
float ang = _maskAngle * 3.14159 / 180.0;
float cs = cos(ang), sn = sin(ang);
uvMask = vec2(uvMask.x * cs - uvMask.y * sn, uvMask.x * sn + uvMask.y * cs) + 0.5;
float mask2 = islandMask(uvMask);
line *= mask2;

vec4 col = vec4(line);

    gl_FragColor = wave + col;
}