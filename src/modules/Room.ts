import * as THREE from 'three'
import * as CANNON from 'cannon'

const ENABLE_HELPERS = false

export default class Room {
  public leftWallBody: CANNON.Body
  public rightWallBody: CANNON.Body
  public frontWallBody: CANNON.Body
  public backWallBody: CANNON.Body
  public floorBody: CANNON.Body

  public debugEl: THREE.Mesh

  constructor(sizeX = 2, sizeZ = 2) {
    const yAxis = new CANNON.Vec3(0, 1, 0)
    const xAxis = new CANNON.Vec3(1, 0, 0)

    this.leftWallBody = new CANNON.Body({ mass: 0 })
    this.leftWallBody.addShape(new CANNON.Plane())
    this.leftWallBody.quaternion.setFromAxisAngle(yAxis, Math.PI / 2)
    this.leftWallBody.position.set(-sizeX / 2, 0, 0)

    this.rightWallBody = new CANNON.Body({ mass: 0 })
    this.rightWallBody.addShape(new CANNON.Plane())
    this.rightWallBody.quaternion.setFromAxisAngle(yAxis, -Math.PI / 2)
    this.rightWallBody.position.set(sizeX / 2, 0, 0)

    this.backWallBody = new CANNON.Body({ mass: 0 })
    this.backWallBody.addShape(new CANNON.Plane())
    this.backWallBody.position.set(0, 0, -sizeZ / 2)

    this.frontWallBody = new CANNON.Body({ mass: 0 })
    this.frontWallBody.addShape(new CANNON.Plane())
    this.frontWallBody.quaternion.setFromAxisAngle(yAxis, Math.PI)
    this.frontWallBody.position.set(0, 0, sizeZ / 2)

    this.floorBody = new CANNON.Body({ mass: 0 })
    this.floorBody.addShape(new CANNON.Plane())
    this.floorBody.quaternion.setFromAxisAngle(xAxis, -Math.PI / 2)

    if (process.env.NODE_ENV === 'development' && ENABLE_HELPERS) {
      const geometry = new THREE.PlaneBufferGeometry(sizeX, sizeZ, 1, 1)
      const material = new THREE.MeshBasicMaterial({
        color: 'blue',
        wireframe: true,
        depthTest: false,
        depthWrite: false
      })

      this.debugEl = new THREE.Mesh(geometry, material)
      this.debugEl.quaternion.setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        -Math.PI / 2
      )
    }
  }
}
