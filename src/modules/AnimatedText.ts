import { TweenMax, Elastic } from 'gsap'

import * as styles from './AnimatedText.css'

export default class AnimatedText {
  public $el: HTMLElement

  private _$letters: HTMLElement[]

  constructor(text: string) {
    this.$el = document.createElement('h2')
    this.$el.classList.add(styles.text)

    const words = text.split(' ')
    
    this._$letters = []

    const $word = document.createElement('span')
    $word.classList.add(styles.word)

    const $letter = document.createElement('span')
    $letter.classList.add(styles.letter)

    const $space = document.createElement('span')
    $space.innerHTML = '&nbsp'

    for (let i = 0; i < words.length; i++) {
      if (i !== 0) {
        this.$el.appendChild($space.cloneNode(true))
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

        this._$letters.push($currentLetter)
      }

      this.$el.appendChild($currentWord)
    }
  }

  public animateIn() {
    TweenMax.staggerTo(this._$letters, 1, {
      opacity: 1,
      yPercent: '0%',
      ease: Elastic.easeOut.config(1, 0.5)
    } as any, 0.015)
  }
}