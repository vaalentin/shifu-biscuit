/// <reference path="./definitions.d.ts" />

import * as THREE from 'three'
import * as CANNON from 'cannon'
import { TweenMax, TimelineMax } from 'gsap'

import PreRendering from './core/PreRendering'
import PostRendering from './core/PostRendering'
import Raycaster from './core/Raycaster'
import SoundPlayer from './core/SoundPlayer'

import Floor from './modules/Floor'
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

  private _floor: Floor
  private _biscuit: Biscuit
  private _paper: Paper
  private _confettis: Confettis
  private _slicer: Slicer
  
  private _hitCount: number

  private _blurAmmount: number

  private _active: boolean

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

    this._floor = new Floor()
    this._preRendering.scene.add(this._floor.el)
    this._world.addBody(this._floor.body)

    this._biscuit = new Biscuit()
    this._preRendering.scene.add(this._biscuit.el)
    this._preRendering.scene.add(this._biscuit.shadow.el)

    this._paper = new Paper()
    // this._preRendering.scene.add(this._paper.el)

    this._confettis = new Confettis(200)
    this._preRendering.scene.add(this._confettis.confettis)
    this._preRendering.scene.add(this._confettis.shadows)

    this._world.addBody(this._biscuit.body)
    this._raycaster.add(this._biscuit.el)
    this._slicer = new Slicer(this._renderer.domElement)
    this._preRendering.scene.add(this._slicer.el)

    this._hitCount = 0

    this._blurAmmount = 0

    this._active = false

    this._bindMethods()
    this._addListeners()

    window.requestAnimationFrame(this._update)
  }

  private _bindMethods() {
    this._update = this._update.bind(this)
    this._handleResize = this._handleResize.bind(this)
    this._handleMouseDown = this._handleMouseDown.bind(this)
    this._handleRaycast = this._handleRaycast.bind(this)
    this._handleLoadProgress = this._handleLoadProgress.bind(this)
    this._handleLoadComplete = this._handleLoadComplete.bind(this)
  }

  private _addListeners() {
    window.addEventListener('resize', this._handleResize)
    this._renderer.domElement.addEventListener(
      'mousedown',
      this._handleMouseDown
    )
    this._raycaster.onCast.add(this._handleRaycast)
    THREE.DefaultLoadingManager.onProgress = this._handleLoadProgress
    THREE.DefaultLoadingManager.onLoad = this._handleLoadComplete
  }

  private _handleLoadProgress(url: number, loaded: number, total: number) {
    // console.log(progress)
  }

  private _handleLoadComplete() {
    this._start()
  }

  private _handleResize() {
    const { innerWidth: width, innerHeight: height } = window

    this._renderer.setSize(width, height)

    this._preRendering.resize(width, height)
    this._postRendering.resize(width, height)
  }

  private _handleMouseDown(e: MouseEvent) {
    this._raycaster.cast(this._preRendering.camera)
  }

  private _handleRaycast(interestion: THREE.Intersection) {
    const { point, object } = interestion
    
    this._shoutSounds[this._soundIndex].play()

    this._soundIndex = (this._soundIndex + 1) % this._shoutSounds.length

    this._confettis.explode(point)

    let piece: BiscuitPiece

    if (this._hitCount < 2) {
      this._shakeCamera(5)

      this._biscuit.bounce(point)

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
        this._biscuit.bouncePiece(piece, point)
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
    this._active = true
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

    if (this._active) {
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
