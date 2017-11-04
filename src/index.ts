/// <reference path="./definitions.d.ts" />

import * as THREE from 'three'
import * as CANNON from 'cannon'
import { TweenMax, TimelineMax } from 'gsap'

import Raycaster from './core/Raycaster'
import { fileLoader } from './core/Loaders'
import Cookies from './core/Cookies'
import { map, random } from './core/math'

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

const SKIP_INTRODUCTION = false
const PLAY_SOUNDS = true
const STRAIGHT_TO_PAPER = false

const HITS = random(2, 4, true)
const BREAK_HITS = random(1, 3, true)

class App {
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

  private _hitCount: number

  private _blurAmmount: number
  private _rgbShiftAmmount: number

  private _isActive: boolean

  private _canSlice: boolean
  private _canPlaySliceSound: boolean

  private _sliceMousePosition: THREE.Vector2
  private _sliceDirection: THREE.Vector2

  constructor() {
    this._world = new CANNON.World()
    this._world.gravity.set(0, -9.82, 0)
    this._world.broadphase = new CANNON.NaiveBroadphase()

    const { innerWidth: width, innerHeight: height } = window

    this._renderer = new THREE.WebGLRenderer({
      antialias: true
    })

    this._renderer.autoClear = false

    this._renderer.setClearColor('#8080ff', 1 );

    this._renderer.setPixelRatio(window.devicePixelRatio || 1)
    this._renderer.setSize(width, height)
    document.body.appendChild(this._renderer.domElement)

    this._preRendering = new PreRendering(width, height)
    this._preRendering.camera.position.set(0, 2, 2)
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

    this._hitCount = 0

    this._blurAmmount = 0
    this._rgbShiftAmmount = 0

    this._isActive = false
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
    this._update = this._update.bind(this)
    this._handleResize = this._handleResize.bind(this)
    this._handleSliceUpdate = this._handleSliceUpdate.bind(this)
    this._handleSliceEnd = this._handleSliceEnd.bind(this)
    this._handleRaycast = this._handleRaycast.bind(this)
    this._handleLoadProgress = this._handleLoadProgress.bind(this)
    this._handlePaperClose = this._handlePaperClose.bind(this)
  }

  private _addListeners() {
    window.addEventListener('resize', this._handleResize)
    this._slicer.onSliceUpate.add(this._handleSliceUpdate)
    this._slicer.onSliceEnd.add(this._handleSliceEnd)
    this._raycaster.onCast.add(this._handleRaycast)
    THREE.DefaultLoadingManager.onProgress = this._handleLoadProgress
    this._paper.onClose.add(this._handlePaperClose)
  }

  private _handleLoadProgress(url: number, loaded: number, total: number) {
    if (SKIP_INTRODUCTION) {
      return
    }

    TweenMax.delayedCall(2, () => {
      const onComplete = loaded === total
        ? this._handleLoadComplete.bind(this)
        : null
        
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

        this._shakeCamera(10, 0.2, 0.2, 0.05, 0, 200)

        this._explosion.explode(point)
        this._smoke.explode(point)
        Sounds.stopBackground()
        
        TweenMax.to(this, 1, {
          _rgbShiftAmmount: 300
        } as any)

        this._biscuit.explode(
          this._world,
          this._preRendering.scene,
          this._raycaster
        )

        let count = parseInt(Cookies.get('count'))

        if (!count) {
          count = 0
        }
        
        count++

        Cookies.add('count', count.toString(), 30)

        this._showPaper()

        for (let i = 0; i < this._biscuit.pieces.length; i++) {
          const piece = this._biscuit.pieces[i]

          piece.body.applyForce(
            new CANNON.Vec3(
              random(-1000, 1000),
              -500,
              random(-1000, 1000)
            ),
            new CANNON.Vec3(piece.el.position.x, piece.el.position.y, piece.el.position.z)
          )
        }
      }
      else {
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

  private _handlePaperClose() {
    this._paper.hide()

    TweenMax.to(this, 1, {
      _rgbShiftAmmount: 0
    } as any)

    TweenMax.to(vertexColorMaterial.uniforms.contrast, 0.5, {
      value: 1
    } as any)

    TweenMax.to(vertexColorMaterial.uniforms.saturation, 1, {
      value: 1
    } as any)
  }

  private _start() {
    this._isActive = true
  }

  private _shakeCamera(steps: number = 20, amplitudeX = 0.1, amplitudeZ = 0.01, duration = 0.05, endBlur = 0, endRgbShift = 0) {
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

      timeline.to(this._preRendering.camera.rotation, d, {
        z: rotation.z + random(-amplitudeX, amplitudeX),
        y: rotation.y + random(-amplitudeZ, amplitudeZ)
      }, time)

      timeline.to(this, d, {
        _blurAmmount: random(2, 4)
      }, time)

      timeline.to(this, d, {
        _rgbShiftAmmount: random(200, 500)
      }, time)

      time += d
    }
  }

  private _showPaper() {
    const { width, height } = this._renderer.domElement

    TweenMax.to(vertexColorMaterial.uniforms.saturation, 1, {
      value: 0.3
    } as any)

    TweenMax.to(vertexColorMaterial.uniforms.contrast, 1, {
      value: 0.3
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

      this._postRendering.render(this._renderer, this._blurAmmount, this._rgbShiftAmmount)

      this._renderer.clearDepth()
    }
  }
}

new App()
