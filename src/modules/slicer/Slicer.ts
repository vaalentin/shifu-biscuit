import * as THREE from 'three'
import { TweenMax, Expo } from 'gsap'

import { map } from '../../core/math'
import Signal from '../../core/Signal'

import SlicerMesh from './SlicerMesh'
import SlicerDebugger from './SlicerDebugger'

const ENABLE_HELPERS = false

interface SlicerSettings {
  pointsCount: number
  maximumPoints: number
  minimumDistanceBetweenPoints: number
  maximumDistanceBetweenPoints: number
  minimumDistance: number
}

interface OnSlicePayload {
  direction: THREE.Vector2
  rayCastPoints: number[]
}

export default class Slicer {
  public el: THREE.Object3D

  public onSliceUpate: Signal<OnSlicePayload>
  public onSliceEnd: Signal<void>

  private _onSlicePlayload: OnSlicePayload

  private _settings: SlicerSettings

  private _$el: HTMLElement
  private _$elSize: THREE.Vector2

  private _inputPoints: Float32Array
  private _smoothedPoints: Float32Array

  private _lastPointAdded: THREE.Vector2
  private _lastPointAddedAt: number

  private _activePointsCount: number
  private _addedPointsCount: number

  private _mesh: SlicerMesh

  private _isEnabled: boolean
  private _isTouchDown: boolean

  private _debugger: SlicerDebugger

  constructor($el: HTMLElement, settings: SlicerSettings) {
    this.el = new THREE.Object3D()

    this.onSliceUpate = new Signal<OnSlicePayload>()
    this.onSliceEnd = new Signal<void>()

    this._onSlicePlayload = {
      direction: new THREE.Vector2(0, 0),
      rayCastPoints: []
    }

    this._settings = settings

    this._$el = $el
    this._$elSize = new THREE.Vector2(
      this._$el.offsetWidth,
      this._$el.offsetHeight
    )

    this._inputPoints = new Float32Array(this._settings.pointsCount * 2)

    for (let i = 0; i < this._inputPoints.length; i++) {
      this._inputPoints[i] = 0
    }

    this._smoothedPoints = new Float32Array(this._settings.pointsCount * 2 * 2)

    this._lastPointAdded = new THREE.Vector2()
    this._lastPointAdded.set(null, null)

    this._activePointsCount = 0
    this._addedPointsCount = 0

    this._mesh = new SlicerMesh(this._settings.pointsCount * 2)
    this._mesh.setDrawCount(0)
    this._mesh.thicknessScale = 1
    this.el.add(this._mesh.el)

    this._isEnabled = true
    this._isTouchDown = false

    if (process.env.NODE_ENV === 'development' && ENABLE_HELPERS) {
      this._debugger = new SlicerDebugger()
      this.el.add(this._debugger.normal)
      this.el.add(this._debugger.rayCastPoints)
    }

    this._bindMethods()
    this._addListeners()
  }

  private _bindMethods() {
    this._handleInputStart = this._handleInputStart.bind(this)
    this._handleInputUpdate = this._handleInputUpdate.bind(this)
    this._handleInputEnd = this._handleInputEnd.bind(this)
  }

  private _addListeners() {
    this._$el.addEventListener('mousedown', this._handleInputStart)
    this._$el.addEventListener('touchstart', this._handleInputStart)

    this._$el.addEventListener('mousemove', this._handleInputUpdate)
    this._$el.addEventListener('touchmove', this._handleInputUpdate)

    this._$el.addEventListener('mouseup', this._handleInputEnd)
    this._$el.addEventListener('mouseleave', this._handleInputEnd)
    this._$el.addEventListener('touchend', this._handleInputEnd)
  }

  private _handleInputStart(event: MouseEvent | TouchEvent) {
    event.preventDefault()

    this._isTouchDown = true

    if (!this._isEnabled) {
      return
    }

    this._mesh.setRandomColor()

    const [x, y] = this._getCoordinates(event)

    this._addPoint(x, y)
  }

  private _handleInputUpdate(event: MouseEvent | TouchEvent) {
    event.preventDefault()

    if (!this._isEnabled || !this._isTouchDown) {
      return
    }

    const [x, y] = this._getCoordinates(event)

    this._addPoint(x, y)

    if (this._activePointsCount < 2) {
      return
    }

    const direction = this._getDirection()
    const rayCastPoints = this._getRaycastPoints()

    this._onSlicePlayload.direction.copy(direction)
    this._onSlicePlayload.rayCastPoints = rayCastPoints

    this.onSliceUpate.dispatch(this._onSlicePlayload)
  }

  private _handleInputEnd() {
    if (!this._isEnabled) {
      return
    }

    this._stop()
  }

  /**
   * Get the slice direction vector.
   * It is based on the last two points (the tip).
   */
  private _getDirection(): THREE.Vector2 {
    if (this._activePointsCount < 2) {
      return null
    }

    const firstX = this._inputPoints[0]
    const firstY = this._inputPoints[1]

    const secondX = this._inputPoints[2]
    const secondY = this._inputPoints[3]

    let directionX = secondX - firstX
    let directionY = secondY - firstY

    const length = Math.sqrt(directionX * directionX + directionY * directionY)

    directionX /= length
    directionY /= length

    directionX *= -1
    directionY *= -1

    if (this._debugger) {
      const originX = this._inputPoints[0]
      const originY = this._inputPoints[1]

      this._debugger.updateDirection(originX, originY, directionX, directionY)
    }

    return new THREE.Vector2(directionX, directionY)
  }

  /**
   * Get points along the first two segments of the line.
   * 
   */
  private _getRaycastPoints(): number[] | null {
    if (this._activePointsCount <= 2) {
      return []
    }

    const rayCastPoints: number[] = []

    for (let i = 0; i < 1; ++i) {
      const j = i * 2

      const x = this._inputPoints[j]
      const y = this._inputPoints[j + 1]

      const nextX = this._inputPoints[j + 2]
      const nextY = this._inputPoints[j + 3]

      let dirX = nextX - x
      let dirY = nextY - y

      const length = Math.sqrt(dirX * dirX + dirY * dirY)

      dirX /= length
      dirY /= length

      const stepSize = 0.05

      let tempLength = 0

      while (tempLength < length) {
        tempLength += stepSize

        const tempX = x + dirX * tempLength
        const tempY = y + dirY * tempLength

        rayCastPoints.push(tempX, tempY)
      }
    }

    if (this._debugger) {
      this._debugger.updateRayCastPoints(rayCastPoints)
    }

    return rayCastPoints
  }

  private _getCoordinates(event: MouseEvent | TouchEvent): [number, number] {
    switch (event.type) {
      case 'touchstart':
      case 'touchmove':
      case 'touchend':
        event = event as TouchEvent

        return [event.touches[0].pageX, event.touches[0].pageY]

      case 'mousedown':
      case 'mousemove':
      case 'mouseup':
        event = event as MouseEvent

        return [event.pageX, event.pageY]

      default:
        return [0, 0]
    }
  }

  private _addPoint(x: number, y: number) {
    if (this._lastPointAdded.x !== null && this._lastPointAdded.y !== null) {
      let dirX = x - this._lastPointAdded.x
      let dirY = y - this._lastPointAdded.y

      const length = Math.sqrt(dirX * dirX + dirY * dirY)

      dirX /= length
      dirY /= length

      // new point too close, don't add it
      if (length < this._settings.minimumDistanceBetweenPoints) {
        return
      } else if (length > this._settings.maximumDistanceBetweenPoints) {
        // new point too far, put it closer
        x =
          this._lastPointAdded.x +
          dirX * this._settings.maximumDistanceBetweenPoints
        y =
          this._lastPointAdded.y +
          dirY * this._settings.maximumDistanceBetweenPoints
      }
    }

    this._activePointsCount = Math.min(
      this._activePointsCount + 1,
      this._settings.pointsCount
    )

    this._addedPointsCount++

    if (this._addedPointsCount > this._settings.maximumPoints) {
      return this._stop()
    }

    this._mesh.setDrawCount(this._activePointsCount * 2 - 1)

    this._lastPointAdded.set(x, y)
    this._lastPointAddedAt = Date.now()

    for (let i = this._inputPoints.length - 1; i > 0; i -= 2) {
      this._inputPoints[i] = this._inputPoints[i - 2]
      this._inputPoints[i - 1] = this._inputPoints[i - 3]
    }

    this._inputPoints[0] = map(x, 0, this._$elSize.width, -1, 1)
    this._inputPoints[1] = map(y, 0, this._$elSize.height, 1, -1)

    this._smoothInputPoints()
    this._updateMesh()
  }

  private _smoothInputPoints() {
    this._smoothedPoints[0] = this._inputPoints[0]
    this._smoothedPoints[1] = this._inputPoints[1]

    let i = 2

    for (let j = 0; j < this._inputPoints.length - 2; j += 2) {
      const x = this._inputPoints[j]
      const y = this._inputPoints[j + 1]

      const nextX = this._inputPoints[j + 2]
      const nextY = this._inputPoints[j + 3]

      const qX = 0.75 * x + 0.25 * nextX
      const qY = 0.75 * y + 0.25 * nextY

      const rX = 0.25 * x + 0.75 * nextX
      const rY = 0.25 * y + 0.75 * nextY

      this._smoothedPoints[i++] = qX
      this._smoothedPoints[i++] = qY

      this._smoothedPoints[i++] = rX
      this._smoothedPoints[i++] = rY
    }

    this._smoothedPoints[i++] = this._inputPoints[this._inputPoints.length - 2]
    this._smoothedPoints[i++] = this._inputPoints[this._inputPoints.length - 1]
  }

  private _updateMesh() {
    this._mesh.update(this._smoothedPoints, this._activePointsCount * 2)
  }

  private _stop() {
    this.onSliceEnd.dispatch()

    this._isEnabled = false
    this._isTouchDown = false

    const props = {
      progress: 1
    }

    TweenMax.to(props, 0.3, {
      progress: 0,
      ease: Expo.easeOut,
      onUpdate: () => {
        this._mesh.thicknessScale = props.progress

        this._updateMesh()
      },
      onComplete: () => {
        this._isEnabled = true

        this._lastPointAdded.set(null, null)

        this._activePointsCount = 0
        this._addedPointsCount = 0

        this._mesh.setDrawCount(0)

        this._mesh.thicknessScale = 1

        this._updateMesh()
      }
    } as any)
  }

  public resize() {
    this._$elSize.set(this._$el.offsetWidth, this._$el.offsetHeight)
  }

  public update() {
    if (!this._isTouchDown || this._activePointsCount <= 1) {
      return
    }

    const delta = Date.now() - this._lastPointAddedAt

    if (delta > 10) {
      this._stop()
    }
  }
}
