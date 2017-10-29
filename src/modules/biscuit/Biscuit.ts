import * as THREE from 'three'
import * as CANNON from 'cannon'

import Raycaster from '../../core/Raycaster'
import { GET } from '../../core/ajax'
import { random } from '../../core/math'

import BiscuitPiece from './BiscuitPiece'
import Shadow from '../Shadow'

export default class Biscuit {
  public el: THREE.Object3D

  public shadow: Shadow

  public material: THREE.RawShaderMaterial

  public body: CANNON.Body

  public pieces: BiscuitPiece[]

  public active: boolean

  constructor() {
    this.el = new THREE.Object3D()
    this.el.position.set(0, 2, 0)

    this.shadow = new Shadow(this.el, 0.7)

    this.body = new CANNON.Body({
      mass: 1
    })

    this.body.position.set(0, 2, 0)
    this.body.angularVelocity.set(
      random(-0.5, 0.5),
      random(-0.5, 0.5),
      random(-0.5, 0.5)
    )

    this.pieces = []

    new THREE.FileLoader().load(
      require<string>('../../models/biscuit.json'),
      response => {
        const { pieces } = JSON.parse(response)

        for (let i = 0; i < pieces.length; ++i) {
          const piece = new BiscuitPiece(pieces[i])
          this.el.add(piece.el)
          this.body.addShape(piece.boxShape, piece.boxShapeCenter)
          this.pieces.push(piece)
        }
      }
    )

    this.active = true
  }

  public update() {
    if (this.active) {
      this.shadow.update()

      const { position, quaternion } = this.body

      this.el.position.set(position.x, position.y, position.z)

      this.el.quaternion.set(
        quaternion.x,
        quaternion.y,
        quaternion.z,
        quaternion.w
      )
    }

    for (let i = 0; i < this.pieces.length; ++i) {
      this.pieces[i].update()
    }
  }

  public getPieceFromObject(object: THREE.Object3D): BiscuitPiece | null {
    for (let i = 0; i < this.pieces.length; ++i) {
      const piece = this.pieces[i]

      if (object === piece.el) {
        return piece
      }
    }

    return null
  }

  public removePiece(
    piece: BiscuitPiece,
    world: CANNON.World,
    scene: THREE.Scene,
    raycaster: Raycaster
  ) {
    if (piece.active) {
      return
    }

    const worldPosition = piece.el.getWorldPosition()

    this.el.remove(piece.el)
    scene.add(piece.el)

    piece.body.position.set(worldPosition.x, worldPosition.y, worldPosition.z)

    world.addBody(piece.body)
    scene.add(piece.shadow.el)
    raycaster.add(piece.el)

    piece.active = true
  }

  public bouncePiece(
    piece: BiscuitPiece,
    point: THREE.Vector3,
    direction: THREE.Vector2
  ) {
    piece.body.applyForce(
      new CANNON.Vec3(direction.x * 500, 500, -direction.y * 500),
      new CANNON.Vec3(point.x, point.y, point.z)
    )
  }

  public bounce(point: THREE.Vector3, direction: THREE.Vector2) {
    this.body.applyForce(
      new CANNON.Vec3(direction.x * 100, 100, -direction.y * 100),
      new CANNON.Vec3(point.x, point.y, point.z)
    )
  }

  public explode(
    world: CANNON.World,
    scene: THREE.Scene,
    raycaster: Raycaster
  ) {
    if (!this.active) {
      return
    }

    this.active = false

    world.remove(this.body)
    scene.remove(this.el)
    raycaster.remove(this.el)

    scene.remove(this.shadow.el)
    this.shadow.dispose()
    this.shadow = null

    for (let i = 0; i < this.pieces.length; ++i) {
      this.removePiece(this.pieces[i], world, scene, raycaster)
    }
  }
}
