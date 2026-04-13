/**
 * Unwraps a paginated DRF response.
 * If `data` is a paginated object (has a `results` array), returns `results`.
 * If `data` is already an array, returns it as-is.
 * Otherwise returns an empty array as a safe fallback.
 */
export function unwrapPaginated<T>(data: any): T[] {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
}
