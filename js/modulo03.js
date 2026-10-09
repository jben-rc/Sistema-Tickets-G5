// ---------- Módulo 3: asignación, estados e historial ----------
const gestionForm = document.querySelector('#gestionForm');
const ticketEl = document.querySelector('#ticket');
const tecnicoEl = document.querySelector('#tecnico');
const estadoEl = document.querySelector('#estado');
const comentarioEl = document.querySelector('#comentario');
const mensajeGestion = document.querySelector('#mensajeGestion');
const timelineEl = document.querySelector('#timeline');
const resumenTicket = document.querySelector('#resumenTicket');

const isRequired = (value) => value.trim() !== '';

const showError = (input, message) => {
    const campo = input.closest('.campo');
    campo.classList.add('error');
    campo.querySelector('small').textContent = message;
};

const clearError = (input) => {
    const campo = input.closest('.campo');
    campo.classList.remove('error');
    campo.querySelector('small').textContent = '';
};

const mostrarMensaje = (texto, tipo) => {
    mensajeGestion.textContent = texto;
    mensajeGestion.className = 'alert alert-' + tipo;
    mensajeGestion.style.display = 'block';
};

const opcion = (valor, texto) => {
    const o = document.createElement('option');
    o.value = valor;
    o.textContent = texto;
    return o;
};

const cargarCombos = () => {
    const tickets = G5.leer(G5.CLAVE_TICKETS);
    const tecnicos = G5.leer(G5.CLAVE_USUARIOS).filter((u) => u.rol === 'Técnico' && u.activo);
    const seleccionado = ticketEl.value;

    ticketEl.innerHTML = '';
    if (tickets.length === 0) {
        ticketEl.appendChild(opcion('', 'No hay tickets (créalos en el módulo 2)'));
    }
    tickets.forEach((t) => ticketEl.appendChild(opcion(t.id, `#${t.id} · ${t.asunto}`)));
    if (seleccionado) ticketEl.value = seleccionado;

    tecnicoEl.innerHTML = '';
    tecnicoEl.appendChild(opcion('', 'Sin asignar'));
    tecnicos.forEach((u) => tecnicoEl.appendChild(opcion(u.nombre, u.nombre)));

    estadoEl.innerHTML = '';
    G5.ESTADOS.forEach((e) => estadoEl.appendChild(opcion(e, e)));
};

const buscarTicket = () => G5.leer(G5.CLAVE_TICKETS).find((t) => t.id === Number(ticketEl.value));

// Muestra el estado actual del ticket seleccionado y su historial
const pintarTicket = () => {
    const t = buscarTicket();
    timelineEl.innerHTML = '';
    if (!t) {
        resumenTicket.textContent = 'Selecciona un ticket.';
        return;
    }

    tecnicoEl.value = t.asignado || '';
    estadoEl.value = t.estado;
    resumenTicket.textContent = `Estado actual: ${t.estado} · Técnico: ${t.asignado || 'sin asignar'}`;

    const historial = (t.historial || []).slice().reverse();
    if (historial.length === 0) {
        timelineEl.innerHTML = '<li class="text-muted">Aún no hay movimientos en este ticket.</li>';
        return;
    }
    historial.forEach((h) => {
        const li = document.createElement('li');
        const titulo = document.createElement('strong');
        titulo.textContent = `${h.estado} · ${h.tecnico || 'sin asignar'}`;
        const cuando = document.createElement('small');
        cuando.className = 'text-muted ms-2';
        cuando.textContent = `${G5.fechaRelativa(h.fecha)} (${G5.formatearFecha(h.fecha)})`;
        const comentario = document.createElement('div');
        comentario.textContent = h.comentario;
        li.appendChild(titulo);
        li.appendChild(cuando);
        li.appendChild(comentario);
        timelineEl.appendChild(li);
    });
};

ticketEl.addEventListener('change', pintarTicket);
comentarioEl.addEventListener('input', () => { if (isRequired(comentarioEl.value)) clearError(comentarioEl); });

gestionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    mensajeGestion.style.display = 'none';

    if (!ticketEl.value) { showError(ticketEl, 'Selecciona un ticket.'); return; }
    clearError(ticketEl);

    if (!isRequired(comentarioEl.value)) {
        showError(comentarioEl, 'El comentario es obligatorio en cada cambio.');
        return;
    }

    const tickets = G5.leer(G5.CLAVE_TICKETS);
    const t = tickets.find((x) => x.id === Number(ticketEl.value));
    const nuevoTecnico = tecnicoEl.value;
    const nuevoEstado = estadoEl.value;
    const cambioTecnico = nuevoTecnico !== (t.asignado || '');
    const cambioEstado = nuevoEstado !== t.estado;

    if (!cambioTecnico && !cambioEstado) {
        mostrarMensaje('No hay cambios: elige otro técnico u otro estado.', 'warning');
        return;
    }

    t.asignado = nuevoTecnico;
    t.estado = nuevoEstado;
    t.historial = t.historial || [];
    t.historial.push({
        fecha: new Date().toISOString(),
        estado: nuevoEstado,
        tecnico: nuevoTecnico,
        comentario: comentarioEl.value.trim()
    });
    G5.guardar(G5.CLAVE_TICKETS, tickets);

    // Eventos que generan notificación (módulo 5)
    if (cambioTecnico && nuevoTecnico) {
        G5.notificar('Asignación', t.id, `El ticket #${t.id} fue asignado a ${nuevoTecnico}.`);
    }
    if (cambioEstado) {
        G5.notificar('Cambio de estado', t.id, `El ticket #${t.id} pasó a "${nuevoEstado}".`);
    }

    comentarioEl.value = '';
    mostrarMensaje('Cambio guardado en el historial.', 'success');
    pintarTicket();

    const contador = document.querySelector('#campanaContador');
    if (contador) {
        contador.textContent = G5.contarNoLeidas();
        contador.style.display = '';
    }
});

cargarCombos();
pintarTicket();
