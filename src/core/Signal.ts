export default class Signal<T> {
  private _listeners: ((data?: T) => any)[]

  constructor() {
    this._listeners = []
  }

  public add(listener: (data?: T) => void) {
    const i = this._listeners.indexOf(listener)

    if (i !== -1) {
      return
    }

    this._listeners.push(listener)
  }

  public remove(listener: (data?: T) => void) {
    const i = this._listeners.indexOf(listener)

    if (i === -1) {
      return
    }

    this._listeners.splice(i, 1)
  }

  public dispatch(data?: T) {
    if (!this._listeners.length) {
      return
    }

    for (let listener of this._listeners) {
      listener(data)
    }
  }

  public dispose() {
    this._listeners.length = 0
  }
}
