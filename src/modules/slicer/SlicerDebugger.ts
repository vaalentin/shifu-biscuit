import * as THREE from 'three'

export default class SlicerDebugger {
  private static _directionMaterial = new THREE.RawShaderMaterial({
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
      gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
    }
    `,
    depthTest: false,
    depthWrite: false
  })

  private static _rayCastPointsMaterial = new THREE.RawShaderMaterial({
    vertexShader: `
    precision mediump float;
    
    attribute vec2 position;

    void main() {
      gl_PointSize = 10.0;
      gl_Position = vec4(position, 0.0, 1.0);
    }
    `,
    fragmentShader: `
    precision mediump float;

    void main() {
      gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
    }
    `,
    depthTest: false,
    depthWrite: false
  })

  public normal: THREE.Line
  public rayCastPoints: THREE.Points

  private _directionGeometry: THREE.BufferGeometry
  private _directionPositions: THREE.BufferAttribute

  private _rayCastPointsGeometry: THREE.BufferGeometry
  private _rayCastPointsPositions: THREE.BufferAttribute

  constructor() {
    // normal
    this._directionGeometry = new THREE.BufferGeometry()

    this._directionPositions = new THREE.BufferAttribute(new Float32Array(4), 2)

    this._directionGeometry.addAttribute('position', this._directionPositions)

    this.normal = new THREE.Line(this._directionGeometry, SlicerDebugger._directionMaterial)
    this.normal.frustumCulled = false

    // ray cast points
    this._rayCastPointsGeometry = new THREE.BufferGeometry()

    this._rayCastPointsPositions = new THREE.BufferAttribute(new Float32Array(1000), 2)
    
    this._rayCastPointsGeometry.addAttribute('position', this._rayCastPointsPositions)

    this.rayCastPoints = new THREE.Points(this._rayCastPointsGeometry, SlicerDebugger._rayCastPointsMaterial)
    this.rayCastPoints.frustumCulled = false
  }

  public updateDirection(originX: number, originY: number, directionX: number, directionY: number) {
    const positions = this._directionPositions.array as number[]

    positions[0] = originX
    positions[1] = originY
    positions[2] = originX + directionX * 0.2
    positions[3] = originY + directionY * 0.2

    this._directionPositions.needsUpdate = true
  }

  public updateRayCastPoints(points: number[]) {
    const positions = this._rayCastPointsPositions.array as number[]

    for (let i = 0; i < points.length; i += 2) {
      positions[i] = points[i]
      positions[i + 1] = points[i + 1]
    }

    this._rayCastPointsGeometry.drawRange.count = points.length / 2

    this._rayCastPointsPositions.needsUpdate = true
  }
}
