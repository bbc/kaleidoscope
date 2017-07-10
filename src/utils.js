export default {
  isiOS() {
    return /(ipad|iphone|ipod)/ig.test(navigator.userAgent);
  },
  isEdge() {
      return /\sedge\//ig.test(navigator.userAgent);
  },
  isWindows() {
      return navigator.platform.indexOf('Win') > -1;
  },
  shouldUseAudioDriver() {
    let isOldiOSOnIphone = /iphone.*(7|8|9)_[0-9]/i.test(navigator.userAgent);
    let isWebView = /(iPhone|iPod).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent);
    return isOldiOSOnIphone || isWebView;
  },
  shouldUseCanvasInBetween() {
    return /trident|edge/i.test(navigator.userAgent);
  },
}
