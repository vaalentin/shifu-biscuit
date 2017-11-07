import SoundPlayer from '../core/SoundPlayer'

class Sounds {
  private _background: SoundPlayer

  private _start: SoundPlayer

  private _slices: SoundPlayer[]
  private _sliceIndex: number

  private _hit: SoundPlayer

  private _break: SoundPlayer

  private _explode: SoundPlayer

  constructor() {
    this._background = new SoundPlayer(
      [
        require<string>('../sounds/background.mp3'),
        require<string>('../sounds/background.ogg'),
        require<string>('../sounds/background.webm')
      ],
      false,
      true
    )

    this._start = new SoundPlayer([
      require<string>('../sounds/start.mp3'),
      require<string>('../sounds/start.wav'),
      require<string>('../sounds/start.webm')
    ])

    this._slices = [
      new SoundPlayer([
        require<string>('../sounds/slice_00.mp3'),
        require<string>('../sounds/slice_00.wav'),
        require<string>('../sounds/slice_00.webm')
      ]),
      new SoundPlayer([
        require<string>('../sounds/slice_01.mp3'),
        require<string>('../sounds/slice_01.wav'),
        require<string>('../sounds/slice_01.webm')
      ]),
      new SoundPlayer([
        require<string>('../sounds/slice_03.mp3'),
        require<string>('../sounds/slice_03.wav'),
        require<string>('../sounds/slice_03.webm')
      ]),
      new SoundPlayer([
        require<string>('../sounds/slice_04.mp3'),
        require<string>('../sounds/slice_04.wav'),
        require<string>('../sounds/slice_04.webm')
      ])
    ]

    this._sliceIndex = 0

    this._hit = new SoundPlayer([
      require<string>('../sounds/hit.mp3'),
      require<string>('../sounds/hit.wav'),
      require<string>('../sounds/hit.webm')
    ])

    this._break = new SoundPlayer([
      require<string>('../sounds/break.mp3'),
      require<string>('../sounds/break.wav'),
      require<string>('../sounds/break.webm')
    ])

    this._explode = new SoundPlayer([
      require<string>('../sounds/explode.mp3'),
      require<string>('../sounds/explode.wav'),
      require<string>('../sounds/explode.webm')
    ])
  }

  public startBackground() {
    this._background.play()
  }

  public fadeOutBackground() {
    this._background.fadeOut(2, 0.2)
  }

  public fadeInBackground() {
    this._background.fadeIn(2, 1)
  }

  public start() {
    this._start.play()
  }

  public slice() {
    this._slices[this._sliceIndex].play()

    this._sliceIndex = (this._sliceIndex + 1) % this._slices.length
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

export default new Sounds()
