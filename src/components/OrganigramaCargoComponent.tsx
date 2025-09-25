// components/OrganigramaCargoComponent.tsx
import React, { useEffect, useRef, useState } from "react";
import  {OrgChart}  from "d3-org-chart";
import Select from "react-select";
import type { ICargoNode, IEmpleado } from "../interfaces/IOrganigramaCargo";
import { parseOrganigramaCargo } from "../utils/parseOrganigramaCargo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
  faExpand,
  faSitemap,
  faCompress,
  faFileArrowDown,
} from "@fortawesome/free-solid-svg-icons";

interface OrganigramaCargoProps {
  rawData: any;
  viewMode: { value: "cargo" | "persona"; label: string } | null;
  setViewMode: React.Dispatch<
    React.SetStateAction<{ value: "cargo" | "persona"; label: string } | null>
  >;
}

interface OptionType {
  value: string;
  label: string;
}

const viewOptions = [
  { value: "cargo", label: "Vista por Cargo" },
  { value: "persona", label: "Vista por Persona" },
];

function getManualUrl(
  rutaManual: string,
  tipo: "usuario" | "procedimientos" | "funciones"
): string {
  if (!rutaManual) return "";

  const cleanPath = rutaManual.replace(/\\/g, "/");
  const safePath = cleanPath.replace(/ /g, "%20");

  let carpeta = "";
  if (tipo === "usuario") carpeta = "Manual%20de%20Usuario";
  if (tipo === "procedimientos") carpeta = "Manual%20de%20Procedimientos";
  if (tipo === "funciones") carpeta = "Manual%20de%20Funciones";

  return `http://srv-shp/${safePath}/${carpeta}/`;
}

//  función para traer nodos filtrados + sus ancestros
function getHierarchySubset(
  data: ICargoNode[],
  predicate: (n: ICargoNode) => boolean
): ICargoNode[] {
  const byId = new Map(data.map((n) => [n.id, n]));
  const result = new Map<string, ICargoNode>();

  data.forEach((n) => {
    if (predicate(n)) {
      let current: ICargoNode | undefined = n;
      while (current && !result.has(current.id)) {
        result.set(current.id, current);
        current = current.parentId ? byId.get(current.parentId) : undefined;
      }
    }
  });

  return Array.from(result.values());
}

const OrganigramaCargoComponent: React.FC<OrganigramaCargoProps> = ({
  rawData = [],
  viewMode,
  setViewMode,
}) => {
  const chartRef = useRef<any>(null);
  const containerId = "organigrama-cargo";

  const [data, setData] = useState<ICargoNode[]>([]);
  const [selectedEmpleados, setSelectedEmpleados] = useState<IEmpleado[]>([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState<IEmpleado | null>(
    null
  );
  const [showDialog, setShowDialog] = useState(false);

  // filtros
  const [lineaNegocio, setLineaNegocio] = useState<OptionType | null>(null);
  const [centroCosto, setCentroCosto] = useState<OptionType | null>(null);
  const [departamento, setDepartamento] = useState<OptionType | null>(null);

  // opciones de selects
  const [lineaNegocioOpts, setLineaNegocioOpts] = useState<OptionType[]>([]);
  const [centroCostoOpts, setCentroCostoOpts] = useState<OptionType[]>([]);
  const [departamentoOpts, setDepartamentoOpts] = useState<OptionType[]>([]);

  // Procesar datos de entrada
  useEffect(() => {
    if (rawData && rawData.length > 0) {
      const parsed = parseOrganigramaCargo(rawData);
      setData(parsed);
      console.log("Parsed cargos:", parsed);

      // Opciones únicas de línea de negocio
      const lineas = Array.from(
        new Set(parsed.map((c) => c.nombreLineaNegocio).filter(Boolean))
      );
      setLineaNegocioOpts(lineas.map((ln: any) => ({ value: ln, label: ln })));
    }
  }, [rawData]);

  // Actualizar centros de costo cuando cambia la línea de negocio
  useEffect(() => {
    if (!lineaNegocio) {
      setCentroCostoOpts([]);
      setCentroCosto(null);
      return;
    }

    const ccs = Array.from(
      new Set(
        data
          .filter((c) => c.nombreLineaNegocio === lineaNegocio.value)
          .map((c) => c.nombreCentroCosto)
          .filter(Boolean)
      )
    );
    setCentroCostoOpts(ccs.map((cc: any) => ({ value: cc, label: cc })));
  }, [lineaNegocio, data]);

  // Actualizar departamentos cuando cambia centro de costo
  useEffect(() => {
    if (!lineaNegocio || !centroCosto) {
      setDepartamentoOpts([]);
      setDepartamento(null);
      return;
    }

    const deps = Array.from(
      new Set(
        data
          .filter(
            (c) =>
              c.nombreLineaNegocio === lineaNegocio.value &&
              c.nombreCentroCosto === centroCosto.value
          )
          .map((c) => c.nombreDepartamento)
          .filter(Boolean)
      )
    );
    setDepartamentoOpts(deps.map((dep: any) => ({ value: dep, label: dep })));
  }, [lineaNegocio, centroCosto, data]);

  // Manejar clicks en botones "Ver ficha"
  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains("btn-ver-ficha")) {
        const id = target.getAttribute("data-id");
        if (!id) return;
        const nodo = data.find((n) => n.id === id);
        if (!nodo || !nodo.empleados) return;

        if (nodo.empleados.length === 1) {
          setSelectedEmpleado(nodo.empleados[0]);
          setSelectedEmpleados([]);
        } else {
          setSelectedEmpleado(null);
          setSelectedEmpleados(nodo.empleados);
        }
        setShowDialog(true);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [data]);

  // Renderizar organigrama con filtros
  useEffect(() => {
    if (!rawData.length) return;

    let filtered = [...data];
    const predicate = (n: ICargoNode) => {
      const matchLinea =
        !lineaNegocio || n.nombreLineaNegocio === lineaNegocio.value;
      const matchCentro =
        !centroCosto || n.nombreCentroCosto === centroCosto.value;
      const matchDep =
        !departamento || n.nombreDepartamento === departamento.value;

      return matchLinea && matchCentro && matchDep;
    };

    filtered = getHierarchySubset(rawData, predicate);
    setData(filtered);

    if (chartRef.current) {
      chartRef.current.data(filtered).render();
    } else {
      chartRef.current = new OrgChart()
        .container(`#${containerId}`)
        .data(filtered)
        .nodeWidth(() => 280)
        .nodeHeight(() => 160)
        .childrenMargin(() => 40)
        .compactMarginBetween(() => 30)
        .compactMarginPair(() => 40)
        .nodeContent((d: any) => {
          const empleados = d.data.empleados || [];

          return `
            <div style="padding:10px; border-radius:10px; background:#fff;
                        box-shadow:0 2px 6px rgba(0,0,0,0.15);
                        text-align:center; display:flex;
                        flex-direction:column; align-items:center; gap:6px;">
              <div style="font-weight:bold; font-size:14px; color:#333;">
                ${d.data.puesto || "(Sin puesto)"}
              </div>
              ${
                empleados.length > 0
                  ? `<button class="btn-ver-ficha"
                             data-id="${d.data.id}"
                             style="padding:6px 12px; border-radius:6px;
                                    background:#007bff; color:#fff; border:none;
                                    cursor:pointer; font-size:12px;">
                       Ver ficha
                     </button>`
                  : `<div style="font-size:12px; color:#999;">Vacante</div>`
              }
            </div>
          `;
        })
        .render();
    }
  }, [rawData, lineaNegocio, centroCosto, departamento]);

  // Controles
  const zoomIn = () => chartRef.current?.zoomIn();
  const zoomOut = () => chartRef.current?.zoomOut();
  const handleFit = () => chartRef.current?.fit();
  const ExpandirAll = () => chartRef.current?.expandAll();
  const CollapseAll = () => chartRef.current?.collapseAll();
  const horizontal = () => chartRef.current?.compact(true).render().fit();
  const vertical = () => chartRef.current?.compact(false).render().fit();
 const handleExportSVG = () => {
  if (!chartRef.current) return;

  // 🔹 Centrar/ajustar organigrama antes de exportar
  chartRef.current.fit();

  // 🔹 Ahora tomamos el SVG ya centrado
  const svgElement = document.querySelector(
    `#${containerId} svg`
  ) as SVGSVGElement | null;

  if (!svgElement) return;

  const serializer = new XMLSerializer();
  const svgContent = serializer.serializeToString(svgElement);
  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "organigrama-cargo.svg";
  link.click();

  URL.revokeObjectURL(url);
};


  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-2 p-3">
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
          isDisabled={!lineaNegocio}
        />
        <Select
          options={departamentoOpts}
          value={departamento}
          onChange={setDepartamento}
          placeholder="Departamento"
          isClearable
          isDisabled={!centroCosto}
        />
        <Select
          options={viewOptions}
          value={viewMode}
          onChange={(opt) => setViewMode(opt)}
          placeholder="Seleccionar vista"
        />
      </div>

      <div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={horizontal}
        >
          Horizontal
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={vertical}
        >
          Vertical
        </button>
      </div>

      {/* Controles */}
      <div className="flex justify-end gap-2 p-3">
  <button
    className="px-4 py-2 bg-gray-700 text-white rounded flex items-center gap-2"
    onClick={zoomIn}
  >
    <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
    Zoom 
  </button>
  <button
    className="px-4 py-2 bg-gray-700 text-white rounded flex items-center gap-2"
    onClick={zoomOut}
  >
    <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
    Zoom 
  </button>
  <button
    className="px-4 py-2 bg-gray-700 text-white rounded flex items-center gap-2"
    onClick={handleFit}
  >
    <FontAwesomeIcon icon={faExpand} />
    Ajustar
  </button>
  <button
    className="px-4 py-2 bg-green-500 text-white rounded flex items-center gap-2"
    onClick={ExpandirAll}
  >
    <FontAwesomeIcon icon={faSitemap} />
    Abrir Organigrama
  </button>
  <button
    className="px-4 py-2 bg-yellow-500 text-white rounded flex items-center gap-2"
    onClick={CollapseAll}
  >
    <FontAwesomeIcon icon={faCompress} />
    Cerrar Organigrama
  </button>
  <button
    className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
    onClick={handleExportSVG}
  >
    <FontAwesomeIcon icon={faFileArrowDown} />
    Exportar SVG
  </button>
</div>


      {/* Contenedor */}
      <div id={containerId} style={{ width: "100%", height: "80vh" }}></div>

      {/* Modal */}
      {showDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[600px]">
            <h2 className="text-lg font-bold mb-4">Ficha de Empleado</h2>

            {selectedEmpleado ? (
              <div>
                {selectedEmpleado.foto && (
                  <img
                    src={selectedEmpleado.foto}
                    alt="Foto"
                    className="w-24 h-24 rounded-full mx-auto mb-4"
                  />
                )}

                <p>
                  <strong>Nombre:</strong> {selectedEmpleado.nombre}{" "}
                  {selectedEmpleado.apellido}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  {selectedEmpleado.emailCorporativo || "N/A"}
                </p>
                <p>
                  <strong>Puesto:</strong>{" "}
                  {selectedEmpleado.puestoEmpleado || "N/A"}
                </p>
                <p>
                  <strong>Departamento:</strong>{" "}
                  {selectedEmpleado.nombreDepartamento || "N/A"}
                </p>
                <p>
                  <strong>Centro de Costo:</strong>{" "}
                  {selectedEmpleado.nombreCentroCosto || "N/A"}
                </p>
                <p>
                  <strong>Línea de Negocio:</strong>{" "}
                  {selectedEmpleado.nombreLineaNegocio || "N/A"}
                </p>

                {/* Manuales SOLO en ficha individual */}
                {selectedEmpleado?.rutaManual && (
                  <div className="mt-4 flex gap-2">
                    <a
                      href={getManualUrl(
                        selectedEmpleado.rutaManual,
                        "usuario"
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                       Usuario
                    </a>
                    <a
                      href={getManualUrl(
                        selectedEmpleado.rutaManual,
                        "procedimientos"
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-cyan-600 text-white rounded"
                    >
                       Procedimientos
                    </a>
                    <a
                      href={getManualUrl(
                        selectedEmpleado.rutaManual,
                        "funciones"
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-purple-600 text-white rounded"
                    >
                       Funciones
                    </a>
                  </div>
                )}

                <div className="mt-6 flex justify-between">
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded"
                    onClick={() => setShowDialog(false)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEmpleados.map((emp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border p-2 rounded"
                  >
                    <div className="flex items-center space-x-3">
                      {emp.foto && (
                        <img
                          src={emp.foto}
                          alt="Foto"
                          className="w-12 h-12 rounded-full"
                        />
                      )}
                      <span>
                        {emp.nombre} {emp.apellido}
                      </span>
                    </div>
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded"
                      onClick={() => setSelectedEmpleado(emp)}
                    >
                      Ver más
                    </button>
                  </div>
                ))}

                {/* Solo botón cerrar aquí */}
                <div className="mt-6 flex justify-end">
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded"
                    onClick={() => setShowDialog(false)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganigramaCargoComponent;
