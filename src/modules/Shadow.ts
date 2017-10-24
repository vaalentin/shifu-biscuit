import * as THREE from 'three'

import { vertexShaderPrecision, fragmentShaderPrecision } from '../core/shader'
import { map } from '../core/math'

export default class Shadow {
  private static _material = new THREE.RawShaderMaterial({
    vertexShader: `
    precision ${vertexShaderPrecision} float;

    attribute vec3 position;
    attribute vec2 uv;

    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;

    varying vec2 vUv;

    void main() {
      vUv = uv;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    fragmentShader: `
    precision ${fragmentShaderPrecision} float;

    uniform float intensity;

    varying vec2 vUv;

    void main() {
      vec2 center = abs(vUv - 0.5);
      float alpha = smoothstep(0.2, 0.5, length(center));

      gl_FragColor = vec4(vec3(0.0), (1.0 - alpha) * intensity);
    }
    `,
    uniforms: {
      intensity: { type: 'f', value: 0.3 }
    },
    transparent: true,
    depthWrite: false
  })

  public el: THREE.Mesh

  private _el: THREE.Object3D

  private _material: THREE.RawShaderMaterial

  private _planeVector: THREE.Vector3

  constructor(
    el: THREE.Object3D,
    size = 1,
    planeVector = new THREE.Vector3(0, -1, 0)
  ) {
    this._el = el

    this._planeVector = planeVector

    const geometry = new THREE.PlaneBufferGeometry(size, size)
    this._material = Shadow._material.clone()

    this.el = new THREE.Mesh(geometry, this._material)
    this.el.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
  }

  public update() {
    const height = Math.abs(this._el.position.y)

    const scale = map(height, 0, 2, 1, 0.2)
    const intensity = map(height, 0, 2, 0.3, 0.1)

    const position = this._el.position.projectOnPlane(this._planeVector)
    position.y += 0.01 // to avoid z-fighting with the plane

    this.el.position.copy(position)
    this.el.scale.set(scale, scale, scale)

    this._material.uniforms.intensity.value = intensity
  }

  public dispose() {
    this.el.geometry.dispose()

    const material = this.el.material as any

    material.dispose()

    this.el = null
    this._el = null
    this._material = null
    this._planeVector = null
  }
}
