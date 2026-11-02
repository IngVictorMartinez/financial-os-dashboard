(function () {
    const SUPABASE_URL = "https://beepnamymzhmfgtbruhk.supabase.co/rest/v1/";
    const SUPABASE_KEY = "sb_publishable_M8twaU9HppdklZxLDI0pLg_G3UaxuWq";

    let movimientosGlobales = [];
    let cuentasGlobales = [];

    // Inicializar el selector de fecha con el mes actual (YYYY-MM)
    const picker = document.getElementById("month-picker");
    const hoy = new Date();
    const mesDefecto = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    if (picker && !picker.value) {
        picker.value = mesDefecto;
    }

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

            // Renderizar con el mes seleccionado
            procesarYRenderizar();

        } catch (error) {
            console.error("Error al cargar los datos:", error);
        }
    }

    function procesarYRenderizar() {
        const [anioSel, mesSel] = picker.value.split('-').map(Number);

        // Mapa para saldos por cuenta
        const saldosCuentas = {};
        cuentasGlobales.forEach(c => saldosCuentas[c.name] = 0);

        let gastoDelMes = 0;
        let ingresoDelMes = 0;
        let ahorroDelMes = 0;

        const movimientosDelMes = [];

        movimientosGlobales.forEach(mov => {
            const monto = Number(mov.amount) || 0;
            const tipo = mov.transaction_type ? mov.transaction_type.trim() : "";
            const categoria = mov.category ? mov.category.toLowerCase().trim() : "";
            
            // Detectar si es un ahorro (ya sea por categoría "ahorro" o tipo "transacción")
            const esAhorro = categoria === "ahorro" || tipo === "Transaccion" || tipo === "Transferencia";

            // 1. Cálculo de saldo por cuenta según el tipo de movimiento
            if (mov.account && saldosCuentas[mov.account] !== undefined) {
                if (tipo === "Ingreso" || tipo === "Ingresso") {
                    saldosCuentas[mov.account] += monto;
                } else if (tipo === "Gasto") {
                    saldosCuentas[mov.account] -= monto;
                } else if (esAhorro) {
                    // El ahorro/transacción interna resta de la cuenta de origen
                    saldosCuentas[mov.account] -= monto;
                }
            }

            // 2. Filtrar movimientos del mes seleccionado para las tarjetas
            if (mov.transaction_date) {
                const fechaLimpia = mov.transaction_date.toString().trim().split('T')[0];
                const partes = fechaLimpia.split(/[-./]/).map(Number);

                if (partes.length >= 2 && partes[1] === mesSel && partes[0] === anioSel) {
                    movimientosDelMes.push(mov);
                    
                    if (esAhorro) {
                        ahorroDelMes += monto; // Se acumula en la tarjeta de ahorros del mes
                    } else if (tipo === "Ingreso" || tipo === "Ingresso") {
                        ingresoDelMes += monto;
                    } else if (tipo === "Gasto") {
                        gastoDelMes += monto;
                    }
                }
            }
        });

        // 3. Renderizar Dinero Total Disponible General
        const saldoTotalGeneral = Object.values(saldosCuentas).reduce((acc, val) => acc + val, 0);
        const elTotalBalance = document.getElementById("total-balance");
        if (elTotalBalance) elTotalBalance.textContent = `$${saldoTotalGeneral.toLocaleString()}`;

        // 4. Renderizar Tarjetas Mensuales
        const elIncome = document.getElementById("monthly-income");
        const elExpense = document.getElementById("monthly-expense");
        const elSavings = document.getElementById("monthly-savings");

        if (elIncome) elIncome.textContent = `$${ingresoDelMes.toLocaleString()}`;
        if (elExpense) elExpense.textContent = `$${gastoDelMes.toLocaleString()}`;
        if (elSavings) elSavings.textContent = `$${ahorroDelMes.toLocaleString()}`;

        // Balance Neto del Mes seleccionado (Ingresos reales - Gastos operativos)
        const balanceNeto = ingresoDelMes - gastoDelMes;
        const elBalance = document.getElementById("monthly-net");
        if (elBalance) {
            elBalance.textContent = `$${balanceNeto.toLocaleString()}`;
            elBalance.className = balanceNeto >= 0 ? "positive" : "negative";
        }

        // 5. Renderizar Cuentas
        const containerCuentas = document.getElementById("accounts-container");
        if (containerCuentas) {
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
        }

        // 6. Renderizar Tabla del Mes Seleccionado
        const tabla = document.getElementById("transactions-table");
        if (tabla) {
            tabla.innerHTML = "";

            if (movimientosDelMes.length === 0) {
                tabla.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 15px; color: #94a3b8;">Sin movimientos en este periodo</td></tr>`;
                return;
            }

            movimientosDelMes.forEach(mov => {
                const tipo = mov.transaction_type ? mov.transaction_type.trim() : "";
                const categoria = mov.category ? mov.category.toLowerCase().trim() : "";
                const esAhorro = categoria === "ahorro" || tipo === "Transaccion" || tipo === "Transferencia";
                
                let badgeClass = 'badge-gasto';
                if (tipo === "Ingreso" || tipo === "Ingresso") badgeClass = 'badge-ingreso';
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
    }

    // Escuchar cambios en el selector de mes si existe
    if (picker) {
        picker.addEventListener("change", procesarYRenderizar);
    }

    // Cargar datos al iniciar
    cargarDatosIniciales();
})();
