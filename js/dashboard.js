// ---------- Módulo 6: dashboard con gráficos (Chart.js) ----------
const desdeEl = document.querySelector('#desde');
const hastaEl = document.querySelector('#hasta');
const graficos = {};

// Cuenta cuántos tickets hay por cada valor del campo indicado
const agrupar = (tickets, campo) => {
    const conteo = {};
    tickets.forEach((t) => {
        const clave = t[campo] || 'Sin asignar';
        conteo[clave] = (conteo[clave] || 0) + 1;
    });
    return conteo;
};

const dibujar = (idCanvas, tipo, conteo) => {
    if (graficos[idCanvas]) graficos[idCanvas].destroy();
    graficos[idCanvas] = new Chart(document.querySelector('#' + idCanvas), {
        type: tipo,
        data: {
            labels: Object.keys(conteo),
            datasets: [{
                data: Object.values(conteo),
                backgroundColor: ['#0d6efd', '#ffc107', '#198754', '#6c757d', '#dc3545', '#20c997', '#6f42c1']
            }]
        },
        options: {
            plugins: { legend: { display: tipo === 'doughnut' } },
            scales: tipo === 'bar' ? { y: { beginAtZero: true, ticks: { precision: 0 } } } : {}
        }
    });
};

const filtrarPorFecha = () => {
    let tickets = G5.leer(G5.CLAVE_TICKETS);
    if (desdeEl.value) {
        tickets = tickets.filter((t) => new Date(t.fecha) >= new Date(desdeEl.value + 'T00:00:00'));
    }
    if (hastaEl.value) {
        tickets = tickets.filter((t) => new Date(t.fecha) <= new Date(hastaEl.value + 'T23:59:59'));
    }
    return tickets;
};

const pintarDashboard = () => {
    const tickets = filtrarPorFecha();
    document.querySelector('#totalTickets').textContent = tickets.length;
    dibujar('grafEstado', 'doughnut', agrupar(tickets, 'estado'));
    dibujar('grafPrioridad', 'bar', agrupar(tickets, 'prioridad'));
    dibujar('grafResponsable', 'bar', agrupar(tickets, 'asignado'));
    dibujar('grafCategoria', 'bar', agrupar(tickets, 'categoria'));
};

document.querySelector('#filtrosForm').addEventListener('submit', (e) => {
    e.preventDefault();
    pintarDashboard();
});

document.querySelector('#btnQuitar').addEventListener('click', () => {
    desdeEl.value = '';
    hastaEl.value = '';
    pintarDashboard();
});

pintarDashboard();
