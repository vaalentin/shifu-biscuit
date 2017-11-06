import * as THREE from 'three'

import { vertexShaderPrecision, fragmentShaderPrecision } from '../core/shader'
import { map } from '../core/math'

export default class Confettis {
  private static _confettiMaterial = new THREE.RawShaderMaterial({
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

  private static _shadowMaterial = new THREE.RawShaderMaterial({
    vertexShader: `
    precision ${vertexShaderPrecision} float;

    attribute vec3 position;
    attribute float influence;
    attribute float lifeSpan;
    attribute float scale;

    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;

    varying float vInfluence;

    void main() {
      vInfluence = influence;

      gl_PointSize = (scale * 2.0) * lifeSpan;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    fragmentShader: `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
    precision ${fragmentShaderPrecision} float;

    varying float vInfluence;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float distance = length(coord);

      float alpha = smoothstep(0.5, 0.0, distance);

      gl_FragColor = vec4(vec3(0.0), alpha * vInfluence * 0.1);
    }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true
  })

  
  private static _confettisColors = [
    [233, 209, 178],
    [151, 102, 41],
    [208, 151, 77]
  ].concat(window.palette.extras.map(color => color.rgb))

  public confettis: THREE.Points

  public shadows: THREE.Points

  private _confettisPositions: THREE.BufferAttribute
  private _confettisLifeSpans: THREE.BufferAttribute

  private _confettisAccelerations: Float32Array
  private _confettisPreviousPositions: Float32Array
  private _confettisScales: Float32Array

  private _shadowsPositions: THREE.BufferAttribute
  private _shadowsInfluences: THREE.BufferAttribute

  public active: boolean

  constructor(count = 100) {
    // confettis arrays
    const confettisPositions = new Float32Array(count * 3)
    const confettisLifeSpans = new Float32Array(count)
    const confettisColors = new Float32Array(count * 3)
    this._confettisScales = new Float32Array(count)
    this._confettisAccelerations = new Float32Array(count * 3)
    this._confettisPreviousPositions = new Float32Array(count * 3)

    for (let i = 0, j = 0; i < count * 3; i += 3, j++) {
      confettisPositions[i] = 0
      confettisPositions[i + 1] = 0
      confettisPositions[i + 2] = 0

      confettisLifeSpans[j] = 0

      let [r, g, b] = Confettis._confettisColors[
        Math.floor(Math.random() * Confettis._confettisColors.length)
      ]

      r /= 255
      g /= 255
      b /= 255

      confettisColors[i] = r
      confettisColors[i + 1] = g
      confettisColors[i + 2] = b

      this._confettisScales[j] = Math.random() * 50

      this._confettisAccelerations[i] = 0
      this._confettisAccelerations[i + 1] = 0
      this._confettisAccelerations[i + 2] = 0

      this._confettisPreviousPositions[i] = 0
      this._confettisPreviousPositions[i + 1] = 0
      this._confettisPreviousPositions[i + 2] = 0
    }

    // confettis attributes
    this._confettisPositions = new THREE.BufferAttribute(confettisPositions, 3)
    this._confettisLifeSpans = new THREE.BufferAttribute(confettisLifeSpans, 1)

    // confettis geometry
    const confettisGeometry = new THREE.BufferGeometry()

    confettisGeometry.addAttribute('position', this._confettisPositions)
    confettisGeometry.addAttribute('lifeSpan', this._confettisLifeSpans)
    confettisGeometry.addAttribute(
      'color',
      new THREE.BufferAttribute(confettisColors, 3)
    )
    confettisGeometry.addAttribute(
      'scale',
      new THREE.BufferAttribute(this._confettisScales, 1)
    )

    // confettis
    this.confettis = new THREE.Points(
      confettisGeometry,
      Confettis._confettiMaterial
    )
    this.confettis.visible = false

    // shadows arrays
    const shadowsPositions = new Float32Array(count * 3)
    const shadowsInfluences = new Float32Array(count)

    for (let i = 0, j = 0; i < count * 3; i += 3, j++) {
      shadowsPositions[i] = 0
      shadowsPositions[i + 1] = 0
      shadowsPositions[i + 2] = 0

      shadowsInfluences[j] = 0
    }

    // shadows attributes
    this._shadowsPositions = new THREE.BufferAttribute(shadowsPositions, 3)
    this._shadowsInfluences = new THREE.BufferAttribute(shadowsInfluences, 1)

    // shadows geometry
    const shadowsGeometry = new THREE.BufferGeometry()

    shadowsGeometry.addAttribute('position', this._shadowsPositions)
    shadowsGeometry.addAttribute('influence', this._shadowsInfluences)
    shadowsGeometry.addAttribute('lifeSpan', this._confettisLifeSpans)
    shadowsGeometry.addAttribute(
      'scale',
      (confettisGeometry.attributes as any).scale
    )

    // shadows
    this.shadows = new THREE.Points(shadowsGeometry, Confettis._shadowMaterial)
    this.shadows.visible = false

    this.active = false
  }

  public explode(origin: THREE.Vector3) {
    this.active = true
    this.confettis.visible = true
    this.shadows.visible = true

    const confettisPositions = this._confettisPositions.array as number[]
    const confettisLifeSpans = this._confettisLifeSpans.array as number[]

    for (let i = 0, j = 0; i < confettisPositions.length; i += 3, j++) {
      confettisPositions[i] = origin.x + (Math.random() * 2 - 1) * 0.1
      confettisPositions[i + 1] = origin.y + (Math.random() * 2 - 1) * 0.1
      confettisPositions[i + 2] = origin.z + (Math.random() * 2 - 1) * 0.1

      this._confettisPreviousPositions[i] = origin.x
      this._confettisPreviousPositions[i + 1] = origin.y
      this._confettisPreviousPositions[i + 2] = origin.z

      this._confettisAccelerations[i] = (Math.random() * 2 - 1) * 1
      this._confettisAccelerations[i + 1] = (Math.random() * 2 - 1) * 0.5
      this._confettisAccelerations[i + 2] = (Math.random() * 2 - 1) * 0.5

      confettisLifeSpans[j] = 1
    }

    this._confettisPositions.needsUpdate = true
    this._confettisLifeSpans.needsUpdate = true
  }

  public update(delta: number) {
    if (!this.active) {
      return
    }

    const confettisPositions = this._confettisPositions.array as number[]
    const confettisLifeSpans = this._confettisLifeSpans.array as number[]

    const shadowsPositions = this._shadowsPositions.array as number[]
    const shadowsInfluences = this._shadowsInfluences.array as number[]

    for (let i = 0, j = 0; i < confettisPositions.length; i += 3, j++) {
      // gravity
      this._confettisAccelerations[i + 1] -= 0.2
      // this._acceleration[i + 1] = Math.min(this._acceleration[i + 1], -1)

      // verlet
      const x =
        confettisPositions[i] +
        (confettisPositions[i] - this._confettisPreviousPositions[i]) +
        this._confettisAccelerations[i] * delta * delta

      let y =
        confettisPositions[i + 1] +
        (confettisPositions[i + 1] - this._confettisPreviousPositions[i + 1]) +
        this._confettisAccelerations[i + 1] * delta * delta

      const z =
        confettisPositions[i + 2] +
        (confettisPositions[i + 2] - this._confettisPreviousPositions[i + 2]) +
        this._confettisAccelerations[i + 2] * delta * delta

      this._confettisPreviousPositions[i] = confettisPositions[i]
      this._confettisPreviousPositions[i + 1] = confettisPositions[i + 1]
      this._confettisPreviousPositions[i + 2] = confettisPositions[i + 2]

      // check collisions with the floor and inverse velocity
      // note that the radius is only an approximation
      // TODO test on different devices
      const radius = this._confettisScales[j] * 0.01 * confettisLifeSpans[j]

      if (y < radius / 2) {
        y = 2 * radius - y
        this._confettisPreviousPositions[i + 1] =
          2 * radius - this._confettisPreviousPositions[i + 1]
      }

      confettisPositions[i] = x
      confettisPositions[i + 1] = y
      confettisPositions[i + 2] = z

      shadowsPositions[i] = x
      shadowsPositions[i + 1] = 0
      shadowsPositions[i + 2] = z

      shadowsInfluences[j] = map(y, 0.0, 2, 1.0, 0.2)

      confettisLifeSpans[j] -= 0.8 * delta

      if (confettisLifeSpans[j] <= 0) {
        this.active = false
        this.confettis.visible = false
        this.shadows.visible = false
      }
    }

    this._confettisPositions.needsUpdate = true
    this._confettisLifeSpans.needsUpdate = true

    this._shadowsPositions.needsUpdate = true
    this._shadowsInfluences.needsUpdate = true
  }
}
