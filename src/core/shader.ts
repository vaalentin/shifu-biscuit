import Features from './Features'

export const vertexShaderPrecision = Features.supportsVsHighp
  ? 'highp'
  : 'mediump'

export const fragmentShaderPrecision = Features.supportsFsHighp
  ? 'highp'
  : 'mediump'
