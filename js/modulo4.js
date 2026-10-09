// ---------- Módulo 4: SLA y semáforo visual ----------
const HORAS_SLA = { Alta: 4, Media: 24, Baja: 72 };
const listaSla = document.querySelector('#listaSla');
const alertaSla = document.querySelector('#alertaSla');

const formatearDuracion = (horas) => {
    const totalMin = Math.floor(horas * 60);
    return `${Math.floor(totalMin / 60)} h ${totalMin % 60} min`;
};

// Calcula tiempo transcurrido, porcentaje consumido y color del semáforo
const calcularSla = (t) => {
    const limite = HORAS_SLA[t.prioridad];
    const resuelto = t.estado === 'Resuelto' || t.estado === 'Cerrado';
    // Si ya se resolvió, el reloj se detiene en el último movimiento del historial
    const ultimo = t.historial && t.historial.length ? t.historial[t.historial.length - 1].fecha : null;
    const fin = resuelto && ultimo ? new Date(ultimo).getTime() : Date.now();
    const transcurrido = (fin - new Date(t.fecha).getTime()) / 3600000;
    const porcentaje = transcurrido / limite;

    let color = 'verde';
    let texto = 'En tiempo';
    if (porcentaje >= 1) { color = 'rojo'; texto = 'Vencido'; }
    else if (porcentaje >= 0.5) { color = 'amarillo'; texto = 'Por vencer'; }

    if (resuelto) {
        color = porcentaje >= 1 ? 'rojo' : 'verde';
        texto = porcentaje >= 1 ? 'Resuelto fuera de SLA' : 'Resuelto dentro de SLA';
    }
    return { limite, transcurrido, porcentaje, color, texto, resuelto };
};

const pintarSla = () => {
    const tickets = G5.leer(G5.CLAVE_TICKETS).map((t) => ({ t: t, sla: calcularSla(t) }));
    // Los más urgentes (mayor porcentaje consumido) primero; los resueltos al final
    tickets.sort((a, b) => (a.sla.resuelto - b.sla.resuelto) || (b.sla.porcentaje - a.sla.porcentaje));

    listaSla.innerHTML = '';
    if (tickets.length === 0) {
        listaSla.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No hay tickets (créalos en el módulo 2).</td></tr>';
    }

    let vencidos = 0;
    let porVencer = 0;

    tickets.forEach(({ t, sla }) => {
        if (!sla.resuelto && sla.color === 'rojo') vencidos++;
        if (!sla.resuelto && sla.color === 'amarillo') porVencer++;

        const fila = document.createElement('tr');
        if (!sla.resuelto && sla.color !== 'verde') fila.className = 'sla-' + sla.color;

        const celdaSemaforo = document.createElement('td');
        const punto = document.createElement('span');
        punto.className = 'semaforo semaforo-' + sla.color;
        celdaSemaforo.appendChild(punto);
        fila.appendChild(celdaSemaforo);

        [t.id, t.asunto, t.prioridad, t.estado, formatearDuracion(sla.transcurrido),
         `${sla.limite} h`, `${sla.texto} (${Math.round(sla.porcentaje * 100)} %)`].forEach((valor) => {
            const celda = document.createElement('td');
            celda.textContent = valor;
            fila.appendChild(celda);
        });
        listaSla.appendChild(fila);
    });

    if (vencidos > 0 || porVencer > 0) {
        alertaSla.textContent = `Atención: ${vencidos} ticket(s) vencido(s) y ${porVencer} por vencer.`;
        alertaSla.style.display = 'block';
    } else {
        alertaSla.style.display = 'none';
    }
};

pintarSla();
setInterval(pintarSla, 60000); // se recalcula cada minuto
