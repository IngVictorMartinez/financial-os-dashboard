(function () {
    const SUPABASE_URL = "https://beepnamymzhmfgtbruhk.supabase.co/rest/v1/";
    const SUPABASE_KEY = "sb_publishable_M8twaU9HppdklZxLDI0pLg_G3UaxuWq";

    async function cargarHistorialReciente() {
        try {
            const response = await fetch(
                `${SUPABASE_URL}dashboard_transactions?select=*&order=transaction_date.desc&limit=20`,
                {
                    headers: {
                        apikey: SUPABASE_KEY,
                        Authorization: `Bearer ${SUPABASE_KEY}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Error al conectar con Supabase: ${response.statusText}`);
            }

            const movimientos = await response.json();
            
            // Buscamos la tabla o el tbody de varias formas posibles para evitar que falle
            const tabla = document.getElementById("transactions-table") || 
                          document.getElementById("history-table") || 
                          document.querySelector("table tbody") ||
                          document.querySelector("table");

            if (!tabla) {
                console.error("No se encontró ningún elemento de tabla en el HTML de historial.");
                return;
            }

            tabla.innerHTML = "";

            if (!movimientos || movimientos.length === 0) {
                tabla.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #94a3b8;">No hay registros disponibles</td></tr>`;
                return;
            }

            movimientos.forEach(mov => {
                const tipo = mov.transaction_type ? mov.transaction_type.trim() : "";
                const categoria = mov.category ? mov.category.toLowerCase().trim() : "";
                const esAhorro = categoria === "ahorro" || tipo === "Transaccion" || tipo === "Transferencia";
                
                let badgeClass = 'badge-gasto';
                if (tipo === "Ingreso" || tipo === "Ingresso") badgeClass = 'badge-ingreso';
                if (esAhorro) badgeClass = 'badge-ahorro';

                tabla.innerHTML += `
                    <tr>
                        <td>${mov.transaction_date ?? ""}</td>
                        <td class="${badgeClass}">$${Number(mov.amount || 0).toLocaleString()}</td>
                        <td>${mov.account ?? ""}</td>
                        <td>${mov.category ?? ""}</td>
                        <td>${mov.description ?? ""}</td>
                        <td>${mov.transaction_type ?? ""}</td>
                    </tr>
                `;
            });

        } catch (error) {
            console.error("Hubo un error al cargar el historial:", error);
        }
    }

    cargarHistorialReciente();
})();
