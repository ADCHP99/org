import type { IEmpleadoNode, IEmpleadoRaw } from "../interfaces/IOrganigramaPersona";

function toStr(v: any): string {
  return v !== undefined && v !== null ? String(v).trim() : "";
}
function preferirUserIdValido(lista: string[]): string {
  // Devuelve el userid con letras si existe, si no el primero numérico
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

  // Si viene con dominio (interno\algo)
  if (raw.includes("\\")) {
    const partes = raw.split("\\");
    const valor = partes[1]?.trim().toLowerCase() || "";

    // si el valor del dominio contiene letras, se asume login (achucuyan)
    if (/[a-zA-Z]/.test(valor)) {
      return valor;
    } else {
      // si solo tiene números, se asume que es cédula
      return valor;
    }
  }

  // Si no trae dominio
  const limpio = raw.trim().toLowerCase();

  // Si tiene letras → achucuyan
  if (/[a-zA-Z]/.test(limpio)) {
    return limpio;
  }

  // Si es solo números → cédula
  if (/^[0-9]+$/.test(limpio)) {
    return limpio;
  }

  // Caso raro: mezcla o vacío
  return limpio;
}



export function parseOrganigramaPersona(json: IEmpleadoRaw[]): IEmpleadoNode[] {
  const nodos: IEmpleadoNode[] = [];
  const posToEmp: Record<string, string> = {};
  // 🔎 Filtrar duplicados: preferir registros con userid alfanumérico (login)
const filtrado = Object.values(
  json.reduce((acc, item) => {
    const codigo = toStr(item.codigoEmpleado);
    const userid = toStr(item.userid);

    // Si aún no hay registro para este empleado, lo agregamos
    if (!acc[codigo]) {
      acc[codigo] = item;
    } else {
      // Si ya existe, priorizamos el que tenga letras en el userid
      const actual = toStr(acc[codigo].userid);
      const nuevoTieneLetras = /[a-zA-Z]/.test(userid);
      const actualTieneLetras = /[a-zA-Z]/.test(actual);

      if (nuevoTieneLetras && !actualTieneLetras) {
        acc[codigo] = item;
      }
    }

    return acc;
  }, {} as Record<string, IEmpleadoRaw>)
);

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
        userid:""
      });
    } else {
      //  Nodo persona
      console.log("📡 userid recibido:", item.userid);

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
        userid: normalizarUserId(item.userid || "")

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
