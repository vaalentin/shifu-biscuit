declare const require: {
  <T>(path: string): T
  (paths: string[], callback: (...modules: any[]) => void): void
  ensure: (
    paths: string[],
    callback: (require: <T>(path: string) => T) => void
  ) => void
}

declare module '*.css' {
  interface IClassNames {
    [className: string]: string
  }

  const classNames: IClassNames

  export = classNames
}

interface Process {
  env: {
    NODE_ENV: string
  }
}

declare const process: Process

declare interface PaletteColor {
  hex: string
  rgb: [number, number, number]
}

declare interface Palette {
  background: PaletteColor
  highlight: PaletteColor
<<<<<<< HEAD
  extras: PaletteColor[]
=======
>>>>>>> 0c743f6f03103408c15443a750d71af3d34b825d
}

interface Window {
  ga(
    send: string,
    type: string,
    category: string,
    action: string,
    label?: string,
    value?: number
  )

  palette: Palette
}
