import { isNativeApp } from './platform';

/**
 * Configuration de la coque native (APK Android) au démarrage. No-op sur le web.
 *
 * Corrige l'affichage edge-to-edge d'Android 15 : par défaut le WebView dessine
 * SOUS la barre de statut, ce qui faisait chevaucher l'en-tête de l'app avec
 * l'horloge/icônes système. `overlays: false` rend la barre de statut opaque et
 * place le contenu en dessous. Fond clair + icônes sombres assortis à l'app.
 */
export async function initNativeShell(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Dark }); // contenu sombre sur fond clair
    await StatusBar.setBackgroundColor({ color: '#EFEDE6' }); // = couleur canvas
  } catch {
    /* plugin indisponible (ancienne coque) — on ignore */
  }
}
