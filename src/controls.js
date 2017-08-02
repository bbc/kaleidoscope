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
    this.inertiaVector = new THREE.Vector2();
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

          this.el.addEventListener('pointerdown', this.onMouseDown, true);
          this.el.addEventListener('pointermove', this.onMouseMove, true);
          this.el.addEventListener('pointerup', this.onMouseUp, true);

      } else {

          this.el.addEventListener('mousedown', this.onMouseDown, true);
          document.addEventListener('mousemove', this.onMouseMove, true);
          document.addEventListener('mouseup', this.onMouseUp, true);
          this.el.addEventListener('touchstart', this.onTouchStart, true);
          document.addEventListener('touchmove', this.onTouchMove, true);
          document.addEventListener('touchend', this.onTouchEnd, true);

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

          this.el.removeEventListener('pointerdown', this.onMouseDown, true);
          this.el.removeEventListener('pointermove', this.onMouseMove, true);
          this.el.removeEventListener('pointerup', this.onMouseUp, true);

      } else {

          this.el.removeEventListener('mousedown', this.onMouseDown, true);
          document.removeEventListener('mousemove', this.onMouseMove, true);
          document.removeEventListener('mouseup', this.onMouseUp, true);
          this.el.removeEventListener('touchstart', this.onTouchStart, true);
          document.removeEventListener('touchmove', this.onTouchMove, true);
          document.removeEventListener('touchend', this.onTouchEnd, true);

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
      this.inertiaVector.copy(this.rotateDelta).multiplyScalar(0.005);
      this.rotateStart.copy(this.rotateEnd);

      this.phi = this.verticalPanning ? this.phi + 2 * Math.PI * this.rotateDelta.y / this.renderer.height * 0.3 : this.phi;
      this.theta += 2 * Math.PI * this.rotateDelta.x / this.renderer.width * 0.5;
      this.adjustPhi();

  }

  startKeyMove(direction) {

      this.momentum = false;

      switch (direction) {
          case 'up':
              this.startKeyMoveVertical(direction);
              break;
          case 'down':
              this.startKeyMoveVertical(direction);
              break;
          case 'right':
              this.startKeyMoveHorizontal(direction);
              break;
          case 'left':
              this.startKeyMoveHorizontal(direction);
              break;
      }

  }

    stopKeyMove(direction) {

        if(direction == 'up' || direction == 'down') {

            cancelAnimationFrame(this.keyMoveVerticalId);
            this.keyMoveVerticalId = null;
            this.momentum = true;

        } else if (direction == 'right' || direction == 'left') {

            cancelAnimationFrame(this.keyMoveHorizontalId);
            this.keyMoveHorizontalId = null;
            this.momentum = true;

        }

    }

  startKeyMoveVertical(direction) {

      let animate = () => {

          let factor = (direction == 'up') ? 0.019 : -0.019;

          this.inertiaVector.set(0, factor);

          this.phi = this.verticalPanning ? this.phi + factor : this.phi;
          this.adjustPhi();
          this.keyMoveVerticalId = requestAnimationFrame(animate);
      };

      if(!this.keyMoveVerticalId) {
          this.keyMoveVerticalId = requestAnimationFrame(animate);
      }

  }

  startKeyMoveHorizontal(direction) {

      let animate = () => {

          let factor = (direction == 'left') ? 0.019 : -0.019;

          this.inertiaVector.set(factor, 0);

          this.theta += factor;
          this.keyMoveHorizontalId = requestAnimationFrame(animate);
      };

      if(!this.keyMoveHorizontalId) {
          this.keyMoveHorizontalId = requestAnimationFrame(animate);
      }

  }

  adjustPhi() {
    // Prevent looking too far up or down.
    this.phi = THREE.Math.clamp(this.phi, -Math.PI / 1.95, Math.PI / 1.95);
  }



  inertia() {
    if (!this.momentum) return;
      this.inertiaVector.y *= 0.85;
      this.inertiaVector.x *= 0.85;
    this.theta += this.inertiaVector.x;
    this.phi = this.verticalPanning ? this.phi + this.inertiaVector.y : this.phi;
    this.adjustPhi();

    if(Math.abs(this.inertiaVector.x) < 0.00001 && Math.abs(this.inertiaVector.y) < 0.00001 ) {
        this.momentum = false;
    }

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
