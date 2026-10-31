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

        // Obtener mes (1-12) y año actual real
        const fechaHoy = new Date();
        const mesActualNum = fechaHoy.getMonth() + 1; 
        const anioActualNum = fechaHoy.getFullYear();

        let gastoDelMes = 0;
        let ingresoDelMes = 0;
        
        // Filtrar estrictamente los movimientos del mes y año actual
        const movimientosDelMes = movimientos.filter(movimiento => {
            if (!movimiento.transaction_date) return false;
            
            // Limpiar la fecha obtenida de Supabase para separar año, mes y día de forma segura
            const fechaLimpia = movimiento.transaction_date.toString().trim().split('T')[0];
            const partesFecha = fechaLimpia.split(/[-./]/).map(Number);
            
            if (partesFecha.length < 2) return false;

            const anioMov = partesFecha[0];
            const mesMov = partesFecha[1];
            
            return mesMov === mesActualNum && anioMov === anioActualNum;
        });

        // Calcular gastos e ingresos del mes filtrado
        movimientosDelMes.forEach(movimiento => {
            const monto = Number(movimiento.amount) || 0;
            if (movimiento.transaction_type === "Gasto") {
                gastoDelMes += monto;
            } else if (movimiento.transaction_type === "Ingreso") {
                ingresoDelMes += monto;
            }
        });

        // Actualizar las tarjetas del dashboard
        document.getElementById("monthly-expense").textContent = `$${gastoDelMes.toLocaleString()}`;
        document.getElementById("monthly-income").textContent = `$${ingresoDelMes.toLocaleString()}`;
        document.getElementById("total-movements").textContent = movimientosDelMes.length;

        // Rellenar la tabla HTML
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
