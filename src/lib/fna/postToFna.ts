/**
 * Déclencheur côté front : invoque l'Edge Function `post-to-fna`.
 * Le secret de l'API Atlas FNA reste côté serveur (souveraineté §2.5) ;
 * le front ne transmet que l'identifiant de campagne.
 */
import { supabase } from '../supabase';
import type { FnaPostResult } from './types';

export async function postRunToFna(runId: string): Promise<FnaPostResult> {
  if (!supabase) {
    // Mode démo : aucun backend configuré, déversement simulé.
    return { status: 'queued', message: 'Mode démo — déversement Atlas FNA simulé.' };
  }

  const { data, error } = await supabase.functions.invoke('post-to-fna', {
    body: { runId },
  });

  if (error) return { status: 'error', message: error.message };
  return data as FnaPostResult;
}
