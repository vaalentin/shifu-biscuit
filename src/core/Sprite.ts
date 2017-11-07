import * as THREE from 'three'

import { vertexShaderPrecision, fragmentShaderPrecision } from './shader'

interface SpriteSettings {
  imagesPerRow: number
  imagesPerColumn: number
  imagesCount: number
  fps: number
}

export default class Sprite {
  private static _material = new THREE.RawShaderMaterial({
    vertexShader: `
    precision ${vertexShaderPrecision} float;

    attribute vec3 position;
    attribute vec2 uv;

    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;
    uniform vec2 scale;
    uniform vec2 offset;

    varying vec2 vUv;

    void main() {
      vUv = (uv * scale) + offset;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    fragmentShader: `
    precision ${fragmentShaderPrecision} float;

    uniform sampler2D texture;
    uniform float alpha;
    uniform vec3 tint;

    varying vec2 vUv;

    void main() {
      gl_FragColor = texture2D(texture, vUv);
      gl_FragColor.rgb *= tint;
      gl_FragColor.a *= alpha;
    }
    `,
    uniforms: {
      scale: { type: 'v2', value: new THREE.Vector2(1, 1) },
      offset: { type: 'v2', value: new THREE.Vector2(0, 0) },
      texture: { type: 't', value: null },
      alpha: { type: 'f', value: 1 },
      tint: { type: 'v3', value: new THREE.Vector3(0.4, 0.4, 0.4) }
    },
    transparent: true,
    depthTest: false,
    blending: THREE.AdditiveBlending
  })

  private _settings: SpriteSettings

  private _time: number
  private _timeStep: number

  private _column: number
  private _row: number

  public material: THREE.RawShaderMaterial

  public texture: THREE.Mesh

  constructor(imagegSrc: string, settings: SpriteSettings) {
    this._settings = settings

    this._time = 0
    this._timeStep = 1 / this._settings.fps

    this._column = 0
    this._row = 0

    this.material = Sprite._material.clone()
    this.material.uniforms.texture.value = new THREE.TextureLoader().load(
      imagegSrc
    )

    this._updateUniforms()
  }

  private _advanceColumn(): boolean {
    this._column++

    if (this._column >= this._settings.imagesPerRow) {
      this._column = 0

      return true
    }

    return false
  }

  private _advanceRow(): boolean {
    this._row++

    if (this._row >= this._settings.imagesPerColumn) {
      this._row = 0

      return true
    }

    return false
  }

  private _updateUniforms() {
    this.material.uniforms.scale.value.set(
      1 / this._settings.imagesPerRow,
      1 / this._settings.imagesPerColumn
    )
    this.material.uniforms.offset.value.set(
      this._column / this._settings.imagesPerColumn,
      1 -
        this._row / this._settings.imagesPerRow -
        1 / this._settings.imagesPerColumn
    )
  }

  public update(delta: number) {
    this._time += delta

    while (this._time > this._timeStep) {
      this._time -= this._timeStep

      if (this._advanceColumn()) {
        this._advanceRow()
      }

      this._updateUniforms()
    }
  }
}
