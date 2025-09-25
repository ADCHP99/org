import type { ICargoNode } from "../interfaces/IOrganigramaCargo";
import { parseOrganigramaCargo } from "../utils/parseOrganigramaCargo";
import type { IEmpleadoNode } from "../interfaces/IOrganigramaPersona";
import { parseOrganigramaPersona } from "../utils/parseOrganigramaPersona";

const API_URL = "http://localhost:8080/wordpress/wp-json/delportal/v1";

interface ICargoRaw {
  codigoPosicion?: string;
  codigoPosicionReporta?: string;
  puesto?: string;
  departamento?: string;
  centroCosto?: string;
  unidadNegocio?: string;
  estadoCargo?: string;
  Empleado?: any;
}

export async function fetchOrganigramaCargo(
  filters?: { codigoEmpleado?: string; codDepAx?: string; departamento?: string }
): Promise<ICargoNode[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.codigoEmpleado) params.append("codigoEmpleado", filters.codigoEmpleado);
    if (filters?.codDepAx) params.append("codDepAx", filters.codDepAx);
    if (filters?.departamento) params.append("departamento", filters.departamento);

    // URL siempre debe apuntar al endpoint correcto
    const query = params.toString();
    const url = query
      ? `${API_URL}/get_organigrama_cargo?${query}`
      : `${API_URL}/get_organigrama_cargo`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error(`Error al obtener organigrama cargo`);

    const json = await response.json();

    let cargos: ICargoRaw[] = [];
    if (Array.isArray(json)) {
      cargos = json;
    } else if (json?.Organigrama?.Cargo) {
      cargos = Array.isArray(json.Organigrama.Cargo)
        ? json.Organigrama.Cargo
        : [json.Organigrama.Cargo];
    } else if (json?.Cargo) {
      cargos = Array.isArray(json.Cargo) ? json.Cargo : [json.Cargo];
    } else {
      console.warn("Respuesta inesperada en organigrama cargo:", json);
      return [];
    }

    return parseOrganigramaCargo(cargos);
  } catch (error) {
    console.error("Error en fetchOrganigramaCargo:", error);
    return [];
  }
}

export async function fetchOrganigramaPersona(): Promise<IEmpleadoNode[]> {
  try {
    const response = await fetch(`${API_URL}/get_organigrama_persona`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error(`Error al obtener organigrama persona`);

    const json = await response.json();
    console.log("Respuesta organigrama persona:", json); // 👈 para debug

    let personas: any[] = [];

    if (Array.isArray(json)) {
      // Caso: array plano
      personas = json;
    } else if (json?.Organigrama?.Persona) {
      // Caso: dentro de Organigrama
      personas = Array.isArray(json.Organigrama.Persona)
        ? json.Organigrama.Persona
        : [json.Organigrama.Persona];
    } else if (json?.Persona) {
      // Caso: sin Organigrama, pero con Persona directo
      personas = Array.isArray(json.Persona) ? json.Persona : [json.Persona];
    } else {
      console.warn("Estructura inesperada en respuesta persona:", json);
    }

    return parseOrganigramaPersona(personas);
  } catch (error) {
    console.error("Error en fetchOrganigramaPersona:", error);
    return [];
  }
}

