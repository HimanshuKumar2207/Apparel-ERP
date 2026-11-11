import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

/**
 * Loads <select> options from the API.
 * optionsFrom: { endpoint, labelKey='name', valueKey='_id', labelFn, params(values,item), dependsOn }
 */
export function useOptions(field, ctx = {}) {
  const src = field.optionsFrom;
  const scopeValues = ctx.item || ctx.values || {};
  const blocked = Boolean(src?.dependsOn && !scopeValues[src.dependsOn]);
  const params = src?.params ? src.params(ctx.values, ctx.item) : undefined;

  const q = useQuery({
    queryKey: ['options', src?.endpoint, params],
    enabled: Boolean(src) && !blocked,
    staleTime: 60_000,
    queryFn: async () => (await api.get(src.endpoint, { params: { limit: 200, ...params } })).data.data,
  });

  if (!src) return { options: field.options || [], loading: false };
  const options = blocked ? [] : (q.data || []).map((d) => ({
    value: d[src.valueKey || '_id'],
    label: src.labelFn ? src.labelFn(d) : d[src.labelKey || 'name'],
    raw: d,
  }));
  return { options, loading: q.isLoading && !blocked, blocked };
}
