import type { AreaFocoNomeMagnetico } from './copy';
import type { ContextualRadarAxis } from './motor-radar';

export const CONTEXTUAL_RADAR_VERSION = 'contextual-v1';

/** Só reutiliza o snapshot que corresponde aos nomes exibidos e à versão suportada. */
export function readContextualRadarSnapshot(data: any, birthName: string, selectedName: string): { birth: ContextualRadarAxis[]; selected: ContextualRadarAxis[] } | null {
  const snapshot = data?.radarSnapshot;
  if (data?.radarVersion !== CONTEXTUAL_RADAR_VERSION || snapshot?.birthName !== birthName || snapshot?.selectedName !== selectedName) return null;
  const context = resolveRadarContext(data);
  if (JSON.stringify(snapshot.context) !== JSON.stringify({ areaFoco: context.areaFoco, ondeAssinaRaw: context.ondeAssinaRaw })) return null;
  const keys = ['expressao', 'motivacao', 'destino', 'harmonia_triangulo', 'sequencias'];
  const valid = (axes: unknown): axes is ContextualRadarAxis[] => Array.isArray(axes) && axes.length === keys.length && axes.every((a, i) =>
    a?.key === keys[i] && typeof a.label === 'string' && typeof a.description === 'string' && Number.isFinite(a.valuePercent) && a.valuePercent >= 0 && a.valuePercent <= 100 && a.value === a.valuePercent / 100);
  return valid(snapshot?.birth) && valid(snapshot?.selected) ? { birth: snapshot.birth, selected: snapshot.selected } : null;
}

const AREAS = new Set(['carreira_negocios', 'prosperidade_financeira', 'relacionamentos_harmonia', 'autoestima_expressao']);

/** Mesma resolução para chat, reabertura, dashboard e PDF; não inventa contexto. */
export function resolveRadarContext(data: any, ranking: any = data?.ranking) {
  const rawArea = ranking?.areaFoco ?? ranking?.area_foco ?? data?.areaFoco ?? data?.area_foco ?? data?.parametros_usuario?.areaFoco;
  const areaFoco = typeof rawArea === 'string' && AREAS.has(rawArea) ? rawArea as AreaFocoNomeMagnetico : null;
  const rawOnde = data?.ondeAssinaRaw ?? data?.ondeAssina ?? data?.ondeVaiUsar ?? data?.onde_vai_usar ?? ranking?.ondeVaiUsar ?? ranking?.onde_vai_usar;
  const ondeAssinaRaw: string[] = Array.isArray(rawOnde) ? rawOnde.filter((x: unknown): x is string => typeof x === 'string' && x.trim().length > 0) : [];
  const assinatura = data?.assinaturaAtual ?? ranking?.assinaturaAtual;
  return {
    areaFoco,
    ondeAssinaRaw,
    contextChips: [...(typeof assinatura === 'string' && assinatura.trim() ? [assinatura.trim()] : []), ...ondeAssinaRaw],
    hasContext: Boolean(areaFoco || ondeAssinaRaw.length),
  };
}
