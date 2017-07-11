
let isOldiOSOnIphone = /iphone.*(7|8|9)_[0-9]/i.test(navigator.userAgent);
let isWebView = /(iPhone|iPod).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent);

let isiOS = /(ipad|iphone|ipod)/ig.test(navigator.userAgent);
let isEdge = /\sedge\//ig.test(navigator.userAgent);
let isWindows = navigator.platform.indexOf('Win') > -1;
let isAndroidFirefox = /firefox/i.test(navigator.userAgent) && /android/i.test(navigator.userAgent) && !isEdge;
let shouldUseAudioDriver = isOldiOSOnIphone || isWebView;
let shouldUseCanvasInBetween = /trident|edge/i.test(navigator.userAgent);

export default {
    isiOS: isiOS,
    isEdge: isEdge,
    isWindows: isWindows,
    isAndroidFirefox: isAndroidFirefox,
    shouldUseAudioDriver: shouldUseAudioDriver,
    shouldUseCanvasInBetween: shouldUseCanvasInBetween
}
