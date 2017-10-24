import * as THREE from 'three'
import { GUI } from 'dat-gui'

export default class Paper {
  private static _material = new THREE.RawShaderMaterial({
    vertexShader: `
    precision mediump float;
    
    attribute vec3 position;
    attribute vec2 uv;

    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;

    uniform float progress;

    void main() {
      vec3 finalPosition = position;

      float angle = uv.x * 1.1;
      // float x = (position.x + angle) * cos(angle * sin(progress));
      // float y = (position.y + angle) * sin(angle * cos(progress));

      finalPosition.x += angle * cos(angle * progress);
      finalPosition.y += angle * sin(angle * progress);

      // finalPosition.y += sin(uv.x * 720.0) * 0.1;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPosition, 1.0);
    }
    `,
    fragmentShader: `
    precision mediump float;

    void main() {
      gl_FragColor = vec4(1.0);
    }
    `,
    uniforms: {
      progress: { type: 'f', value: 0 }
    },
    depthTest: false,
    side: THREE.DoubleSide,
    wireframe: true
  })
  public el: THREE.Mesh

  constructor() {
    const geometry = new THREE.PlaneBufferGeometry(1, 0.2, 20, 1)
    const material = Paper._material.clone()

    this.el = new THREE.Mesh(geometry, material)

    this.el.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2))

    const gui = new GUI()
    gui
      .add(material.uniforms.progress, 'value')
      .min(0)
      .max(100)
  }
}
