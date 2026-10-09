// ---------- Módulo 5: notificaciones internas ----------
const listaNotif = document.querySelector('#listaNotif');
const totalNoLeidas = document.querySelector('#totalNoLeidas');

const actualizarContadores = () => {
    const total = G5.contarNoLeidas();
    totalNoLeidas.textContent = total;
    const campana = document.querySelector('#campanaContador');
    if (campana) {
        campana.textContent = total;
        campana.style.display = total > 0 ? '' : 'none';
    }
};

const pintarNotificaciones = () => {
    const lista = G5.leer(G5.CLAVE_NOTIF).slice().reverse();
    listaNotif.innerHTML = '';

    if (lista.length === 0) {
        listaNotif.innerHTML = '<p class="text-muted mb-0">No tienes notificaciones. Se generan al asignar un ticket o cambiar su estado (módulo 3).</p>';
    }

    lista.forEach((n) => {
        const item = document.createElement('div');
        item.className = 'list-group-item d-flex justify-content-between align-items-start' + (n.leido ? '' : ' notif-no-leida');

        const texto = document.createElement('div');
        const tipo = document.createElement('strong');
        tipo.textContent = n.tipo;
        const cuando = document.createElement('small');
        cuando.className = 'text-muted ms-2';
        cuando.textContent = G5.fechaRelativa(n.fecha);
        const mensaje = document.createElement('div');
        mensaje.textContent = n.mensaje;
        texto.appendChild(tipo);
        texto.appendChild(cuando);
        texto.appendChild(mensaje);
        item.appendChild(texto);

        if (!n.leido) {
            const boton = document.createElement('button');
            boton.className = 'btn btn-sm btn-outline-secondary ms-3 flex-shrink-0';
            boton.textContent = 'Marcar leída';
            boton.addEventListener('click', () => {
                const todas = G5.leer(G5.CLAVE_NOTIF);
                todas.find((x) => x.id === n.id).leido = true;
                G5.guardar(G5.CLAVE_NOTIF, todas);
                pintarNotificaciones();
            });
            item.appendChild(boton);
        }
        listaNotif.appendChild(item);
    });

    actualizarContadores();
};

document.querySelector('#btnMarcarTodas').addEventListener('click', () => {
    const todas = G5.leer(G5.CLAVE_NOTIF);
    todas.forEach((n) => { n.leido = true; });
    G5.guardar(G5.CLAVE_NOTIF, todas);
    pintarNotificaciones();
});

pintarNotificaciones();
