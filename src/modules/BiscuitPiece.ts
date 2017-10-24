import * as THREE from 'three'
import * as CANNON from 'cannon'

import { vertexShaderPrecision, fragmentShaderPrecision } from '../core/shader'

import Shadow from './Shadow'

const BODY_BOUNDING_BOX_REDUCTION = 0.5

interface BufferData {
  type: string
  itemSize: number
  array: number[]
}

interface BiscuitPieceData {
  id: string
  position: { x: number, y: number, z: number }
  shadowSize: number
  attributes: {
    position: BufferData
    normal: BufferData
    color: BufferData
  }
  index: BufferData
}

export default class BiscuitPiece {
  private static _material = new THREE.RawShaderMaterial({
    vertexShader: `
    precision ${vertexShaderPrecision} float;

    attribute vec3 position;
    attribute vec2 uv;
    attribute vec3 color;

    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;

    varying vec3 vColor;

    void main() {
      vColor = color;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    fragmentShader: `
    precision ${fragmentShaderPrecision} float;

    varying vec3 vColor;

    void main() {
      gl_FragColor = vec4(vColor, 1.0);
    }
    `,
    side: THREE.DoubleSide
  })

  public el: THREE.Mesh

  public shadow: Shadow

  public body: CANNON.Body

  public boxShape: CANNON.Box

  public boxShapeCenter: CANNON.Vec3

  public active: boolean

  constructor(data: BiscuitPieceData) {
    const geometry = new THREE.BufferGeometry()

    const { color, position, normal } = data.attributes

    geometry.addAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(position.array), 3)
    )

    geometry.addAttribute(
      'normal',
      new THREE.BufferAttribute(new Float32Array(normal.array), 3)
    )

    geometry.addAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(color.array), 3)
    )

    const { index } = data

    geometry.setIndex(
      new THREE.BufferAttribute(new Uint16Array(index.array), 1)
    )

    this.el = new THREE.Mesh(geometry, BiscuitPiece._material)

    const { shadowSize } = data

    this.shadow = new Shadow(this.el, shadowSize)

    const { x, y, z } = data.position

    this.el.position.set(x, y, z)

    this.body = new CANNON.Body({
      mass: 2
    })

    this.body.position.set(x, y, z)

    geometry.computeBoundingBox()

    const boundingBoxCenter = geometry.boundingBox.getCenter()
    const boundingBoxSize = geometry.boundingBox.getSize()

    this.boxShape = new CANNON.Box(
      new CANNON.Vec3(
        boundingBoxSize.x * BODY_BOUNDING_BOX_REDUCTION,
        boundingBoxSize.y * BODY_BOUNDING_BOX_REDUCTION,
        boundingBoxSize.z * BODY_BOUNDING_BOX_REDUCTION
      )
    )

    this.boxShapeCenter = new CANNON.Vec3(
      boundingBoxCenter.x,
      boundingBoxCenter.y,
      boundingBoxCenter.z
    )

    this.body.addShape(this.boxShape, this.boxShapeCenter)

    this.active = false
  }

  public update() {
    if (!this.active) {
      return
    }

    this.shadow.update()

    const { position, quaternion } = this.body

    this.el.position.set(
      position.x,
      position.y,
      position.z
    )

    this.el.quaternion.set(
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w
    )
  }
}