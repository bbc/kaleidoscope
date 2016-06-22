import Renderer from './renderer'
import utils from './utils'
import Controls from './controls'
import {
  Texture,
  LinearFilter,
  Scene,
  Object3D,
  Vector3,
  PerspectiveCamera,
  RGBFormat,
} from 'threejs360'

export default class ThreeSixtyViewer {
  constructor(options={}) {
    Object.assign(this, options);
    let {height, width, container, containerId} = this;
    this.renderer = new Renderer({height, width, container, containerId});
    this.camera = new PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 100);
    this.controls = new Controls(this.camera, this.renderer);
    this.scene = this.createScene();
    this.scene.add(this.camera);
    this.element = this.getElement();
    this.texture = this.createTexture();
    this.renderer.setTexture(this.texture);
    this.scene.getObjectByName('photo').children = [this.renderer.mesh];
  }

  getElement() {
    if (this.video) {
      return this.video;
    } else {
      let video = document.createElement('video');
      video.src = this.source;
      video.loop = this.loop || false;
      video.muted = this.muted || false;
      video.setAttribute('crossorigin', 'anonymous');
      video.setAttribute('webkit-playsinline', '');
      video.autoplay = this.autoplay || true;
      video.addEventListener('error', () => this.onError());
      return video;
    }
  }

  createTexture() {
      console.log(this.video.currentSrc);
    let texture = new Texture(this.element);
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.format = RGBFormat;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }

  createScene() {
    let scene = new Scene();
    let group = new Object3D();
    group.name = 'photo';
    scene.add(group);
    return scene;
  }

  onError(err) {
    console.log('error loading image');
    console.log(err);
  }

  render() {
    let loop = () => {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(loop);
    };
    loop();
  }
}

