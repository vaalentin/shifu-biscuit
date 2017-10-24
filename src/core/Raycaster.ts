import * as THREE from 'three'

import Signal from './Signal'

export default class Raycaster {
  private _$el: HTMLElement

  private _raycaster: THREE.Raycaster
  private _mouse: THREE.Vector2

  private _els: THREE.Object3D[]

  public onCast: Signal<THREE.Intersection>

  constructor($el: HTMLElement) {
    this._$el = $el

    this._raycaster = new THREE.Raycaster()
    this._mouse = new THREE.Vector2()

    this._els = []

    this.onCast = new Signal<THREE.Intersection>()

    this._bindMethods()
    this._addListeners()
  }

  private _bindMethods() {
    this._handleMouseMove = this._handleMouseMove.bind(this)
  }

  private _addListeners() {
    this._$el.addEventListener('mousemove', this._handleMouseMove)
  }

  private _handleMouseMove(e: MouseEvent) {
    this._mouse.set(
      e.offsetX / this._$el.offsetWidth * 2 - 1,
      -(e.offsetY / this._$el.offsetHeight) * 2 + 1
    )
  }

  public cast(camera: THREE.PerspectiveCamera) {
    this._raycaster.setFromCamera(this._mouse, camera)

    const intersects = this._raycaster.intersectObjects(this._els, true)

    if (!intersects.length) {
      return
    }

    this.onCast.dispatch(intersects[0])
  }

  public add(el: THREE.Object3D) {
    const i = this._els.indexOf(el)

    if (i !== -1) {
      return
    }

    this._els.push(el)
  }

  public remove(el: THREE.Object3D) {
    const i = this._els.indexOf(el)

    if (i === -1) {
      return
    }

    this._els.splice(i, 1)
  }
}
