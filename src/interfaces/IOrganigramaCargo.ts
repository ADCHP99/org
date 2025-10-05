// Empleado asignado a un cargo
export interface IEmpleado {
  codigoEmpleado: string;
  nombre: string;
  apellido: string;
  emailCorporativo?: string;
  foto?: string;

  // Extras que la API devuelve
  puestoEmpleado?: string;        // Puesto / cargo asignado
  nombreDepartamento?: string;    // Nombre del departamento
  nombreCentroCosto?: string;     // Nombre del centro de costo
  codDepAx?: string;              // Código línea de negocio (DepAx)
  codCentroCosto?: string;   
  codDepartamento?: string;  // Código del departamento
  nombreLineaNegocio?: string;    // Nombre de la línea de negocio
  rutaManual?: string;
  fechaIngreso?: string;      // Fecha de ingreso a la empresa
  userid?: string;  //  este lo devuelve el SP

}

// Nodo de cargo en el organigrama
export interface ICargoNode {
  id: string; // "C-<codigoPosicion>"
  parentId: string | null; // "C-<codigoPosicionReporta>"
  tipo: "cargo";

  puesto: string;                // Nombre del cargo
  codDepartamento?: string;      // ID del departamento
  codCentroCosto?: string;       // ID del centro de costo
  codLineaNegocio?: string;      // ID de la línea de negocio
  estadoCargo?: string;          // Estado del cargo (ej. "A")

  // Extras (nombres legibles)
  nombreDepartamento?: string;
  nombreCentroCosto?: string;
  nombreLineaNegocio?: string;

  descripcionCargo?: string;     // Descripción larga del cargo
  esVacante?: boolean;           // <- SP devuelve 1/0 si no hay empleados

  empleados: IEmpleado[];
}
