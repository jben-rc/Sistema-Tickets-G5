// ---------- Código compartido por todos los módulos (datos en localStorage mientras no exista el backend) ----------
const G5 = {
    CLAVE_TICKETS: 'tickets_g5',
    CLAVE_USUARIOS: 'usuarios_g5',
    CLAVE_NOTIF: 'notificaciones_g5',
    ESTADOS: ['Abierto', 'En proceso', 'Resuelto', 'Cerrado'],

    leer(clave) {
        try {
            return JSON.parse(localStorage.getItem(clave)) || [];
        } catch (e) {
            return [];
        }
    },

    guardar(clave, datos) {
        localStorage.setItem(clave, JSON.stringify(datos));
    },

    siguienteId(lista) {
        return lista.length ? Math.max(...lista.map((x) => x.id)) + 1 : 1;
    },

    formatearFecha(iso) {
        return new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
    },

    fechaRelativa(iso) {
        const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
        if (minutos < 1) return 'hace un momento';
        if (minutos < 60) return `hace ${minutos} min`;
        const horas = Math.floor(minutos / 60);
        if (horas < 24) return `hace ${horas} h`;
        const dias = Math.floor(horas / 24);
        return `hace ${dias} día${dias === 1 ? '' : 's'}`;
    },

    // Crea una notificación interna (módulo 5) cuando ocurre un evento en un ticket
    notificar(tipo, ticketId, mensaje) {
        const lista = G5.leer(G5.CLAVE_NOTIF);
        lista.push({
            id: G5.siguienteId(lista),
            tipo: tipo,
            ticketId: ticketId,
            mensaje: mensaje,
            leido: false,
            fecha: new Date().toISOString()
        });
        G5.guardar(G5.CLAVE_NOTIF, lista);
    },

    contarNoLeidas() {
        return G5.leer(G5.CLAVE_NOTIF).filter((n) => !n.leido).length;
    }
};

// Usuarios de prueba para poder probar los demás módulos
if (G5.leer(G5.CLAVE_USUARIOS).length === 0) {
    G5.guardar(G5.CLAVE_USUARIOS, [
        { id: 1, nombre: 'Administrador', email: 'admin@demo.com', rol: 'Administrador', activo: true },
        { id: 2, nombre: 'Técnico Uno', email: 'tecnico1@demo.com', rol: 'Técnico', activo: true },
        { id: 3, nombre: 'Técnico Dos', email: 'tecnico2@demo.com', rol: 'Técnico', activo: true },
        { id: 4, nombre: 'Solicitante Demo', email: 'solicitante@demo.com', rol: 'Solicitante', activo: true }
    ]);
}

// ---------- Menú superior con la campana de notificaciones ----------
const menuEl = document.querySelector('#menu');

if (menuEl) {
    const paginas = [
        ['login.html', 'Login'],
        ['Modulo1.html', 'Usuarios'],
        ['Modulo2.html', 'Tickets'],
        ['Modulo03.html', 'Asignación'],
        ['Modulo4.html', 'SLA'],
        ['Dashboard.html', 'Dashboard']
    ];
    const actual = location.pathname.split('/').pop();

    const enlaces = paginas.map(([archivo, texto]) =>
        `<li class="nav-item"><a class="nav-link${archivo === actual ? ' active' : ''}" href="${archivo}">${texto}</a></li>`
    ).join('');

    menuEl.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
            <div class="container">
                <span class="navbar-brand">Soporte TI</span>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuLinks" aria-controls="menuLinks" aria-expanded="false" aria-label="Abrir menú">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="menuLinks">
                    <ul class="navbar-nav me-auto">${enlaces}</ul>
                    <a class="btn btn-outline-light btn-sm position-relative" href="Modulo5.html" aria-label="Notificaciones">
                        🔔
                        <span id="campanaContador" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">0</span>
                    </a>
                </div>
            </div>
        </nav>`;

    const contador = document.querySelector('#campanaContador');
    const total = G5.contarNoLeidas();
    contador.textContent = total;
    contador.style.display = total > 0 ? '' : 'none';
}
