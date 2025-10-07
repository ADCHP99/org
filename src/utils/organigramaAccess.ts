// src/utils/organigramaAccess.ts
function parseXml(xmlString: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(xmlString, "text/xml");
}

export function extractAccesoTotalCodesFromXml(xmlString: string): string[] {
  const doc = parseXml(xmlString);
  const nodos = Array.from(doc.querySelectorAll("AccesoTotal > Posicion"));
  return nodos
    .map((n) => n.getAttribute("codigo"))
    .filter((c): c is string => !!c);
}

export function extractResolvedUserIdFromXml(xmlString: string): string | null {
  const doc = parseXml(xmlString);
  const root = doc.querySelector("Organigrama");
  // Atributo puede venir como UserId o userid (por si acaso)
  return root?.getAttribute("UserId") || root?.getAttribute("userid") || null;
}

export function getUserFromXml(xmlString: string, resolvedUserId?: string): {
  codigoPosicion: string | null;
  nombreDepartamento: string | null;
} {
  const doc = parseXml(xmlString);
  const userId = resolvedUserId ?? extractResolvedUserIdFromXml(xmlString) ?? "";
  if (!userId) return { codigoPosicion: null, nombreDepartamento: null };

  const personas = Array.from(doc.querySelectorAll("Persona"));
  // Buscar la persona cuyo <userid> coincida con el UserId resuelto del root
  for (const p of personas) {
    const userid = p.querySelector("userid")?.textContent?.trim().toLowerCase();
    if (userid && userid === userId.toLowerCase()) {
      const codigoPosicion = p.querySelector("codigoPosicion")?.textContent?.trim() ?? null;
      const nombreDepartamento = p.querySelector("nombreDepartamento")?.textContent?.trim() ?? null;
      return { codigoPosicion, nombreDepartamento };
    }
  }
  return { codigoPosicion: null, nombreDepartamento: null };
}
