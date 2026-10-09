// ---------- Módulo 1: usuarios (la contraseña con bcrypt y el JWT se harán en el backend Flask) ----------
const usuarioForm = document.querySelector('#usuarioForm');
const nombreEl = document.querySelector('#nombre');
const emailUsuarioEl = document.querySelector('#email');
const passwordUsuarioEl = document.querySelector('#password');
const rolEl = document.querySelector('#rol');
const mensajeUsuario = document.querySelector('#mensajeUsuario');
const listaUsuarios = document.querySelector('#listaUsuarios');

const isRequired = (value) => value.trim() !== '';
const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
    mensajeUsuario.textContent = texto;
    mensajeUsuario.className = 'alert alert-' + tipo;
    mensajeUsuario.style.display = 'block';
};

const pintarUsuarios = () => {
    listaUsuarios.innerHTML = '';
    G5.leer(G5.CLAVE_USUARIOS).forEach((u) => {
        const fila = document.createElement('tr');
        [u.id, u.nombre, u.email, u.rol].forEach((valor) => {
            const celda = document.createElement('td');
            celda.textContent = valor;
            fila.appendChild(celda);
        });

        const celdaEstado = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'badge text-bg-' + (u.activo ? 'success' : 'secondary');
        badge.textContent = u.activo ? 'Activo' : 'Inactivo';
        celdaEstado.appendChild(badge);
        fila.appendChild(celdaEstado);

        const celdaAccion = document.createElement('td');
        const boton = document.createElement('button');
        boton.className = 'btn btn-sm btn-outline-secondary';
        boton.textContent = u.activo ? 'Desactivar' : 'Activar';
        boton.addEventListener('click', () => {
            const usuarios = G5.leer(G5.CLAVE_USUARIOS);
            const usuario = usuarios.find((x) => x.id === u.id);
            usuario.activo = !usuario.activo;
            G5.guardar(G5.CLAVE_USUARIOS, usuarios);
            pintarUsuarios();
        });
        celdaAccion.appendChild(boton);
        fila.appendChild(celdaAccion);

        listaUsuarios.appendChild(fila);
    });
};

usuarioForm.addEventListener('submit', (e) => {
    e.preventDefault();
    mensajeUsuario.style.display = 'none';

    const usuarios = G5.leer(G5.CLAVE_USUARIOS);
    let valido = true;

    if (!isRequired(nombreEl.value)) { showError(nombreEl, 'Ingresa el nombre.'); valido = false; } else { clearError(nombreEl); }

    const email = emailUsuarioEl.value.trim().toLowerCase();
    if (!isRequired(email)) {
        showError(emailUsuarioEl, 'Ingresa el correo electrónico.'); valido = false;
    } else if (!isEmailValid(email)) {
        showError(emailUsuarioEl, 'Ingresa un correo válido.'); valido = false;
    } else if (usuarios.some((u) => u.email === email)) {
        showError(emailUsuarioEl, 'Ese correo ya está registrado.'); valido = false;
    } else { clearError(emailUsuarioEl); }

    if (passwordUsuarioEl.value.length < 6) {
        showError(passwordUsuarioEl, 'La contraseña debe tener al menos 6 caracteres.'); valido = false;
    } else { clearError(passwordUsuarioEl); }

    if (!valido) return;

    // La contraseña NO se guarda aquí: el backend la recibirá y la guardará hasheada con bcrypt
    usuarios.push({
        id: G5.siguienteId(usuarios),
        nombre: nombreEl.value.trim(),
        email: email,
        rol: rolEl.value,
        activo: true
    });
    G5.guardar(G5.CLAVE_USUARIOS, usuarios);

    usuarioForm.reset();
    mostrarMensaje('Usuario registrado correctamente.', 'success');
    pintarUsuarios();
});

pintarUsuarios();
