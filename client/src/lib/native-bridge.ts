/** Thin wrapper around the Android WebView JavascriptInterface (`window.DennyNative`). */

export type DennyNativeBridge = {
  isNativeApp: () => boolean;
  getVersion: () => string;
  getVersionCode: () => number;
  canBiometricLogin: () => boolean;
  getRememberedUsername: () => string;
  onLoginSuccess: (username: string, password: string, rememberDevice: boolean) => void;
  requestBiometricLogin: () => void;
  onLogout: () => void;
};

declare global {
  interface Window {
    DennyNative?: DennyNativeBridge;
    __DENNY_NATIVE__?: boolean;
    __DENNY_CAN_BIOMETRIC__?: boolean;
    __DENNY_REMEMBERED_USER__?: string;
    __dennyOnBiometricUnlock?: (payload: { username: string; password: string }) => void;
    __dennyOnBiometricError?: (message: string) => void;
  }
}

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.__DENNY_NATIVE__ || window.DennyNative?.isNativeApp?.());
}

export function canBiometricLogin(): boolean {
  try {
    if (window.__DENNY_CAN_BIOMETRIC__) return true;
    return Boolean(window.DennyNative?.canBiometricLogin?.());
  } catch {
    return false;
  }
}

export function getRememberedUsername(): string {
  try {
    return (
      window.__DENNY_REMEMBERED_USER__ ||
      window.DennyNative?.getRememberedUsername?.() ||
      ""
    );
  } catch {
    return "";
  }
}

export function notifyNativeLogin(
  username: string,
  password: string,
  rememberDevice: boolean,
): void {
  try {
    window.DennyNative?.onLoginSuccess?.(username, password, rememberDevice);
  } catch {
    // Browser / non-bridge environments
  }
}

export function requestBiometricLogin(): void {
  try {
    window.DennyNative?.requestBiometricLogin?.();
  } catch {
    // Browser / non-bridge environments
  }
}

export function notifyNativeLogout(): void {
  try {
    window.DennyNative?.onLogout?.();
  } catch {
    // Browser / non-bridge environments
  }
}

export function getNativeAppVersion(): string | null {
  try {
    return window.DennyNative?.getVersion?.() ?? null;
  } catch {
    return null;
  }
}
