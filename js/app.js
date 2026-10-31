const SUPABASE_URL = "https://beepnamymzhmfgtbruhk.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_M8twaU9HppdklZxLDI0pLg_G3UaxuWq";

async function cargarMovimientos() {

    const response = await fetch(
        `${SUPABASE_URL}dashboard_transactions?select=*`,
        {
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`
            }
        }
    );

    const movimientos = await response.json();

    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    let gastoDelMes = 0;
    let ingresoDelMes = 0;

    movimientos.forEach(movimiento => {

        const fecha = new Date(movimiento.transaction_date);

        const mismoMes =
            fecha.getMonth() === mesActual &&
            fecha.getFullYear() === anioActual;

        if (
            mismoMes &&
            movimiento.transaction_type === "Gasto"
        ) {
            gastoDelMes += Number(movimiento.amount);
        }

        if (
            mismoMes &&
            movimiento.transaction_type === "Ingreso"
        ) {
            ingresoDelMes += Number(movimiento.amount);
        }

    });

    document.getElementById("monthly-expense").textContent =
        `$${gastoDelMes.toLocaleString()}`;

    document.getElementById("monthly-income").textContent =
        `$${ingresoDelMes.toLocaleString()}`;

    document.getElementById("total-movements").textContent =
        movimientos.length;

    const tabla = document.getElementById("transactions-table");

    tabla.innerHTML = "";

    movimientos.forEach(movimiento => {

        tabla.innerHTML += `
            <tr>
                <td>${movimiento.transaction_date}</td>
                <td>$${movimiento.amount}</td>
                <td>${movimiento.account ?? ""}</td>
                <td>${movimiento.category ?? ""}</td>
                <td>${movimiento.description ?? ""}</td>
                <td>${movimiento.transaction_type ?? ""}</td>
            </tr>
        `;

    });

}

cargarMovimientos();
