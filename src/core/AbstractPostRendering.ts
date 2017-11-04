import * as THREE from 'three'

import { vertexShaderPrecision, fragmentShaderPrecision } from '../core/shader'

export default abstract class AbstractPostRendering {
  protected _quad: THREE.Mesh

  public scene: THREE.Scene
  public camera: THREE.Camera

  public renderTargets: THREE.WebGLRenderTarget[]

  constructor(renderTargetsCount: number, width: number, height: number) {
    this.scene = new THREE.Scene()
    this.camera = new THREE.Camera()

    this.renderTargets = new Array(renderTargetsCount)

    for (let i = 0; i < this.renderTargets.length; ++i) {
      const renderTarget = new THREE.WebGLRenderTarget(width, height)
      renderTarget.texture.format = THREE.RGBFormat
      renderTarget.texture.minFilter = THREE.LinearFilter
      renderTarget.texture.magFilter = THREE.LinearFilter
      renderTarget.texture.generateMipmaps = false
      renderTarget.stencilBuffer = false
      renderTarget.depthBuffer = true

      this.renderTargets[i] = renderTarget
    }

    const postProcessGeometry = new THREE.PlaneBufferGeometry(2, 2)
    this._quad = new THREE.Mesh(postProcessGeometry, null)
    this.scene.add(this._quad)
  }

  public resize(width: number, height: number) {
    for (let i = 0; i < this.renderTargets.length; ++i) {
      this.renderTargets[i].setSize(width, height)
    }
  }

  public abstract render(renderer: THREE.WebGLRenderer, ...any);
}
