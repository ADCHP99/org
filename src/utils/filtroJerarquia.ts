export function filtroJerarquia<T extends { id: string; parentId?: string | null }>(
  data: T[],
  predicate: (n: T) => boolean,
  hasActiveFilter: boolean
): T[] {
  // Si no hay filtros activos → devolver todo
  if (!hasActiveFilter) return data;

  const children = new Map<string, T[]>();

  data.forEach((n) => {
    if (n.parentId) {
      if (!children.has(n.parentId)) children.set(n.parentId, []);
      children.get(n.parentId)!.push(n);
    }
  });

  const result = new Map<string, T>();

  function includeNode(node: T): boolean {
    const matches = predicate(node);
    const childMatches = (children.get(node.id) || []).some(includeNode);

    if (matches || childMatches) {
      result.set(node.id, node); // 👈 asegura unicidad por ID
      return true;
    }
    return false;
  }

  // recorrer raíces (los que no tienen parentId)
  data.filter((n) => !n.parentId).forEach(includeNode);

  // 🔹 Devolver solo nodos únicos
  return Array.from(result.values());
}
