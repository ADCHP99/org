import type { ICargoNode, IEmpleado } from "../interfaces/IOrganigramaCargo";

export function parseOrganigramaCargo(json: any[]): ICargoNode[] {
  function toStr(v: any): string {
    return v !== undefined && v !== null ? String(v).trim() : "";
  }

  return json
    .map((item) => {
      let empleados: IEmpleado[] = [];

      if (Array.isArray(item.Empleado)) {
        empleados = item.Empleado.map((emp: any) => ({
          codigoEmpleado: emp.codigoEmpleado || "",
          nombre: emp.nombre || "",
          apellido: emp.apellido || "",
          emailCorporativo: emp.emailCorporativo || "",
          foto: emp.foto || "",
          puestoEmpleado: emp.puestoEmpleado || "",
          nombreDepartamento: toStr(emp.nombreDepartamento || ""),
          nombreCentroCosto: toStr(emp.nombreCentroCosto || ""),
          codDepAx: toStr(emp.codDepAx || ""),
          codCentroCosto: toStr(emp.codCentroCosto || ""),
          codDepartamento: toStr(emp.codDepartamento || ""),
          nombreLineaNegocio: toStr(emp.nombreLineaNegocio || ""),
          rutaManual: toStr(emp.manual || emp.rutaManual || emp.ruta),
          fechaIngreso: toStr(emp.fechaIngreso || ""),
          userid: toStr(emp.userid || ""),   //  agregado
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
            nombreDepartamento: toStr(item.Empleado.nombreDepartamento || ""),
            nombreCentroCosto: toStr(item.Empleado.nombreCentroCosto || ""),
            codDepAx: toStr(item.Empleado.codDepAx || ""),
            codCentroCosto: toStr(item.Empleado.codCentroCosto || ""),
            codDepartamento: toStr(item.Empleado.codDepartamento || ""),
            nombreLineaNegocio: toStr(item.Empleado.nombreLineaNegocio || ""),
            rutaManual: toStr(item.Empleado.manual || item.Empleado.rutaManual || item.Empleado.ruta),
            fechaIngreso: toStr(item.Empleado.fechaIngreso || ""),
            userid: toStr(item.Empleado.userid || ""),  //  agregado
          },
        ];
      }

      // Deduplicar empleados por codigoEmpleado
      const unique = Array.from(
        new Map(empleados.map((e) => [e.codigoEmpleado, e])).values()
      );

      const isVacante = item.esVacante === 1 || item.esVacante === "1";

      if (isVacante && !toStr(item.puesto)) return null;

      return {
        id: `C-${item.codigoPosicion}`,
        parentId: item.codigoPosicionReporta ? `C-${item.codigoPosicionReporta}` : null,
        tipo: "cargo",
        puesto: toStr(item.puesto) || "(Sin puesto)",

        codDepartamento: toStr(item.codDepartamento) || undefined,
        nombreDepartamento: toStr(item.nombreDepartamento) || undefined,
        codCentroCosto: toStr(item.codCentroCosto) || undefined,
        nombreCentroCosto: toStr(item.nombreCentroCosto) || undefined,
        codLineaNegocio: toStr(item.codLineaNegocio) || undefined,
        nombreLineaNegocio: toStr(item.nombreLineaNegocio) || undefined,

        descripcionCargo: toStr(item.descripcionCargo || ""),
        estadoCargo: toStr(item.estadoCargo || ""),
        esVacante: isVacante,
        empleados: unique,
      } as ICargoNode;
    })
    .filter((n) => n !== null) as ICargoNode[];
}
