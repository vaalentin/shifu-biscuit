/// <reference path="./definitions.d.ts" />

import * as THREE from 'three'
import * as CANNON from 'cannon'
import { TweenMax, TimelineMax } from 'gsap'

import PreRendering from './core/PreRendering'
import PostRendering from './core/PostRendering'
import Raycaster from './core/Raycaster'

import Floor from './modules/Floor'
import Biscuit from './modules/Biscuit'
import BiscuitPiece from './modules/BiscuitPiece'
import Paper from './modules/Paper'
import Confettis from './modules/Confettis'

class App {
  private _world: CANNON.World

  private _renderer: THREE.WebGLRenderer

  private _preRendering: PreRendering
  private _postRendering: PostRendering
  private _raycaster: Raycaster

  private _clock: THREE.Clock

  private _floor: Floor
  private _biscuit: Biscuit
  private _paper: Paper
  private _confettis: Confettis

  private _hitCount: number

  private _blurAmmount: number

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

    this._floor = new Floor()
    this._preRendering.scene.add(this._floor.el)
    this._world.addBody(this._floor.body)

    this._biscuit = new Biscuit(this._preRendering.scene, this._world)
    this._preRendering.scene.add(this._biscuit.el)
    this._preRendering.scene.add(this._biscuit.shadow.el)

    this._paper = new Paper()
    // this._preRendering.scene.add(this._paper.el)

    this._confettis = new Confettis()
    this._preRendering.scene.add(this._confettis.el)

    this._world.addBody(this._biscuit.body)
    this._raycaster.add(this._biscuit.el)

    this._hitCount = 0

    this._blurAmmount = 0

    this._bindMethods()
    this._addListeners()

    window.requestAnimationFrame(this._update)
  }

  private _bindMethods() {
    this._update = this._update.bind(this)
    this._handleResize = this._handleResize.bind(this)
    this._handleMouseDown = this._handleMouseDown.bind(this)
    this._handleRaycast = this._handleRaycast.bind(this)
  }

  private _addListeners() {
    window.addEventListener('resize', this._handleResize)
    this._renderer.domElement.addEventListener(
      'mousedown',
      this._handleMouseDown
    )
    this._raycaster.onCast.add(this._handleRaycast)
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

    this._confettis.explode(point)

    let piece: BiscuitPiece

    if (this._hitCount < 2) {
      this._shakeCamera(5)

      this._biscuit.bounce(point)
    } else if (this._hitCount < 4) {
      this._shakeCamera(5)

      piece = this._biscuit.getPieceFromObject(object)
    } else {
      this._shakeCamera(10)

      piece = this._biscuit.getPieceFromObject(object)

      this._biscuit.explode(
        this._world,
        this._preRendering.scene,
        this._raycaster
      )
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

    this._hitCount++
  }

  private _update() {
    window.requestAnimationFrame(this._update)

    const delta = this._clock.getDelta()

    this._confettis.update(delta)

    this._world.step(1 / 60, delta, 3)

    this._biscuit.update()

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

  private _shakeCamera(steps: number) {
    const timeline = new TimelineMax()

    const rotation = this._preRendering.camera.rotation.clone()
    this._blurAmmount = 2

    for (var i = 0; i < steps; i++) {
      timeline.to(this._preRendering.camera.rotation, Math.random() * 0.05, {
        z: rotation.z + (Math.random() * 2 - 1) * 0.1,
        y: rotation.y + (Math.random() * 2 - 1) * 0.01
      })
    }

    timeline.call(() => {
      this._preRendering.camera.rotation.z = rotation.z
      this._preRendering.camera.rotation.y = rotation.y
      this._blurAmmount = 0
    })
  }
}

new App()
