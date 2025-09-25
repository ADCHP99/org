export interface IEmpleadoNode {
  id: string;
  parentId: string | null;
  tipo: "persona" | "virtual" | "vacante";
  codigoEmpleado: string;
  nombre: string;
  apellido: string;

  puesto?: string;

  // Códigos crudos
  departamento?: string;
  centroCosto?: string;
  unidadNegocio?: string;

  // Nombres legibles
  nombreDepartamento?: string;
  nombreCentroCosto?: string;
  nombreLineaNegocio?: string;

  emailCorporativo?: string;
  foto?: string;

  // Opcionales de jerarquía
  codigoPosicion?: string;
  codigoPosicionReporta?: string;
  vacante?: boolean;
  rutaManual?: string;
}
