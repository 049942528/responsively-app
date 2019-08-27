// @flow
import type {Dispatch, BrowserStateType} from '../reducers/types';
import pubsub from 'pubsub.js';
import {
  SCROLL_DOWN,
  SCROLL_UP,
  NAVIGATION_BACK,
  NAVIGATION_FORWARD,
  NAVIGATION_RELOAD,
  SCREENSHOT_ALL_DEVICES,
  FLIP_ORIENTATION_ALL_DEVICES,
  ENABLE_INSPECTOR_ALL_DEVICES,
} from '../constants/pubsubEvents';

export const NEW_ADDRESS = 'NEW_ADDRESS';
export const NEW_ZOOM_LEVEL = 'NEW_ZOOM_LEVEL';
export const NEW_SCROLL_POSITION = 'NEW_SCROLL_POSITION';
export const NEW_NAVIGATOR_STATUS = 'NEW_NAVIGATOR_STATUS';
export const NEW_DRAWER_CONTENT = 'NEW_DRAWER_CONTENT';
export const NEW_PREVIEWER_CONFIG = 'NEW_PREVIEWER_CONFIG';

export function newAddress(address) {
  return {
    type: NEW_ADDRESS,
    address,
  };
}

export function newZoomLevel(zoomLevel) {
  return {
    type: NEW_ZOOM_LEVEL,
    zoomLevel,
  };
}

export function newScrollPosition(scrollPosition) {
  return {
    type: NEW_SCROLL_POSITION,
    scrollPosition,
  };
}

export function newNavigatorStatus(navigatorStatus) {
  return {
    type: NEW_NAVIGATOR_STATUS,
    navigatorStatus,
  };
}

export function newDrawerContent(drawer) {
  return {
    type: NEW_DRAWER_CONTENT,
    drawer,
  };
}

export function newPreviewerConfig(previewer) {
  return {
    type: NEW_PREVIEWER_CONFIG,
    previewer,
  };
}

export function onAddressChange(newURL) {
  return (dispatch: Dispatch, getState: RootStateType) => {
    const {
      browser: {address},
    } = getState();

    console.log('newURL', newURL);

    if (newURL === address) {
      return;
    }

    dispatch(newAddress(newURL));
  };
}

export function onZoomChange(newLevel) {
  return (dispatch: Dispatch, getState: RootStateType) => {
    const {
      browser: {zoomLevel},
    } = getState();

    if (newLevel === zoomLevel) {
      return;
    }

    dispatch(newZoomLevel(newLevel));
  };
}

export function onScrollChange({x: newX, y: newY}) {
  return (dispatch: Dispatch, getState: RootStateType) => {
    const {
      browser: {
        scrollPosition: {x, y},
      },
    } = getState();

    if (newX === x && newY === y) {
      return;
    }

    dispatch(newScrollPosition({x: newX, y: newY}));
  };
}

export function updateNavigatorStatus({
  backEnabled: newBackEnabled,
  forwardEnabled: newForwardEnabled,
}) {
  return (dispatch: Dispatch, getState: RootStateType) => {
    const {
      browser: {
        navigatorStatus: {backEnabled, forwardEnabled},
      },
    } = getState();

    if (
      newBackEnabled === backEnabled &&
      newForwardEnabled === forwardEnabled
    ) {
      return;
    }

    dispatch(
      newNavigatorStatus({
        backEnabled: newBackEnabled,
        forwardEnabled: newForwardEnabled,
      })
    );
  };
}

export function openDrawerAndSetContent(_newDrawerContent) {
  return (dispatch: Dispatch, getState: RootStateType) => {
    const {
      browser: {
        drawer: {drawerContent, open},
      },
    } = getState();

    if (_newDrawerContent === drawerContent && open) {
      return;
    }

    dispatch(
      newDrawerContent({
        content: _newDrawerContent,
        open: true,
      })
    );
  };
}

export function changeDrawerOpenState(newOpenState) {
  return (dispatch: Dispatch, getState: RootStateType) => {
    const {
      browser: {drawer},
    } = getState();

    if (newOpenState === drawer.open) {
      return;
    }

    dispatch(
      newDrawerContent({
        ...drawer,
        open: newOpenState,
      })
    );
  };
}

export function setPreviewLayout(newLayout) {
  return (dispatch: Dispatch, getState: RootStateType) => {
    const {
      browser: {previewer},
    } = getState();

    if (previewer.layout === newLayout) {
      return;
    }

    dispatch(
      newPreviewerConfig({
        ...previewer,
        layout: newLayout,
      })
    );
  };
}

export function triggerScrollDown() {
  return (dispatch: Dispatch, getState: RootStateType) => {
    console.log('triggerScrollDown');
    pubsub.publish(SCROLL_DOWN);
  };
}

export function screenshotAllDevices() {
  return (dispatch: Dispatch, getState: RootStateType) => {
    console.log('screenshotAllDevices');
    pubsub.publish(SCREENSHOT_ALL_DEVICES, [{now: new Date()}]);
  };
}

export function flipOrientationAllDevices() {
  return (dispatch: Dispatch, getState: RootStateType) => {
    console.log('flipOrientationAllDevices');
    pubsub.publish(FLIP_ORIENTATION_ALL_DEVICES);
  };
}

export function enableInpector() {
  return (dispatch: Dispatch, getState: RootStateType) => {
    console.log('enableInpector');
    pubsub.publish(ENABLE_INSPECTOR_ALL_DEVICES);
  };
}

export function triggerScrollUp() {
  return (dispatch: Dispatch, getState: RootStateType) => {
    pubsub.publish(SCROLL_UP);
  };
}

export function triggerNavigationBack() {
  return (dispatch: Dispatch, getState: RootStateType) => {
    pubsub.publish(NAVIGATION_BACK);
  };
}

export function triggerNavigationForward() {
  return (dispatch: Dispatch, getState: RootStateType) => {
    pubsub.publish(NAVIGATION_FORWARD);
  };
}

export function triggerNavigationReload() {
  return (dispatch: Dispatch, getState: RootStateType) => {
    pubsub.publish(NAVIGATION_RELOAD);
  };
}
