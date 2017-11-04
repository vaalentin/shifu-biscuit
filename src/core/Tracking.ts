export interface TrackingEvent {
  category: string
  action: string
  label?: string
  value?: number
}

class Tracking {
  private _isEnabled: boolean
  private _isVerbose: boolean
 
  constructor(isEnabled: boolean, isVerbose: boolean) {
      this._isEnabled = isEnabled
      this._isVerbose = isVerbose
  }
  
  public trackEvent(event: TrackingEvent) {
      if (this._isVerbose) {
          console.log(`Track event: ${JSON.stringify(event)}`)
      }

      if (!this._isEnabled || !window.ga) {
          return
      }

      const { category, action, label = null, value = null } = event

      window.ga('send', 'event', category, action, label, value)
  }
}

const enabled = process.env.NODE_ENV !== 'development'

export default new Tracking(enabled, !enabled)
