class Features {
  public supportsWebGL: boolean
  public supportsVsHighp: boolean
  public supportsFsHighp: boolean
  public supportsDepthTexture: boolean

  constructor() {
    const $canvas = document.createElement('canvas')

    const gl = this._getWebglContext($canvas)

    this.supportsWebGL = gl !== null

    if (this.supportsWebGL) {
      this.supportsVsHighp = this._supportsHighp(gl, gl.VERTEX_SHADER)
      this.supportsFsHighp = this._supportsHighp(gl, gl.FRAGMENT_SHADER)

      const extensions = gl.getSupportedExtensions()

      this.supportsDepthTexture =
        extensions.indexOf('WEBGL_depth_texture') !== -1 ||
        extensions.indexOf('WEBKIT_WEBGL_depth_texture') !== -1
    } else {
      this.supportsVsHighp = false
      this.supportsFsHighp = false
      this.supportsDepthTexture = false
    }
  }

  private _getWebglContext(
    $canvas: HTMLCanvasElement
  ): WebGLRenderingContext | null {
    let gl: WebGLRenderingContext | null

    try {
      gl =
        $canvas.getContext('webgl') || $canvas.getContext('experimental-webgl')
    } catch (err) {
      gl = null
    }

    return gl
  }

  private _supportsHighp(gl: WebGLRenderingContext, type: number): boolean {
    const precision = gl.getShaderPrecisionFormat(type, gl.HIGH_FLOAT)

    return precision.rangeMin !== 0 && precision.rangeMax !== 0
  }
}

export default new Features()
