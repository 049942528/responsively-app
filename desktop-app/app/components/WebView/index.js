// @flow
import React, {Component, createRef} from 'react';
import {ipcRenderer} from 'electron';
import pubsub from 'pubsub.js';
import BugIcon from '../icons/Bug';
import cx from 'classnames';

import styles from './style.module.css';

const MESSAGE_TYPES = {
  scroll: 'scroll',
  click: 'click',
};

class WebView extends Component {
  constructor(props) {
    super(props);
    this.webviewRef = createRef();
  }

  componentDidMount() {
    this.webviewRef.current.addEventListener(
      'ipc-message',
      this.messageHandler
    );
    pubsub.subscribe('scroll', this.processScrollEvent);
    pubsub.subscribe('click', this.processClickEvent);

    this.webviewRef.current.addEventListener('dom-ready', () => {
      this.initEventTriggers(this.webviewRef.current);
    });

    this.webviewRef.current.addEventListener('will-navigate', ({url}) => {
      console.log('Navigating to ', url);
      this.props.onAddressChange(url);
    });
  }

  processScrollEvent = message => {
    if (message.sourceDeviceId === this.props.device.id) {
      return;
    }
    this.webviewRef.current.send('scrollMessage', message.position);
  };

  processClickEvent = message => {
    if (message.sourceDeviceId === this.props.device.id) {
      return;
    }
    this.webviewRef.current.send('clickMessage', message);
  };

  messageHandler = ({channel: type, args: [message]}) => {
    console.log('Message recieved', message);
    switch (type) {
      case MESSAGE_TYPES.scroll:
        pubsub.publish('scroll', [message]);
        return;
      case MESSAGE_TYPES.click:
        pubsub.publish('click', [message]);
        return;
    }
  };

  initEventTriggers = webview => {
    console.log('Initializing triggers');
    webview.getWebContents().executeJavaScript(`
      responsivelyApp.deviceId = ${this.props.device.id};
      document.body.addEventListener('mouseleave', () => responsivelyApp.mouseOn = false)
      document.body.addEventListener('mouseenter', () => responsivelyApp.mouseOn = true)

      window.addEventListener('scroll', (e) => {
        if (!responsivelyApp.mouseOn) {
          return;
        }
        window.responsivelyApp.sendMessageToHost(
          '${MESSAGE_TYPES.scroll}', 
          {
            sourceDeviceId: window.responsivelyApp.deviceId,
            position: {x: window.scrollX, y: window.scrollY},
          }
        );
      });

      document.querySelectorAll('*')
        .forEach(elem => {
          elem.addEventListener('click', e => {
            if (e.responsivelyAppProcessed) {
              return;
            }
            e.responsivelyAppProcessed = true; 
            console.log('clicked', e);
            window.responsivelyApp.sendMessageToHost(
              '${MESSAGE_TYPES.click}', 
              {
                sourceDeviceId: window.responsivelyApp.deviceId,
                cssPath: window.responsivelyApp.cssPath(e.target),
              }
            );
          });
        });
    `);
  };

  _toggleDevTools = () => {
    this.webviewRef.current.getWebContents().toggleDevTools();
  };

  render() {
    console.log('WebView this.props', this.props);
    const {device, browser} = this.props;
    return (
      <div className={cx(styles.webViewContainer)}>
        <div className={cx(styles.webViewToolbar)}>
          <div
            className={cx(styles.webViewToolbarIcons)}
            onClick={this._toggleDevTools}
          >
            <BugIcon width={20} color="lightgrey" />
          </div>
        </div>
        <webview
          ref={this.webviewRef}
          preload="./preload.js"
          className={cx(styles.device)}
          src={browser.address || 'about:blank'}
          useragent={device.useragent}
          style={{
            width: device.width,
            height: device.height,
            transform: `scale(${browser.zoomLevel})`,
          }}
        />
      </div>
    );
  }
}

export default WebView;
