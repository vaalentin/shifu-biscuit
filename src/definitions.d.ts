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
  env: { [key: string]: string }
}

declare const process: Process