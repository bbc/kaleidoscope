import THREE from 'threejs360';
import utils from './utils'

let easeOutBack = k => {
  let s = 1.70158;
  return --k * k * ((s + 1) * k + s) + 1;
};

export default class Controls {
  constructor(options) {
    Object.assign(this, options);
    this.el = this.renderer.el;
    this.theta = this.initialYaw * Math.PI / 180;
    this.phi = 0;
    this.velo =  this.getVelocity();
    this.rotateStart = new THREE.Vector2();
    this.rotateEnd = new THREE.Vector2();
    this.rotateDelta = new THREE.Vector2();
    this.orientation = new THREE.Quaternion();
    this.euler = new THREE.Euler();
    this.momentum = false;
    this.isUserInteracting = false;
    this.addDraggableStyle();

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    this.onTouchStart = e => this.onMouseDown({clientX: e.touches[0].pageX, clientY: e.touches[0].pageY});
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = e => this.onMouseUp(e);

    this.onDeviceMotion = this.onDeviceMotion.bind(this);
    this.onMessage = this.onMessage.bind(this);
    //this.bindEvents();
  }

  getVelocity() {

    if(utils.isiOS || utils.isWindows || utils.isAndroidFirefox) {
      return 0.02;
    }

    return 1.6;

  }

  bindEvents() {

      if(window.PointerEvent) {

          this.el.addEventListener('pointerdown', this.onMouseDown);
          this.el.addEventListener('pointermove', this.onMouseMove);
          this.el.addEventListener('pointerup', this.onMouseUp);

      } else {

          this.el.addEventListener('mousedown', this.onMouseDown);
          document.addEventListener('mousemove', this.onMouseMove);
          document.addEventListener('mouseup', this.onMouseUp);
          this.el.addEventListener('touchstart', this.onTouchStart);
          document.addEventListener('touchmove', this.onTouchMove);
          document.addEventListener('touchend', this.onTouchEnd);

      }
  }

  centralize() {
    let endTheta = this.initialYaw * Math.PI / 180;

    let duration = 750;
    let startTheta = this.theta;
    let startPhi = this.phi;
    let start = Date.now();

    let animate = () => {
      let progress = Date.now() - start;
      let elapsed = progress / duration;
      elapsed = elapsed > 1 ? 1 : elapsed;
      if (progress >= duration) {
        return cancelAnimationFrame(id);
      }
      this.theta = startTheta  + (endTheta - startTheta) * easeOutBack(elapsed);
      this.phi = startPhi + (0 - startPhi) * easeOutBack(elapsed);
      return requestAnimationFrame(animate);
    };
    let id = animate();
  }

  isInIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  destroy() {

      if(window.PointerEvent) {

          this.el.removeEventListener('pointerdown', this.onMouseDown);
          this.el.removeEventListener('pointermove', this.onMouseMove);
          this.el.removeEventListener('pointerup', this.onMouseUp);

      } else {

          this.el.removeEventListener('mousedown', this.onMouseDown);
          document.removeEventListener('mousemove', this.onMouseMove);
          document.removeEventListener('mouseup', this.onMouseUp);
          this.el.removeEventListener('touchstart', this.onTouchStart);
          document.removeEventListener('touchmove', this.onTouchMove);
          document.removeEventListener('touchend', this.onTouchEnd);

      }

  }

  getCurrentStyle() {
    return `height: ${parseInt(this.el.style.height, 10)}px; width: ${parseInt(this.el.style.width, 10)}px; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: rgba(0,0,0,0);`;
  }

  addDraggingStyle() {
    //this.el.setAttribute('style', `${this.getCurrentStyle()} cursor: -webkit-grabbing; cursor: -moz-grabbing; cursor: grabbing;`);
  }

  addDraggableStyle() {
    //this.el.setAttribute('style', `${this.getCurrentStyle()} cursor: -webkit-grab; cursor: -moz-grab; cursor: grab;`);
  }

  onMessage(event) {
    let {orientation, portrait, rotationRate} = event.data;
    if (!rotationRate) return;
    this.onDeviceMotion({orientation, portrait, rotationRate});
  }

  onDeviceMotion(event) {
    let orientation;

    let screenOrientation = screen.orientation || screen.msOrientation || screen.mozOrientation;

    if (event.orientation !== undefined) {
      orientation = event.orientation;
    } else if (window.orientation !== undefined) {
      orientation = window.orientation;
    } else if (screenOrientation) {

        let type = screenOrientation.type || screenOrientation;

        switch (type) {
            case 'portrait-primary':
                orientation = utils.isEdge ? -90 : 90;
                break;
            case 'portrait-secondary':
                orientation = utils.isEdge ? 90: -90;
                break;
            case 'landscape-primary':
                orientation = 0;
                break;
            case 'landscape-secondary':
                orientation = 180;
                break;
            default:
                orientation = 0;
        }

    } else {
        orientation = 0;
    }

    let beta = utils.isEdge ? THREE.Math.degToRad(event.rotationRate.beta) : THREE.Math.degToRad(event.rotationRate.alpha);
    let gamma = utils.isEdge ? THREE.Math.degToRad(event.rotationRate.gamma) : THREE.Math.degToRad(event.rotationRate.beta);

    switch (orientation) {
        case 0:
            this.phi = this.verticalPanning ? this.phi + beta * this.velo : this.phi;
            this.theta = this.theta + gamma * this.velo;
            break;
        case 180:
            this.phi = this.verticalPanning ? this.phi - beta * this.velo : this.phi;
            this.theta = this.theta - gamma * this.velo;
            break;
        case 90:
            this.phi = this.verticalPanning ? this.phi - gamma * this.velo : this.phi;
            this.theta = this.theta + beta * this.velo;
            break;
        case -90:
            this.phi = this.verticalPanning ? this.phi + gamma * this.velo : this.phi;
            this.theta = this.theta - beta * this.velo;
            break;
    }

    this.adjustPhi();
  }

    onMouseDown(event) {

        if(event.type == 'pointerdown') {
            this.el.setPointerCapture(event.pointerId);
        }

        this.addDraggingStyle();
        this.rotateStart.set(event.clientX, event.clientY);
        this.isUserInteracting = true;
        this.momentum = false;
        this.onDragStart && this.onDragStart();
    }

  onMouseMove(event) {

    this.calculateDragMove(event.clientX, event.clientY);

  }

  onTouchMove(event) {


      this.calculateDragMove(event.touches[0].pageX, event.touches[0].pageY);
      event.preventDefault();

  }

    onMouseUp() {
        this.isUserInteracting && this.onDragStop && this.onDragStop();
        this.addDraggableStyle();
        this.isUserInteracting = false;
        this.momentum = true;
    }

  calculateDragMove(x,y) {

      if(!this.isUserInteracting) {
          return;
      }
      this.rotateEnd.set(x, y);

      this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
      this.rotateStart.copy(this.rotateEnd);

      this.phi = this.verticalPanning ? this.phi + 2 * Math.PI * this.rotateDelta.y / this.renderer.height * 0.3 : this.phi;
      this.theta += 2 * Math.PI * this.rotateDelta.x / this.renderer.width * 0.5;
      this.adjustPhi();

  }

  adjustPhi() {
    // Prevent looking too far up or down.
    this.phi = THREE.Math.clamp(this.phi, -Math.PI / 1.95, Math.PI / 1.95);
  }



  inertia() {
    if (!this.momentum) return;
    this.rotateDelta.y *= 0.85;
    this.rotateDelta.x *= 0.85;
    this.theta += 0.005 * this.rotateDelta.x;
    this.phi = this.verticalPanning ? this.phi + 0.005 * this.rotateDelta.y : this.phi;
    this.adjustPhi();
  }



  update() {
    if ((this.phi === this.previousPhi) && (this.theta === this.previousTheta))
      return false;
    this.previousPhi = this.phi;
    this.previousTheta = this.theta;
    this.euler.set(this.phi, this.theta, 0, 'YXZ');
    this.orientation.setFromEuler(this.euler);
    this.camera.quaternion.copy(this.orientation);
    this.inertia();
    return true;
  }
}
