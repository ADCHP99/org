// pages/OrganigramaPage.tsx
import React, { useEffect, useState } from "react";
import Select from "react-select";
import OrganigramaCargoComponent from "../components/OrganigramaCargoComponent";
import OrganigramaPersonaComponent from "../components/OrganigramaPersonaComponent";

import {
  fetchOrganigramaCargo,
  fetchOrganigramaPersona,
} from "../services/organigramaCargoService";

interface ViewOption {
  value: "cargo" | "persona";
  label: string;
}

interface FiltroOption {
  value: string;
  label: string;
}

const viewOptions: ViewOption[] = [
  { value: "cargo", label: "Vista por Cargo" },
  { value: "persona", label: "Vista por Persona" },
];

const OrganigramaPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewOption | null>(viewOptions[0]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Filtros
  const [lineaNegocio, setLineaNegocio] = useState<FiltroOption | null>(null);
  const [centroCosto, setCentroCosto] = useState<FiltroOption | null>(null);
  const [departamento, setDepartamento] = useState<FiltroOption | null>(null);

  // Opciones de filtros
  const [lineaNegocioOpts, setLineaNegocioOpts] = useState<FiltroOption[]>([]);
  const [centroCostoOpts, setCentroCostoOpts] = useState<FiltroOption[]>([]);
  const [departamentoOpts, setDepartamentoOpts] = useState<FiltroOption[]>([]);

  const [menuAbierto, setMenuAbierto] = useState(false);

  // 🔄 Cargar datos según vista seleccionada
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data =
          viewMode?.value === "cargo"
            ? await fetchOrganigramaCargo()
            : await fetchOrganigramaPersona();
        setRawData(data);
      } catch (err) {
        console.error("Error al cargar datos del organigrama:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [viewMode]);

  return (
    <div className="relative p-4 h-full flex flex-col">
      {/* Overlay loader */}
      {loading && (
        <div className="absolute inset-0 z-50 bg-white bg-opacity-80 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          <span className="mt-3 text-gray-700 font-medium">
            Cargando organigrama...
          </span>
        </div>
      )}

      {/* Contenido principal */}
      <div className={loading ? "pointer-events-none opacity-60" : ""}>
        {/* Botón menú móvil */}
        <div className="sm:hidden flex justify-end mb-2 p-2">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            {menuAbierto ? "Cerrar Filtros" : "Mostrar Filtros"}
          </button>
        </div>

        {/* Filtros en escritorio */}
        <div className="hidden sm:flex flex-nowrap gap-2 mb-4">
          <Select
            className="sm:w-1/4 w-full"
            options={lineaNegocioOpts}
            value={lineaNegocio}
            onChange={setLineaNegocio}
            placeholder="Línea de Negocio"
            isClearable
          />
          <Select
            className="sm:w-1/4 w-full"
            options={centroCostoOpts}
            value={centroCosto}
            onChange={setCentroCosto}
            placeholder="Centro de Costo"
            isClearable
            isDisabled={!lineaNegocio}
          />
          <Select
            className="sm:w-1/4 w-full"
            options={departamentoOpts}
            value={departamento}
            onChange={setDepartamento}
            placeholder="Departamento"
            isClearable
          />
          <Select
            className="sm:w-1/4 w-full"
            options={viewOptions}
            value={viewMode}
            onChange={(opt) => setViewMode(opt)}
            placeholder="Seleccionar vista"
          />
        </div>

        {/* Menú lateral en móvil */}
        <div
          className={`fixed top-0 right-0 w-72 h-full bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out sm:hidden ${
            menuAbierto ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-4 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Filtros</h2>

            <Select
              options={lineaNegocioOpts}
              value={lineaNegocio}
              onChange={setLineaNegocio}
              placeholder="Línea de Negocio"
              isClearable
            />
            <Select
              options={centroCostoOpts}
              value={centroCosto}
              onChange={setCentroCosto}
              placeholder="Centro de Costo"
              isClearable
            />
            <Select
              options={departamentoOpts}
              value={departamento}
              onChange={setDepartamento}
              placeholder="Departamento"
              isClearable
            />
            <Select
              options={viewOptions}
              value={viewMode}
              onChange={(opt) => setViewMode(opt)}
              placeholder="Seleccionar vista"
            />

            <button
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              onClick={() => setMenuAbierto(false)}
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Render del organigrama */}
        <div className="flex-1">
          {viewMode?.value === "cargo" ? (
            <OrganigramaCargoComponent
              rawData={rawData}
              viewMode={viewMode}
              setViewMode={setViewMode}
              lineaNegocio={lineaNegocio}
              setLineaNegocio={setLineaNegocio}
              centroCosto={centroCosto}
              setCentroCosto={setCentroCosto}
              departamento={departamento}
              setDepartamento={setDepartamento}
              setLineaNegocioOpts={setLineaNegocioOpts}
              setCentroCostoOpts={setCentroCostoOpts}
              setDepartamentoOpts={setDepartamentoOpts}
            />
          ) : (
            <OrganigramaPersonaComponent
              rawData={rawData}
              viewMode={viewMode}
              setViewMode={setViewMode}
              lineaNegocio={lineaNegocio}
              setLineaNegocio={setLineaNegocio}
              centroCosto={centroCosto}
              setCentroCosto={setCentroCosto}
              departamento={departamento}
              setDepartamento={setDepartamento}
              setLineaNegocioOpts={setLineaNegocioOpts}
              setCentroCostoOpts={setCentroCostoOpts}
              setDepartamentoOpts={setDepartamentoOpts}
            />
          )}
        </div>

       
      </div>
    </div>
  );
};

export default OrganigramaPage;
