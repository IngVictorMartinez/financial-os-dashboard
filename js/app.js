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
        let ahorroTotalHistorico = 0; // Se calculará en función de Mercado Pago o registros de Ahorro

        const movimientosDelMes = [];

        movimientosGlobales.forEach(mov => {
            const monto = Number(mov.amount) || 0;
            const tipo = mov.transaction_type ? mov.transaction_type.trim() : "";
            const categoria = mov.category ? mov.category.toLowerCase().trim() : "";
            const cuenta = mov.account ? mov.account.trim() : "";

            const esAhorro = categoria === "ahorro";
            const esIngreso = tipo === "Ingreso" || tipo === "Ingresso";
            
            // Detectamos el ahorro de forma universal cuando su categoría sea "ahorro"
            // (Ya sea que entre a Mercado Pago como Transacción o se registre como Ahorro)
            const esMovimientoAhorroValido = esAhorro;

            // 1. Cálculo de Saldo por Cuenta
            if (cuenta && saldosCuentas[cuenta] !== undefined) {
                if (esIngreso) {
                    saldosCuentas[cuenta] += monto;
                } else {
                    // Resta dinero de las cuentas operativas o aplica según corresponda
                    saldosCuentas[cuenta] -= monto;
                }
            }

            // 2. Acumulado de Ahorro Total Histórico (Suma todo lo que tenga categoría ahorro)
            if (esMovimientoAhorroValido) {
                ahorroTotalHistorico += monto;
            }

            // 3. Filtrar movimientos del mes seleccionado para las tarjetas de ingresos/gastos y la tabla
            if (mov.transaction_date) {
                const fechaLimpia = mov.transaction_date.toString().trim().split('T')[0];
                const partes = fechaLimpia.split(/[-./]/).map(Number);

                if (partes.length >= 2 && partes[1] === mesSel && partes[0] === anioSel) {
                    movimientosDelMes.push(mov);
                    
                    if (!esAhorro) {
                        if (esIngreso) {
                            ingresoDelMes += monto;
                        } else if (tipo === "Gasto") {
                            gastoDelMes += monto; // Solo gastos operativos reales
                        }
                    }
                }
            }
        });

        // 4. Renderizar Dinero Total Disponible Operativo (Suma de Santander, Banamex, Efectivo, etc. excluyendo o incluyendo Mercado Pago según tu saldo)
        const saldoTotalGeneral = Object.values(saldosCuentas).reduce((acc, val) => acc + val, 0);
        const elTotalBalance = document.getElementById("total-balance");
        if (elTotalBalance) elTotalBalance.textContent = `$${saldoTotalGeneral.toLocaleString()}`;

        // 5. Renderizar Tarjetas Mensuales y de Ahorro Total
        const elIncome = document.getElementById("monthly-income");
        const elExpense = document.getElementById("monthly-expense");
        const elSavings = document.getElementById("monthly-savings");

        if (elIncome) elIncome.textContent = `$${ingresoDelMes.toLocaleString()}`;
        if (elExpense) elExpense.textContent = `$${gastoDelMes.toLocaleString()}`;
        if (elSavings) elSavings.textContent = `$${ahorroTotalHistorico.toLocaleString()}`;

        // Balance Neto del Mes seleccionado (Ingresos - Gastos operativos)
        const balanceNeto = ingresoDelMes - gastoDelMes;
        const elBalance = document.getElementById("monthly-net");
        if (elBalance) {
            elBalance.textContent = `$${balanceNeto.toLocaleString()}`;
            elBalance.className = balanceNeto >= 0 ? "positive" : "negative";
        }

        // 6. Renderizar Lista de Cuentas
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

        // 7. Renderizar Tabla de Movimientos del Mes
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
                const esAhorro = categoria === "ahorro";
                
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

    if (picker) {
        picker.addEventListener("change", procesarYRenderizar);
    }

    cargarDatosIniciales();


    
    
})();


