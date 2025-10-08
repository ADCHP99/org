// src/services/organigramaService.ts

import type { ICargoNode } from "../interfaces/IOrganigramaCargo";
import type { IEmpleadoNode, IEmpleadoRaw } from "../interfaces/IOrganigramaPersona";
import { parseOrganigramaCargo } from "../utils/parseOrganigramaCargo";
import { parseOrganigramaPersona } from "../utils/parseOrganigramaPersona";

const API_URL = "https://mobileqa.liris.com.ec/delportal/wp-json/delportal/v1";

export async function fetchOrganigramaCargo(
  filters?: { codigoEmpleado?: string; codDepAx?: string; departamento?: string }
): Promise<ICargoNode[]> {
  try {
    const params = new URLSearchParams();

    if (filters?.codigoEmpleado) params.append("codigoEmpleado", filters.codigoEmpleado);
    if (filters?.codDepAx) params.append("codDepAx", filters.codDepAx);
    if (filters?.departamento) params.append("departamento", filters.departamento);

    const url = `${API_URL}/get_organigrama_cargo?${params.toString()}`;
    console.log("📡 Fetch Organigrama Cargo:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status} al obtener cargos`);
    }

    // 🔹 Parsear el JSON completo tal cual lo entrega el backend
    const json = await response.json();

    console.log("🧩 JSON recibido desde API:", json);

    // 🔹 Pasar el objeto completo al parser (él detecta si tiene Organigrama, Cargo, etc.)
    const cargos = parseOrganigramaCargo(json);

    console.log("✅ Cargos parseados correctamente:", cargos.length);

    return cargos;
  } catch (error) {
    console.error("❌ Error al obtener organigrama de cargos:", error);
    return [];
  }
}
export async function fetchOrganigramaPersona(): Promise<IEmpleadoNode[]> {
  try {
   


    const url = `${API_URL}/get_organigrama_persona`;
    console.log("📡 Fetch Organigrama Persona:", url);

    const response = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } });
    if (!response.ok) throw new Error(`Error HTTP ${response.status} al obtener personas`);

    const json = await response.json();
    console.log("🧩 Respuesta organigrama persona:", json);

    // Normalizar estructura
    let personasRaw: IEmpleadoRaw[] = [];
    if (Array.isArray(json)) personasRaw = json as IEmpleadoRaw[];
    else if (json?.Organigrama?.Persona) personasRaw = Array.isArray(json.Organigrama.Persona) ? json.Organigrama.Persona : [json.Organigrama.Persona];
    else if (json?.Persona) personasRaw = Array.isArray(json.Persona) ? json.Persona : [json.Persona];
    else {
      return [];
    }

    return parseOrganigramaPersona(personasRaw);
  } catch (error) {
    return [];
  }
}
