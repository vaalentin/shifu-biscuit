/// <reference path="./definitions.d.ts" />

import * as THREE from 'three'
import * as CANNON from 'cannon'
import { TweenMax, TimelineMax } from 'gsap'

import PreRendering from './core/PreRendering'
import PostRendering from './core/PostRendering'
import Raycaster from './core/Raycaster'
import SoundPlayer from './core/SoundPlayer'

import Introduction from './modules/Introduction'
import Floor from './modules/Floor'
import Room from './modules/Room'
import Biscuit from './modules/biscuit/Biscuit'
import BiscuitPiece from './modules/biscuit/BiscuitPiece'
import Paper from './modules/Paper'
import Confettis from './modules/Confettis'
import Slicer from './modules/slicer/Slicer'

class App {
  private _world: CANNON.World

  private _renderer: THREE.WebGLRenderer

  private _preRendering: PreRendering
  private _postRendering: PostRendering
  private _raycaster: Raycaster

  private _clock: THREE.Clock

  private _shoutSounds: SoundPlayer[]
  private _soundIndex: number

  private _introduction: Introduction

  private _floor: Floor
  private _room: Room
  private _biscuit: Biscuit
  private _paper: Paper
  private _confettis: Confettis
  private _slicer: Slicer

  private _hitCount: number

  private _blurAmmount: number

  private _isActive: boolean

  private _canSlice: boolean

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

    this._renderer.setPixelRatio(window.devicePixelRatio || 1)
    this._renderer.setSize(width, height)
    document.body.appendChild(this._renderer.domElement)

    this._preRendering = new PreRendering(width, height)
    this._preRendering.camera.position.set(0, 2, 2)
    this._preRendering.camera.lookAt(new THREE.Vector3(0, 0, 0))

    this._postRendering = new PostRendering(width, height)

    this._raycaster = new Raycaster(this._renderer.domElement)

    this._clock = new THREE.Clock()

    this._shoutSounds = new Array(3)

    for (let i = 0; i < this._shoutSounds.length; i++) {
      this._shoutSounds[i] = new SoundPlayer([
        require<string>('./sounds/shout.mp3'),
        require<string>('./sounds/shout.wav')
      ])
    }

    this._soundIndex = 0

    this._introduction = new Introduction()

    this._floor = new Floor()
    this._preRendering.scene.add(this._floor.el)

    this._room = new Room(2, 2)
    this._world.addBody(this._room.floorBody)
    this._world.addBody(this._room.leftWallBody)
    this._world.addBody(this._room.rightWallBody)
    this._world.addBody(this._room.backWallBody)
    this._world.addBody(this._room.frontWallBody)

    if (this._room.debugEl) {
      this._preRendering.scene.add(this._room.debugEl)
    }

    this._biscuit = new Biscuit()
    this._preRendering.scene.add(this._biscuit.el)
    this._preRendering.scene.add(this._biscuit.shadow.el)
    this._world.addBody(this._biscuit.body)
    this._raycaster.add(this._biscuit.el)

    this._paper = new Paper()
    // this._preRendering.scene.add(this._paper.el)

    this._confettis = new Confettis(200)
    this._preRendering.scene.add(this._confettis.confettis)
    this._preRendering.scene.add(this._confettis.shadows)

    this._slicer = new Slicer(this._renderer.domElement, {
      pointsCount: 8,
      maximumPoints: 12,
      minimumDistanceBetweenPoints: 30,
      maximumDistanceBetweenPoints: 100,
      minimumDistance: 40
    })

    this._preRendering.scene.add(this._slicer.el)

    this._hitCount = 0

    this._blurAmmount = 0

    this._isActive = false
    this._canSlice = true

    this._sliceMousePosition = new THREE.Vector2(0, 0)
    this._sliceDirection = new THREE.Vector2(0, 0)

    this._bindMethods()
    this._addListeners()

    window.requestAnimationFrame(this._update)
  }

  private _bindMethods() {
    this._update = this._update.bind(this)
    this._handleResize = this._handleResize.bind(this)
    this._handleSliceUpdate = this._handleSliceUpdate.bind(this)
    this._handleSliceEnd = this._handleSliceEnd.bind(this)
    this._handleRaycast = this._handleRaycast.bind(this)
    this._handleLoadProgress = this._handleLoadProgress.bind(this)
  }

  private _addListeners() {
    window.addEventListener('resize', this._handleResize)
    this._slicer.onSliceUpate.add(this._handleSliceUpdate)
    this._slicer.onSliceEnd.add(this._handleSliceEnd)
    this._raycaster.onCast.add(this._handleRaycast)
    THREE.DefaultLoadingManager.onProgress = this._handleLoadProgress
  }

  private _handleLoadProgress(url: number, loaded: number, total: number) {
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
      this._start()
    })
  }

  private _handleResize() {
    const { innerWidth: width, innerHeight: height } = window

    this._renderer.setSize(width, height)

    this._preRendering.resize(width, height)
    this._postRendering.resize(width, height)

    this._slicer.resize()
  }

  private _handleSliceUpdate({ direction, rayCastPoints }) {
    if (!this._canSlice) {
      return
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
  }

  private _handleRaycast(interestion: THREE.Intersection) {
    if (!this._canSlice) {
      return
    }

    const { point, object } = interestion

    this._shoutSounds[this._soundIndex].play()

    this._soundIndex = (this._soundIndex + 1) % this._shoutSounds.length

    this._confettis.explode(point)

    let piece: BiscuitPiece

    if (this._hitCount < 2) {
      this._shakeCamera(5)

      this._biscuit.bounce(point, this._sliceDirection)

      this._hitCount++
    } else if (this._hitCount < 4) {
      this._shakeCamera(5)

      piece = this._biscuit.getPieceFromObject(object)

      if (!piece || !piece.active) {
        this._hitCount++
      }
    } else {
      this._shakeCamera(10)

      piece = this._biscuit.getPieceFromObject(object)

      if (!piece || !piece.active) {
        this._biscuit.explode(
          this._world,
          this._preRendering.scene,
          this._raycaster
        )
      }
    }

    if (piece) {
      if (piece.active) {
        this._biscuit.bouncePiece(piece, point, this._sliceDirection)
      } else {
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
  }

  private _shakeCamera(steps: number = 20) {
    const timeline = new TimelineMax({
      onComplete: () => {
        this._preRendering.camera.lookAt(new THREE.Vector3(0, 0, 0))

        this._blurAmmount = 0
      }
    })

    const rotation = this._preRendering.camera.rotation.clone()

    this._blurAmmount = 2

    for (var i = 0; i < steps; i++) {
      timeline.to(this._preRendering.camera.rotation, Math.random() * 0.05, {
        z: rotation.z + (Math.random() * 2 - 1) * 0.1,
        y: rotation.y + (Math.random() * 2 - 1) * 0.01
      })
    }
  }

  private _update() {
    window.requestAnimationFrame(this._update)

    const delta = this._clock.getDelta()

    if (this._isActive) {
      this._world.step(1 / 60, delta, 3)

      this._slicer.update()

      this._confettis.update(delta)

      this._biscuit.update()
    }

    this._render()
  }

  private _render() {
    if (this._blurAmmount === 0) {
      // forward rendering
      this._preRendering.render(this._renderer)
    } else {
      // post process
      this._preRendering.render(
        this._renderer,
        this._postRendering.renderTargets[0]
      )
      this._postRendering.render(this._renderer, this._blurAmmount)
    }
  }
}

new App()
