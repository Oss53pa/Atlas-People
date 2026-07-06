/**
 * Provider effectif de l'app.
 *
 * Depuis le socle Lot 0.0 (auth réelle + RLS membership + grants), le tenant
 * démo authentifié PEUT écrire dans atlas_people_reports (RLS is_hr_or_admin).
 * Le no-op silencieux d'antan est donc supprimé : les écritures passent
 * réellement par Supabase, et l'isolation reste garantie par la RLS — jamais
 * par un mensonge côté client (règle CDC « jamais d'échec silencieux »).
 */
import { supabaseProvider } from './supabaseProvider';
import type { DataProvider } from './provider';

/** Le provider effectif utilisé par l'app. */
export const dataProvider: DataProvider = supabaseProvider;
