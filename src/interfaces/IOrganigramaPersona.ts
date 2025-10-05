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
    codCentroCosto?: string;
    codDepAx?: string;

    children?: IEmpleadoNode[]; 
    fechaIngreso?: string;
    userid?: string;

}
export interface IEmpleadoRaw {
  codigoPosicion?: string;
  CodigoPosicion?: string; // a veces llega con mayúscula
  codigoPosicionReporta?: string;
  CodigoPosicionReporta?: string;
  codigoEmpleado?: string;
  codigoEmpleadoJefe?: string;
  JefeInmediato?: { codigoEmpleadoJefe?: string };
  vacante?: string;
  puesto?: string;
  departamento?: string;
  centroCosto?: string;
  unidadNegocio?: string;
  nombreDepartamento?: string;
  nombreCentroCosto?: string;
  codDepAx?: string;
  nombreLineaNegocio?: string;
  emailCorporativo?: string;
  foto?: string;
  nombre?: string;
  apellido?: string;
  rutaManual?: string;
  ruta?: string;
  codCentroCosto?: string;  
  fechaIngreso?:string;
  userid?:string;
}
