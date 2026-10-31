const SUPABASE_URL = "https://beepnamymzhmfgtbruhk.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_M8twaU9HppdklZxLDI0pLg_G3UaxuWq";

async function cargarMovimientos() {
    try {
        const response = await fetch(
            `${SUPABASE_URL}dashboard_transactions?select=*`,
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

        // Obtener el mes (1-12) y año actual
        const hoy = new Date();
        const mesActual = hoy.getMonth() + 1; 
        const anioActual = hoy.getFullYear();

        let gastoDelMes = 0;
        let ingresoDelMes = 0;
        
        // Filtrar estrictamente los movimientos del mes y año actual
        const movimientosDelMes = movimientos.filter(movimiento => {
            if (!movimiento.transaction_date) return false;
            
            // Limpiamos la fecha por si viene con formato ISO (YYYY-MM-DDTHH:mm:ss)
            const fechaLimpia = movimiento.transaction_date.split('T')[0];
            const [anioMov, mesMov] = fechaLimpia.split('-').map(Number);
            
            return mesMov === mesActual && anioMov === anioActual;
        });

        // Calcular gastos e ingresos del mes
        movimientosDelMes.forEach(movimiento => {
            const monto = Number(movimiento.amount) || 0;
            if (movimiento.transaction_type === "Gasto") {
                gastoDelMes += monto;
            } else if (movimiento.transaction_type === "Ingreso") {
                ingresoDelMes += monto;
            }
        });

        // Actualizar las tarjetas superiores
        document.getElementById("monthly-expense").textContent = `$${gastoDelMes.toLocaleString()}`;
        document.getElementById("monthly-income").textContent = `$${ingresoDelMes.toLocaleString()}`;
        document.getElementById("total-movements").textContent = movimientosDelMes.length;

        // Llenar la tabla con los movimientos del mes
        const tabla = document.getElementById("transactions-table");
        tabla.innerHTML = "";

        if (movimientosDelMes.length === 0) {
            tabla.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 15px;">No hay movimientos registrados en este mes</td></tr>`;
            return;
        }

        movimientosDelMes.forEach(movimiento => {
            tabla.innerHTML += `
                <tr>
                    <td>${movimiento.transaction_date}</td>
                    <td>$${Number(movimiento.amount || 0).toLocaleString()}</td>
                    <td>${movimiento.account ?? ""}</td>
                    <td>${movimiento.category ?? ""}</td>
                    <td>${movimiento.description ?? ""}</td>
                    <td>${movimiento.transaction_type ?? ""}</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Hubo un error en la carga:", error);
    }
}

cargarMovimientos();
