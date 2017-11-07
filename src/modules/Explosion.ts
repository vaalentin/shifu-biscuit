import * as THREE from 'three'
import { TimelineMax, Expo } from 'gsap'

import { vertexShaderPrecision, fragmentShaderPrecision } from '../core/shader'
import { map, random } from '../core/math'

export default class Explosion {
  private static _material = new THREE.RawShaderMaterial({
    vertexShader: `
    precision ${vertexShaderPrecision} float;
    
    attribute vec3 position;
    attribute vec2 uv;

    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;
    uniform vec3 color;
    uniform float scale;
    uniform float size;

    varying vec2 vUv;
    varying vec3 vColor;

    void main() {
      vUv = uv;
      vColor = color;

      // float a = smoothstep(progress - 0.3, progress + 0.3, uv.x);
      // vColor = vec3(a);

      vec3 finalPosition = position;
      finalPosition.x *= smoothstep(size, size + 0.5, uv.x);
      finalPosition.y *= scale;

      // finalPosition.y *= progress * uv.x + (progress);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPosition, 1.0);
    }
    `,
    fragmentShader: `
    precision ${fragmentShaderPrecision} float;

    varying vec2 vUv;
    varying vec3 vColor;

    void main() {
      gl_FragColor = vec4(vColor, 1.0);
    }
    `,
    uniforms: {
      color: { type: 'v3', value: new THREE.Vector3(1, 1, 1) },
      size: { type: 'f', value: 1 },
      scale: { type: 'f', value: 1 }
    },
    depthTest: false,
    depthWrite: false,
    transparent: true
  })

  private static _geometry: THREE.BufferGeometry

  private static _colors = [
    [233, 209, 178],
    [151, 102, 41],
    [208, 151, 77]
  ].concat(window.palette.extras.map(color => color.rgb))

  public el: THREE.Object3D

  private _materials: THREE.RawShaderMaterial[]

  constructor() {
    this.el = new THREE.Object3D()

    if (!Explosion._geometry) {
      const width = 1
      const height = 0.2

      const stepsX = 3

      const positions: number[] = []
      const uvs: number[] = []

      positions.push(0, 0, 0)
      uvs.push(0, 0.5)

      for (let i = 1; i < stepsX - 1; i++) {
        const x = map(i, 0, stepsX - 1, 0, 1)

        const j = map(i, 0, stepsX - 1, -0.6, 1)

        const h = (1 - Math.pow(Math.abs(j), 2)) * 0.1

        const u = map(i, 0, stepsX - 1, 0, 1)

        positions.push(x, -h, 0)
        uvs.push(u, 1)

        positions.push(x, h, 0)
        uvs.push(u, 0)
      }

      positions.push(1, 0, 0)
      uvs.push(1, 0.5)

      Explosion._geometry = new THREE.BufferGeometry()
      Explosion._geometry.addAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(positions), 3)
      )
      Explosion._geometry.addAttribute(
        'uv',
        new THREE.BufferAttribute(new Float32Array(uvs), 2)
      )
    }

    this._materials = []

    for (let i = 0; i < 12; i++) {
      const angle = map(i, 0, 10, 0, 2 * Math.PI)

      const material = Explosion._material.clone()

      let [r, g, b] = Explosion._colors[
        Math.floor(Math.random() * Explosion._colors.length)
      ]

      r /= 255
      g /= 255
      b /= 255

      material.uniforms.color.value.set(r, g, b)

      this._materials.push(material)

      const mesh = new THREE.Mesh(Explosion._geometry, material)
      mesh.drawMode = THREE.TriangleStripDrawMode
      mesh.position.x = 0

      const scale = random(0.5, 3)
      mesh.scale.set(scale, scale, 2)

      const parent = new THREE.Object3D()
      parent.rotation.z = angle + random(-0.3, 0.3)

      parent.add(mesh)

      this.el.add(parent)
    }
  }

  public explode(origin: THREE.Vector3, strength = 1) {
    this.el.visible = true

    this.el.position.copy(origin)

    const timeline = new TimelineMax({
      onComplete: () => (this.el.visible = false)
    })

    timeline.to(
      this.el.scale,
      0.5,
      {
        x: 2 * strength,
        y: 2 * strength,
        z: 2 * strength,
        ease: Expo.easeOut
      },
      0
    )

    for (let i = 0; i < this._materials.length; i++) {
      this._materials[i].uniforms.size.value = 1
      this._materials[i].uniforms.scale.value = 1

      const delay = random(0, 0.2)

      timeline.to(
        this._materials[i].uniforms.size,
        0.25,
        {
          value: 0,
          ease: Expo.easeOut
        },
        delay
      )

      timeline.to(
        this._materials[i].uniforms.scale,
        0.25,
        {
          value: 0
        },
        delay + 0.1
      )
    }
  }
}
