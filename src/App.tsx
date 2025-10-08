import { useEffect, useState } from 'react';
import './App.css'
import OrganigramaPage from "./page/OrganigramaPage";

function App() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    // 🧪 Local: quemado manualmente
    setUserId("drendon"); // <-- cámbialo por el usuario que quieras probar
    //console.log("🧪 UserId quemado:", "krosado");
  } else {
    //  Producción: espera mensaje desde el iframe (ASPX)
    const handler = (event: MessageEvent) => {
      if (event.data?.userId) {
        const rawUserId = String(event.data.userId);
        const partes = rawUserId.split("\\"); // manejar "interno\\achucuyan"
        const limpio = partes.length > 1 ? partes[1] : rawUserId;
        const finalId = limpio.trim().toLowerCase();
        console.log(" UserId recibido via postMessage:", finalId);
        setUserId(finalId);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }
}, []);


  return (
     <div className="App">
      {userId && (
  <div className="text-sm text-gray-500">
    Usuario logueado: <strong>{userId}</strong>
  </div>
)}
      <OrganigramaPage userId={userId} />
    </div>
  )
}

export default App
