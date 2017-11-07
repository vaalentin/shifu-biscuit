import { TweenMax } from 'gsap'

import { fileLoader } from './Loaders'

export default class SoundPlayer {
  private static _supportedTypes: { [name: string]: boolean }

  private _audio: HTMLAudioElement

  private _preload: boolean

  constructor(srcs: string[], preload = true, loop = false) {
    this._audio = new Audio()
    this._audio.playbackRate = 0.1
    this._audio.loop = loop

    // see https://github.com/goldfire/howler.js/blob/master/src/howler.core.js#L246-L267
    if (!SoundPlayer._supportedTypes) {
      const mpegTest = this._audio
        .canPlayType('audio/mpeg;')
        .replace(/^no$/, '')

      const checkOpera =
        window.navigator && window.navigator.userAgent.match(/OPR\/([0-6].)/g)
      const isOldOpera =
        checkOpera && parseInt(checkOpera[0].split('/')[1], 10) < 33

      SoundPlayer._supportedTypes = {
        mp3: !!(
          !isOldOpera &&
          (mpegTest ||
            this._audio.canPlayType('audio/mp3;').replace(/^no$/, ''))
        ),
        wav: !!this._audio
          .canPlayType('audio/wav; codecs="1"')
          .replace(/^no$/, ''),
        webm: !!this._audio
          .canPlayType('audio/webm; codecs="vorbis"')
          .replace(/^no$/, '')
      }
    }

    this._setSrc(srcs)
  }

  private _setSrc(srcs: string[]) {
    for (let i = 0; i < srcs.length; i++) {
      const src = srcs[i]
      const extension = src.split('.').pop()

      if (SoundPlayer._supportedTypes[extension]) {
        if (this._preload) {
          fileLoader.load(src, () => {
            this._audio.setAttribute('src', src)
            this._audio.load()
          })
        } else {
          this._audio.setAttribute('src', src)
          this._audio.load()
        }

        return
      }
    }
  }

  public play() {
    this._audio.play()
  }

  public fadeOut(duration: number, target = 0) {
    TweenMax.to(this._audio, duration, {
      volume: target
    } as any)
  }

  public fadeIn(duration: number, target = 1) {
    TweenMax.to(this._audio, duration, {
      volume: target
    } as any)
  }
}
