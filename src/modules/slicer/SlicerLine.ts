import * as THREE from 'three'

export default class SlicerLine {
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
      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
    `,
    depthTest: false,
    depthWrite: false
  })

  public el: THREE.Line

  private _geometry: THREE.BufferGeometry

  private _positions: THREE.BufferAttribute

  constructor(pointsCount: number) {
    this._geometry = new THREE.BufferGeometry()

    this._positions = new THREE.BufferAttribute(new Float32Array(pointsCount * 2), 2)

    this._geometry.addAttribute('position', this._positions)
    this._geometry.drawRange.count = 0

    this.el = new THREE.Line(this._geometry, SlicerLine._material)
    this.el.frustumCulled = false
    this.el.visible = false
  }

  public setDrawCount(count: number) {
    this._geometry.drawRange.count = count
    
    this.el.visible = count !== 0
  }

  public update(points: Float32Array) {
    const positions = this._positions.array as number[]
    
    for (let i = 0; i < points.length; i += 2) {
      positions[i] = points[i]
      positions[i + 1] = points[i + 1]
    }
    
    this._positions.needsUpdate = true    
  }
}