import * as THREE from 'three'

export default abstract class AbstractPreRendering {
  public scene: THREE.Scene

  public camera: THREE.PerspectiveCamera
  public cameraContainer: THREE.Object3D

  constructor(width: number, height: number) {
    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 100)

    this.cameraContainer = new THREE.Object3D()
    this.cameraContainer.add(this.camera)
    this.scene.add(this.cameraContainer)
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  public render(
    renderer: THREE.WebGLRenderer,
    renderTarget: THREE.WebGLRenderTarget = null
  ) {
    renderer.render(this.scene, this.camera, renderTarget)
  }
}
