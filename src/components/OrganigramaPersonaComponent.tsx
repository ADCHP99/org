import React, { use, useEffect, useRef, useState } from "react";
import { OrgChart } from "d3-org-chart";
import type { IEmpleadoNode } from "../interfaces/IOrganigramaPersona";
import { parseOrganigramaPersona } from "../utils/parseOrganigramaPersona";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
  faExpand,
  faSitemap,
  faCompress,
  faFileArrowDown,
} from "@fortawesome/free-solid-svg-icons";

function sanitizeHierarchy(data: IEmpleadoNode[]): IEmpleadoNode[] {
  const validIds = new Set(data.map((n) => n.id));
  return data.map((n) => ({
    ...n,
    parentId: n.parentId && validIds.has(n.parentId) ? n.parentId : null,
  }));
}

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

interface OptionType {
  value: string;
  label: string;
}

type ViewOptionType = { value: "cargo" | "persona"; label: string };

interface OrganigramaPersonaProps {
  rawData: any[];
  viewMode: ViewOptionType | null;
  setViewMode: React.Dispatch<
    React.SetStateAction<ViewOptionType | null>
  >;

  // Filtros y sus setters (controlados por la Page)
  lineaNegocio: OptionType | null;
  setLineaNegocio: React.Dispatch<React.SetStateAction<OptionType | null>>;
  centroCosto: OptionType | null;
  setCentroCosto: React.Dispatch<React.SetStateAction<OptionType | null>>;
  departamento: OptionType | null;
  setDepartamento: React.Dispatch<React.SetStateAction<OptionType | null>>;

  // Setters de opciones (controlados por la Page)
  setLineaNegocioOpts: React.Dispatch<React.SetStateAction<OptionType[]>>;
  setCentroCostoOpts: React.Dispatch<React.SetStateAction<OptionType[]>>;
  setDepartamentoOpts: React.Dispatch<React.SetStateAction<OptionType[]>>;
}

function sortOptions(options: OptionType[]) {
  return [...options].sort((a, b) =>
    a.label.localeCompare(b.label, "es", { sensitivity: "base" })
  );
}

const OrganigramaPersonaComponent: React.FC<OrganigramaPersonaProps> = ({
  rawData,
  viewMode,
  setViewMode,

  // filtros (valores) desde el padre
  lineaNegocio,
  setLineaNegocio,
  centroCosto,
  setCentroCosto,
  departamento,
  setDepartamento,

  // setters de opciones desde el padre
  setLineaNegocioOpts,
  setCentroCostoOpts,
  setDepartamentoOpts,
}) => {
  const chartRef = useRef<any>(null);
  const containerId = "organigrama-persona";

  const [fullData, setFullData] = useState<IEmpleadoNode[]>([]);
  const [data, setData] = useState<IEmpleadoNode[]>([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState<IEmpleadoNode | null>(null);
  
  function getManualUrl(
    codEmp?: string,
    codDepAx?: string,
    codCentroCosto?: string,
    tipo?: "usuario" | "procedimientos" | "funciones"
  ): string {
    let carpeta = "";
    if (tipo === "usuario") carpeta = "Manual de usuario";
    if (tipo === "procedimientos") carpeta = "Manual de procedimientos";
    if (tipo === "funciones") carpeta = "Manual de funciones";

    return `https://soporte.liris.com.ec/rhh/UserDocsF.aspx?Carpeta=${encodeURIComponent(
      carpeta
    )}&CodEmp=${codEmp}&DepartMyProcessId=${codDepAx}|${codCentroCosto}`;
  }
 
useEffect(() => {
  if (!rawData || rawData.length === 0) {
    setFullData([]);
    setData([]);
    setLineaNegocioOpts([]);
    setCentroCostoOpts([]);
    setDepartamentoOpts([]);
    return;
  }

  // 1️⃣ Parsear y limpiar la jerarquía
  const parsed = parseOrganigramaPersona(rawData);
  const cleaned = sanitizeHierarchy(parsed);

  // 2️⃣ Guardar datos completos
  setFullData(cleaned);
  setData(cleaned);

  // 3️⃣ Poblar filtros
  const lineas = Array.from(
    new Set(cleaned.map((d) => d.nombreLineaNegocio).filter(Boolean))
  );
  setLineaNegocioOpts(sortOptions(lineas.map((ln: any) => ({ value: ln, label: ln }))));

  const ccs = Array.from(
    new Set(cleaned.map((d) => d.nombreCentroCosto).filter(Boolean))
  );
  setCentroCostoOpts(sortOptions(ccs.map((cc: any) => ({ value: cc, label: cc }))));

  const deps = Array.from(
    new Set(cleaned.map((d) => d.nombreDepartamento).filter(Boolean))
  );
  setDepartamentoOpts(sortOptions(deps.map((dep: any) => ({ value: dep, label: dep }))));
}, [rawData]);


useEffect(() => {
  if (!lineaNegocio) {
    setCentroCostoOpts([]);
    if (centroCosto !== null) {
      setCentroCosto(null);
    }
    return;
  }

  const ccs = Array.from(
    new Set(
      fullData
        .filter((d) => d.nombreLineaNegocio === lineaNegocio.value)
        .map((d) => d.nombreCentroCosto)
        .filter(Boolean)
    )
  );
  setCentroCostoOpts(sortOptions(ccs.map((cc: any) => ({ value: cc, label: cc }))));
}, [lineaNegocio, fullData, setCentroCostoOpts]); // ✅ sin centroCosto

  // 3) Poblar Departamentos en el padre (independiente de los otros filtros)
  useEffect(() => {
    const deps = Array.from(
      new Set(fullData.map((d) => d.nombreDepartamento).filter(Boolean))
    );
    setDepartamentoOpts(sortOptions(deps.map((dep: any) => ({ value: dep, label: dep }))));
  }, [fullData, setDepartamentoOpts]);

  // 4) Filtrar y renderizar el organigrama (usando fullData)
  useEffect(() => {
    if (!fullData.length) return;

    const predicate = (n: IEmpleadoNode) => {
      const matchLinea = !lineaNegocio || n.nombreLineaNegocio === lineaNegocio.value;
      const matchCentro = !centroCosto || n.nombreCentroCosto === centroCosto.value;
      const matchDep = !departamento || n.nombreDepartamento === departamento.value;
      return matchLinea && matchCentro && matchDep;
    };
    
    const filtered = getHierarchySubset(fullData, predicate);
      const cleaned = sanitizeHierarchy(filtered); // ✅ Limpiar padres inexistentes

    setData(cleaned);

    if (chartRef.current) {
      chartRef.current.data(filtered).render();
    } else {
      chartRef.current = new OrgChart()
        .container(`#${containerId}`)
        .data(filtered)
        .nodeWidth(() => 320)
        .nodeHeight(() => 140)
        .childrenMargin(() => 40)
        .compactMarginBetween(() => 30)
        .compactMarginPair(() => 40)
        .linkUpdate((_d: any, _i: number, arr: any[]) => {
          arr.forEach((el: any) => {
            el.setAttribute("stroke", "#444");
            el.setAttribute("stroke-width", "1.0");
          });
        })
        // NO SE TOCÓ nodeContent
        .nodeContent((d: any) => {
          const emp = d.data as IEmpleadoNode;
          const isVacante = emp.tipo === "vacante";
          const manualBtns = emp.rutaManual ? `` : "";

          return `
    <div style="padding:10px; border-radius:10px; background:${isVacante ? "#f9f9f9" : "#fff"};
                box-shadow:0 2px 6px rgba(0,0,0,0.15);
                text-align:center; display:flex; flex-direction:column; align-items:center;">
      ${isVacante
              ? `
            <div style="width:50px; height:50px; border-radius:50%; margin-bottom:6px;
                        background:#e5e7eb; display:flex; align-items:center; justify-content:center;">
              <svg xmlns="http://www.w3.org/2000/svg" fill="#9ca3af" viewBox="0 0 24 24" width="32" height="32">
                <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 
                         2.3-5 5 2.3 5 5 5zm0 2c-3.3 
                         0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/>
              </svg>
            </div>`
              : emp.foto
                ? `<img src="${emp.foto}" alt="Foto"
                   style="width:50px; height:50px; border-radius:50%; margin-bottom:6px;" />`
                : `
            <div style="width:50px; height:50px; border-radius:50%; margin-bottom:6px;
                        background:#e5e7eb; display:flex; align-items:center; justify-content:center;">
              <svg xmlns="http://www.w3.org/2000/svg" fill="#9ca3af" viewBox="0 0 24 24" width="32" height="32">
                <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 
                         2.3-5 5 2.3 5 5 5zm0 2c-3.3 
                         0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/>
              </svg>
            </div>`
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

      const handleResize = () => chartRef.current?.fit();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [fullData, lineaNegocio, centroCosto, departamento]);

  // Click en "Ver ficha"
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
  const CollapseAll = () => chartRef.current?.collapseAll().fit();

  const handleExportSVG = () => {
    if (!chartRef.current) return;
    chartRef.current.fit();
    setTimeout(() => {
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
      link.download = "organigrama-persona.svg";
      link.click();
      URL.revokeObjectURL(url);
    }, 300);
  };

  return (
    <div className="p-3">
      {/* 🔧 Botones de control */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 py-2 px-1 sm:px-0 justify-center sm:justify-end">
        <button className="w-full sm:w-auto px-4 py-2 bg-gray-700 text-white rounded flex items-center gap-2" onClick={zoomIn}>
          <FontAwesomeIcon icon={faMagnifyingGlassPlus} /> Zoom
        </button>
        <button className="w-full sm:w-auto px-4 py-2 bg-gray-700 text-white rounded flex items-center gap-2" onClick={zoomOut}>
          <FontAwesomeIcon icon={faMagnifyingGlassMinus} /> Zoom
        </button>
        <button className="w-full sm:w-auto px-4 py-2 bg-gray-700 text-white rounded flex items-center gap-2" onClick={handleFit}>
          <FontAwesomeIcon icon={faExpand} /> Ajustar
        </button>
        <button className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded flex items-center gap-2" onClick={ExpandirAll}>
          <FontAwesomeIcon icon={faSitemap} /> Abrir Organigrama
        </button>
        <button className="w-full sm:w-auto px-4 py-2 bg-yellow-500 text-white rounded flex items-center gap-2" onClick={CollapseAll}>
          <FontAwesomeIcon icon={faCompress} /> Cerrar Organigrama
        </button>
        <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2" onClick={handleExportSVG}>
          <FontAwesomeIcon icon={faFileArrowDown} /> Exportar SVG
        </button>
         <button
    onClick={() => chartRef.current?.compact(false).render().fit()}
    className="px-3 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
  >
    Horizontal
  </button>
  <button
    onClick={() => chartRef.current?.compact(true).render().fit()}
    className="px-3 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
  >
    Vertical
  </button>
      </div>

      {/* Contenedor del organigrama */}
      <div className="w-full overflow-x-auto">
        <div id={containerId} className="w-full h-full"></div>
      </div>

      {/* Modal de ficha */}
      {selectedEmpleado && selectedEmpleado.tipo === "persona" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-[550px] max-w-full mx-4 animate-fadeIn">
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                {selectedEmpleado.foto ? (
                  <img
                    src={selectedEmpleado.foto}
                    alt="Foto"
                    className="w-24 h-24 rounded-full border-4 border-blue-200 shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-3xl" />
                )}
                <h3 className="mt-3 text-xl font-semibold text-gray-800">
                  {selectedEmpleado.nombre} {selectedEmpleado.apellido}
                </h3>
                <p className="text-sm text-gray-500">{selectedEmpleado.puesto || "Sin puesto"}</p>
              </div>

              <div className="space-y-2 text-sm text-gray-700 text-center">
                <p>
                  <strong>Email:</strong> {selectedEmpleado.emailCorporativo || "N/A"}
                </p>
                <p>
                  <strong>Línea de Negocio:</strong> {selectedEmpleado.nombreLineaNegocio || "N/A"}
                </p>
                <p>
                  <strong>Centro de Costo:</strong> {selectedEmpleado.nombreCentroCosto || "N/A"}
                </p>
                <p>
                  <strong>Departamento:</strong> {selectedEmpleado.nombreDepartamento || "N/A"}
                </p>
                <p>
                  <strong>Fecha de ingreso a la empreso:</strong> {selectedEmpleado.fechaIngreso || "N/A"}
                </p>
              </div>

              <div className="mt-6 flex flex-nowrap gap-3 justify-center">
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      getManualUrl(
                        selectedEmpleado.codigoEmpleado,
                        selectedEmpleado.codDepAx,
                        selectedEmpleado.codCentroCosto,
                        "funciones"
                      ),
                      "_blank"
                    );
                  }}
                >
                  Manual de Funciones
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg shadow hover:bg-cyan-700 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      getManualUrl(
                        selectedEmpleado.codigoEmpleado,
                        selectedEmpleado.codDepAx,
                        selectedEmpleado.codCentroCosto,
                        "procedimientos"
                      ),
                      "_blank"
                    );
                  }}
                >
                  Manual de Procedimientos
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      getManualUrl(
                        selectedEmpleado.codigoEmpleado,
                        selectedEmpleado.codDepAx,
                        selectedEmpleado.codCentroCosto,
                        "usuario"
                      ),
                      "_blank"
                    );
                  }}
                >
                  Manual de Usuario
                </button>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  onClick={() => setSelectedEmpleado(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganigramaPersonaComponent;
