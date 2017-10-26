import * as THREE from 'three'

import { map } from '../core/math'

export default class Slicer {
  private static _NULL = -2

  private static _lineMaterial = new THREE.RawShaderMaterial({
    vertexShader: `
    precision mediump float;

    attribute vec3 position;

    void main() {
      gl_Position = vec4(position, 1.0);
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

  private static _meshMaterial = new THREE.RawShaderMaterial({
    vertexShader: `
    precision mediump float;

    attribute vec3 position;

    void main() {
      gl_Position = vec4(position, 1.0);
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

  public line: THREE.Line
  public mesh: THREE.Mesh

  private _$el: HTMLElement

  private _width: number
  private _height: number

  private _pointsToCapture: number

  private _minimumDistanceBetweenPoints: number
  private _lastPointX: number
  private _lastPointY: number

  private _inputPoints: THREE.Vector3[]

  private _linePositions: THREE.BufferAttribute
  private _meshPositions: THREE.BufferAttribute

  private _isMouseDown: boolean

  private _tempPoint: THREE.Vector3

  constructor($el: HTMLElement) {
    this._$el = $el

    this._width = this._$el.offsetWidth
    this._height = this._$el.offsetHeight

    // input points
    this._pointsToCapture = 8

    this._minimumDistanceBetweenPoints = 0.1
    this._lastPointX = 0
    this._lastPointY = 0

    this._inputPoints = new Array(this._pointsToCapture)

    for (let i = 0; i < this._inputPoints.length; i++) {
      this._inputPoints[i] = new THREE.Vector3(0, 0, 0)
    }

    // line
    const linePoints = new Float32Array(this._pointsToCapture * 3)
    
    for (let i = 0; i < this._inputPoints.length; i++) {
      linePoints[i] = 0
    }

    this._linePositions = new THREE.BufferAttribute(linePoints, 3)

    const lineGeometry = new THREE.BufferGeometry()
    lineGeometry.addAttribute('position', this._linePositions)

    this.line = new THREE.Line(lineGeometry, Slicer._lineMaterial)

    // mesh
    const meshPoints = new Float32Array(
      (((this._pointsToCapture - 2) * 2) + 2) * 3
    )

    for (let i = 0; i < meshPoints.length; i += 3) {
      meshPoints[i] = Math.random() * 2 - 1
      meshPoints[i + 1] = Math.random() * 2 - 1
      meshPoints[i + 2] = 0
    }

    this._meshPositions = new THREE.BufferAttribute(meshPoints, 3)

    const meshGeometry = new THREE.BufferGeometry()
    meshGeometry.addAttribute('position', this._meshPositions)

    this.mesh = new THREE.Mesh(meshGeometry, Slicer._meshMaterial)
    this.mesh.drawMode = THREE.TriangleStripDrawMode

    this._isMouseDown = false

    this._bindMethods()
    this._addListeners()
  }

  private _bindMethods() {
    this._handleResize = this._handleResize.bind(this)
    this._handleTouchStart = this._handleTouchStart.bind(this)
    this._handleTouchMove = this._handleTouchMove.bind(this)
    this._handleTouchEnd = this._handleTouchEnd.bind(this)
  }

  private _addListeners() {
    window.addEventListener('resize', this._handleResize)
    this._$el.addEventListener('mousedown', this._handleTouchStart)
    this._$el.addEventListener('mousemove', this._handleTouchMove)
    this._$el.addEventListener('mouseup', this._handleTouchEnd)
  }

  private _handleResize() {
    this._width = this._$el.offsetWidth
    this._height = this._$el.offsetHeight
  }

  private _handleTouchStart(event: MouseEvent) {
    this._isMouseDown = true

    this._addPoint(event.offsetX, event.offsetY)
  }

  private _handleTouchMove(event: MouseEvent) {
    if (!this._isMouseDown) {
      return
    }

    this._addPoint(event.offsetX, event.offsetY)
  }

  private _handleTouchEnd() {
    this._isMouseDown = false
  }

  private _addPoint(x: number, y: number) {
    const dx = x - this._lastPointX
    const dy = y - this._lastPointY

    const distanceToPreviousPoint = Math.sqrt((dx * dx) + (dy * dy))

    if (distanceToPreviousPoint < 5) {
      return
    }

    this._lastPointX = x
    this._lastPointY = y

    for (let i = this._inputPoints.length - 1; i > 0; i--) {
      this._inputPoints[i].copy(this._inputPoints[i - 1]) 
    }

    this._inputPoints[0].set(
      map(x, 0, this._width, -1, 1),
      map(y, 0, this._height, 1, -1),
      0
    )

    this._updateLine()
    this._updateMesh()
  }

  private _updateLine() {
    const linePositions = this._linePositions.array as number[]

    for (let i = 0, j = 0; i < this._inputPoints.length; i++, j += 3) {
      linePositions[j] = this._inputPoints[i].x
      linePositions[j + 1] = this._inputPoints[i].y
      linePositions[j + 2] = this._inputPoints[i].z
    }

    this._linePositions.needsUpdate = true    
  }

  private _updateMesh() {
    const points = []

    points.push(this._inputPoints[0])

    for (let i = 1; i < this._inputPoints.length - 1; i++) {
      const dir = this._inputPoints[i].clone().sub(this._inputPoints[i - 1])

      dir.normalize()

      const perp = new THREE.Vector3(-dir.y, dir.x, 0)

      const thickness = 0.1 * ((this._inputPoints.length - i) / this._inputPoints.length)

      const c = this._inputPoints[i].clone().sub(perp.clone().multiplyScalar(thickness))
      const d = this._inputPoints[i].clone().add(perp.clone().multiplyScalar(thickness))

      points.push(c)
      points.push(d)
    }

    points.push(this._inputPoints[this._inputPoints.length - 1])
    
    const meshPositions = this._meshPositions.array as number[]

    console.log(meshPositions.length, points.length * 3)

    for (let i = 0, j = 0; i < points.length; i++, j += 3) {
      meshPositions[j] = points[i].x
      meshPositions[j + 1] = points[i].y
      meshPositions[j + 2] = points[i].z
    }

    console.log(this._meshPositions)

    this._meshPositions.needsUpdate = true
  }
}