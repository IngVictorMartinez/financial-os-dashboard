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
