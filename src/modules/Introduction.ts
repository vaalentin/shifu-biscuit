import { TweenMax, Elastic, Expo } from 'gsap'

import Signal from '../core/Signal'

export default class Introduction {
  private _$el: HTMLElement
  private _$titles: NodeListOf<HTMLElement>
  private _$rects: NodeListOf<any>
  private _$loading: HTMLElement
  private _$instructionsLetters: HTMLElement[]
  private _$button: HTMLElement

  private _scale: number

  public onStart: Signal<void>

  constructor() {
    this._$el = document.querySelector('.introduction') as HTMLElement
    this._$titles = this._$el.querySelectorAll('.introduction__title') as NodeListOf<HTMLElement>
    this._$rects = this._$el.querySelectorAll('.title__rect--foreground') as NodeListOf<any>
    this._$loading = this._$el.querySelector('.introduction__loading') as HTMLElement
    this._$button = this._$el.querySelector('.introduction__button') as HTMLElement

    this._scale = 0

    this.onStart = new Signal<void>()

    this._prepareInstuctions()
    this._bindMethods()
    this._addListeners()
  }

  private _bindMethods() {
    this._updateRects = this._updateRects.bind(this)
    this._handleButtonMouseEnter = this._handleButtonMouseEnter.bind(this)
    this._handleButtonMouseLeave = this._handleButtonMouseLeave.bind(this)
    this._handleButtonClick = this._handleButtonClick.bind(this)
  }

  private _addListeners() {
    this._$button.addEventListener('mouseenter', this._handleButtonMouseEnter)
    this._$button.addEventListener('mouseleave', this._handleButtonMouseLeave)
    this._$button.addEventListener('click', this._handleButtonClick)
  }

  private _prepareInstuctions() {
    const $instructions = this._$el.querySelector('.introduction__instructions') as HTMLElement

    const words = $instructions.innerText.split(' ')
    
    this._$instructionsLetters = []

    $instructions.innerHTML = ''

    const $word = document.createElement('span')
    $word.classList.add('instructions__word')

    const $letter = document.createElement('span')
    $letter.classList.add('instructions__letter')

    const $space = document.createElement('span')
    $space.innerHTML = '&nbsp'

    for (let i = 0; i < words.length; i++) {
      if (i !== 0) {
        $instructions.appendChild($space.cloneNode(true))
      }

      const $currentWord = $word.cloneNode()

      const letters = words[i].split('')

      for (let j = 0; j < letters.length; j++) {
        const $currentLetter = $letter.cloneNode() as HTMLElement
        $currentLetter.innerText = letters[j]

        $currentWord.appendChild($currentLetter)

        TweenMax.set($currentLetter, {
          yPercent: '200%'
        })

        this._$instructionsLetters.push($currentLetter)
      }

      $instructions.appendChild($currentWord)
    }

    TweenMax.set($instructions, {
      display: 'block'
    })
  }

  private _handleButtonMouseEnter() {
    TweenMax.to(this._$button, 0.3, {
      scale: 0.9,
      ease: Expo.easeOut
    } as any)
  }

  private _handleButtonMouseLeave() {
    TweenMax.to(this._$button, 0.3, {
      scale: 1,
      ease: Expo.easeOut
    } as any)
  }

  private _handleButtonClick() {
    this.onStart.dispatch() 
  }

  private _updateRects() {
    const transform = `scaleX(${this._scale}`

    for (let i = 0; i < this._$rects.length; i++) {
      const $rect = this._$rects[i]

      $rect.style.webkitTransform = transform
      $rect.style.msTransform = transform
      $rect.style.transform = transform
    }
  }

  public setProgress(progress: number, onComplete: () => void = null) {
    TweenMax.to(this, 1, {
      _scale: progress,
      onUpdate: this._updateRects,
      onComplete
    } as any)
  }

  public hideLoader() {
    TweenMax.to(this._$loading, 0.5, {
      opacity: 0,
      y: '-100%'
    } as any)
  }

  public displayIntro() {
    TweenMax.staggerTo(this._$instructionsLetters, 1, {
      opacity: 1,
      yPercent: '0%',
      ease: Elastic.easeOut.config(1, 0.5)
    } as any, 0.015)

    TweenMax.to(this._$button, 1, {
      opacity: 1,
      y: 0,
      ease: Elastic.easeOut.config(1, 0.5),
      delay: 0.7
    } as any)
  }

  public hideIntro() {
    TweenMax.to(this._$el, 1, {
      opacity: 0,
      scale: 0.8,
      ease: Expo.easeOut,
      onComplete: this.dispose.bind(this)
    } as any)
  }

  public dispose() {
    this._$el.parentNode.removeChild(this._$el)

    this._$el = null
    this._$titles = null
    this._$rects = null
    this._$loading = null
    this._$instructionsLetters = null
    this._$button = null

    this._scale = null

    this.onStart.dispose()
    this.onStart = null

    this._updateRects = null
    this._handleButtonMouseEnter = null
    this._handleButtonMouseLeave = null
    this._handleButtonClick = null
  }
}