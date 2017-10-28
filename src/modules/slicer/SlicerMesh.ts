import * as THREE from 'three'

import { map } from '../../core/math'

export default class SlicerMesh {
  private static _material = new THREE.RawShaderMaterial({
    vertexShader: `
    precision mediump float;

    attribute vec2 position;
    attribute float progress;

    varying float vProgress;

    void main() {
      vProgress = progress;

      gl_Position = vec4(position, 0.0, 1.0);
    }
    `,
    fragmentShader: `
    precision mediump float;

    uniform vec3 fromColor;
    uniform vec3 toColor;

    varying float vProgress;
    
    void main() {
      vec3 color = mix(toColor, fromColor, vProgress);

      gl_FragColor = vec4(color, 1.0);
    }
    `,
    uniforms: {
      fromColor: {
        type: 'v3',
        value: Math.random() < 0.5
          ? new THREE.Vector3(0, 1, 0.5)
          : new THREE.Vector3(1, 0, 0.5)
      },
      toColor: {
        type: 'v3',
        value: new THREE.Vector3(1, 1, 1)
      }
    },
    depthTest: false,
    depthWrite: false
  })

  public el: THREE.Mesh

  public thicknessScale: number

  private _geometry: THREE.BufferGeometry

  private _positions: THREE.BufferAttribute
  private _progresses: THREE.BufferAttribute

  constructor(pointsCount: number) {
    this._geometry = new THREE.BufferGeometry()

    pointsCount = ((pointsCount - 2) * 2) + 2

    this._positions = new THREE.BufferAttribute(new Float32Array(pointsCount * 2), 2)
    this._progresses = new THREE.BufferAttribute(new Float32Array(pointsCount), 1)

    this._geometry.addAttribute('position', this._positions)
    this._geometry.addAttribute('progress', this._progresses)
    this._geometry.drawRange.count = 0

    this.el = new THREE.Mesh(this._geometry, SlicerMesh._material)
    this.el.drawMode = THREE.TriangleStripDrawMode
    this.el.frustumCulled = false
    this.el.visible = false

    this.thicknessScale = 1
  }

  public setRandomColor() {
    const value = Math.random()

    if (value < 0.33) {
      SlicerMesh._material.uniforms.fromColor.value.set(1, 0.5, 0)
    }
    else if (value < 0.66) {
      SlicerMesh._material.uniforms.fromColor.value.set(0, 1, 0.5)
    }
    else {
      SlicerMesh._material.uniforms.fromColor.value.set(1, 0, 0.5)
    }
  }

  public setDrawCount(count: number) {
    this._geometry.drawRange.count = ((count - 2) * 2) + 2

    this.el.visible = count !== 0
  }

  public update(points: Float32Array, count: number) {
    const meshPositions = this._positions.array as number[]
    const meshProgresses = this._progresses.array as number[]
    
    let i = 0
    let l = 0

    meshPositions[i] = points[i]

    i++

    meshPositions[i] = points[i]

    i++

    meshProgresses[l] = 1

    for (let j = 1; j < count; j++) {
      const k = j * 2

      const x = points[k]
      const y = points[k + 1]

      const previousX = points[k - 2]
      const previousY = points[k - 1]

      let directionX = x - previousX
      let directionY = y - previousY

      const length = Math.sqrt((directionX * directionX) + (directionY * directionY))

      directionX /= length
      directionY /= length

      const perpendicularX = -directionY
      const perpendicularY = directionX

      const thickness = map(j, 0, count, 0.1 * this.thicknessScale, 0)

      const cX = x - perpendicularX * thickness
      const cY = y - perpendicularY * thickness

      const dX = x + perpendicularX * thickness
      const dY = y + perpendicularY * thickness

      meshPositions[i++] = cX
      meshPositions[i++] = cY

      meshPositions[i++] = dX
      meshPositions[i++] = dY

      const progress = map(j, 0, count, 1, 0)

      meshProgresses[l++] = progress
      meshProgresses[l++] = progress
    }

    meshPositions[i] = points[i]

    i++

    meshPositions[i] = points[i]
    
    this._positions.needsUpdate = true
    this._progresses.needsUpdate = true
  }
}