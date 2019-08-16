const {ipcRenderer} = require('electron');
console.log('Preloader');
global.responsivelyApp = {
  sendMessageToHost: (type, message) => ipcRenderer.sendToHost(type, message),
  cssPath: el => {
    if (!(el instanceof Element)) return;
    var path = [];
    while (el.nodeType === Node.ELEMENT_NODE) {
      var selector = el.nodeName.toLowerCase();
      var sib = el,
        nth = 1;
      while (
        sib.nodeType === Node.ELEMENT_NODE &&
        (sib = sib.previousElementSibling) &&
        nth++
      );
      selector += ':nth-child(' + nth + ')';
      path.unshift(selector);
      el = el.parentNode;
    }
    return path.join(' > ');
  },
  eventFire: (el, etype) => {
    if (el.fireEvent) {
      el.fireEvent('on' + etype);
    } else {
      var evObj = document.createEvent('Events');
      evObj.initEvent(etype, true, false);
      evObj.responsivelyAppProcessed = true;
      el.dispatchEvent(evObj);
    }
  },
};

ipcRenderer.on('scrollMessage', (event, args) => {
  console.log('Recieved scroll message from host', event, args);
  window.scrollTo({
    top: args.y,
    left: args.x,
  });
});

ipcRenderer.on('clickMessage', (event, args) => {
  console.log('Recieved click message from host', event, args);
  const elem = document.querySelector(args.cssPath);
  if (!elem) {
    console.log('Element to click is not found', args);
    return;
  }
  window.responsivelyApp.lastClickElement = elem;
  if (elem.click) {
    elem.click();
    return;
  }
  window.responsivelyApp.eventFire(elem, 'click');
});
