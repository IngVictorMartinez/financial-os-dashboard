(function () {
    const SUPABASE_URL = "https://beepnamymzhmfgtbruhk.supabase.co/rest/v1/";
    const SUPABASE_KEY = "sb_publishable_M8twaU9HppdklZxLDI0pLg_G3UaxuWq";

    async function cargarHistorialCompleto() {
        try {
            const response = await fetch(
                `${SUPABASE_URL}dashboard_transactions?select=*&order=transaction_date.desc`,
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
            const tabla = document.getElementById("full-history-table");
            tabla.innerHTML = "";

            if (movimientos.length === 0) {
                tabla.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #94a3b8;">No hay movimientos registrados en el sistema</td></tr>`;
                return;
            }

            movimientos.forEach(mov => {
                const esIngreso = mov.transaction_type === "Ingreso";
                tabla.innerHTML += `
                    <tr>
                        <td>${mov.transaction_date}</td>
                        <td class="${esIngreso ? 'badge-ingreso' : 'badge-gasto'}">$${Number(mov.amount || 0).toLocaleString()}</td>
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

    cargarHistorialCompleto();
})();
