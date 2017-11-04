// import * as THREE from 'three';
// import {TweenMax} from 'gsap';

// const spriteMaterial = new THREE.RawShaderMaterial({
//   vertexShader: `
//     precision highp float;

//     attribute vec3 position;
//     attribute vec2 uv;

//     uniform mat4 projectionMatrix;
//     uniform mat4 modelViewMatrix;
//     uniform vec2 offset;
//     uniform vec2 scale;
//     uniform vec2 padding;

//     varying vec2 vUv;

//     void main() {
//       /**
//        * in order
//        * - scale (uv *= scale)
//        * - remove the padding (uv *= 1.0 - padding)
//        * - add padding.y (uv.y += padding.y)
//        *   our pictures start from the top, padding is at the bottom.
//        * - apply offset (uv -= offset)
//        */
//       vUv = ((uv * scale) * (1.0 - padding) + vec2(0.0, padding.y)) - offset;

//       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//     }
//   `,
//   fragmentShader: `
//     precision highp float;

//     uniform sampler2D diffuseTexture;
//     uniform sampler2D alphaTexture;
//     uniform float alphaStrength;

//     varying vec2 vUv;

//     void main() {
//       vec4 diffuse = texture2D(diffuseTexture, vUv);
//       vec4 alpha = texture2D(alphaTexture, vUv);

//       diffuse.a = mix(diffuse.a, alpha.r, alphaStrength);

//       gl_FragColor = diffuse;
//     }
//   `,
//   uniforms: {
//     diffuseTexture: {type: 't', value: null},
//     alphaTexture: {type: 't', value: null},
//     alphaStrength: { type: 'f', value: 0},
//     offset: {type: 'v2', value: new THREE.Vector2(0, 0)},
//     scale: {type: 'v2', value: new THREE.Vector2(0, 0)},
//     padding: {type: 'v2', value: new THREE.Vector2(0, 0)}
//   },
//   side: THREE.DoubleSide,
//   transparent: true
// });

// export default class Sprite {
//   /**
//    * interface Options {
//    *    fps:int = 30;
//    *    sheets:Array<Sheet> = [];
//    *    loop:boolean = false;
//    *    hotspot:boolean;
//    *    waitingTime:float; // time between loops
//    *    depthTest:boolean = true;
//    * }
//    *
//    * interface Sheet {
//    *    diffuseTexture?:THREE.Texture;
//    *    alphaTexture?:THREE.Texture;
//    *    src:string;
//    *    alpha?:string;
//    *    imagesPerRow:int;
//    *    imagesPerColumn:int;
//    *    total:int;
//    *    paddingX:float = 0;
//    *    paddingY:float = 0;
//    * }
//    *
//    * @param {Options} options
//    */
//   constructor(options) {
//     this.isGlitch = options.glitch === void 0 ? false : options.glitch;

//     if (this.isGlitch) {
//       this.material = spriteGlitchMaterial.clone();
//       this.material.uniforms.noiseTexture.value = noiseTexture;

//       this.glitchAnimation = this.getGlitchAnimation();

//       const glitchInterval = (Math.random() * 4) + 6; // interval between 2 and 4 seconds

//       this.glitchInterval = glitchInterval;
//       this.glitchTime = Math.random() * glitchInterval; // time offset over the interval
//     }
//     else {
//       this.material = spriteMaterial.clone();
//     }

//     if (options.depthTest !== void 0) {
//       this.material.depthTest = options.depthTest;
//       this.material.needsUpdate = true;
//     }

//     this.sheets = options.sheets || [];

//     this.hasTriggered = false;

//     this.shouldLoop = options.loop === void 0 ? false : options.loop;
//     this.waitingTime = options.waitingTime === void 0 ? 0 : options.waitingTime;

//     this.currentLoop = 0;
//     this.loopsCount = -1;

//     this.totalAbsoluteFrames = 0;
//     this.currentAbsoluteFrame = 0;

//     for (let i = 0; i < this.sheets.length; ++i) {
//       const sheet = this.sheets[i];

//       this.totalAbsoluteFrames += sheet.total;

//       if (sheet.paddingX === void 0) {
//         sheet.paddingX = 0;
//       }

//       if (sheet.paddingY === void 0) {
//         sheet.paddingY = 0;
//       }

//       if(sheet.diffuseTexture === void 0) {
//         sheet.diffuseTexture = textureLoader.load(sheet.src);
//       }

//       sheet.diffuseTexture.minFilter = sheet.diffuseTexture.magFilter = THREE.LinearFilter;
//       sheet.diffuseTexture.wrapS = sheet.diffuseTexture.wrapT = THREE.ClampToEdgeWrapping;
//       sheet.diffuseTexture.generateMipmaps = false;

//       if (sheet.alpha) {
//         if (sheet.alphaTexture === void 0) {
//           sheet.alphaTexture = textureLoader.load(sheet.alpha);
//         }

//         sheet.alphaTexture.minFilter = sheet.alphaTexture.magFilter = THREE.LinearFilter;
//         sheet.alphaTexture.wrapS = sheet.alphaTexture.wrapT = THREE.ClampToEdgeWrapping;
//         sheet.alphaTexture.generateMipmaps = false;
//       }
//     }

//     this.isRunning = false;

//     this.currentSheet = 0;
//     this.currentRow = 0;
//     this.currentColumn = 0;
//     this.currentTime = 0;
//     this.currentFrame = 0;

//     this.setFps(options.fps || 30);
//     this.updateTexture();
//     this.updateOffset();
//   }

//   /**
//    * Advance to the next column, returns true if the row needs to be updated.
//    *
//    * @returns {boolean}
//    */
//   advanceColumn() {
//     this.currentColumn++;

//     if (this.currentColumn >= this.sheets[this.currentSheet].imagesPerRow) {
//       this.currentColumn = 0;

//       return true;
//     }

//     return false;
//   }

//   /**
//    * Advance to the next row, returns true if the column needs to be updated.
//    *
//    * @returns {boolean}
//    */
//   advanceRow() {
//     this.currentRow++;

//     if (this.currentRow >= this.sheets[this.currentSheet].imagesPerColumn) {
//       this.currentRow = 0;

//       return true;
//     }

//     return false;
//   }

//   /**
//    * Advance to the next sheet if needed, returns true if the sheets needs to be updated.
//    *
//    * @returns {boolean}
//    */
//   advanceSheet() {
//     if (this.currentFrame >= this.sheets[this.currentSheet].total) {
//       this.currentSheet++;

//       if (this.currentSheet > this.sheets.length - 1) {
//         this.currentSheet = 0;
//       }

//       this.currentColumn = 0;
//       this.currentRow = 0;
//       this.currentFrame = 0;

//       return true;
//     }

//     return false;
//   }

//   /**
//    * Update active textures.
//    */
//   updateTexture() {
//     const sheet = this.sheets[this.currentSheet];

//     this.material.uniforms.scale.value.set(1 / sheet.imagesPerRow, 1 / sheet.imagesPerColumn);
//     this.material.uniforms.padding.value.set(sheet.paddingX, sheet.paddingY);
//     this.material.uniforms.diffuseTexture.value = sheet.diffuseTexture;
//     this.material.uniforms.alphaTexture.value = sheet.alphaTexture;
//     this.material.uniforms.alphaStrength.value = sheet.alphaTexture ? 1 : 0;
//   }

//   /**
//    * Update current textures offset.
//    */
//   updateOffset() {
//     const sheet = this.sheets[this.currentSheet];

//     const offsetX = -this.currentColumn * ((1-sheet.paddingX) / (sheet.imagesPerRow));
//     const offsetY = -((1-sheet.paddingY) - ((1-sheet.paddingY) / sheet.imagesPerColumn)) + (this.currentRow * ((1-sheet.paddingY) / sheet.imagesPerColumn));

//     this.material.uniforms.offset.value.set(offsetX, offsetY);
//   }

//   /**
//    * @param {float} delta
//    */
//   update(delta) {
//     if (this.isGlitch) {
//       let newTime = this.material.uniforms.time.value + delta

//       if (newTime > 10) {
//         newTime = 0
//       }

//       this.material.uniforms.time.value = newTime;
//     }

//     if (!this.isRunning) {
//       return;
//     }

//     this.currentTime += delta;

//     while (this.currentTime > this.timePerFrame) {
//       this.currentTime -= this.timePerFrame;

//       if (this.advanceColumn()) {
//         this.advanceRow();
//       }

//       this.currentFrame++;
//       this.currentAbsoluteFrame++;

//       if (this.currentAbsoluteFrame >= this.totalAbsoluteFrames - 1) {
//         if (this.loopsCount !== -1) {
//           this.currentLoop++;  

//           if (this.currentLoop === this.loopsCount) {
//             this.currentAbsoluteFrame = -1;
//             this.stop();
//           }
//         }
//         else if (!this.shouldLoop) {
//           this.currentAbsoluteFrame = -1;
//           this.stop();
//         }
//         else if (this.waitingTime){
//           this.currentAbsoluteFrame = -1;
//           this.stop();

//           setTimeout(() => {
//             this.start();
//           }, this.waitingTime);
//         }
//       }

//       if (this.advanceSheet()) {
//         this.updateTexture();
//       }

//       this.updateOffset();
//     }
//   }

//   /**
//    * Flag the sprite to be updated.
//    *
//    * @param {int} loopsCount amount of the time the sprite should loop before stoping.
//    */
//   start(loopsCount = -1) {
//     if (this.shouldLoop) {
//       this.currentLoop = 0;
//       this.loopsCount = loopsCount;
//     }
    
//     this.isRunning = true;
//   }

//   /**
//    * Stop further updates
//    */
//   stop() {
//     this.isRunning = false;
//   }

//   /**
//    * Set the sprite back in his startin state.
//    */
//   reset() {
//     this.currentAbsoluteFrame = 0;

//     this.currentSheet = 0;
//     this.currentRow = 0;
//     this.currentColumn = 0;
//     this.currentFrame = 0;

//     this.updateTexture();
//     this.updateOffset();
//   }

//   /**
//    * Update animation speed.
//    *
//    * @param {float} fps
//    */
//   setFps(fps) {
//     this.timePerFrame = 1 / fps;
//   }

//   /**
//    * @param {float} value
//    */
//   setGlitchGrain(value) {
//     this.material.uniforms.grainIntensity.value = value;
//   }

//   /**
//    * @param {float} speed
//    * @param {float} count
//    * @param {float} amplitude
//    */
//   setGlitchSplits(speed, count, amplitude) {
//     this.material.uniforms.splitsSpeed.value = speed;
//     this.material.uniforms.splitsCount.value = count;
//     this.material.uniforms.splitsAmplitude.value = amplitude;
//   }

//   /**
//    * @param {float} amount
//    * @param {float} offsetX
//    * @param {float} offsetY
//    */
//   setGlitchRgbShift(amount, offsetX, offsetY) {
//     this.material.uniforms.rgbShiftAmount.value = amount;
//     this.material.uniforms.rgbShiftOffset.value.set(offsetX, offsetY);
//   }

//   /**
//    * @returns {TimelineMax}
//    */
//   getGlitchAnimation() {
//     const timeline = new TimelineMax({
//       onComplete: () => {
//         timeline.seek(0);
//         timeline.pause();
//       },
//       paused: true
//     });

//     const grainTimeline = new TimelineMax();
//     timeline.add(grainTimeline, 0);
//     grainTimeline.call(this.setGlitchGrain, [1], this, '+=0.1');
//     grainTimeline.call(this.setGlitchGrain, [0], this, '+=0.05');
//     grainTimeline.call(this.setGlitchGrain, [0.6], this, '+=0.05');
//     grainTimeline.call(this.setGlitchGrain, [0], this, '+=0.1');
//     grainTimeline.call(this.setGlitchGrain, [0.5], this, '+=0.65');
//     grainTimeline.call(this.setGlitchGrain, [0], this, '+=0.1');

//     const splitsTimeline = new TimelineMax();
//     timeline.add(splitsTimeline, 0);
//     splitsTimeline.call(this.setGlitchSplits, [1.8, 6, -0.015], this, 0);
//     splitsTimeline.call(this.setGlitchSplits, [0, 0, 0], this, '+=1');

//     const rgbShiftTimeline = new TimelineMax();
//     timeline.add(rgbShiftTimeline, 0);
//     rgbShiftTimeline.call(this.setGlitchRgbShift, [1, 0.5, 0.56], this, 0);
//     rgbShiftTimeline.call(this.setGlitchRgbShift, [0, 0.51, 0.56], this, '+=0.1');
//     rgbShiftTimeline.call(this.setGlitchRgbShift, [0.8, 0.56, 0.5], this, '+=0.2');
//     rgbShiftTimeline.call(this.setGlitchRgbShift, [0, 0.5, 0.5], this, '+=0.7');

//     return timeline;
//   }

//   /**
//    * Start the glitch effect.
//    */
//   glitch() {
//     if (!this.isGlitch) {
//       return;
//     }

//     this.glitchAnimation.play();
//   }

//   dispose() {
//     for (let i = 0; i < this.sheets.length; ++i) {
//       const sheet = this.sheets[i];

//       sheet.diffuseTexture.dispose();

//       if (sheet.diffuseTexture.mipmaps && sheet.diffuseTexture.data) {
//         sheet.diffuseTexture.mipmaps.data = null;
//       }

//       sheet.diffuseTexture.mipmaps = null;
//       sheet.diffuseTexture = null;

//       if (sheet.alphaTexture) {
//         sheet.alphaTexture.dispose();

//         if (sheet.alphaTexture.mipmaps && sheet.alphaTexture.data) {
//           sheet.alphaTexture.mipmaps.data = null;
//         }

//         sheet.alphaTexture.mipmaps = null;
//         sheet.alphaTexture = null;
//       }
//     }

//     this.material.dispose();

//     if (this.glitchAnimation !== void 0) {
//       this.glitchAnimation.kill();
//       this.glitchAnimation = null;
//     }
//   }
// }
