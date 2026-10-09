// ---------- Funciones de validación (mismo patrón de la sesión de formularios) ----------
const isRequired = value => value === '' ? false : true;

const isBetween = (length, min, max) => length < min || length > max ? false : true;

const isEmailValid = (email) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

const showError = (input, message) => {
    const formField = input.parentElement;
    formField.classList.remove('success');
    formField.classList.add('error');
    formField.querySelector('small').textContent = message;
};

const showSuccess = (input) => {
    const formField = input.parentElement;
    formField.classList.remove('error');
    formField.classList.add('success');
    formField.querySelector('small').textContent = '';
};

// Quita los colores verde/rojo de un formulario (por ejemplo, después de guardar)
const limpiarValidacion = (form) => {
    form.querySelectorAll('.form-field').forEach((campo) => {
        campo.classList.remove('error', 'success');
        campo.querySelector('small').textContent = '';
    });
};

// Espera 500 ms después de la última tecla antes de validar
const debounce = (fn, delay = 500) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn.apply(null, args);
        }, delay);
    };
};

// ---------- Login ----------
const loginForm = document.querySelector('#loginForm');

if (loginForm) {
    const emailEl = loginForm.querySelector('#email');
    const passwordEl = loginForm.querySelector('#password');
    const mensajeLogin = document.querySelector('#mensajeLogin');

    const checkEmail = () => {
        let valid = false;
        const email = emailEl.value.trim();
        if (!isRequired(email)) {
            showError(emailEl, 'El correo no puede estar vacío.');
        } else if (!isEmailValid(email)) {
            showError(emailEl, 'El correo no es válido.');
        } else {
            showSuccess(emailEl);
            valid = true;
        }
        return valid;
    };

    const checkPassword = () => {
        let valid = false;
        if (!isRequired(passwordEl.value.trim())) {
            showError(passwordEl, 'La contraseña no puede estar vacía.');
        } else {
            showSuccess(passwordEl);
            valid = true;
        }
        return valid;
    };

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        let isEmailOk = checkEmail(),
            isPasswordOk = checkPassword();

        if (!(isEmailOk && isPasswordOk)) {
            return;
        }

        fetch('/procesar_login', {
            method: 'POST',
            body: new FormData(loginForm)
        })
            .then((respuesta) => respuesta.text())
            .then((html) => {
                mensajeLogin.innerHTML = html;
            })
            .catch(() => {
                mensajeLogin.innerHTML = '<p class="text-danger">No se pudo conectar con el servidor.</p>';
            });
    });

    loginForm.addEventListener('input', debounce(function (e) {
        switch (e.target.id) {
            case 'email':
                checkEmail();
                break;
            case 'password':
                checkPassword();
                break;
        }
    }));
}

// ---------- Registro ----------
const registroForm = document.querySelector('#registroForm');

if (registroForm) {
    const nombreEl = registroForm.querySelector('#nombre');
    const emailEl = registroForm.querySelector('#email');
    const passwordEl = registroForm.querySelector('#password');
    const confirmarEl = registroForm.querySelector('#confirmar');

    const checkNombre = () => {
        let valid = false;
        const min = 3,
            max = 100;
        const nombre = nombreEl.value.trim();
        if (!isRequired(nombre)) {
            showError(nombreEl, 'El nombre no puede estar vacío.');
        } else if (!isBetween(nombre.length, min, max)) {
            showError(nombreEl, `El nombre debe tener entre ${min} y ${max} caracteres.`);
        } else {
            showSuccess(nombreEl);
            valid = true;
        }
        return valid;
    };

    const checkEmail = () => {
        let valid = false;
        const email = emailEl.value.trim();
        if (!isRequired(email)) {
            showError(emailEl, 'El correo no puede estar vacío.');
        } else if (!isEmailValid(email)) {
            showError(emailEl, 'El correo no es válido.');
        } else {
            showSuccess(emailEl);
            valid = true;
        }
        return valid;
    };

    const checkPassword = () => {
        let valid = false;
        const password = passwordEl.value;
        if (!isRequired(password)) {
            showError(passwordEl, 'La contraseña no puede estar vacía.');
        } else if (password.length < 8) {
            showError(passwordEl, 'La contraseña debe tener al menos 8 caracteres.');
        } else {
            showSuccess(passwordEl);
            valid = true;
        }
        return valid;
    };

    const checkConfirmar = () => {
        let valid = false;
        const confirmar = confirmarEl.value;
        if (!isRequired(confirmar)) {
            showError(confirmarEl, 'Escribe la contraseña otra vez.');
        } else if (confirmar !== passwordEl.value) {
            showError(confirmarEl, 'Las contraseñas no coinciden.');
        } else {
            showSuccess(confirmarEl);
            valid = true;
        }
        return valid;
    };

    // Si todo está bien se envía el formulario normal; el servidor vuelve a validar
    registroForm.addEventListener('submit', (e) => {
        let isNombreOk = checkNombre(),
            isEmailOk = checkEmail(),
            isPasswordOk = checkPassword(),
            isConfirmarOk = checkConfirmar();

        if (!(isNombreOk && isEmailOk && isPasswordOk && isConfirmarOk)) {
            e.preventDefault();
        }
    });

    registroForm.addEventListener('input', debounce(function (e) {
        switch (e.target.id) {
            case 'nombre':
                checkNombre();
                break;
            case 'email':
                checkEmail();
                break;
            case 'password':
                checkPassword();
                // si ya escribió la confirmación, se vuelve a comparar
                if (confirmarEl.value !== '') checkConfirmar();
                break;
            case 'confirmar':
                checkConfirmar();
                break;
        }
    }));
}

// ---------- Nuevo ticket con fotos ----------
const ticketForm = document.querySelector('#ticketForm');

if (ticketForm) {
    const asuntoEl = ticketForm.querySelector('#asunto');
    const descripcionEl = ticketForm.querySelector('#descripcion');
    const fotosEl = ticketForm.querySelector('#fotos');
    const mensajeTicket = document.querySelector('#mensajeTicket');

    const MAX_FOTOS = 3;
    const MAX_MB = 5;
    const TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    const checkAsunto = () => {
        let valid = false;
        const min = 5,
            max = 150;
        const asunto = asuntoEl.value.trim();
        if (!isRequired(asunto)) {
            showError(asuntoEl, 'El asunto no puede estar vacío.');
        } else if (!isBetween(asunto.length, min, max)) {
            showError(asuntoEl, `El asunto debe tener entre ${min} y ${max} caracteres.`);
        } else {
            showSuccess(asuntoEl);
            valid = true;
        }
        return valid;
    };

    const checkDescripcion = () => {
        let valid = false;
        const min = 10;
        const descripcion = descripcionEl.value.trim();
        if (!isRequired(descripcion)) {
            showError(descripcionEl, 'La descripción no puede estar vacía.');
        } else if (descripcion.length < min) {
            showError(descripcionEl, `Describe el incidente con al menos ${min} caracteres.`);
        } else {
            showSuccess(descripcionEl);
            valid = true;
        }
        return valid;
    };

    // Las fotos son opcionales, pero si se eligen deben cumplir las reglas
    const checkFotos = () => {
        const archivos = Array.from(fotosEl.files);
        if (archivos.length > MAX_FOTOS) {
            showError(fotosEl, `Solo puedes adjuntar hasta ${MAX_FOTOS} fotos.`);
            return false;
        }
        for (const archivo of archivos) {
            if (!TIPOS_VALIDOS.includes(archivo.type)) {
                showError(fotosEl, `"${archivo.name}" no es una imagen (JPG, PNG, GIF o WEBP).`);
                return false;
            }
            if (archivo.size > MAX_MB * 1024 * 1024) {
                showError(fotosEl, `"${archivo.name}" supera los ${MAX_MB} MB.`);
                return false;
            }
        }
        if (archivos.length > 0) {
            showSuccess(fotosEl);
        } else {
            fotosEl.parentElement.classList.remove('error', 'success');
            fotosEl.parentElement.querySelector('small').textContent = '';
        }
        return true;
    };

    ticketForm.addEventListener('submit', (e) => {
        e.preventDefault();

        let isAsuntoOk = checkAsunto(),
            isDescripcionOk = checkDescripcion(),
            isFotosOk = checkFotos();

        if (!(isAsuntoOk && isDescripcionOk && isFotosOk)) {
            return;
        }

        fetch('/procesar_ticket', {
            method: 'POST',
            body: new FormData(ticketForm)
        })
            .then((respuesta) => respuesta.text())
            .then((html) => {
                const esExito = html.includes('registrado correctamente');
                mensajeTicket.innerHTML = html.replace('<p>', '<p class="' + (esExito ? 'text-success' : 'text-danger') + '">');
                if (esExito) {
                    ticketForm.reset();
                    limpiarValidacion(ticketForm);
                }
            })
            .catch(() => {
                mensajeTicket.innerHTML = '<p class="text-danger">No se pudo conectar con el servidor.</p>';
            });
    });

    ticketForm.addEventListener('input', debounce(function (e) {
        switch (e.target.id) {
            case 'asunto':
                checkAsunto();
                break;
            case 'descripcion':
                checkDescripcion();
                break;
            case 'fotos':
                checkFotos();
                break;
        }
    }));
}
