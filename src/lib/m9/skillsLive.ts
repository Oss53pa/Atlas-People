/**
 * M9 Compétences — lecture live minimale pour le reporting (écart de compétences).
 *
 * Le module M9 n'a pas de couche `dataLive` complète ; ce hook fournit la
 * dérivation `skillsGap` depuis les tables réelles :
 *   m9_skills · m9_skill_matrix (niveaux détenus) · m9_job_requirements (demande).
 *
 * Méthodologie (transparente) :
 *   holders  = collaborateurs au niveau ≥ 3 (maîtrise) pour la compétence
 *   required = nombre de postes exigeant la compétence (demande)
 *   gap      = max(0, required − holders)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase, isBackendConfigured } from '../supabase';

const DEMO = '11111111-1111-1111-1111-111111111111';

export interface SkillGapRow {
  skill: string;
  holders: number;
  required: number;
  gap: number;
}

export function useM9SkillsGap(tenantId = DEMO) {
  return useQuery({
    queryKey: ['m9-skills-gap', tenantId],
    queryFn: async (): Promise<SkillGapRow[]> => {
      if (!supabase) return [];
      const ap = supabase.schema('atlas_people');
      const [skillsR, matrixR, reqR] = await Promise.all([
        ap.from('m9_skills').select('id, name').eq('tenant_id', tenantId),
        ap.from('m9_skill_matrix').select('skill_id, level').eq('tenant_id', tenantId),
        ap.from('m9_job_requirements').select('skill_id').eq('tenant_id', tenantId),
      ]);
      if (skillsR.error || matrixR.error || reqR.error) return [];
      const skills = (skillsR.data ?? []) as { id: string; name: string }[];
      const matrix = (matrixR.data ?? []) as { skill_id: string; level: number | null }[];
      const reqs = (reqR.data ?? []) as { skill_id: string }[];

      const holdersBy: Record<string, number> = {};
      for (const m of matrix) if ((m.level ?? 0) >= 3) holdersBy[m.skill_id] = (holdersBy[m.skill_id] ?? 0) + 1;
      const reqBy: Record<string, number> = {};
      for (const r of reqs) reqBy[r.skill_id] = (reqBy[r.skill_id] ?? 0) + 1;

      return skills
        .map((s) => {
          const holders = holdersBy[s.id] ?? 0;
          const required = reqBy[s.id] ?? 0;
          return { skill: s.name, holders, required, gap: Math.max(0, required - holders) };
        })
        .filter((s) => s.required > 0 || s.holders > 0)
        .sort((a, b) => b.gap - a.gap);
    },
    enabled: isBackendConfigured,
    staleTime: 60_000,
  });
}
