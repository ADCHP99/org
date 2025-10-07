// components/OrganigramaCargoComponent.tsx
import React, { useEffect, useRef, useState } from "react";
import { OrgChart } from "d3-org-chart";
import type { ICargoNode, IEmpleado } from "../interfaces/IOrganigramaCargo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
  faExpand,
  faSitemap,
  faCompress,
  faFileArrowDown,
} from "@fortawesome/free-solid-svg-icons";
import { parseOrganigramaCargo } from "../utils/parseOrganigramaCargo";

interface OptionType {
  value: string;
  label: string;
}

interface OrganigramaCargoProps {
  rawData: any;
  viewMode: { value: "cargo" | "persona"; label: string } | null;
  setViewMode: React.Dispatch<
    React.SetStateAction<{ value: "cargo" | "persona"; label: string } | null>
  >;

  lineaNegocio: OptionType | null;
  setLineaNegocio: React.Dispatch<React.SetStateAction<OptionType | null>>;
  centroCosto: OptionType | null;
  setCentroCosto: React.Dispatch<React.SetStateAction<OptionType | null>>;
  departamento: OptionType | null;
  setDepartamento: React.Dispatch<React.SetStateAction<OptionType | null>>;

  setLineaNegocioOpts: React.Dispatch<React.SetStateAction<OptionType[]>>;
  setCentroCostoOpts: React.Dispatch<React.SetStateAction<OptionType[]>>;
  setDepartamentoOpts: React.Dispatch<React.SetStateAction<OptionType[]>>;
}

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
  lineaNegocio,
  centroCosto,
  setCentroCosto,
  departamento,
  setDepartamento,
  setLineaNegocioOpts,
  setCentroCostoOpts,
  setDepartamentoOpts,
}) => {
  const chartRef = useRef<any>(null);
  const containerId = "organigrama-cargo";

  const [fullData, setFullData] = useState<ICargoNode[]>([]);
  const [data, setData] = useState<ICargoNode[]>([]);
  const [selectedEmpleados, setSelectedEmpleados] = useState<IEmpleado[]>([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState<IEmpleado | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
 function getManualUrl(
  codEmp?: string,
  codDepAx?: string,
  codDepartamento?: string,
  tipo?: "usuario" | "procedimientos" | "funciones"
): string {
  let carpeta = "";
  if (tipo === "usuario") carpeta = "Manual de usuario";
  if (tipo === "procedimientos") carpeta = "Manual de procedimientos";
  if (tipo === "funciones") carpeta = "Manual de funciones";

  const depParam =
    codDepAx && codDepartamento
      ? `${codDepAx}|${codDepartamento}`
      : codDepAx || "";

  return `https://soporte.liris.com.ec/rhh/UserDocsF.aspx?Carpeta=${encodeURIComponent(
    carpeta
  )}&CodEmp=${codEmp || ""}&DepartMyProcessId=${depParam}`;
}
useEffect(() => {
  if (rawData && rawData.length > 0) {
    const parsed = parseOrganigramaCargo(rawData);

    // ✅ Asignamos los datos reales
    setFullData(parsed);
    setData(parsed);

    //  Poblar los filtros principales desde parsed
    const lineas = Array.from(
      new Set(parsed.map((n) => n.nombreLineaNegocio).filter(Boolean))
    ).map((v) => ({ value: v, label: v }));
    setLineaNegocioOpts(lineas);

    const centros = Array.from(
      new Set(parsed.map((n) => n.nombreCentroCosto).filter(Boolean))
    ).map((v) => ({ value: v, label: v }));
    setCentroCostoOpts(centros);

    const deps = Array.from(
      new Set(parsed.map((n) => n.nombreDepartamento).filter(Boolean))
    ).map((v) => ({ value: v, label: v }));
    setDepartamentoOpts(deps);
  } else {
    setFullData([]);
    setData([]);
    setLineaNegocioOpts([]);
    setCentroCostoOpts([]);
    setDepartamentoOpts([]);
  }
}, [rawData]);

  useEffect(() => {
    if (!lineaNegocio) {
      setCentroCostoOpts([]);
      return;
    }

    const ccs = Array.from(
      new Set(
        fullData
          .filter((c) => c.nombreLineaNegocio === lineaNegocio.value)
          .map((c) => c.nombreCentroCosto)
          .filter(Boolean)
      )
    );
    setCentroCostoOpts(ccs.map((cc: any) => ({ value: cc, label: cc })));
  }, [lineaNegocio, fullData, setCentroCostoOpts]);

  useEffect(() => {
    const deps = Array.from(
      new Set(fullData.map((c) => c.nombreDepartamento).filter(Boolean))
    );
    setDepartamentoOpts(deps.map((dep: any) => ({ value: dep, label: dep })));
  }, [fullData, setDepartamentoOpts]);

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

  useEffect(() => {
    if (!rawData || rawData.length === 0) return;

    const predicate = (n: ICargoNode) => {
      const matchLinea = !lineaNegocio || n.nombreLineaNegocio === lineaNegocio.value;
      const matchCentro = !centroCosto || n.nombreCentroCosto === centroCosto.value;
      const matchDep = !departamento || n.nombreDepartamento === departamento.value;
      return matchLinea && matchCentro && matchDep;
    };

    const filtered = getHierarchySubset(rawData, predicate);
    setData(filtered);

    if (chartRef.current) {
      chartRef.current.data(filtered).render();
    } else {
      chartRef.current = new OrgChart()
        .container(`#${containerId}`)
        .data(filtered)
        .nodeWidth(() => 220)
        .nodeHeight(() => 100)
        .childrenMargin(() => 100)
        .compactMarginBetween(() => 30)
        .compact(false)
        .compactMarginPair(() => 40)
        .linkUpdate((_d: any, _i: number, arr: any[]) => {
          arr.forEach((el: any) => {
            el.setAttribute("stroke", "#444");
            el.setAttribute("stroke-width", "1.0");
          });
        })
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

    const handleResize = () => {
      chartRef.current?.fit();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [rawData, lineaNegocio, centroCosto, departamento]);

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
      const blob = new Blob([svgContent], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "organigrama-cargo.svg";
      link.click();
      URL.revokeObjectURL(url);
    }, 300);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Botones de control */}
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

      {/* Contenedor principal del organigrama */}
      <div className="flex-1 overflow-x-auto">
        <div id={containerId} className="w-full h-full"></div>
      </div>

    {showDialog && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-[600px]">
      <h2 className="text-lg font-bold mb-4">Ficha de Empleado</h2>

      {/* 🔹 Ficha para un solo empleado */}
      {selectedEmpleado ? (
        <div className="text-center">
          {/* Foto + nombre */}
          <div className="flex flex-col items-center mb-4">
            {selectedEmpleado.foto ? (
              <img
                src={selectedEmpleado.foto}
                alt="Foto"
                className="w-24 h-24 rounded-full border-4 border-blue-200 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-3xl">
                
              </div>
            )}
            <h3 className="mt-3 text-xl font-semibold text-gray-800">
              {selectedEmpleado.nombre} {selectedEmpleado.apellido}
            </h3>
            <p className="text-sm text-gray-500">
              {selectedEmpleado.puestoEmpleado || "Sin puesto"}
            </p>
          </div>

          {/* Información adicional */}
          <div className="space-y-2 text-sm text-gray-700 text-center">
            <p>
              <strong>Email:</strong>{" "}
              {selectedEmpleado.emailCorporativo || "N/A"}
            </p>
            <p>
              <strong>Línea de Negocio:</strong>{" "}
              {selectedEmpleado.nombreLineaNegocio || "N/A"}
            </p>
            <p>
              <strong>Centro de Costo:</strong>{" "}
              {selectedEmpleado.nombreCentroCosto || "N/A"}
            </p>
            <p>
              <strong>Departamento:</strong>{" "}
              {selectedEmpleado.nombreDepartamento || "N/A"}
            </p>
            <p>
              <strong>Fecha de ingreso a la empresa:</strong>{" "}
              {selectedEmpleado.fechaIngreso || "N/A"}
            </p>
          </div>

          {/* Botones de Manuales */}
          <div className="mt-6 flex flex-nowrap justify-center gap-3">
            <a
              href={getManualUrl(
                selectedEmpleado.codigoEmpleado,
                selectedEmpleado.codDepAx,
                selectedEmpleado.codDepartamento,
                "funciones"
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
            >
              Manual de Funciones
            </a>
            <a
              href={getManualUrl(
                selectedEmpleado.codigoEmpleado,
                selectedEmpleado.codDepAx,
                selectedEmpleado.codDepartamento,
                "procedimientos"
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg shadow hover:bg-cyan-700 transition"
            >
              Manual de Procedimientos
            </a>
            <a
              href={getManualUrl(
                selectedEmpleado.codigoEmpleado,
                selectedEmpleado.codDepAx,
                selectedEmpleado.codDepartamento,
                "usuario"
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
            >
              Manual de Usuario
            </a>
          </div>

          {/* Cerrar */}
          <div className="mt-6 flex justify-end">
            <button
              className="px-5 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
              onClick={() => setShowDialog(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        //  Si hay múltiples empleados en un nodo
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {selectedEmpleados.map((emp, idx) => (
            <div
              key={idx}
              className="flex items-center  justify-between border p-3 rounded-lg shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center space-x-3">
                {emp.foto ? (
                  <img
                    src={emp.foto}
                    alt="Foto"
                    className="w-12 h-12 rounded-full border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    
                  </div>
                )}
                <span className="font-medium text-gray-800">
                  {emp.nombre} {emp.apellido}
                </span>
              </div>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                onClick={() => setSelectedEmpleado(emp)}
              >
                Ver más
              </button>
            </div>
          ))}

          {/* Botón cerrar */}
          <div className="mt-6 flex justify-end">
            <button
              className="px-5 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
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
