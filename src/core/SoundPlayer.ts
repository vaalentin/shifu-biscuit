  export default class SoundPlayer {
    private static _supportedTypes: {[name: string]: boolean}

    private _audio: HTMLAudioElement

    constructor(srcs: string[]) {
      this._audio = new Audio()
      this._audio.playbackRate = 0.1

      // see https://github.com/goldfire/howler.js/blob/master/src/howler.core.js#L246-L267
      if (!SoundPlayer._supportedTypes) {
        const mpegTest = this._audio.canPlayType('audio/mpeg;').replace(/^no$/, '')

        const checkOpera = window.navigator && window.navigator.userAgent.match(/OPR\/([0-6].)/g)
        const isOldOpera = (checkOpera && parseInt(checkOpera[0].split('/')[1], 10) < 33)

        SoundPlayer._supportedTypes = {
          mp3: !!(!isOldOpera && (mpegTest || this._audio.canPlayType('audio/mp3;').replace(/^no$/, ''))),
          wav: !!this._audio.canPlayType('audio/wav; codecs="1"').replace(/^no$/, ''),
          webm: !!this._audio.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, '')
        }
      }

      this.setSrc(srcs)
    }

    public setSrc(srcs: string[]) {
      let src: string
      
      for (let i = 0; i < srcs.length; i++) {
        const extension = srcs[i].split('.').pop()

        if (SoundPlayer._supportedTypes[extension]) {
          src = srcs[i]
          break
        }
      }

      if (!src) {
        return
      }

      this._audio.setAttribute('src', src)
      this._audio.load()
    }

    public play() {
      this._audio.play()
    }
  }
