import { TweenMax, Elastic, Expo } from 'gsap'

import * as styles from './AnimatedText.css'

export default class AnimatedText {
  public $el: HTMLElement

  private _$letters: HTMLElement[]

  constructor(
    text: string,
    links: string[] = [],
    classes: string[] = [styles.text]
  ) {
    this.$el = document.createElement('h2')

    for (let i = 0; i < classes.length; i++) {
      this.$el.classList.add(classes[i])
    }

    this._$letters = []

    const $line = document.createElement('div')

    const $word = document.createElement('span')
    $word.classList.add(styles.word)

    const $link = document.createElement('a')
    $link.classList.add(styles.word)
    $link.classList.add(styles.link)
    $link.setAttribute('target', '_blank')

    const $letter = document.createElement('span')
    $letter.classList.add(styles.letter)

    const $space = document.createElement('span')
    $space.innerHTML = '&nbsp'

    const $br = document.createElement('br')

    const lines = text.trim().split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      const $currentLine = $line.cloneNode()

      this.$el.appendChild($currentLine)

      if (line === '') {
        $currentLine.appendChild($br.cloneNode(true))
        continue
      }

      const words = line.split(' ')

      for (let j = 0; j < words.length; j++) {
        let word = words[j]

        if (j !== 0) {
          $currentLine.appendChild($space.cloneNode(true))
        }

        const isLink = /^{{(.*?)}}$/.test(word)

        let $currentWord: HTMLLinkElement | HTMLElement

        if (isLink) {
          word = word.replace('{{', '').replace('}}', '')
          $currentWord = $link.cloneNode() as HTMLLinkElement
          $currentWord.setAttribute('href', links.pop())
        } else {
          $currentWord = $word.cloneNode() as HTMLElement
        }

        const letters = word.split('')

        for (let k = 0; k < letters.length; k++) {
          const $currentLetter = $letter.cloneNode() as HTMLElement
          $currentLetter.innerText = letters[k]

          $currentWord.appendChild($currentLetter)

          TweenMax.set($currentLetter, {
            yPercent: '200%'
          })

          this._$letters.push($currentLetter)
        }

        $currentLine.appendChild($currentWord)
      }
    }
  }

  public animateIn() {
    TweenMax.set(this.$el, {
      display: 'block'
    })

    TweenMax.staggerTo(
      this._$letters,
      1,
      {
        opacity: 1,
        yPercent: '0%',
        ease: Elastic.easeOut.config(1, 0.5)
      } as any,
      0.015
    )
  }

  public animateOut(hide = false) {
    TweenMax.to(this._$letters, 1, {
      opacity: 0,
      y: '-100%',
      ease: Expo.easeOut,
      onComplete: () => {
        this.reset()

        if (hide) {
          TweenMax.set(this.$el, {
            display: 'none'
          })
        }
      }
    } as any)
  }

  public reset() {
    TweenMax.killTweensOf(this._$letters)

    TweenMax.set(this._$letters, {
      opacity: 0,
      yPercent: '200%'
    })
  }
}
