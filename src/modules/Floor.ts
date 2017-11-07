import * as THREE from 'three'

import { vertexColorMaterial } from './materials'

export default class Floor {
  public el: THREE.Mesh

  constructor() {
    const geometry = new THREE.PlaneBufferGeometry(20, 20)

    const colors = new Float32Array(4 * 3)

    let [r, g, b] = window.palette.background.rgb

    r /= 255
    g /= 255
    b /= 255

    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = r
      colors[i + 1] = g
      colors[i + 2] = b
    }

    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3))

    this.el = new THREE.Mesh(geometry, vertexColorMaterial)

    this.el.quaternion.setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      -Math.PI / 2
    )

    this.el.position.y = -0.2
  }
}
