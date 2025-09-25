import type { ICargoNode, IEmpleado } from "../interfaces/IOrganigramaCargo";

export function parseOrganigramaCargo(json: any[]): ICargoNode[] {
  function toStr(v: any): string {
    return v !== undefined && v !== null ? String(v).trim() : "";
  }

  return json.map((item) => {
    let empleados: IEmpleado[] = [];

    if (Array.isArray(item.Empleado)) {
      empleados = item.Empleado.map((emp: any) => ({
        codigoEmpleado: emp.codigoEmpleado || "",
        nombre: emp.nombre || "",
        apellido: emp.apellido || "",
        emailCorporativo: emp.emailCorporativo || "",
        foto: emp.foto || "",
        puestoEmpleado: emp.puestoEmpleado || "",
        nombreDepartamento: emp.nombreDepartamento || undefined,
        nombreCentroCosto: emp.nombreCentroCosto || undefined,
        codDepAx: emp.codDepAx || undefined,
        nombreLineaNegocio: emp.nombreLineaNegocio || undefined,
        // ✅ ahora lo sacamos de emp
        rutaManual: toStr(emp.manual || emp.rutaManual || emp.ruta),

      }));
    } else if (item.Empleado) {
      empleados = [
        {
          codigoEmpleado: item.Empleado.codigoEmpleado || "",
          nombre: item.Empleado.nombre || "",
          apellido: item.Empleado.apellido || "",
          emailCorporativo: item.Empleado.emailCorporativo || "",
          foto: item.Empleado.foto || "",
          puestoEmpleado: item.Empleado.puestoEmpleado || "",
          nombreDepartamento: item.Empleado.nombreDepartamento || undefined,
          nombreCentroCosto: item.Empleado.nombreCentroCosto || undefined,
          codDepAx: item.Empleado.codDepAx || undefined,
          nombreLineaNegocio: item.Empleado.nombreLineaNegocio || undefined,
          // ✅ también de item.Empleado
          rutaManual: toStr(item.manual || item.rutaManual || item.ruta),
        },
      ];
    }

    // 🔹 Deduplicar empleados por codigoEmpleado
    const unique = Array.from(
      new Map(empleados.map((e) => [e.codigoEmpleado, e])).values()
    );

    return {
      id: `C-${item.codigoPosicion}`,
      parentId: item.codigoPosicionReporta
        ? `C-${item.codigoPosicionReporta}`
        : null,
      tipo: "cargo",
      puesto: item.puesto || "(Sin puesto)",

      codDepartamento: item.codDepartamento || undefined,
      nombreDepartamento: item.nombreDepartamento || undefined,
      codCentroCosto: item.codCentroCosto || undefined,
      nombreCentroCosto: item.nombreCentroCosto || undefined,
      codLineaNegocio: item.codLineaNegocio || undefined,
      nombreLineaNegocio: item.nombreLineaNegocio || undefined,

      descripcionCargo: item.descripcionCargo || undefined,
      estadoCargo: item.estadoCargo || undefined,
      esVacante: item.esVacante === 1 || item.esVacante === "1",

      empleados: unique, // 👉 empleados únicos con rutaManual incluida
    };
  });
}
