import type { IEmpleadoNode, IEmpleadoRaw } from "../interfaces/IOrganigramaPersona";

function toStr(v: any): string {
  return v !== undefined && v !== null ? String(v).trim() : "";
}

export function parseOrganigramaPersona(json: IEmpleadoRaw[]): IEmpleadoNode[] {
  const nodos: IEmpleadoNode[] = [];
  const posToEmp: Record<string, string> = {};

  // Indexar posición → empleado (solo si tiene persona real)
  json.forEach((item) => {
    const codigoPosicion = toStr(item.codigoPosicion || (item as any).CodigoPosicion);
    const codigoEmpleado = toStr(item.codigoEmpleado);
    if (codigoEmpleado && codigoPosicion && item.vacante !== "1") {
      posToEmp[codigoPosicion] = codigoEmpleado;
    }
  });

//  const presidenteId = posToEmp["00001"] ? `E-${posToEmp["00001"]}` : null;

  json.forEach((item) => {
    const codigoPosicion = toStr(item.codigoPosicion || (item as any).CodigoPosicion);
    let codigoPosicionReporta = toStr(item.codigoPosicionReporta || (item as any).CodigoPosicionReporta);

    //  Validación: si no hay posición, ignoramos este nodo
    if (!codigoPosicion) {
      //console.warn("⚠️ Nodo ignorado por no tener codigoPosicion:", item);
      return;
    }

    // ⚠️ Ignorar directorio (00006) excepto presidente
    if (codigoPosicion === "00006") return;
    if (codigoPosicionReporta === "00006" && codigoPosicion !== "00001") return;

    // Para el presidente, forzar como root
    if (codigoPosicion === "00001") {
      codigoPosicionReporta = "";
    }

    let parentId: string | null = null;

    if (codigoPosicion === "00001") {
      parentId = null;
    } else if (item.codigoEmpleadoJefe || item.JefeInmediato?.codigoEmpleadoJefe) {
      const jefeEmpleado =
        item.codigoEmpleadoJefe || item.JefeInmediato?.codigoEmpleadoJefe;
      parentId = jefeEmpleado ? `E-${toStr(jefeEmpleado)}` : null;
    } else if (codigoPosicionReporta) {
      const jefePorPos = posToEmp[codigoPosicionReporta];
      if (jefePorPos) {
        // jefe con persona real
        parentId = `E-${jefePorPos}`;
      } else {
        // jefe es vacante → enganchar al nodo de posición vacante
        parentId = `P-${codigoPosicionReporta}`;
      }
    }

    // ✅ Detectar si es vacante
    const esVacante = item.vacante === "1" || !toStr(item.codigoEmpleado);

    const nodeId = esVacante
      ? `P-${codigoPosicion}` // nodo de posición vacante
      : `E-${toStr(item.codigoEmpleado)}`;

    // Evitar ciclos
    if (parentId === nodeId) {
      //console.warn("⚠️ Ciclo detectado, se fuerza root:", nodeId);
      parentId = null;
    }

    if (esVacante) {
      if(!toStr(item.puesto)){
        return
      }
      // 🔎 Nodo vacante
      nodos.push({
        id: nodeId,
        parentId,
        tipo: "vacante", // ⚠️ recuerda que en la interfaz debes permitir "vacante"
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
      });
    } else {
      //  Nodo persona
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
        fechaIngreso: toStr(item.fechaIngreso || "")

      });
    }
  });

  //  Depuración: múltiples raíces
  const roots = nodos.filter((n) => n.parentId === null);
  if (roots.length > 1) {
    //console.group(" Múltiples raíces detectadas en organigrama");
    roots.forEach((r) => {
      
    });
  //  console.groupEnd();
  }

  // 🔎 Depuración: IDs duplicados
  const ids = new Set<string>();
  nodos.forEach((n) => {
    if (ids.has(n.id)) {
    //  console.error("⚠️ Duplicado detectado:", n);
    }
    ids.add(n.id);
  });
  
  return nodos;
}
