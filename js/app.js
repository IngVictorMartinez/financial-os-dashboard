(function () {
    const SUPABASE_URL = "https://beepnamymzhmfgtbruhk.supabase.co/rest/v1/";
    const SUPABASE_KEY = "sb_publishable_M8twaU9HppdklZxLDI0pLg_G3UaxuWq";

    let movimientosGlobales = [];
    let cuentasGlobales = [];

    // Inicializar el selector de fecha con el mes actual (YYYY-MM)
    const picker = document.getElementById("month-picker");
    const hoy = new Date();
    const mesDefecto = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    picker.value = mesDefecto;

    async function cargarDatosIniciales() {
        try {
            // 1. Obtener Cuentas
            const resCuentas = await fetch(`${SUPABASE_URL}accounts?select=*`, {
                headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
            });
            cuentasGlobales = await resCuentas.json();

            // 2. Obtener Transacciones
            const resMovs = await fetch(`${SUPABASE_URL}dashboard_transactions?select=*`, {
                headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
            });
            movimientosGlobales = await resMovs.json();

            // Renderizar con el mes seleccionado por defecto
            procesarYRenderizar();

        } catch (error) {
            console.error("Error al cargar los datos:", error);
        }
    }

    function procesarYRenderizar() {
        const [anioSel, mesSel] = picker.value.split('-').map(Number);

        // Mapa para saldos por cuenta (Patrimonio total histórico acumulado)
        const saldosCuentas = {};
        cuentasGlobales.forEach(c => saldosCuentas[c.name] = 0);

        let gastoDelMes = 0;
        let ingresoDelMes = 0;
        let ahorroDelMes = 0;

        const movimientosDelMes = [];

        movimientosGlobales.forEach(mov => {
            const monto = Number(mov.amount) || 0;
            const esIngreso = mov.transaction_type === "Ingreso";
            const esAhorro = mov.category && mov.category.toLowerCase().trim() === "ahorro";

            // Acumular saldo real de las cuentas (acumulado general)
            if (mov.account && saldosCuentas[mov.account] !== undefined) {
                saldosCuentas[mov.account] += esIngreso ? monto : -monto;
            }

            // Filtrar movimientos del mes seleccionado en el picker
            if (mov.transaction_date) {
                const fechaLimpia = mov.transaction_date.toString().trim().split('T')[0];
                const partes = fechaLimpia.split(/[-./]/).map(Number);

                if (partes.length >= 2 && partes[1] === mesSel && partes[0] === anioSel) {
                    movimientosDelMes.push(mov);
                    
                    if (esAhorro) {
                        ahorroDelMes += monto;
                    } else if (esIngreso) {
                        ingresoDelMes += monto;
                    } else {
                        gastoDelMes += monto;
                    }
                }
            }
        });

        // 3. Renderizar Dinero Total Disponible General
        const saldoTotalGeneral = Object.values(saldosCuentas).reduce((acc, val) => acc + val, 0);
        document.getElementById("total-balance").textContent = `$${saldoTotalGeneral.toLocaleString()}`;

        // 4. Renderizar Tarjetas Mensuales
        document.getElementById("monthly-income").textContent = `$${ingresoDelMes.toLocaleString()}`;
        document.getElementById("monthly-expense").textContent = `$${gastoDelMes.toLocaleString()}`;
        document.getElementById("monthly-savings").textContent = `$${ahorroDelMes.toLocaleString()}`;

        // Balance Neto del Mes seleccionado
        const balanceNeto = ingresoDelMes - gastoDelMes;
        const elBalance = document.getElementById("monthly-net");
        elBalance.textContent = `$${balanceNeto.toLocaleString()}`;
        elBalance.className = balanceNeto >= 0 ? "positive" : "negative";

        // 5. Renderizar Cuentas
        const containerCuentas = document.getElementById("accounts-container");
        containerCuentas.innerHTML = "";

        Object.keys(saldosCuentas).forEach(cuentaNombre => {
            const montoCuenta = saldosCuentas[cuentaNombre];
            containerCuentas.innerHTML += `
                <div class="account-item">
                    <span class="account-name">${cuentaNombre}</span>
                    <span class="account-amount">$${montoCuenta.toLocaleString()}</span>
                </div>
            `;
        });

        // 6. Renderizar Tabla del Mes Seleccionado
        const tabla = document.getElementById("transactions-table");
        tabla.innerHTML = "";

        if (movimientosDelMes.length === 0) {
            tabla.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 15px; color: #94a3b8;">Sin movimientos en este periodo</td></tr>`;
            return;
        }

        movimientosDelMes.forEach(mov => {
            const esIngreso = mov.transaction_type === "Ingreso";
            const esAhorro = mov.category && mov.category.toLowerCase().trim() === "ahorro";
            
            let badgeClass = esIngreso ? 'badge-ingreso' : 'badge-gasto';
            if (esAhorro) badgeClass = 'badge-ahorro';

            tabla.innerHTML += `
                <tr>
                    <td>${mov.transaction_date}</td>
                    <td class="${badgeClass}">$${Number(mov.amount || 0).toLocaleString()}</td>
                    <td>${mov.account ?? ""}</td>
                    <td>${mov.category ?? ""}</td>
                    <td>${mov.transaction_type ?? ""}</td>
                </tr>
            `;
        });
    }

    // Escuchar cambios en el selector de mes
    picker.addEventListener("change", procesarYRenderizar);

    // Cargar datos
    cargarDatosIniciales();
})();
