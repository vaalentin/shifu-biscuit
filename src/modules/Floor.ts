import * as THREE from 'three'
import * as CANNON from 'cannon'

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

  public body: CANNON.Body

  constructor() {
    const geometry = new THREE.PlaneBufferGeometry(3, 3)
    
    geometry.addAttribute(
      'color',
      new THREE.BufferAttribute(
        new Float32Array([
          0.5, 0.5, 1.0,
          0.5, 0.5, 1.0,
          0.5, 0.5, 1.0,
          0.5, 0.5, 1.0,
        ]),
        3
      )
    )

    this.el = new THREE.Mesh(
      geometry,
      Floor._material
    )

    this.el.quaternion.setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      -Math.PI / 2
    )

    this.body = new CANNON.Body({ mass: 0 })
    
    const shape = new CANNON.Plane()
    
    this.body.addShape(shape)
    
    this.body.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    )
  }
}
