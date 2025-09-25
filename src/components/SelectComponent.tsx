import React, { useState, useEffect } from "react";
import Select, { type SingleValue } from "react-select";

// Tipo para cada opción
interface OptionType {
  value: string;
  label: string;
  foto?: string;
}

const SelectComponent: React.FC = () => {
  const [options, setOptions] = useState<OptionType[]>([]);
  const [selectedOption, setSelectedOption] = useState<OptionType | null>(null);
  const [loading, setLoading] = useState(false);

  // Llamada a tu API WordPress
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "http://localhost:8080/wordpress/wp-json/delportal/v1/get_organigrama"
        );
        const json = await res.json();

        // Transformar la respuesta en opciones para react-select
        const formatted = json.map((item: any) => ({
          value: item.codigoPosicion,
          label: `${item.puesto} - ${item.nombre ?? ""} ${item.apellido ?? ""}`,
          foto: item.foto || null,
        }));

        setOptions(formatted);
      } catch (error) {
        console.error("Error cargando opciones:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Plantilla para mostrar foto + texto
  const formatOptionLabel = (option: OptionType) => (
    <div className="flex items-center gap-2">
      {option.foto && (
        <img
          src={option.foto}
          alt={option.label}
          className="w-6 h-6 rounded-full object-cover"
        />
      )}
      <span>{option.label}</span>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto mt-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Buscar en organigrama
      </label>
      <Select
        options={options}
        value={selectedOption}
        onChange={(option: SingleValue<OptionType>) => setSelectedOption(option)}
        placeholder="Escribe para buscar..."
        isLoading={loading}
        isClearable
        formatOptionLabel={formatOptionLabel}
      />

      {selectedOption && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-gray-700">
            Seleccionaste:{" "}
            <span className="font-semibold">{selectedOption.label}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default SelectComponent;
