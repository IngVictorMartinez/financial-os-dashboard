(function () {
    const SUPABASE_URL = "https://beepnamymzhmfgtbruhk.supabase.co/rest/v1/";
    const SUPABASE_KEY = "sb_publishable_M8twaU9HppdklZxLDI0pLg_G3UaxuWq";

    async function cargarAhorros() {
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

            // Filtrar únicamente los movimientos de la categoría "Ahorro"
            const ahorros = movimientos.filter(mov => 
                mov.category && mov.category.toLowerCase().trim() === "ahorro"
            );

            let totalAhorrado = 0;

            const tabla = document.getElementById("savings-table");
            tabla.innerHTML = "";

            if (ahorros.length === 0) {
                tabla.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #94a3b8;">No hay registros de ahorro aún</td></tr>`;
                document.getElementById("total-savings").textContent = "$0";
                return;
            }

            ahorros.forEach(mov => {
                const monto = Number(mov.amount || 0);
                totalAhorrado += monto;

                tabla.innerHTML += `
                    <tr>
                        <td>${mov.transaction_date}</td>
                        <td class="badge-ingreso">$${monto.toLocaleString()}</td>
                        <td>${mov.account ?? ""}</td>
                        <td>${mov.description ?? ""}</td>
                    </tr>
                `;
            });

            document.getElementById("total-savings").textContent = `$${totalAhorrado.toLocaleString()}`;

        } catch (error) {
            console.error("Hubo un error al cargar los ahorros:", error);
        }
    }

    cargarAhorros();
})();
