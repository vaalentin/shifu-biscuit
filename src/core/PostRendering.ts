import * as THREE from 'three'

import { vertexShaderPrecision, fragmentShaderPrecision } from '../core/shader'

export default class PostRendering {
  public material: THREE.RawShaderMaterial

  public renderTargets: THREE.WebGLRenderTarget[]

  public scene: THREE.Scene
  public camera: THREE.Camera

  constructor(width: number, height: number) {
    this.material = new THREE.RawShaderMaterial({
      vertexShader: `
        precision ${vertexShaderPrecision} float;

        attribute vec3 position;
        attribute vec2 uv;

        varying vec2 vUv;

        void main() {
          vUv = uv;
          
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision ${fragmentShaderPrecision} float;
        
        uniform sampler2D texture;
        uniform vec2 blurAmmount;
        uniform vec2 resolution;

        varying vec2 vUv;

        vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
          vec4 color = vec4(0.0);
          vec2 off1 = vec2(1.3846153846) * direction;
          vec2 off2 = vec2(3.2307692308) * direction;
          color += texture2D(image, uv) * 0.2270270270;
          color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
          color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
          color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
          color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
          return color;
        }

        void main() {
          gl_FragColor = blur9(texture, vUv, resolution, blurAmmount);
        }
        `,
      uniforms: {
        texture: { type: 't', value: null },
        blurAmmount: { tyype: 'v2', value: new THREE.Vector2(2, 2)},
        resolution: { type: 'v2', value: new THREE.Vector2(width, height) }
      },
      depthTest: false
    })

    this.renderTargets = new Array(2)

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

    this.scene = new THREE.Scene()
    this.camera = new THREE.Camera()

    const postProcessGeometry = new THREE.PlaneBufferGeometry(2, 2)
    const postProcessQuad = new THREE.Mesh(postProcessGeometry, this.material)
    this.scene.add(postProcessQuad)
  }

  public resize(width: number, height: number) {
    for (let i = 0; i < this.renderTargets.length; ++i) {
      this.renderTargets[i].setSize(width, height)
    }
    
    this.material.uniforms.resolution.value.set(width, height)
  }

  public render(renderer: THREE.WebGLRenderer, blurAmmount: number) {
    // horizontal pass
    this.material.uniforms.texture.value = this.renderTargets[0].texture
    this.material.uniforms.blurAmmount.value.set(blurAmmount, 0)

    renderer.render(this.scene, this.camera, this.renderTargets[1])

    // vertical pass
    this.material.uniforms.texture.value = this.renderTargets[1].texture
    this.material.uniforms.blurAmmount.value.set(0, blurAmmount)

    renderer.render(this.scene, this.camera)
  }
}
