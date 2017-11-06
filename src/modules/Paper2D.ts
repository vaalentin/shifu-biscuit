import * as THREE from 'three'
import { TweenMax, Elastic, Expo } from 'gsap'

import { random } from '../core/math'
import Signal from '../core/Signal'

import AnimatedText from './AnimatedText'

import * as styles from './Paper2D.css'

export default class Paper2D {
  private _$el: HTMLElement
  private _$paper: HTMLElement
  private _$container: HTMLElement
  private _$content: HTMLElement
  private _$contentBack: HTMLElement

  private _isActive: boolean
  private _needsUpdate: boolean
  private _isClosing: boolean

  private _parentSize: THREE.Vector2
  private _position: THREE.Vector2

  private _animatedText: AnimatedText

  public onClose: Signal<void>

  constructor(width: number, height: number) {
    this._$el = document.createElement('div')
    this._$el.classList.add(styles.wrapper)

    this._$paper = document.createElement('div')
    this._$paper.classList.add(styles.paper)

    this._$el.appendChild(this._$paper)

    this._$container = document.createElement('div')
    this._$container.classList.add(styles.container)

    this._$paper.appendChild(this._$container)

    this._$content = document.createElement('div')
    this._$content.classList.add(styles.content)

    this._$container.appendChild(this._$content)

    this._isActive = false
    this._needsUpdate = false
    this._isClosing = false

    this._parentSize = new THREE.Vector2(width, height)
    this._position = new THREE.Vector2(0, 0)

    if (true) {
      this._animatedText = new AnimatedText('Tap anywhere to keep on smashing the biscuit')
      this._animatedText.$el.classList.add(styles.instructions)
      this._$el.appendChild(this._animatedText.$el)
    }

    this.onClose = new Signal<void>()

    // let isMouseDown = false

    // let previousX = 0
    // let previousY = 0

    // this._$content.addEventListener('mousedown', e => {
    //   isMouseDown = true

    //   previousX = e.pageX
    //   previousY = e.pageY
    // })

    // document.addEventListener('mousemove', e => {
    //   if (!isMouseDown) {
    //     return
    //   }

    //   const x = e.pageX
    //   const y = e.pageY

    //   const deltaX = (x - previousX) / this._parentSize.width
    //   const deltaY = (y - previousY) / this._parentSize.height

    //   this._position.x += deltaX
    //   this._position.y += deltaY

    //   this._needsUpdate = true

    //   previousX = x
    //   previousY = y
    // })

    // document.addEventListener('mouseup', () => {
    //   isMouseDown = false

    //   TweenMax.to(this._position, 1, {
    //     x: 0.5,
    //     y: 0.5,
    //     ease: Elastic.easeOut.config(1, 0.5),
    //     onUpdate: () => this._needsUpdate = true
    //   } as any)
    // })
  }

  public setQuote(quote: { text: string, author: string }) {
    const $text = document.createElement('div')
    $text.classList.add(styles.text)
    $text.innerText = quote.text

    this._$content.appendChild($text)

    if (quote.author) {
      const $author = document.createElement('div')
      $author.classList.add(styles.author)
      $author.innerText = quote.author

      this._$content.appendChild($author)
    }
  }

  public update() {
    if (!this._isActive || !this._needsUpdate) {
      return
    }

    this._needsUpdate = false

    TweenMax.set(this._$paper, {
      css: {
        x: this._position.x * this._parentSize.x,
        y: this._position.y * this._parentSize.y
      }
    })
  }

  public resize(width: number, height: number) {
    this._parentSize.set(width, height)
    
    this._needsUpdate = true
  }

  public show(originX: number, originY: number, angle: number) {
    this._isActive = true

    document.body.appendChild(this._$el)

    this._position.set(originX, originY)

    TweenMax.to(this._position, 3, {
      x: 0.5,
      y: 0.5,
      onUpdate: () => this._needsUpdate = true,
      ease: Elastic.easeOut.config(1, 0.5),
      onComplete: () => {
        if (this._animatedText) {
          this._animatedText.animateIn()
        }

        this._$el.addEventListener('click', e => {
          if (e.target !== this._$el) {
            return
          }

          this.onClose.dispatch()
        })
      }
    } as any)

    TweenMax.set(this._$paper, {
      css: {
        scale: 0,
        rotationX: -90,
        rotationY: angle * 2,
        rotationZ: angle,
        opacity: 0
      }
    })

    TweenMax.to(this._$paper, 3, {
      css: {
        scale: 1,
        rotationX: 0,
        rotationY: 0,
        rotationZ: random(-5, 5),
        opacity: 1
      },
      ease: Elastic.easeOut.config(1, 0.5)
    } as any)
  }

  public hide() {
    if (this._isClosing) {
      return
    }

    this._isClosing = true

    if (this._animatedText) {
      TweenMax.to(this._animatedText.$el, 0.5, {
        opacity: 0
      } as any)
    }

    TweenMax.to(this._$paper, 1, {
      css: {
        scale: 0.7,
        opacity: 0
      },
      ease: Expo.easeOut,
      onComplete: () => document.body.removeChild(this._$el)
    } as any)
  }
}
