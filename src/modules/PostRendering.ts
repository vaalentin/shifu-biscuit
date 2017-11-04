import * as THREE from 'three'

import { vertexShaderPrecision, fragmentShaderPrecision } from '../core/shader'
import AbstratPostRendering from '../core/AbstractPostRendering'

export default class PostRendering extends AbstratPostRendering {
  public blurMaterial: THREE.RawShaderMaterial

  public rgbShiftMaterial: THREE.RawShaderMaterial

  constructor(width: number, height: number) {
    super(2, width, height)

    this.blurMaterial = new THREE.RawShaderMaterial({
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
        blurAmmount: { tyype: 'v2', value: new THREE.Vector2(2, 2) },
        resolution: { type: 'v2', value: new THREE.Vector2(width, height) }
      },
      depthTest: false
    })

    this.rgbShiftMaterial = new THREE.RawShaderMaterial({
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
      uniform float rgbShiftAmount;
      uniform vec2 resolution;

      varying vec2 vUv;

      void main() {
        vec2 direction = vUv - vec2(0.5);
        float d = 0.7 * length(direction);
        normalize(direction);
        vec2 value = d * direction * vec2(rgbShiftAmount);
      
        vec4 c1 = texture2D(texture, vUv - value / resolution.x);
        vec4 c2 = texture2D(texture, vUv);
        vec4 c3 = texture2D(texture, vUv + value / resolution.y);
        
        gl_FragColor = vec4(c1.r, c2.g, c3.b, c1.a + c2.a + c3.b);
      }
      `,
      uniforms: {
        resolution: { type: 'v2', value: new THREE.Vector2(width, height) },
        texture: { type: 'f', value: null },
        rgbShiftAmount: { type: 'f', value: 0 }
      }
    })
  }

  public resize(width: number, height: number) {
    super.resize(width, height)

    this.blurMaterial.uniforms.resolution.value.set(width, height)
    this.rgbShiftMaterial.uniforms.resolution.value.set(width, height)
  }

  public render(renderer: THREE.WebGLRenderer, blurAmount: number, rgbShiftAmmount: number) {

    if (blurAmount !== 0) {
      // blur pass
      this._quad.material = this.blurMaterial
    
      // vertical blur
      this.blurMaterial.uniforms.texture.value = this.renderTargets[0].texture
      this.blurMaterial.uniforms.blurAmmount.value.set(blurAmount, 0)
  
      renderer.render(this.scene, this.camera, this.renderTargets[1])
  
      // horizontal blur
      this.blurMaterial.uniforms.texture.value = this.renderTargets[1].texture
      this.blurMaterial.uniforms.blurAmmount.value.set(0, blurAmount)

      if (rgbShiftAmmount !== 0) {
        renderer.render(this.scene, this.camera, this.renderTargets[0])
      }
    }

    if (rgbShiftAmmount !== 0) {
      // rgb shift pass
      this._quad.material = this.rgbShiftMaterial

      this.rgbShiftMaterial.uniforms.texture.value = this.renderTargets[0].texture
      this.rgbShiftMaterial.uniforms.rgbShiftAmount.value = rgbShiftAmmount
    }

    renderer.render(this.scene, this.camera)
  }
}