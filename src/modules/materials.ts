import * as THREE from 'three'

import {
  vertexShaderPrecision,
  fragmentShaderPrecision
} from '../core/shader'

export const vertexColorMaterial = new THREE.RawShaderMaterial({
  vertexShader: `
  precision ${vertexShaderPrecision} float;

  attribute vec3 position;
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

  uniform float contrast;
  uniform float brightness;
  uniform float saturation;

  varying vec3 vColor;

  vec3 getSaturation(vec3 rgb, float adjustment) {
      // Algorithm from Chapter 16 of OpenGL Shading Language
      const vec3 W = vec3(0.2125, 0.7154, 0.0721);
      vec3 intensity = vec3(dot(rgb, W));
      return mix(intensity, rgb, adjustment);
  }

  void main() {
    // gl_FragColor = vec4(vColor, 1.0);

    vec3 color = vColor;
    vec3 colorContrasted = (color) * contrast;
    vec3 bright = colorContrasted + vec3(brightness,brightness,brightness);
    gl_FragColor.rgb = getSaturation(bright, saturation);
    gl_FragColor.a = 1.;
  }
  `,
  side: THREE.DoubleSide,
  uniforms: {
    contrast: { type: 'f', value: 1 },
    brightness: { type: 'f', value: 0 },
    saturation: { type: 'f', value: 1 }
  }
})
