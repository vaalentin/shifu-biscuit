import * as THREE from 'three'

import { map } from '../../core/math'

export default class SlicerMesh {
  private static _material = new THREE.RawShaderMaterial({
    vertexShader: `
    precision mediump float;

    attribute vec2 position;

    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
    `,
    fragmentShader: `
    precision mediump float;
    
    void main() {
      gl_FragColor = vec4(vec3(1.0), 1.0);
    }
    `,
    depthTest: false,
    depthWrite: false
  })

  public el: THREE.Mesh

  public thicknessScale: number

  private _geometry: THREE.BufferGeometry

  private _positions: THREE.BufferAttribute

  constructor(pointsCount: number) {
    this._geometry = new THREE.BufferGeometry()

    pointsCount = ((pointsCount - 2) * 2) + 2

    this._positions = new THREE.BufferAttribute(new Float32Array(pointsCount * 2), 2)

    this._geometry.addAttribute('position', this._positions)
    this._geometry.drawRange.count = 0

    this.el = new THREE.Mesh(this._geometry, SlicerMesh._material)
    this.el.drawMode = THREE.TriangleStripDrawMode
    this.el.frustumCulled = false
    this.el.visible = false

    this.thicknessScale = 1
  }

  public setDrawCount(count: number) {
    this._geometry.drawRange.count = ((count - 2) * 2) + 2

    this.el.visible = count !== 0
  }

  public update(points: Float32Array, count: number) {
    const meshPositions = this._positions.array as number[]
    
    let i = 0

    meshPositions[i] = points[i]

    i++

    meshPositions[i] = points[i]

    i++

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
    }

    // meshPositions[i] = points[i]

    // i++

    // meshPositions[i] = points[i]
    
    this._positions.needsUpdate = true
  }
}