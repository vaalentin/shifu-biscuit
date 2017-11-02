import SoundPlayer from '../core/SoundPlayer'

export default class Sounds {
  private _slice: SoundPlayer
  private _hit: SoundPlayer
  private _break: SoundPlayer
  private _explode: SoundPlayer
  
  constructor() {
    this._slice = new SoundPlayer([
      require<string>('../sounds/slice.mp3'),
      require<string>('../sounds/slice.wav')
    ])

    this._hit = new SoundPlayer([
      require<string>('../sounds/hit.mp3'),
      require<string>('../sounds/hit.wav')
    ])

    this._break = new SoundPlayer([
      require<string>('../sounds/break.mp3'),
      require<string>('../sounds/break.wav')
    ])

    this._explode = new SoundPlayer([
      require<string>('../sounds/explode.mp3'),
      require<string>('../sounds/explode.wav')
    ])
  }

  public slice() {
    this._slice.play()
  }

  public hit() {
    this._hit.play()
  }

  public break() {
    this._break.play()
  }

  public explode() {
    this._explode.play()
  }
}
