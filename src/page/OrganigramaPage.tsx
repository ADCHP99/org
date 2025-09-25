import React, { useEffect, useState } from "react";
import OrganigramaCargoComponent from "../components/OrganigramaCargoComponent";
import OrganigramaPersonaComponent from "../components/OrganigramaPersonaComponent";
import { fetchOrganigramaCargo, fetchOrganigramaPersona } from "../services/organigramaCargoService";

interface OptionType {
  value: "cargo" | "persona";
  label: string;
}

const options: OptionType[] = [
  { value: "cargo", label: "Vista por Cargo" },
  { value: "persona", label: "Vista por Persona" },
];

const OrganigramaPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<OptionType | null>(options[0]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Cargar datos cuando cambia la vista
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (viewMode?.value === "cargo") {
          const data = await fetchOrganigramaCargo();
          setRawData(data);
        } else {
          const data = await fetchOrganigramaPersona();
          setRawData(data);
          console.log("Datos cargados:", data);

        }
      } catch (err) {
        console.error("Error al cargar datos del organigrama:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [viewMode]);

  return (
    <div className="p-4">
      {/* Selector de vista */}
      
      {/* Loader */}
      {loading && (
  <div className="flex justify-center items-center py-10">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
    <span className="ml-3 text-gray-600 font-medium">Cargando organigrama...</span>
  </div>
)}

      {/* Mostrar organigrama según la vista */}
      {!loading && (
        <>
          {viewMode?.value === "cargo" ? (
           
            <OrganigramaCargoComponent
              rawData={rawData} 
              viewMode={viewMode} 
              setViewMode={setViewMode}

              />
          ) : (
            <OrganigramaPersonaComponent 
              rawData={rawData} 
              viewMode={viewMode}  
              setViewMode={setViewMode}
              
              />
          )}
        </>
      )}
    </div>
  );
};

export default OrganigramaPage;
