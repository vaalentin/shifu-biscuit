import * as THREE from 'three'
import { TweenMax, Expo, Elastic } from 'gsap'
import { GUI } from 'dat-gui'

import { vertexShaderPrecision, fragmentShaderPrecision } from '../core/shader'
import { random } from '../core/math'

export default class Paper3D {
  private static _paperMaterial = new THREE.RawShaderMaterial({
    vertexShader: `
    precision ${vertexShaderPrecision} float;
    
    attribute vec3 position;
    attribute vec2 uv;

    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;
    uniform float time;
    uniform float bend;

    uniform float progress;

    varying vec2 vUv;

    void main() {
      vUv = uv;

      vec3 finalPosition = position;
      finalPosition.y += sin(time * 2.0 + uv.x * 2.0) * 0.03;

      float x = -1.0 + uv.x * 2.0;
      
      finalPosition.y += (1.0 - pow(abs(x), 2.0)) * bend;
      finalPosition.x *= 1.0 - bend;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPosition, 1.0);
    }
    `,
    fragmentShader: `
    precision ${fragmentShaderPrecision} float;

    uniform sampler2D texture;

    varying vec2 vUv;

    void main() {
      gl_FragColor = texture2D(texture, vUv);
    }
    `,
    uniforms: {
      progress: { type: 'f', value: 0 },
      time: { type: 'f', value: 0 },
      bend: { type: 'f', value: 0 },
      texture: { type: 't', value: null }
    }
  })

  private static _particlesMaterial = new THREE.RawShaderMaterial({
    vertexShader: `
    precision ${vertexShaderPrecision} float;

    attribute vec3 position;

    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;

    void main() {
      gl_PointSize = 20.0;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    fragmentShader: `
    precision ${fragmentShaderPrecision} float;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float distance = length(coord);

      float alpha = smoothstep(0.5, 0.4, distance);

      gl_FragColor = vec4(vec3(1.0), alpha);
    }
    `,
    transparent: true,
    depthTest: false,
    depthWrite: false
  })

  public el: THREE.Object3D

  private _paperMaterial: THREE.RawShaderMaterial

  constructor() {
    this.el = new THREE.Object3D()
    this.el.visible = false

    const paperGeometry = new THREE.PlaneBufferGeometry(1, 1, 10, 10)

    this._paperMaterial = Paper3D._paperMaterial

    const paper = new THREE.Mesh(paperGeometry, this._paperMaterial)
    this.el.add(paper)

    const directions = new Float32Array(100 * 3)
    const positions = new Float32Array(100 * 3)
    
    for (let i = 0; i < positions.length; i += 3) {
      let directionX = random(-1, 1)
      let directionY = random(-1, 1)
      let directionZ = random(-1, 1)

      const directionLength = Math.sqrt(
        (directionX * directionX)
        + (directionY * directionY)
        + (directionZ * directionZ)
      )

      directions[i] = directionX / directionLength
      directions[i + 1] = directionY / directionLength
      directions[i + 2] = directionZ / directionLength

      positions[i] = random(-0.6, 0.6)
      positions[i + 1] = random(-0.2, 0.2)
      positions[i + 2] = 0
    }

    const particlesPositions = new THREE.BufferAttribute(positions, 3)

    const particlesGeometry = new THREE.BufferGeometry()
    particlesGeometry.addAttribute('position', particlesPositions)

    const particles = new THREE.Points(particlesGeometry, Paper3D._particlesMaterial)

    setInterval(() => {
      const positions = particlesPositions.array as number[]

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += directions[i] * 0.001
        positions[i + 1] += directions[i + 1] * 0.001
        positions[i + 2] += directions[i + 2] * 0.001
      }

      particlesPositions.needsUpdate = true
    }, 16)

    // this.el.add(particles)


    // const gui = new GUI()
    // gui.add(this._material.uniforms.bend, 'value').min(-1).max(1).name('bend')
  }

  private _getTexture(text: string, author: string): THREE.Texture {
    // 180

    const margin = 0
    const lineHeight = 64
    const maxCharactersPerLine = 60

    const lines = text.split('\n')
      .map(line => line.trim())
      .reduce((out, line) => {
        const lines = []

        while (line.length > maxCharactersPerLine) {
          lines.push(line.substr(0, maxCharactersPerLine))
          line = line.substr(maxCharactersPerLine)
        }

        if (line.length) {
          lines.push(line)
        }

        return out.concat(lines)
      }, [])

    const linesCount = lines.length + (author ? 1 : 0)

   

    const $canvas = document.createElement('canvas')

    this.el.scale.y = 0.1 * linesCount

    $canvas.width = 1024
    $canvas.height = (lineHeight * 1.1) * (linesCount)

    const ctx = $canvas.getContext('2d')

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, $canvas.width, $canvas.height)

    ctx.font = `${lineHeight}px serif`;
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#000'

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], $canvas.width / 2, lineHeight * (i), $canvas.width - 50);
    }

    // if (author) {
    //   ctx.font = '18px serif'
    //   ctx.textAlign = 'right'
      
    //   ctx.fillText(author, $canvas.width -50, 32 * (linesCount), $canvas.width - 50)
    // }

    const texture = new THREE.Texture($canvas)
    // texture.generateMipmaps = false
    texture.needsUpdate = true

    return texture
  }

  public setQuote(quote: { text: string, author: string}) {
    this._paperMaterial.uniforms.texture.value = this._getTexture(quote.text, quote.author)
  }

  public update(delta: number) {
    this._paperMaterial.uniforms.time.value += delta
  }

  public appear(origin: THREE.Vector3) {
    this.el.visible = true

    this.el.position.copy(origin)

    let angle = origin.angleTo(new THREE.Vector3(0, 1, 0))

    if (origin.x < 0) {
      angle *= -1
    }

    this.el.rotation.z = angle

    TweenMax.to(this.el.rotation, 3, {
      z: 0,
      ease: Expo.easeOut
    } as any)

    TweenMax.to(this.el.position, 3, {
      x: 0,
      y: 1,
      z: 0,
      ease: Elastic.easeOut.config(1, 0.5)
    } as any)

    this._paperMaterial.uniforms.bend.value = 0.5

    TweenMax.to(this._paperMaterial.uniforms.bend, 3, {
      value: 0,
      ease: Elastic.easeOut.config(1, 0.5)
    } as any)
  }
}
