import { Assets, Geometry, Mesh, Shader } from 'pixi.js';
import fragment from './triangleTextured.frag';
import vertex from './triangleTextured.vert';
import { app } from './main.ts';

export let func = (async () => {
  const texture = await Assets.load(
    'Sprites/water.jpg',
  );


  const geometry = new Geometry({
    attributes: {
      aPosition: [
        -0,
        -0, // x, y
        window.innerWidth,
        -0, // x, y
        window.innerWidth,
        window.innerHeight, // x, y
        -0,
        -0,
        window.innerWidth,
        window.innerHeight,
        -0,
        window.innerHeight,
      ], // x, y,,
      aUV: [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1],
    },
  });

  const shader = Shader.from({
    gl: {
      vertex,
      fragment,
    },
    resources: {
      uTexture: texture.source,
      backgroundUniforms: {
        resolution: { value: [window.innerWidth, window.innerHeight], type: 'vec2<f32>' },
        uTime: { value: 0, type: 'f32' },
      },
    },
  });

  const triangle = new Mesh({
    geometry,
    shader,
  });

  triangle.zIndex = -100
  app.stage.addChild(triangle);

  window.addEventListener('resize', () => {
      geometry.attributes.aPosition.buffer.data[0]=0; 
      geometry.attributes.aPosition.buffer.data[1]=0; 
      geometry.attributes.aPosition.buffer.data[2]=window.innerWidth; 
      geometry.attributes.aPosition.buffer.data[3]=0; 
      geometry.attributes.aPosition.buffer.data[4]=window.innerWidth; 
      geometry.attributes.aPosition.buffer.data[5]=window.innerHeight; 
      geometry.attributes.aPosition.buffer.data[6]=0;
      geometry.attributes.aPosition.buffer.data[7]=0;
      geometry.attributes.aPosition.buffer.data[8]=window.innerWidth;
      geometry.attributes.aPosition.buffer.data[9]=window.innerHeight;
      geometry.attributes.aPosition.buffer.data[10]=0;
      geometry.attributes.aPosition.buffer.data[11]=window.innerHeight;
      geometry.attributes.aPosition.buffer.update();
      shader.resources.backgroundUniforms.uniforms.resolution = [window.innerWidth, window.innerHeight];
      shader.resources.backgroundUniforms.update();
  })
  app.ticker.add(() => {
    shader.resources.backgroundUniforms.uniforms.uTime = performance.now() / 1000;
  })
});

