import {
  createNavigationContainerRef,
  StackActions,
} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
}

export function push(name: string, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.push(name, params));
  }
}

export function getParams() {
    if (navigationRef.isReady()) {
        const route = navigationRef.getCurrentRoute();
        return route?.params;
    }
    return null;
}

export function getCurrentRouteName() {
    if (navigationRef.isReady()) {
        const route = navigationRef.getCurrentRoute();
        return route?.name;
    }
    return null;
}
