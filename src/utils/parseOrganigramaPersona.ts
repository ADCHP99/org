import type { IEmpleadoNode, IEmpleadoRaw } from "../interfaces/IOrganigramaPersona";

function toStr(v: any): string {
  return v !== undefined && v !== null ? String(v).trim() : "";
}

function preferirUserIdValido(lista: string[]): string {
  const limpio = lista.map(toStr).filter(Boolean);
  const conLetras = limpio.find((u) => /[a-zA-Z]/.test(u));
  if (conLetras) return conLetras.toLowerCase();
  const numerico = limpio.find((u) => /^[0-9]+$/.test(u));
  if (numerico) return numerico;
  return "";
}

function normalizarUserId(input: any): string {
  const raw = toStr(input);
  if (!raw) return "";

  if (raw.includes("\\")) {
    const partes = raw.split("\\");
    const valor = partes[1]?.trim().toLowerCase() || "";
    return valor;
  }

  return raw.trim().toLowerCase();
}

export function parseOrganigramaPersona(json: IEmpleadoRaw[]): IEmpleadoNode[] {
  const nodos: IEmpleadoNode[] = [];
  const posToEmp: Record<string, string> = {};

  //  Filtrar duplicados preferidos
  const filtrado = Object.values(
    json.reduce((acc, item) => {
      const codigo = toStr(item.codigoEmpleado);
      const userid = toStr(item.userid);

      if (!acc[codigo]) {
        acc[codigo] = item;
      } else {
        const actual = toStr(acc[codigo].userid);
        const nuevoTieneLetras = /[a-zA-Z]/.test(userid);
        const actualTieneLetras = /[a-zA-Z]/.test(actual);

        if (nuevoTieneLetras && !actualTieneLetras) acc[codigo] = item;
      }

      return acc;
    }, {} as Record<string, IEmpleadoRaw>)
  );

  //  Indexar posición → empleado real
  json.forEach((item) => {
    const codigoPosicion = toStr(item.codigoPosicion || (item as any).CodigoPosicion);
    const codigoEmpleado = toStr(item.codigoEmpleado);
    if (codigoEmpleado && codigoPosicion && item.vacante !== "1") {
      posToEmp[codigoPosicion] = codigoEmpleado;
    }
  });

  // Construir nodos persona/vacante
  json.forEach((item) => {
    const codigoPosicion = toStr(item.codigoPosicion || (item as any).CodigoPosicion);
    let codigoPosicionReporta = toStr(
      item.codigoPosicionReporta || (item as any).CodigoPosicionReporta
    );

    if (!codigoPosicion) return;
    if (codigoPosicion === "00006") return;
    if (codigoPosicionReporta === "00006" && codigoPosicion !== "00001") return;

    if (codigoPosicion === "00001") codigoPosicionReporta = "";

    let parentId: string | null = null;
    if (codigoPosicion === "00001") parentId = null;
    else if (item.codigoEmpleadoJefe || item.JefeInmediato?.codigoEmpleadoJefe) {
      const jefeEmpleado =
        item.codigoEmpleadoJefe || item.JefeInmediato?.codigoEmpleadoJefe;
      parentId = jefeEmpleado ? `E-${toStr(jefeEmpleado)}` : null;
    } else if (codigoPosicionReporta) {
      const jefePorPos = posToEmp[codigoPosicionReporta];
      parentId = jefePorPos ? `E-${jefePorPos}` : `P-${codigoPosicionReporta}`;
    }

    const esVacante = item.vacante === "1" || !toStr(item.codigoEmpleado);
    const nodeId = esVacante ? `P-${codigoPosicion}` : `E-${toStr(item.codigoEmpleado)}`;
    if (parentId === nodeId) parentId = null;

    //Normalizar nivel jerárquico (3–7 o 99)
    const nivelJerarquico =
      Number(item.nivelJerarquico ?? 99) >= 3 && Number(item.nivelJerarquico) <= 7
        ? Number(item.nivelJerarquico)
        : 99;

    if (esVacante) {
      if (!toStr(item.puesto)) return;
      nodos.push({
        id: nodeId,
        parentId,
        tipo: "vacante",
        codigoEmpleado: "",
        nombre: "VACANTE",
        apellido: "",
        puesto: toStr(item.puesto),
        departamento: toStr(item.departamento),
        centroCosto: toStr(item.centroCosto),
        unidadNegocio: toStr(item.unidadNegocio),
        nombreDepartamento: toStr(item.nombreDepartamento),
        nombreCentroCosto: toStr(item.nombreCentroCosto),
        nombreLineaNegocio: toStr(item.nombreLineaNegocio),
        emailCorporativo: "",
        foto: "",
        codigoPosicion,
        codigoPosicionReporta,
        vacante: true,
        rutaManual: "",
        userid: "",
        nivelJerarquico,
      });
    } else {
      nodos.push({
        id: nodeId,
        parentId,
        tipo: "persona",
        codigoEmpleado: toStr(item.codigoEmpleado),
        nombre: toStr(item.nombre),
        apellido: toStr(item.apellido),
        puesto: toStr(item.puesto),
        departamento: toStr(item.departamento),
        centroCosto: toStr(item.centroCosto),
        unidadNegocio: toStr(item.unidadNegocio),
        nombreDepartamento: toStr(item.nombreDepartamento),
        nombreCentroCosto: toStr(item.nombreCentroCosto),
        nombreLineaNegocio: toStr(item.nombreLineaNegocio),
        emailCorporativo: toStr(item.emailCorporativo),
        foto: toStr(item.foto),
        codigoPosicion,
        codigoPosicionReporta,
        vacante: false,
        rutaManual: toStr((item as any).rutaManual || (item as any).ruta),
        fechaIngreso: toStr(item.fechaIngreso || ""),
        userid: normalizarUserId(item.userid || ""),
        nivelJerarquico,
      });
    }
  });

  //  Limpiar raíces múltiples
  const roots = nodos.filter((n) => n.parentId === null);
  if (roots.length > 1) {
    const presidente = nodos.find((n) => n.codigoPosicion === "00001");
    const rootId = presidente ? presidente.id : roots[0].id;
    const filtrados = nodos.filter((n) => n.parentId !== null || n.id === rootId);
    nodos.splice(0, nodos.length, ...filtrados);
  }

  // 🔹 Validar duplicados
  const ids = new Set<string>();
  nodos.forEach((n) => {
    if (ids.has(n.id)) console.warn("⚠️ Duplicado detectado:", n.id);
    ids.add(n.id);
  });

  return nodos;
}
