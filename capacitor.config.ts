import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor — empaquetage Android d'Atlas People.
 *
 * Mode « wrapper du site live » : l'APK est une coque native légère qui
 * charge l'application déployée (Vercel). L'auth Supabase, le multi-tenant
 * et les données restent ceux de la prod, et l'app est toujours à jour sans
 * republier l'APK. Pour basculer sur une version embarquée (offline), retirer
 * le bloc `server.url` : Capacitor servira alors le contenu de `webDir` (dist).
 *
 * L'APK cible UNIQUEMENT l'espace employé (ESS) : `server.url` pointe sur la
 * route `/espace` (PortalLayout, requireRole="employee"). Le back-office RH
 * n'est pas l'entrée de l'app mobile.
 */
const config: CapacitorConfig = {
  appId: 'org.atlasstudio.atlaspeople',
  appName: 'Atlas People',
  webDir: 'dist',
  server: {
    url: 'https://atlas-people.atlas-studio.org/espace',
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
