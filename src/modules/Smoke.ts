import * as THREE from 'three'
import { TweenMax, Expo } from 'gsap'

import Sprite from '../core/Sprite'
import { random } from '../core/math'

export default class Smoke {
  public el: THREE.Object3D

  private _sprite: Sprite

  private _planes: THREE.Mesh[]
  private _scales: number[]

  constructor() {
    this.el = new THREE.Object3D()
    this.el.visible = false
    this.el.rotation.x = -Math.PI / 4

    this._sprite = new Sprite(require<string>('../textures/smoke.png'), {
      imagesPerRow: 8,
      imagesPerColumn: 8,
      imagesCount: 64,
      fps: 20
    })

    this._sprite.material.uniforms.alpha.value = 0.7

    const geometry = new THREE.PlaneBufferGeometry(1, 1)

    this._planes = new Array(4)
    this._scales = new Array(this._planes.length)

    const plane = new THREE.Mesh(geometry, this._sprite.material)

    for (let i = 0; i < this._planes.length; i++) {
      const planeCopy = plane.clone()

      planeCopy.position.set(
        random(-0.2, 0.2),
        random(-0.2, 0.2),
        random(-0.2, 0.2)
      )

      const scale = random(2, 5)
      this._scales[i] = scale

      planeCopy.scale.set(0, 0, 1)

      planeCopy.rotateZ(random(0, 2 * Math.PI))

      this.el.add(planeCopy)

      this._planes[i] = planeCopy
    }
  }

  public update(delta: number) {
    if (!this.el.visible) {
      return
    }
    
    this._sprite.update(delta)
  }

  public explode(origin: THREE.Vector3) {
    this.el.visible = true

    this.el.position.copy(origin)

    for (let i = 0; i < this._planes.length; i++) {
      const plane = this._planes[i]
      const scale = this._scales[i]
      
      TweenMax.to(plane.scale, 2, {
        x: scale,
        y: scale,
        z: scale,
        ease: Expo.easeOut
      } as any)
    }

    TweenMax.to(this._sprite.material.uniforms.alpha, 2, {
      value: 0,
      onComplete: () => this.el.visible = false
    } as any)
  }
}