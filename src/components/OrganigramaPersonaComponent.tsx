import React, { useEffect, useRef, useState } from "react";
import { OrgChart } from "d3-org-chart";
import Select from "react-select";
import type { IEmpleadoNode } from "../interfaces/IOrganigramaPersona";
import { parseOrganigramaPersona } from "../utils/parseOrganigramaPersona";

function getHierarchySubset(
  data: IEmpleadoNode[],
  predicate: (n: IEmpleadoNode) => boolean
): IEmpleadoNode[] {
  const byId = new Map(data.map((n) => [n.id, n]));
  const result = new Map<string, IEmpleadoNode>();

  data.forEach((n) => {
    if (predicate(n)) {
      let current: IEmpleadoNode | undefined = n;
      while (current && !result.has(current.id)) {
        result.set(current.id, current);
        current = current.parentId ? byId.get(current.parentId) : undefined;
      }
    }
  });

  return Array.from(result.values());
}

interface OrganigramaPersonaProps {
  rawData: any[];
  viewMode: { value: "cargo" | "persona"; label: string } | null;
  setViewMode: React.Dispatch<
    React.SetStateAction<{ value: "cargo" | "persona"; label: string } | null>
  >;
}

const viewOptions = [
  { value: "cargo", label: "Vista por Cargo" },
  { value: "persona", label: "Vista por Persona" },
];

const OrganigramaPersonaComponent: React.FC<OrganigramaPersonaProps> = ({
  rawData,
  viewMode,
  setViewMode,
}) => {
  const chartRef = useRef<any>(null);
  const containerId = "organigrama-persona";

  const [data, setData] = useState<IEmpleadoNode[]>([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState<IEmpleadoNode | null>(
    null
  );

  // filtros
  const [lineaNegocio, setLineaNegocio] = useState<any | null>(null);
  const [centroCosto, setCentroCosto] = useState<any | null>(null);
  const [departamento, setDepartamento] = useState<any | null>(null);

  const [lineaNegocioOpts, setLineaNegocioOpts] = useState<any[]>([]);
  const [centroCostoOpts, setCentroCostoOpts] = useState<any[]>([]);
  const [departamentoOpts, setDepartamentoOpts] = useState<any[]>([]);

  function getManualUrl(rutaManual: string, tipo: "usuario" | "procedimientos" | "funciones"): string {
    if (!rutaManual) return "";

    const cleanPath = rutaManual.replace(/\\/g, "/");
    const safePath = cleanPath.replace(/ /g, "%20");

    let carpeta = "";
    if (tipo === "usuario") carpeta = "Manual%20de%20Usuario";
    if (tipo === "procedimientos") carpeta = "Manual%20de%20Procedimientos";
    if (tipo === "funciones") carpeta = "Manual%20de%20Funciones";

    return `http://srv-shp/${safePath}/${carpeta}/`;
  }


  // Parsear datos de entrada
  useEffect(() => {
    if (rawData && rawData.length > 0) {
      const parsed = parseOrganigramaPersona(rawData);
      setData(parsed);

      const lineas = Array.from(
        new Set(parsed.map((d) => d.nombreLineaNegocio).filter(Boolean))
      );
      setLineaNegocioOpts(lineas.map((ln) => ({ value: ln, label: ln })));
    }
  }, [rawData]);

  // actualizar opciones de centro de costo cuando cambia línea de negocio
  useEffect(() => {
    if (lineaNegocio) {
      const ccs = data
        .filter((d) => d.nombreLineaNegocio === lineaNegocio.value)
        .map((d) => d.nombreCentroCosto);
      const unicos = Array.from(new Set(ccs)).filter(Boolean);
      setCentroCostoOpts(unicos.map((cc) => ({ value: cc, label: cc })));
      setCentroCosto(null);
      setDepartamento(null);
    } else {
      setCentroCostoOpts([]);
      setDepartamentoOpts([]);
    }
  }, [lineaNegocio, data]);

  // actualizar opciones de departamento cuando cambia centro de costo
  useEffect(() => {
    if (centroCosto) {
      const deps = data
        .filter((d) => d.nombreCentroCosto === centroCosto.value)
        .map((d) => d.nombreDepartamento);
      const unicos = Array.from(new Set(deps)).filter(Boolean);
      setDepartamentoOpts(unicos.map((dep) => ({ value: dep, label: dep })));
      setDepartamento(null);
    } else {
      setDepartamentoOpts([]);
    }
  }, [centroCosto, data]);

  // Renderizar organigrama con filtros
  useEffect(() => {
    if (!data.length) return;

    const predicate = (n: IEmpleadoNode) => {
      if (departamento) return n.nombreDepartamento === departamento.value;
      if (centroCosto) return n.nombreCentroCosto === centroCosto.value;
      if (lineaNegocio) return n.nombreLineaNegocio === lineaNegocio.value;
      return true;
    };

    const filtered = getHierarchySubset(data, predicate);

    if (chartRef.current) {
      chartRef.current.data(filtered).render();
    } else {
      chartRef.current = new OrgChart()
        .container(`#${containerId}`)
        .data(filtered)
        .nodeWidth(() => 320)
        .nodeHeight(() => 200)
        .childrenMargin(() => 40)
        .compactMarginBetween(() => 30)
        .compactMarginPair(() => 40)
        .nodeContent((d: any) => {
          const emp = d.data as IEmpleadoNode;
          const isVacante = emp.tipo === "vacante";
          const manualBtns = emp.rutaManual
            ? `
  `
            : "";

          return `
            <div style="padding:10px; border-radius:10px; background:${isVacante ? "#f9f9f9" : "#fff"};
                        box-shadow:0 2px 6px rgba(0,0,0,0.15);
                        text-align:center; display:flex; flex-direction:column; align-items:center;">
              ${isVacante
              ? `<img src="/images/vacante.png" alt="Vacante"
                           style="width:50px; height:50px; border-radius:50%; margin-bottom:6px; opacity:0.6;" />`
              : emp.foto
                ? `<img src="${emp.foto}" alt="Foto"
                           style="width:50px; height:50px; border-radius:50%; margin-bottom:6px;" />`
                : ""
            }
              <div style="font-weight:bold; font-size:14px; color:#333; margin-bottom:4px;">
                ${isVacante ? "VACANTE" : `${emp.nombre} ${emp.apellido}`}
              </div>
              <div style="font-size:12px; color:#666; margin-bottom:6px;">
                ${emp.puesto || ""}
              </div>
              ${isVacante
              ? ""
              : `<button class="btn-ver-persona" data-id="${emp.id}"
                             style="padding:4px 8px; border-radius:6px;
                                    background:#007bff; color:#fff; border:none;
                                    cursor:pointer; font-size:12px;">
                      Ver ficha
                    </button>
                    ${manualBtns}`
            }
            </div>
          `;
        })
        .render();
    }
  }, [data, lineaNegocio, centroCosto, departamento]);

  // Manejar clicks en "Ver ficha"
  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains("btn-ver-persona")) {
        const id = target.getAttribute("data-id");
        const nodo = data.find((n) => n.id === id);
        if (nodo) setSelectedEmpleado(nodo);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [data]);

  // Controles
  const zoomIn = () => chartRef.current?.zoomIn();
  const zoomOut = () => chartRef.current?.zoomOut();
  const handleFit = () => chartRef.current?.fit();
  const ExpandirAll = () => chartRef.current?.expandAll();
  const CollapseAll = () => chartRef.current?.collapseAll();
  const horizontal = () => chartRef.current?.compact(true).render().fit();
  const vertical = () => chartRef.current?.compact(false).render().fit();
  

const handleExportSVG = async () => {
  if (!chartRef.current) return;

  // 🔹 Centrar sin animación
  chartRef.current.fit(0);

  // 🔹 Esperar al siguiente ciclo del navegador
  await new Promise(requestAnimationFrame);

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
  link.download = "organigrama-personas.svg";
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

      {/* Controles */}
      <div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={horizontal}>Horizontal</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={vertical}>Vertical</button>
      </div>
      {/* Controles */}
      <div className="flex justify-end gap-2 p-3">
        <button className="px-4 py-2 bg-gray-700 text-white rounded" onClick={zoomIn}> + </button>
        <button className="px-4 py-2 bg-gray-700 text-white rounded" onClick={zoomOut}> - </button>
        <button className="px-4 py-2 bg-gray-700 text-white rounded" onClick={handleFit}>Ajustar</button>
        <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={ExpandirAll}>Abrir Organigrama</button>
        <button className="px-4 py-2 bg-yellow-500 text-white rounded" onClick={CollapseAll}>Cerrar organigrama</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleExportSVG}>Exportar SVG</button>
      </div>

      {/* Contenedor del organigrama */}
      <div id={containerId} style={{ width: "100%", height: "80vh" }}></div>

      {/* Modal de ficha */}
      {selectedEmpleado && selectedEmpleado.tipo === "persona" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[530px]">
            <div className="flex justify-between">
              <h2 className="text-lg font-bold mb-4">Ficha de Empleado</h2>
              <button
                className=" text-black rounded-lg "
                onClick={() => setSelectedEmpleado(null)}              >
                X
              </button>
            </div>
            
            {selectedEmpleado.foto && (
              <img
                src={selectedEmpleado.foto}
                alt="Foto"
                className="w-24 h-24 rounded-full mx-auto mb-4"
              />
            )}
            <p>
              <strong>Nombre:</strong> {selectedEmpleado.nombre} {selectedEmpleado.apellido}
            </p>
            <p>
              <strong>Puesto:</strong> {selectedEmpleado.puesto}
            </p>
            <p>
              <strong>Email:</strong> {selectedEmpleado.emailCorporativo || "N/A"}
            </p>
            <p>
              <strong>Departamento:</strong> {selectedEmpleado.nombreDepartamento || "N/A"}
            </p>
            <p>
              <strong>Centro de Costo:</strong> {selectedEmpleado.nombreCentroCosto || "N/A"}
            </p>
            <p>
              <strong>Línea de Negocio:</strong> {selectedEmpleado.nombreLineaNegocio || "N/A"}
            </p>
            <div className="mt-6 flex justify-end">
              <div className="mt-6 flex justify-end gap-2">
                {selectedEmpleado.rutaManual && (
  <div className="flex gap-1">
    <button
      className="p-2 bg-green-600 text-white rounded"
      onClick={() =>
        window.open(
          getManualUrl(selectedEmpleado.rutaManual!, "usuario"),
          "_blank"
        )
      }
    >
      Manual Usuario
    </button>
    <button
      className="p-2 bg-cyan-600 text-white rounded"
      onClick={() =>
        window.open(
          getManualUrl(selectedEmpleado.rutaManual!, "procedimientos"),
          "_blank"
        )
      }
    >
      Manual Procedimientos
    </button>
    <button
      className="p-2 bg-purple-600 text-white rounded"
      onClick={() =>
        window.open(
          getManualUrl(selectedEmpleado.rutaManual!, "funciones"),
          "_blank"
        )
      }
    >
      Manual Funciones
    </button>
  </div>
)}

              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganigramaPersonaComponent;
