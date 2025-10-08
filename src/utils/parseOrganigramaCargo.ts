import type { ICargoNode, IEmpleado } from "../interfaces/IOrganigramaCargo";

export function parseOrganigramaCargo(json: any): ICargoNode[] {
  function toStr(v: any): string {
    return v !== undefined && v !== null ? String(v).trim() : "";
  }

  if (!json) return [];

  // ✅ Detectar distintas estructuras (Cargo[], Organigrama.Cargo, etc.)
  const cargosRaw =
    Array.isArray(json)
      ? json
      : json?.Cargo
      ? Array.isArray(json.Cargo)
        ? json.Cargo
        : [json.Cargo]
      : json?.Organigrama?.Cargo
      ? Array.isArray(json.Organigrama.Cargo)
        ? json.Organigrama.Cargo
        : [json.Organigrama.Cargo]
      : [];

  if (!Array.isArray(cargosRaw) || cargosRaw.length === 0) return [];

  const cargosMap = new Map<string, { base: any; empleados: IEmpleado[] }>();

  for (const item of cargosRaw) {
    // 🔹 Aceptar campo en mayúsculas o minúsculas
    const codPos = toStr(item.codigoPosicion || item.COD_POSICION);
    if (!codPos) continue;

    if (!cargosMap.has(codPos)) {
      cargosMap.set(codPos, { base: item, empleados: [] });
    }
    const group = cargosMap.get(codPos)!;

    const empleadosArr: IEmpleado[] = [];

    // 🔹 Normalizar Empleado (objeto o array)
    const empleadosRaw = Array.isArray(item.Empleado)
      ? item.Empleado
      : item.Empleado
      ? [item.Empleado]
      : [];

    for (const emp of empleadosRaw) {
      if (!emp) continue;

      // Aceptar código de posición en distintos nombres
      const empCodPos =
        toStr(emp.codigoPosicion) || toStr(emp.COD_POSICION) || codPos;

      empleadosArr.push({
        codigoEmpleado: toStr(emp.codigoEmpleado || emp.CODIGO),
        nombre: toStr(emp.nombre || emp.NOMBRE),
        apellido: toStr(emp.apellido || emp.APELLIDO),
        emailCorporativo: toStr(emp.emailCorporativo || emp.DIRECCION_E_MAIL),
        foto: toStr(emp.foto || emp.FotoWeb),
        puestoEmpleado: toStr(emp.puestoEmpleado || emp.DESCRIPCION),
        nombreDepartamento: toStr(emp.nombreDepartamento || emp.DEPARTAMENTO),
        nombreCentroCosto: toStr(emp.nombreCentroCosto || emp.CENTRO_COSTO),
        codDepAx: toStr(emp.codDepAx || emp.Cod_DepAx),
        codCentroCosto: toStr(emp.codCentroCosto || emp.Cod_CentroCosto),
        codDepartamento: toStr(emp.codDepartamento || emp.Cod_Dep),
        nombreLineaNegocio: toStr(emp.nombreLineaNegocio || emp.Desc_DepAx),
        rutaManual: toStr(emp.manual || emp.rutaManual || emp.ruta),
        fechaIngreso: toStr(emp.fechaIngreso || emp.InicioContrato),
        userid: toStr(emp.userid),
        codigoPosicion: empCodPos,
      });
    }

    // 🔹 Asociar empleados que pertenecen al mismo cargo
    for (const emp of empleadosArr) {
      if (
        emp.codigoPosicion === codPos &&
        !group.empleados.some((e) => e.codigoEmpleado === emp.codigoEmpleado)
      ) {
        group.empleados.push(emp);
      }
    }
  }

  // 🔹 Construir nodos finales
  const nodos: ICargoNode[] = [];

  for (const [codigoPosicion, { base, empleados }] of cargosMap.entries()) {
    // Solo marcar vacante si realmente no hay empleados
    const isVacante = empleados.length === 0;

    const puesto = toStr(base.puesto || base.DESCRIPCION);
    if (!puesto) continue;

    const empRef = empleados[0] || {};

    const lineaNeg =
      toStr(base.nombreLineaNegocio) || toStr(empRef.nombreLineaNegocio);
    const centro =
      toStr(base.nombreCentroCosto) || toStr(empRef.nombreCentroCosto);
    const dep =
      toStr(base.nombreDepartamento) || toStr(empRef.nombreDepartamento);
    const codDep =
      toStr(base.codDepartamento) || toStr(empRef.codDepartamento);
    const codCentro =
      toStr(base.codCentroCosto) || toStr(empRef.codCentroCosto);
    const codLinea =
      toStr(base.codLineaNegocio) || toStr(empRef.codDepAx);

    nodos.push({
      id: `C-${codigoPosicion}`,
      parentId: base.codigoPosicionReporta
        ? `C-${base.codigoPosicionReporta}`
        : null,
      tipo: "cargo",
      puesto,
      codDepartamento: codDep || undefined,
      nombreDepartamento: dep || undefined,
      codCentroCosto: codCentro || undefined,
      nombreCentroCosto: centro || undefined,
      codLineaNegocio: codLinea || undefined,
      nombreLineaNegocio: lineaNeg || undefined,
      descripcionCargo: toStr(base.descripcionCargo),
      estadoCargo: toStr(base.estadoCargo),
      esVacante: isVacante,
      empleados,
    });
  }

  console.log("✅ Cargo parseado:", nodos);
  return nodos;
}
