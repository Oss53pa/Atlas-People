import { Capacitor } from '@capacitor/core';

/**
 * Vrai quand l'application s'exécute dans la coque native Capacitor (APK Android).
 * Faux dans un navigateur classique (desktop/mobile web).
 *
 * Sert à restreindre l'app mobile aux espaces self-service (Employé + Manager)
 * et à masquer le back-office RH, qui est desktop-first.
 */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}
