// ---------- Módulo 2: registro de tickets con fotos de evidencia ----------
const CLAVE_TICKETS = 'tickets_g5';
const MAX_FOTOS = 3;
const MAX_MB = 5;
const TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const SOLICITANTE = 'solicitante@demo.com'; // luego vendrá del login (módulo 1)

const ticketForm = document.querySelector('#ticketForm');
const asuntoEl = document.querySelector('#asunto');
const descripcionEl = document.querySelector('#descripcion');
const categoriaEl = document.querySelector('#categoria');
const prioridadEl = document.querySelector('#prioridad');
const fotosEl = document.querySelector('#fotos');
const vistaPrevia = document.querySelector('#vistaPrevia');
const mensajeTicket = document.querySelector('#mensajeTicket');
const listaTickets = document.querySelector('#listaTickets');
const zoomOverlay = document.querySelector('#zoomOverlay');
const zoomImagen = document.querySelector('#zoomImagen');

document.querySelector('#solicitante').textContent = SOLICITANTE;

// ---------- Almacenamiento (localStorage) ----------
const leerTickets = () => {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_TICKETS)) || [];
    } catch (e) {
        return [];
    }
};

const guardarTickets = (tickets) => {
    localStorage.setItem(CLAVE_TICKETS, JSON.stringify(tickets));
};

// ---------- Validaciones ----------
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
    mensajeTicket.textContent = texto;
    mensajeTicket.className = 'alert alert-' + tipo;
    mensajeTicket.style.display = 'block';
};

// Lee los primeros bytes del archivo para confirmar que realmente es una imagen
const esImagenReal = (archivo) => {
    return new Promise((resolve) => {
        const lector = new FileReader();
        lector.onload = () => {
            const b = new Uint8Array(lector.result);
            const texto = String.fromCharCode(...b);
            const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
            const png = b[0] === 0x89 && texto.slice(1, 4) === 'PNG';
            const gif = texto.startsWith('GIF87a') || texto.startsWith('GIF89a');
            const webp = texto.slice(0, 4) === 'RIFF' && texto.slice(8, 12) === 'WEBP';
            resolve(jpeg || png || gif || webp);
        };
        lector.onerror = () => resolve(false);
        lector.readAsArrayBuffer(archivo.slice(0, 12));
    });
};

// Devuelve un texto de error o '' si las fotos son válidas
const validarFotos = async () => {
    const archivos = Array.from(fotosEl.files);
    if (archivos.length > MAX_FOTOS) {
        return `Solo puedes adjuntar hasta ${MAX_FOTOS} fotos.`;
    }
    for (const archivo of archivos) {
        if (!TIPOS_VALIDOS.includes(archivo.type)) {
            return `El archivo "${archivo.name}" no es una imagen (JPG, PNG, GIF o WEBP).`;
        }
        if (archivo.size > MAX_MB * 1024 * 1024) {
            return `La imagen "${archivo.name}" supera los ${MAX_MB} MB.`;
        }
        if (!(await esImagenReal(archivo))) {
            return `El archivo "${archivo.name}" no tiene un formato de imagen válido.`;
        }
    }
    return '';
};

// Reduce la imagen para que quepa en localStorage y devuelve un data URL
const comprimirImagen = (archivo) => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(archivo);
        const img = new Image();
        img.onload = () => {
            const maximo = 800;
            const escala = Math.min(1, maximo / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * escala);
            canvas.height = Math.round(img.height * escala);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('No se pudo leer la imagen ' + archivo.name));
        };
        img.src = url;
    });
};

// ---------- Vista previa de las fotos elegidas ----------
fotosEl.addEventListener('change', async () => {
    vistaPrevia.innerHTML = '';
    const error = await validarFotos();
    if (error) {
        showError(fotosEl, error);
        return;
    }
    clearError(fotosEl);
    Array.from(fotosEl.files).forEach((archivo) => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(archivo);
        img.alt = archivo.name;
        vistaPrevia.appendChild(img);
    });
});

asuntoEl.addEventListener('input', () => { if (isRequired(asuntoEl.value)) clearError(asuntoEl); });
descripcionEl.addEventListener('input', () => { if (isRequired(descripcionEl.value)) clearError(descripcionEl); });

// ---------- Guardar ticket ----------
ticketForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensajeTicket.style.display = 'none';

    let valido = true;
    if (!isRequired(asuntoEl.value)) { showError(asuntoEl, 'Ingresa el asunto del ticket.'); valido = false; }
    if (!isRequired(descripcionEl.value)) { showError(descripcionEl, 'Describe el incidente.'); valido = false; }

    const errorFotos = await validarFotos();
    if (errorFotos) { showError(fotosEl, errorFotos); valido = false; }

    if (!valido) return;

    const boton = ticketForm.querySelector('button[type="submit"]');
    boton.disabled = true;
    boton.textContent = 'Guardando...';

    try {
        const fotos = [];
        for (const archivo of Array.from(fotosEl.files)) {
            fotos.push({ nombre: archivo.name, data: await comprimirImagen(archivo) });
        }

        const tickets = leerTickets();
        const ticket = {
            id: tickets.length ? Math.max(...tickets.map((t) => t.id)) + 1 : 1,
            asunto: asuntoEl.value.trim(),
            descripcion: descripcionEl.value.trim(),
            categoria: categoriaEl.value,
            prioridad: prioridadEl.value,
            estado: 'Abierto',
            asignado: '',
            historial: [],
            solicitante: SOLICITANTE,
            fecha: new Date().toISOString(),
            fotos: fotos
        };
        tickets.push(ticket);
        guardarTickets(tickets);

        ticketForm.reset();
        vistaPrevia.innerHTML = '';
        mostrarMensaje(`Ticket #${ticket.id} registrado correctamente.`, 'success');
        pintarTickets();
    } catch (err) {
        const sinEspacio = err && err.name === 'QuotaExceededError';
        mostrarMensaje(sinEspacio
            ? 'No hay espacio en el navegador. Borra tickets antiguos e intenta de nuevo.'
            : 'Ocurrió un error: ' + err.message, 'danger');
    } finally {
        boton.disabled = false;
        boton.textContent = 'Registrar ticket';
    }
});

// ---------- Listado ----------
const clasePrioridad = { Alta: 'danger', Media: 'warning', Baja: 'success' };

const formatearFecha = (iso) => {
    return new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
};

const pintarTickets = () => {
    const tickets = leerTickets().slice().reverse();
    listaTickets.innerHTML = '';

    if (tickets.length === 0) {
        listaTickets.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Aún no hay tickets registrados.</td></tr>';
        return;
    }

    tickets.forEach((t) => {
        const fila = document.createElement('tr');
        fila.className = 'fila-ticket';
        fila.dataset.id = t.id;

        const celdaFoto = document.createElement('td');
        if (t.fotos.length > 0) {
            const img = document.createElement('img');
            img.className = 'miniatura';
            img.src = t.fotos[0].data;
            img.alt = 'Evidencia';
            celdaFoto.appendChild(img);
            if (t.fotos.length > 1) {
                const extra = document.createElement('small');
                extra.className = 'text-muted ms-1';
                extra.textContent = '+' + (t.fotos.length - 1);
                celdaFoto.appendChild(extra);
            }
        } else {
            celdaFoto.innerHTML = '<div class="sin-foto">Sin foto</div>';
        }
        fila.appendChild(celdaFoto);

        const textoCeldas = [
            t.id,
            t.asunto,
            null,
            t.estado,
            formatearFecha(t.fecha)
        ];
        textoCeldas.forEach((valor, i) => {
            const celda = document.createElement('td');
            if (i === 2) {
                const badge = document.createElement('span');
                badge.className = 'badge text-bg-' + clasePrioridad[t.prioridad];
                badge.textContent = t.prioridad;
                celda.appendChild(badge);
            } else {
                celda.textContent = valor; // textContent evita inyectar HTML
            }
            fila.appendChild(celda);
        });

        fila.addEventListener('click', () => abrirDetalle(t.id));
        listaTickets.appendChild(fila);
    });
};

// ---------- Detalle con fotos y zoom ----------
const abrirDetalle = (id) => {
    const t = leerTickets().find((x) => x.id === id);
    if (!t) return;

    document.querySelector('#detalleTitulo').textContent = `#${t.id} · ${t.asunto}`;
    document.querySelector('#detalleMeta').textContent =
        `${t.categoria} · Prioridad ${t.prioridad} · Estado ${t.estado} · ${t.solicitante} · ${formatearFecha(t.fecha)}`;
    document.querySelector('#detalleDescripcion').textContent = t.descripcion;

    const contenedor = document.querySelector('#detalleFotos');
    contenedor.innerHTML = '';
    if (t.fotos.length === 0) {
        contenedor.innerHTML = '<p class="text-muted mb-0">Este ticket no tiene fotos de evidencia.</p>';
    }
    t.fotos.forEach((foto) => {
        const col = document.createElement('div');
        col.className = 'col-sm-4';
        const img = document.createElement('img');
        img.className = 'foto-detalle';
        img.src = foto.data;
        img.alt = foto.nombre;
        img.addEventListener('click', () => {
            zoomImagen.src = foto.data;
            zoomOverlay.classList.add('abierto');
        });
        const nombre = document.createElement('small');
        nombre.className = 'text-muted d-block text-truncate';
        nombre.textContent = foto.nombre;
        col.appendChild(img);
        col.appendChild(nombre);
        contenedor.appendChild(col);
    });

    bootstrap.Modal.getOrCreateInstance(document.querySelector('#detalleModal')).show();
};

zoomOverlay.addEventListener('click', () => zoomOverlay.classList.remove('abierto'));
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') zoomOverlay.classList.remove('abierto');
});

// ---------- Borrar todos ----------
document.querySelector('#btnLimpiar').addEventListener('click', () => {
    if (confirm('¿Desea borrar todos los tickets guardados en este navegador?')) {
        localStorage.removeItem(CLAVE_TICKETS);
        pintarTickets();
    }
});

pintarTickets();
