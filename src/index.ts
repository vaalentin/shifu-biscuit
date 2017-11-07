/// <reference path="./definitions.d.ts" />

import * as THREE from 'three'
import * as CANNON from 'cannon'
import { TweenMax, TimelineMax } from 'gsap'

import Features from './core/Features'
import Raycaster from './core/Raycaster'
import { fileLoader } from './core/Loaders'
import { map, random } from './core/math'
import Tracking from './core/Tracking'

import { vertexColorMaterial } from './modules/materials'
import PreRendering from './modules/PreRendering'
import PostRendering from './modules/PostRendering'
import Introduction from './modules/Introduction'
import Floor from './modules/Floor'
import Room from './modules/Room'
import Biscuit from './modules/biscuit/Biscuit'
import BiscuitPiece from './modules/biscuit/BiscuitPiece'
import Paper2D from './modules/Paper2D'
import Confettis from './modules/Confettis'
import Explosion from './modules/Explosion'
import Slicer from './modules/slicer/Slicer'
import Sounds from './modules/Sounds'
import Smoke from './modules/Smoke'
import About from './modules/About'
import AnimatedText from './modules/AnimatedText'

require<string>('./images/facebook.png?uncached')
require<string>('./images/twitter.png?uncached')

const SKIP_INTRODUCTION = false
const PLAY_SOUNDS = true
const STRAIGHT_TO_PAPER = false

const HITS = random(2, 5, true)
const BREAK_HITS = random(1, 3, true)

class App {
  private _$about: HTMLElement

  private _world: CANNON.World

  private _renderer: THREE.WebGLRenderer

  private _preRendering: PreRendering
  private _postRendering: PostRendering
  private _raycaster: Raycaster

  private _clock: THREE.Clock

  private _introduction: Introduction
  private _floor: Floor
  private _room: Room
  private _biscuit: Biscuit
  private _paper: Paper2D
  private _confettis: Confettis
  private _explosion: Explosion
  private _slicer: Slicer
  private _smoke: Smoke
  private _about: About

  private _paperButton: AnimatedText
  private _aboutButton: AnimatedText
  private _closeButton: AnimatedText

  private _hitCount: number

  private _blurAmmount: number
  private _rgbShiftAmmount: number

  private _isActive: boolean
  private _isAboutOpen: boolean
  private _isPaperOpen: boolean
  private _isBiscuitExploded: boolean

  private _canSlice: boolean
  private _canPlaySliceSound: boolean

  private _sliceMousePosition: THREE.Vector2
  private _sliceDirection: THREE.Vector2

  constructor() {
    this._$about = document.querySelector('.footer__link') as HTMLElement

    this._world = new CANNON.World()
    this._world.gravity.set(0, -9.82, 0)
    this._world.broadphase = new CANNON.NaiveBroadphase()

    const { innerWidth: width, innerHeight: height } = window

    this._renderer = new THREE.WebGLRenderer({
      antialias: true
    })

    this._renderer.autoClear = false

    this._renderer.setClearColor(window.palette.background.hex, 1)

    this._renderer.setPixelRatio(window.devicePixelRatio || 1)
    this._renderer.setSize(width, height)
    document.body.appendChild(this._renderer.domElement)

    this._preRendering = new PreRendering(width, height)
    const cameraPosition = map(width / height, 0.5, 1, 5, 2)
    this._preRendering.camera.position.set(0, cameraPosition, cameraPosition)
    this._preRendering.camera.userData.lookAt = new THREE.Vector3(0, 0, 0)
    this._preRendering.camera.lookAt(this._preRendering.camera.userData.lookAt)

    this._postRendering = new PostRendering(width, height)

    this._raycaster = new Raycaster(this._renderer.domElement)

    this._clock = new THREE.Clock()

    this._introduction = new Introduction()

    this._floor = new Floor()
    this._preRendering.scene.add(this._floor.el)

    this._room = new Room(2, 2)
    this._world.addBody(this._room.floorBody)
    this._world.addBody(this._room.leftWallBody)
    this._world.addBody(this._room.rightWallBody)
    this._world.addBody(this._room.backWallBody)
    this._world.addBody(this._room.frontWallBody)

    this._biscuit = new Biscuit()
    this._preRendering.scene.add(this._biscuit.el)
    this._preRendering.scene.add(this._biscuit.shadow.el)
    this._world.addBody(this._biscuit.body)
    this._raycaster.add(this._biscuit.el)

    this._paper = new Paper2D(width, height)

    this._confettis = new Confettis(200)
    this._preRendering.scene.add(this._confettis.confettis)
    this._preRendering.scene.add(this._confettis.shadows)

    const confettisSize = map(width / height, 0.5, 1, 0.5, 1)
    this._confettis.confettisMaterial.uniforms.sizeAttenuation.value = confettisSize
    this._confettis.shadowsMaterial.uniforms.sizeAttenuation.value = confettisSize

    this._explosion = new Explosion()
    this._preRendering.scene.add(this._explosion.el)

    this._slicer = new Slicer(this._renderer.domElement, {
      pointsCount: 8,
      maximumPoints: 12,
      minimumDistanceBetweenPoints: 50,
      maximumDistanceBetweenPoints: 100,
      minimumDistance: 40
    })

    this._preRendering.scene.add(this._slicer.el)

    this._smoke = new Smoke()
    this._preRendering.scene.add(this._smoke.el)

    this._about = new About()
    document.body.appendChild(this._about.$el)

    this._paperButton = new AnimatedText(
      'Show me my quote!',
      [],
      ['header__button']
    )
    TweenMax.set(this._paperButton.$el, { display: 'none' })
    document.body.appendChild(this._paperButton.$el)

    this._aboutButton = new AnimatedText('About', [], ['footer__button'])
    TweenMax.set(this._aboutButton.$el, { display: 'none' })
    document.body.appendChild(this._aboutButton.$el)

    this._closeButton = new AnimatedText('Close', [], ['footer__button'])
    TweenMax.set(this._closeButton.$el, { display: 'none' })
    document.body.appendChild(this._closeButton.$el)

    this._hitCount = 0

    this._blurAmmount = 0
    this._rgbShiftAmmount = 0

    this._isActive = false
    this._isAboutOpen = false
    this._isPaperOpen = false
    this._isBiscuitExploded = false

    this._canSlice = true
    this._canPlaySliceSound = true

    this._sliceMousePosition = new THREE.Vector2(0, 0)
    this._sliceDirection = new THREE.Vector2(0, 0)

    this._bindMethods()
    this._addListeners()

    window.requestAnimationFrame(this._update)

    if (SKIP_INTRODUCTION) {
      this._introduction.dispose()
      this._start()
    }

    if (STRAIGHT_TO_PAPER) {
      TweenMax.delayedCall(1, () => {
        this._showPaper()
      })
    }

    fileLoader.load(require<string>('./data.json?uncached'), response => {
      const { quotes } = JSON.parse(response)

      const quote = quotes[Math.floor(Math.random() * quotes.length)] as {
        text: string
        author: string
      }

      this._paper.setQuote(quote)
    })
  }

  private _bindMethods() {
    this._showPaper = this._showPaper.bind(this)
    this._handleAboutClick = this._handleAboutClick.bind(this)
    this._handleCloseClick = this._handleCloseClick.bind(this)
    this._update = this._update.bind(this)
    this._handleResize = this._handleResize.bind(this)
    this._handleSliceUpdate = this._handleSliceUpdate.bind(this)
    this._handleSliceEnd = this._handleSliceEnd.bind(this)
    this._handleRaycast = this._handleRaycast.bind(this)
    this._handleLoadProgress = this._handleLoadProgress.bind(this)
    this._handlePaperClose = this._handlePaperClose.bind(this)
  }

  private _addListeners() {
    this._paperButton.$el.addEventListener('click', this._showPaper)
    this._aboutButton.$el.addEventListener('click', this._handleAboutClick)
    this._closeButton.$el.addEventListener('click', this._handleCloseClick)
    window.addEventListener('resize', this._handleResize)
    this._slicer.onSliceUpate.add(this._handleSliceUpdate)
    this._slicer.onSliceEnd.add(this._handleSliceEnd)
    this._raycaster.onCast.add(this._handleRaycast)
    THREE.DefaultLoadingManager.onProgress = this._handleLoadProgress
    this._paper.animatedText.$el.addEventListener(
      'click',
      this._handlePaperClose
    )
  }

  private _handleLoadProgress(url: number, loaded: number, total: number) {
    if (SKIP_INTRODUCTION) {
      return
    }

    TweenMax.delayedCall(2, () => {
      const onComplete =
        loaded === total ? this._handleLoadComplete.bind(this) : null

      this._introduction.setProgress(loaded / total, onComplete)
    })
  }

  private _handleLoadComplete() {
    this._introduction.hideLoader()
    this._introduction.displayIntro()

    this._introduction.onStart.add(() => {
      this._introduction.hideIntro()
      this._introduction = null
      Sounds.startBackground()
      this._start()
    })
  }

  private _handleResize() {
    const { innerWidth: width, innerHeight: height } = window

    const cameraPosition = map(width / height, 0.5, 1, 5, 2)
    this._preRendering.camera.position.y = cameraPosition
    this._preRendering.camera.position.z = cameraPosition
    this._preRendering.camera.lookAt(new THREE.Vector3(0, 0, 0))

    const confettisSize = map(width / height, 0.5, 1, 0.5, 1)
    this._confettis.confettisMaterial.uniforms.sizeAttenuation.value = confettisSize
    this._confettis.shadowsMaterial.uniforms.sizeAttenuation.value = confettisSize

    this._renderer.setSize(width, height)

    this._preRendering.resize(width, height)
    this._postRendering.resize(width, height)

    this._paper.resize(width, height)

    this._slicer.resize()
  }

  private _handleSliceUpdate({ direction, rayCastPoints }) {
    if (!this._canSlice) {
      return
    }

    if (PLAY_SOUNDS && this._canPlaySliceSound) {
      Sounds.slice()
      this._canPlaySliceSound = false
    }

    this._sliceDirection.copy(direction)

    for (let i = 0; i < rayCastPoints.length; i += 2) {
      const x = rayCastPoints[i]
      const y = rayCastPoints[i + 1]

      this._sliceMousePosition.set(x, y)

      if (
        this._raycaster.cast(
          this._preRendering.camera,
          this._sliceMousePosition
        )
      ) {
        return (this._canSlice = false)
      }
    }
  }

  private _handleSliceEnd() {
    this._canSlice = true
    this._canPlaySliceSound = true
  }

  private _handleRaycast(interestion: THREE.Intersection) {
    if (!this._canSlice) {
      return
    }

    const { point, object } = interestion

    this._confettis.explode(point)

    let piece: BiscuitPiece

    if (this._hitCount < HITS) {
      if (PLAY_SOUNDS) {
        Sounds.hit()
      }

      this._shakeCamera(10)

      this._biscuit.bounce(point, this._sliceDirection)

      this._hitCount++
    } else if (this._hitCount < HITS + BREAK_HITS) {
      this._shakeCamera(10)

      piece = this._biscuit.getPieceFromObject(object)

      if (!piece || !piece.active) {
        this._hitCount++
      }
    } else {
      piece = this._biscuit.getPieceFromObject(object)

      if (!piece || !piece.active) {
        if (PLAY_SOUNDS) {
          Sounds.explode()
        }

        this._shakeCamera(10, 0.2, 0.2, 0.05, 0, 200, 1, 1)

        this._explosion.explode(point)
        this._smoke.explode(point)

        this._isBiscuitExploded = true

        TweenMax.to(this, 1, {
          _rgbShiftAmmount: 300
        } as any)

        Tracking.trackEvent({
          category: 'biscuit',
          action: 'explode',
          value: this._hitCount
        })

        this._biscuit.explode(
          this._world,
          this._preRendering.scene,
          this._raycaster
        )

        this._showPaper()

        for (let i = 0; i < this._biscuit.pieces.length; i++) {
          const piece = this._biscuit.pieces[i]

          piece.body.applyForce(
            new CANNON.Vec3(random(-1000, 1000), -500, random(-1000, 1000)),
            new CANNON.Vec3(
              piece.el.position.x,
              piece.el.position.y,
              piece.el.position.z
            )
          )
        }
      } else {
        this._shakeCamera(10)
      }
    }

    if (piece) {
      if (piece.active) {
        if (PLAY_SOUNDS) {
          Sounds.hit()
        }

        this._biscuit.bouncePiece(piece, point, this._sliceDirection)
      } else {
        if (PLAY_SOUNDS) {
          Sounds.break()
        }

        this._biscuit.removePiece(
          piece,
          this._world,
          this._preRendering.scene,
          this._raycaster
        )
      }
    }
  }

  private _start() {
    this._isActive = true

    TweenMax.delayedCall(1.5, () => {
      this._aboutButton.animateIn()
    })
  }

  private _shakeCamera(
    steps: number = 20,
    amplitudeX = 0.1,
    amplitudeZ = 0.01,
    duration = 0.05,
    endBlur = 0,
    endRgbShift = 0,
    blurStrength = 1,
    rgbShiftStrength = 0.2
  ) {
    const timeline = new TimelineMax({
      onComplete: () => {
        this._preRendering.camera.lookAt(new THREE.Vector3(0, 0, 0))

        this._blurAmmount = endBlur

        this._rgbShiftAmmount = endRgbShift
      }
    })

    const rotation = this._preRendering.camera.rotation.clone()

    let time = 0

    for (var i = 0; i < steps; i++) {
      const d = Math.random() * duration

      timeline.to(
        this._preRendering.camera.rotation,
        d,
        {
          z: rotation.z + random(-amplitudeX, amplitudeX),
          y: rotation.y + random(-amplitudeZ, amplitudeZ)
        },
        time
      )

      timeline.to(
        this,
        d,
        {
          _blurAmmount: random(2, 4) * blurStrength
        },
        time
      )

      timeline.to(
        this,
        d,
        {
          _rgbShiftAmmount: random(200, 500) * rgbShiftStrength
        },
        time
      )

      time += d
    }
  }

  private _showPaper() {
    if (this._isAboutOpen || this._isPaperOpen) {
      return
    }

    Sounds.fadeOutBackground()

    this._isPaperOpen = true

    const { width, height } = this._renderer.domElement

    this._paperButton.animateOut(true)

    this._aboutButton.animateOut(true)

    TweenMax.to(vertexColorMaterial.uniforms.saturation, 1, {
      value: 0.3
    } as any)

    TweenMax.to(vertexColorMaterial.uniforms.contrast, 1, {
      value: 0.3
    } as any)

    TweenMax.to(this, 1, {
      _blurAmmount: 2,
      _rgbShiftAmmount: 200
    } as any)

    Sounds.start()

    // get screen position from biscuit 3d position
    // https://stackoverflow.com/questions/27409074/converting-3d-position-to-2d-screen-position-r69
    const point = new THREE.Vector3().copy(this._biscuit.el.position)
    const vector = point.project(this._preRendering.camera)

    vector.x = (vector.x + 1) / 2 * width
    vector.y = -(vector.y - 1) / 2 * height

    // normalize
    vector.x /= width
    vector.y /= height

    const angle = map(this._biscuit.el.position.x, -1, 1, 20, -20)

    TweenMax.delayedCall(0.3, () => {
      this._paper.show(vector.x, vector.y, angle)
    })
  }

  private _handlePaperClose() {
    this._isPaperOpen = false

    this._paper.hide()

    Sounds.fadeInBackground()

    TweenMax.delayedCall(
      0.5,
      this._paperButton.animateIn.bind(this._paperButton)
    )
    TweenMax.delayedCall(
      0.5,
      this._aboutButton.animateIn.bind(this._aboutButton)
    )

    TweenMax.to(this, 1, {
      _rgbShiftAmmount: 0
    } as any)

    TweenMax.to(vertexColorMaterial.uniforms.contrast, 0.5, {
      value: 1
    } as any)

    TweenMax.to(vertexColorMaterial.uniforms.saturation, 1, {
      value: 1
    } as any)

    TweenMax.to(this, 1, {
      _blurAmmount: 0,
      _rgbShiftAmmount: 0
    } as any)
  }

  private _handleAboutClick() {
    if (this._isPaperOpen || this._isAboutOpen) {
      return
    }

    Tracking.trackEvent({
      category: 'about',
      action: 'click'
    })

    this._isAboutOpen = true

    if (this._isBiscuitExploded) {
      this._paperButton.animateOut(true)
    }

    TweenMax.to(vertexColorMaterial.uniforms.saturation, 1, {
      value: 0.3
    } as any)

    TweenMax.to(vertexColorMaterial.uniforms.contrast, 1, {
      value: 0.3
    } as any)

    TweenMax.to(this, 1, {
      _blurAmmount: 2,
      _rgbShiftAmmount: 200
    } as any)

    this._aboutButton.animateOut(true)
    TweenMax.delayedCall(
      0.5,
      this._closeButton.animateIn.bind(this._closeButton)
    )

    this._about.animateIn()

    Sounds.fadeOutBackground()
  }

  private _handleCloseClick() {
    if (!this._isAboutOpen) {
      return
    }

    this._isAboutOpen = false

    if (this._isBiscuitExploded) {
      TweenMax.delayedCall(
        0.5,
        this._paperButton.animateIn.bind(this._paperButton)
      )
    }

    this._isAboutOpen = false

    TweenMax.to(vertexColorMaterial.uniforms.saturation, 1, {
      value: 1
    } as any)

    TweenMax.to(vertexColorMaterial.uniforms.contrast, 1, {
      value: 1
    } as any)

    TweenMax.to(this, 0.5, {
      _blurAmmount: 0,
      _rgbShiftAmmount: 0
    } as any)

    this._closeButton.animateOut(true)
    TweenMax.delayedCall(
      0.5,
      this._aboutButton.animateIn.bind(this._aboutButton)
    )

    this._about.animateOut()

    Sounds.fadeInBackground()
  }

  private _update() {
    window.requestAnimationFrame(this._update)

    const delta = this._clock.getDelta()

    if (this._isActive) {
      this._world.step(1 / 60, delta, 3)

      this._slicer.update()

      this._confettis.update(delta)

      this._paper.update()

      this._biscuit.update()

      this._smoke.update(delta)
    }

    this._render()
  }

  private _render() {
    if (!this._isActive) {
      this._renderer.clearColor()
      return
    }

    if (this._blurAmmount === 0 && this._rgbShiftAmmount === 0) {
      this._renderer.clearColor()

      // forward rendering
      this._preRendering.render(this._renderer)

      this._renderer.clearDepth()
    } else {
      this._renderer.clearColor()

      // post process
      this._preRendering.render(
        this._renderer,
        this._postRendering.renderTargets[0]
      )

      this._renderer.clearDepth()

      this._postRendering.render(
        this._renderer,
        this._blurAmmount,
        this._rgbShiftAmmount
      )

      this._renderer.clearDepth()
    }
  }
}

if (Features.supportsWebGL) {
  new App()
}
else {
  new Introduction().fallback()
}

