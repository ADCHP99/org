import type { ICargoNode, IEmpleado } from "../interfaces/IOrganigramaCargo";

export function parseOrganigramaCargo(json: any): ICargoNode[] {
  function toStr(v: any): string {
    return v !== undefined && v !== null ? String(v).trim() : "";
  }

  if (!json) return [];

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
    const codPos = toStr(item.codigoPosicion || item.COD_POSICION || item.Cod_Posicion);
    if (!codPos) continue;

    if (!cargosMap.has(codPos)) {
      cargosMap.set(codPos, { base: item, empleados: [] });
    }
    const group = cargosMap.get(codPos)!;

    const empleadosArr: IEmpleado[] = [];
    const empleadosRaw = Array.isArray(item.Empleado)
      ? item.Empleado
      : item.Empleado
      ? [item.Empleado]
      : [];

    for (const emp of empleadosRaw) {
      if (!emp) continue;

      const empCodPos =
        toStr(emp.codigoPosicion) ||
        toStr(emp.COD_POSICION) ||
        toStr(emp.Cod_Posicion) ||
        codPos;

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

    for (const emp of empleadosArr) {
      const empPos = emp.codigoPosicion || codPos;
      if (empPos === codPos && !group.empleados.some((e) => e.codigoEmpleado === emp.codigoEmpleado)) {
        group.empleados.push(emp);
      }
    }
  }

  const nodos: ICargoNode[] = [];

  for (const [codigoPosicion, { base, empleados }] of cargosMap.entries()) {
    const isVacante = empleados.length === 0;
    const puesto = toStr(base.puesto || base.DESCRIPCION);
    if (!puesto) continue;

    const empRef = empleados[0] || {};

    const lineaNeg = toStr(base.nombreLineaNegocio) || toStr(empRef.nombreLineaNegocio);
    const centro = toStr(base.nombreCentroCosto) || toStr(empRef.nombreCentroCosto);
    const dep = toStr(base.nombreDepartamento) || toStr(empRef.nombreDepartamento);
    const codDep = toStr(base.codDepartamento) || toStr(empRef.codDepartamento);
    const codCentro = toStr(base.codCentroCosto) || toStr(empRef.codCentroCosto);
    const codLinea = toStr(base.codLineaNegocio) || toStr(empRef.codDepAx);

    // Normalizar nivel jerárquico
    const nivelJerarquico =
      Number(base.nivelJerarquico ?? 99) >= 3 && Number(base.nivelJerarquico) <= 7
        ? Number(base.nivelJerarquico)
        : 99;

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
      nivelJerarquico, 
    });
  }

  console.log("✅ Cargos parseados correctamente:", nodos.length);
  return nodos;
}