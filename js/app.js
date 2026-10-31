(function () {
    const SUPABASE_URL = "https://beepnamymzhmfgtbruhk.supabase.co/rest/v1/";
    const SUPABASE_KEY = "sb_publishable_M8twaU9HppdklZxLDI0pLg_G3UaxuWq";

    async function cargarDashboard() {
        try {
            // 1. Obtener Cuentas
            const resCuentas = await fetch(`${SUPABASE_URL}accounts?select=*`, {
                headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
            });
            const cuentas = await resCuentas.json();

            // 2. Obtener Transacciones
            const resMovs = await fetch(`${SUPABASE_URL}dashboard_transactions?select=*`, {
                headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
            });
            const movimientos = await resMovs.json();

            // Obtener mes y año actual
            const fechaActual = new Date();
            const mesActualFiltro = fechaActual.getMonth() + 1;
            const anioActualFiltro = fechaActual.getFullYear();

            // Mapa para saldos por cuenta (Suma total real de las cuentas)
            const saldosCuentas = {};
            cuentas.forEach(c => saldosCuentas[c.name] = 0);

            let gastoDelMes = 0;
            let ingresoDelMes = 0;
            let ahorroDelMes = 0;

            const movimientosDelMes = [];

            movimientos.forEach(mov => {
                const monto = Number(mov.amount) || 0;
                const esIngreso = mov.transaction_type === "Ingreso";
                const esAhorro = mov.category && mov.category.toLowerCase().trim() === "ahorro";

                // Acumular saldo total general por cuenta (Patrimonio real)
                if (mov.account && saldosCuentas[mov.account] !== undefined) {
                    saldosCuentas[mov.account] += esIngreso ? monto : -monto;
                }

                // Filtrar solo movimientos de este mes para las tarjetas
                if (mov.transaction_date) {
                    const fechaLimpia = mov.transaction_date.toString().trim().split('T')[0];
                    const partes = fechaLimpia.split(/[-./]/).map(Number);

                    if (partes.length >= 2 && partes[1] === mesActualFiltro && partes[0] === anioActualFiltro) {
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

            // 3. Renderizar Total Disponible General
            const saldoTotalGeneral = Object.values(saldosCuentas).reduce((acc, val) => acc + val, 0);
            document.getElementById("total-balance").textContent = `$${saldoTotalGeneral.toLocaleString()}`;

            // 4. Renderizar Tarjetas Mensuales (3 tarjetas)
            document.getElementById("monthly-income").textContent = `$${ingresoDelMes.toLocaleString()}`;
            document.getElementById("monthly-expense").textContent = `$${gastoDelMes.toLocaleString()}`;
            document.getElementById("monthly-savings").textContent = `$${ahorroDelMes.toLocaleString()}`;

            // 5. Renderizar Lista de Cuentas
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

            // 6. Renderizar Tabla de Movimientos del Mes
            const tabla = document.getElementById("transactions-table");
            tabla.innerHTML = "";

            if (movimientosDelMes.length === 0) {
                tabla.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 15px; color: #94a3b8;">Sin movimientos este mes</td></tr>`;
                return;
            }

            movimientosDelMes.forEach(mov => {
                const esIngreso = mov.transaction_type === "Ingreso";
                const esAhorro = mov.category && mov.category.toLowerCase().trim() === "ahorro";
                
                let badgeClass = esIngreso ? 'badge-ingreso' : 'badge-gasto';
                if (esAhorro) badgeClass = 'badge-ahorro'; // Opcional si quieres darle color verde ahorro

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

        } catch (error) {
            console.error("Error al cargar los datos:", error);
        }
    }

    cargarDashboard();
})();
