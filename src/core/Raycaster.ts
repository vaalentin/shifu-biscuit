import * as THREE from 'three'

import Signal from './Signal'

export default class Raycaster {
  private _$el: HTMLElement

  private _raycaster: THREE.Raycaster

  private _els: THREE.Object3D[]

  public onCast: Signal<THREE.Intersection>

  constructor($el: HTMLElement) {
    this._$el = $el

    this._raycaster = new THREE.Raycaster()

    this._els = []

    this.onCast = new Signal<THREE.Intersection>()
  }

  public cast(camera: THREE.PerspectiveCamera, mousePosition: THREE.Vector2): boolean {
    this._raycaster.setFromCamera(mousePosition, camera)

    const intersects = this._raycaster.intersectObjects(this._els, true)

    if (!intersects.length) {
      return false
    }

    this.onCast.dispatch(intersects[0])

    return true
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
