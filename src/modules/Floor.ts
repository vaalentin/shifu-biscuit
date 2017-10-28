import * as THREE from 'three'

import { vertexShaderPrecision, fragmentShaderPrecision } from '../core/shader'

export default class Floor {
  private static _material = new THREE.RawShaderMaterial({
    vertexShader: `
    precision ${vertexShaderPrecision} float;

    attribute vec3 position;
    attribute vec2 uv;
    attribute vec3 color;

    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;

    varying vec3 vColor;

    void main() {
      vColor = color;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    fragmentShader: `
    precision ${fragmentShaderPrecision} float;

    varying vec3 vColor;

    void main() {
      gl_FragColor = vec4(vColor, 1.0);
    }
    `,
    side: THREE.DoubleSide
  })

  public el: THREE.Mesh

  constructor() {
    const geometry = new THREE.PlaneBufferGeometry(10, 10)

    geometry.addAttribute(
      'color',
      new THREE.BufferAttribute(
        new Float32Array([
          0.5,
          0.5,
          1.0,
          0.5,
          0.5,
          1.0,
          0.5,
          0.5,
          1.0,
          0.5,
          0.5,
          1.0
        ]),
        3
      )
    )

    this.el = new THREE.Mesh(geometry, Floor._material)

    this.el.quaternion.setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      -Math.PI / 2
    )
  }
}
