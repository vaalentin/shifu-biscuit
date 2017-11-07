import { TweenMax } from 'gsap'

import Tracking from '../core/Tracking'

import * as styles from './About.css'

import AnimatedText from './AnimatedText'

export default class About {
  public $el: HTMLElement

  private _text: AnimatedText

  constructor() {
    this.$el = document.createElement('div')
    this.$el.classList.add(styles.about)
    this.$el.style.display = 'none'

    this._text = new AnimatedText(
    `
    Why did we do this?

    Cause we just wanted to break biscuits and feel smarter at the same time.
    That’s our way to make the world a better place.

    We are {{JeanValJean}}

    Music credit:
    Baron Retif & Concepcion Perez - l’indien
    `,
      ['https://www.facebook.com/jeanvaljeanduweb/']
    )

    this._text.$el.classList.add(styles.text)

    this._text.$el.querySelector('a').addEventListener('click', () => {
      Tracking.trackEvent({
        category: 'facebook',
        action: 'click'
      })
    })

    this.$el.appendChild(this._text.$el)
  }

  public animateIn() {
    this.$el.style.display = 'block'

    this._text.animateIn()
  }

  public animateOut() {
    TweenMax.to(this.$el, 0.5, {
      opacity: 0,
      onComplete: () => {
        TweenMax.set(this.$el, {
          opacity: 1,
          display: 'none'
        })

        this._text.reset()
      }
    } as any)
  }
}
