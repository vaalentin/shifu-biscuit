import * as THREE from 'three'

import { vertexShaderPrecision, fragmentShaderPrecision } from '../core/shader'

export default class Confettis {
  private static _material = new THREE.RawShaderMaterial({
    vertexShader: `
    precision ${vertexShaderPrecision} float;

    attribute vec3 position;
    attribute float lifeSpan;
    attribute vec3 color;
    attribute float scale;

    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;

    varying float vLifeSpan;
    varying vec3 vColor;

    void main() {
      vLifeSpan = lifeSpan;
      vColor = color;

      gl_PointSize = lifeSpan * scale;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    fragmentShader: `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
    precision ${fragmentShaderPrecision} float;

    varying vec3 vColor;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float distance = length(coord);

      float alpha = smoothstep(0.5, 0.4, distance);

      gl_FragColor = vec4(vColor, alpha);
    }
    `,
    transparent: true,
    depthWrite: false
  })

  public el: THREE.Points

  private _positions: THREE.BufferAttribute
  private _lifeSpans: THREE.BufferAttribute

  private _acceleration: Float32Array
  private _previousPositions: Float32Array

  public active: boolean

  constructor(count = 100) {
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < positions.length; ++i) {
      positions[i] = 0
    }

    const lifeSpans = new Float32Array(count)

    for (let i = 0; i < lifeSpans.length; ++i) {
      lifeSpans[i] = 0
    }

    const colors = new Float32Array(count * 3)

    const particlesColors = [
      [233 / 255, 209 / 255, 178 / 255],
      [151 / 255, 102 / 255, 41 / 255],
      [208 / 255, 151 / 255, 77 / 255],
      [1, 0.5, 0],
      [0, 1, 0.5],
      [1, 0, 0.5]
    ]

    for (let i = 0; i < colors.length; i += 3) {
      const [r, g, b] = particlesColors[Math.floor(Math.random() * particlesColors.length)]

      colors[i] = r
      colors[i + 1] = g
      colors[i + 2] = b
    }

    const scales = new Float32Array(count)

    for (let i = 0; i < scales.length; i++) {
      scales[i] = Math.random() * 50
    }

    this._positions = new THREE.BufferAttribute(
      positions,
      3
    )

    this._lifeSpans = new THREE.BufferAttribute(
      lifeSpans,
      1
    )

    const geometry = new THREE.BufferGeometry()

    geometry.addAttribute('position', this._positions)
    geometry.addAttribute('lifeSpan', this._lifeSpans)
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.addAttribute('scale', new THREE.BufferAttribute(scales, 1))

    this._acceleration = new Float32Array(count * 3)
    this._previousPositions = new Float32Array(count * 3)

    this.el = new THREE.Points(geometry, Confettis._material)

    this.active = false
  }

  public explode(origin: THREE.Vector3) {
    this.active = true

    const positions = this._positions.array as number[]
    const lifespans = this._lifeSpans.array as number[]

    for (let i = 0, j = 0; i < positions.length; i += 3, j++) {
      positions[i] = origin.x + (Math.random() * 2 - 1) * 0.1
      positions[i + 1] = origin.y + (Math.random() * 2 - 1) * 0.1
      positions[i + 2] = origin.z + (Math.random() * 2 - 1) * 0.1

      this._previousPositions[i] = origin.x
      this._previousPositions[i + 1] = origin.y
      this._previousPositions[i + 2] = origin.z

      this._acceleration[i] = (Math.random() * 2 - 1) * 1
      this._acceleration[i + 1] = (Math.random() * 2 - 1) * 0.5
      this._acceleration[i + 2] = (Math.random() * 2 - 1) * 0.5

      lifespans[j] = 1
    }

    this._positions.needsUpdate = true
    this._lifeSpans.needsUpdate = true
  }

  public update(delta: number) {
    if (!this.active) {
      return
    }

    const positions = this._positions.array as number[]
    const lifespans = this._lifeSpans.array as number[]

    for (let i = 0, j = 0; i < positions.length; i += 3, j++) {
      // gravity
      this._acceleration[i + 1] -= 0.2

      // verlet
      const x = positions[i] + (positions[i] - this._previousPositions[i]) + this._acceleration[i] * delta * delta
      const y = positions[i + 1] + (positions[i + 1] - this._previousPositions[i + 1]) + this._acceleration[i + 1] * delta * delta
      const z = positions[i + 2] + (positions[i + 2] - this._previousPositions[i + 2]) + this._acceleration[i + 2] * delta * delta

      this._previousPositions[i] = positions[i]
      this._previousPositions[i + 1] = positions[i + 1]
      this._previousPositions[i + 2] = positions[i + 2]

      positions[i] = x
      positions[i + 1] = y
      positions[i + 2] = z

      lifespans[j] -= 0.8 * delta

      if (lifespans[j] <= 0) {
        this.active = false
      }
    }

    this._positions.needsUpdate = true
    this._lifeSpans.needsUpdate = true
  }
}