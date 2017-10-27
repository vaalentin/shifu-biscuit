import * as THREE from 'three'
import { TweenMax, Expo } from 'gsap'

import { map } from '../core/math'

class SlicerLine {
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

class SlicerMesh {
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

export default class Slicer {
  public el: THREE.Object3D

  private _$el: HTMLElement

  private _width: number
  private _height: number

  private _pointsToCapture: number
  private _minimumDistanceBetweenPoints: number
  private _maximumPoints: number

  private _lastPointX: number
  private _lastPointY: number

  private _inputPoints: Float32Array

  private _enabled: boolean
  private _active: boolean
  
  private _previousX: number
  private _previousY: number
  private _x: number
  private _y: number

  private _drawCount: number
  private _pointsAdded: number

  private _line: SlicerLine
  private _mesh: SlicerMesh

  constructor($el: HTMLElement) {
    this.el = new THREE.Object3D()

    this._$el = $el

    this._width = this._$el.offsetWidth
    this._height = this._$el.offsetHeight

    // input points
    this._pointsToCapture = 8

    this._minimumDistanceBetweenPoints = 30
    this._maximumPoints = 12
    this._lastPointX = 0
    this._lastPointY = 0

    this._inputPoints = new Float32Array(this._pointsToCapture * 2)

    for (let i = 0; i < this._inputPoints.length; i++) {
      this._inputPoints[i] = 0
    }

    this._enabled = true
    this._active = false

    this._drawCount = 0
    this._pointsAdded = 0

    this._line = new SlicerLine(this._pointsToCapture)
    // this.el.add(this._line.el)

    this._mesh = new SlicerMesh(this._pointsToCapture)
    this.el.add(this._mesh.el)

    this._previousX = 0
    this._previousY = 0
    this._x = 0
    this._y = 0

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
    this._$el.addEventListener('touchstart', this._handleTouchStart)
    this._$el.addEventListener('mousemove', this._handleTouchMove)
    this._$el.addEventListener('touchmove', this._handleTouchMove)
    this._$el.addEventListener('mouseup', this._handleTouchEnd)
    this._$el.addEventListener('touchend', this._handleTouchEnd)
  }

  private _handleResize() {
    this._width = this._$el.offsetWidth
    this._height = this._$el.offsetHeight
  }

  private _handleTouchStart(event: MouseEvent | TouchEvent) {
    event.preventDefault()

    this._active = true

    if (!this._enabled) {
      return
    }

    const [x, y] = this._getCoordinates(event)

    this._addPoint(x, y)
  }

  private _handleTouchMove(event: MouseEvent | TouchEvent) {
    event.preventDefault()

    if (!this._enabled || !this._active) {
      return
    }

    const [x, y] = this._getCoordinates(event)

    this._previousX = this._x
    this._previousY = this._y
    this._x = x
    this._y = y

    this._addPoint(x, y)
  }

  private _handleTouchEnd() {
    if (!this._enabled) {
      return
    }

    this._stop()
  }

  private _getCoordinates(event: MouseEvent | TouchEvent): [number, number] {
    switch (event.type) {
      case 'touchstart':
      case 'touchmove':
      case 'touchend':
        event = event as TouchEvent

        return [
          event.touches[0].pageX,
          event.touches[0].pageY
        ]

      case 'mousedown':
      case 'mousemove':
      case 'mouseup':
        event = event as MouseEvent

        return [
          event.pageX,
          event.pageY
        ]

      default:
        return [0, 0]
    }
  }

  private _isPointFarEnough(x: number, y: number) {
    if (this._lastPointX === null || this._lastPointY === null) {
      return true
    }

    const dx = x - this._lastPointX
    const dy = y - this._lastPointY

    const distanceToPreviousPoint = Math.sqrt((dx * dx) + (dy * dy))

    return  distanceToPreviousPoint > this._minimumDistanceBetweenPoints
  }

  private _addPoint(x: number, y: number) {
    if (!this._isPointFarEnough(x, y)) {
      return
    }

    this._drawCount = Math.min(this._drawCount + 1, this._pointsToCapture)
    this._pointsAdded++

    if (this._pointsAdded > this._maximumPoints) {
      return this._stop()
    }

    this._line.setDrawCount(this._drawCount)
    this._mesh.setDrawCount(this._drawCount)

    this._lastPointX = x
    this._lastPointY = y

    for (let i = this._inputPoints.length - 1; i > 0; i -= 2) {
      this._inputPoints[i] = this._inputPoints[i - 2]
      this._inputPoints[i - 1] = this._inputPoints[i - 3]
    }

    this._inputPoints[0] = map(x, 0, this._width, -1, 1)
    this._inputPoints[1] = map(y, 0, this._height, 1, -1)

    this._updateLine()
    this._updateMesh()
  }

  private _updateLine() {  
    this._line.update(this._inputPoints)
  }

  private _updateMesh() {
    this._mesh.update(this._inputPoints, this._drawCount)
  }

  private _stop() {
    this._enabled = false    
    this._active = false
    
    const props = {
      progress: 1
    }

    TweenMax.to(props, 0.3, {
      progress: 0,
      ease: Expo.easeOut,
      onUpdate: () => {
        this._mesh.thicknessScale = props.progress

        this._updateLine()
        this._updateMesh()
      },
      onComplete: () => {
        this._enabled = true
        
        this._lastPointX = null
        this._lastPointY = null
    
        this._drawCount = 0
        this._pointsAdded = 0

        this._line.setDrawCount(this._drawCount)
        this._mesh.setDrawCount(this._drawCount)

        this._mesh.thicknessScale = 1

        this._updateLine()
        this._updateMesh()
      }
    } as any)
  }

  public update() {
    if (!this._active) {
      return
    }

    const dirX = this._x - this._previousX
    const dirY = this._y - this._previousY

    const length = Math.sqrt((dirX * dirX) + (dirY * dirY))
  }
}