import * as THREE from 'three'

import { vertexColorMaterial } from './materials'

export default class Floor {
  public el: THREE.Mesh

  constructor() {
    const geometry = new THREE.PlaneBufferGeometry(10, 10)

    geometry.addAttribute(
      'color',
      new THREE.BufferAttribute(
        new Float32Array([
          0.5,
          0.5,
          1.0,
          0.5,
          0.5,
          1.0,
          0.5,
          0.5,
          1.0,
          0.5,
          0.5,
          1.0
        ]),
        3
      )
    )

    this.el = new THREE.Mesh(geometry, vertexColorMaterial)

    this.el.quaternion.setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      -Math.PI / 2
    )
  }
}
