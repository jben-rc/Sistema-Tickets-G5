from flask import Flask, render_template, request, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from markupsafe import escape
import pymysql.cursors
import os
import uuid

app = Flask(__name__)

CARPETA_UPLOADS = os.path.join(app.root_path, 'uploads')
os.makedirs(CARPETA_UPLOADS, exist_ok=True)

MAX_FOTOS = 3
TIPOS_IMAGEN = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp'}
CATEGORIAS = ['Hardware', 'Software', 'Red', 'Impresoras', 'Correo', 'Accesos', 'Otro']
PRIORIDADES = ['Alta', 'Media', 'Baja']

def obtenerconexion():
    try:
        connection = pymysql.connect(host='localhost',
                                    port=3306,
                                    user='root',
                                    password='',
                                    database='helpdesk_db',
                                    cursorclass=pymysql.cursors.DictCursor)
        return connection
    except Exception as e:
        raise e

# ---------- Rutas de práctica vistas en clase ----------

@app.route("/probandoconexionbd")
def probandoconexionbd():
    try:
        con = obtenerconexion()
        con.close()
        return "<p>Conexión exitosa</p>"
    except Exception as e:
        return "<p>Error de conexión: " + repr(e) + "</p>"

@app.route("/procesararchivo")
def procesararchivo():
    # Lee mbox.txt y cuenta cuántos correos envió cada remitente (líneas que empiezan con "From ")
    try:
        remitentes = {}
        total_lineas = 0
        with open(os.path.join(app.root_path, 'mbox.txt'), encoding='utf-8') as archivo:
            for linea in archivo:
                total_lineas += 1
                if linea.startswith('From '):
                    correo = linea.split()[1]
                    remitentes[correo] = remitentes.get(correo, 0) + 1

        # Se ordena de mayor a menor con una lista de tuplas (cantidad, correo)
        lista = sorted([(cantidad, correo) for correo, cantidad in remitentes.items()], reverse=True)

        strMensaje = "<p>El archivo tiene " + str(total_lineas) + " líneas.</p><ul>"
        for cantidad, correo in lista:
            strMensaje += "<li>" + str(escape(correo)) + ": " + str(cantidad) + "</li>"
        strMensaje += "</ul>"
        return strMensaje
    except FileNotFoundError:
        return "<p>No se encontró el archivo mbox.txt</p>"
    except Exception as e:
        return "<p>Error: " + repr(e) + "</p>"

@app.route("/calcularfactorial/<int:numero>")
def calcularfactorial(numero):
    strMensaje = ""
    if numero < 1:
        strMensaje = "<p>El número debe ser mayor a 0</p>"
    else:
        producto = 1
        for i in range(numero):
            producto *= (i + 1)
        strMensaje = "<p>El factorial de " + str(numero) + " es " + str(producto) + ".</p>"
    return strMensaje

@app.route("/precio/<p_plan>")
def precio(p_plan):
    planes = {'individual': 4.90, 'mensual': 24.90, 'semanal': 12.90}
    if p_plan in planes:
        return "<p>El plan " + str(escape(p_plan)) + " cuesta S/ " + str(planes[p_plan]) + "</p>"
    return "<p>El plan " + str(escape(p_plan)) + " no existe</p>"

@app.route("/catalogo-tabla")
def catalogo_tabla():
    peliculas = [
        {'titulo': 'Frontera de Acero', 'genero': 'Acción', 'anio': 2024, 'precio': 6.90},
        {'titulo': 'Últimas Luces', 'genero': 'Drama', 'anio': 2023, 'precio': 5.90},
        {'titulo': 'Vecinos del Piso 4', 'genero': 'Comedia', 'anio': 2022, 'precio': 4.90},
        {'titulo': 'El Sótano', 'genero': 'Terror', 'anio': 2024, 'precio': 5.90},
    ]
    return render_template('catalogo_tabla.html', peliculas=peliculas)

# ---------- Módulo 1: autenticación y registro ----------

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/login")
def login():
    return render_template('login.html')

@app.route("/procesar_login", methods=['POST'])
def procesar_login():
    try:
        strMensaje = ""
        v_email = request.form['email'].strip().lower()
        v_passw = request.form['password']
        objCon = obtenerconexion()
        with objCon:
            with objCon.cursor() as cursor:
                sql = "SELECT `id`, `nombre`, `password`, `estado` FROM `users` WHERE `email`=%s"
                cursor.execute(sql, (v_email,))
                result = cursor.fetchone()
                if result is None or not check_password_hash(result['password'], v_passw):
                    strMensaje = "<p>Credenciales inválidas</p>"
                elif result['estado'] != 'activo':
                    strMensaje = "<p>El usuario está inactivo</p>"
                else:
                    strMensaje = "<p>Bienvenido, <strong>" + str(escape(result['nombre'])) + "</strong> 🎬</p>"
    except Exception as e:
        strMensaje = "<p>Error: " + repr(e) + "</p>"
    return strMensaje

@app.route("/registro", methods=['GET', 'POST'])
def registro():
    errores = []
    exito = ""
    if request.method == 'POST':
        v_nombre = request.form['nombre'].strip()
        v_email = request.form['email'].strip().lower()
        v_passw = request.form['password']
        v_confirmar = request.form['confirmar']

        if v_nombre == '':
            errores.append('El nombre no puede estar vacío.')
        if '@' not in v_email or '.' not in v_email.split('@')[-1] or ' ' in v_email:
            errores.append('El correo no es válido.')
        if len(v_passw) < 8:
            errores.append('La contraseña debe tener al menos 8 caracteres.')
        if v_passw != v_confirmar:
            errores.append('Las contraseñas no coinciden.')

        if len(errores) == 0:
            try:
                connection = obtenerconexion()
                with connection:
                    with connection.cursor() as cursor:
                        cursor.execute("SELECT `id` FROM `users` WHERE `email`=%s", (v_email,))
                        if cursor.fetchone() is not None:
                            errores.append('El correo ya se encuentra registrado.')
                        else:
                            sql = "INSERT INTO `users` (`nombre`, `email`, `password`) VALUES (%s, %s, %s)"
                            cursor.execute(sql, (v_nombre, v_email, generate_password_hash(v_passw)))
                            connection.commit()
                            exito = "Registro exitoso. Ya puedes iniciar sesión."
            except Exception as e:
                errores.append("Error: " + repr(e))
    return render_template('registro.html', errores=errores, exito=exito)

# ---------- Módulo 2: tickets con evidencias ----------

@app.route("/crear-ticket")
def crear_ticket():
    try:
        connection = obtenerconexion()
        with connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT `id`, `nombre`, `rol` FROM `users` WHERE `estado`='activo' ORDER BY `nombre`")
                usuarios = cursor.fetchall()
        return render_template('crear_ticket.html', usuarios=usuarios, categorias=CATEGORIAS,
                               prioridades=PRIORIDADES, max_fotos=MAX_FOTOS)
    except Exception as e:
        return "<p>Error: " + repr(e) + "</p>"

@app.route("/procesar_ticket", methods=['POST'])
def procesar_ticket():
    guardados = []
    try:
        v_asunto = request.form['asunto'].strip()
        v_descripcion = request.form['descripcion'].strip()
        v_categoria = request.form['categoria']
        v_prioridad = request.form['prioridad']
        v_solicitante = request.form['solicitante_id']

        if v_asunto == '' or v_descripcion == '':
            return "<p>El asunto y la descripción son obligatorios</p>"
        if v_categoria not in CATEGORIAS or v_prioridad not in PRIORIDADES:
            return "<p>Categoría o prioridad no válida</p>"

        fotos = [f for f in request.files.getlist('fotos') if f.filename != '']
        if len(fotos) > MAX_FOTOS:
            return "<p>Solo se permiten hasta " + str(MAX_FOTOS) + " fotos</p>"
        for foto in fotos:
            if foto.mimetype not in TIPOS_IMAGEN:
                return "<p>El archivo " + str(escape(foto.filename)) + " no es una imagen válida</p>"

        # Se guardan las fotos con un nombre único dentro de la carpeta uploads
        for foto in fotos:
            nombre = uuid.uuid4().hex + '.' + TIPOS_IMAGEN[foto.mimetype]
            foto.save(os.path.join(CARPETA_UPLOADS, nombre))
            guardados.append(nombre)

        connection = obtenerconexion()
        with connection:
            with connection.cursor() as cursor:
                sql = "INSERT INTO `tickets` (`asunto`, `descripcion`, `categoria`, `prioridad`, `solicitante_id`) VALUES (%s, %s, %s, %s, %s)"
                cursor.execute(sql, (v_asunto, v_descripcion, v_categoria, v_prioridad, v_solicitante))
                id_ticket = cursor.lastrowid
                for nombre in guardados:
                    sql = "INSERT INTO `ticket_evidencias` (`ticket_id`, `ruta_archivo`) VALUES (%s, %s)"
                    cursor.execute(sql, (id_ticket, nombre))
            connection.commit()
        return "<p>Ticket #" + str(id_ticket) + " registrado correctamente</p>"
    except Exception as e:
        # Si algo falló, se borran las fotos que ya se habían guardado
        for nombre in guardados:
            if os.path.exists(os.path.join(CARPETA_UPLOADS, nombre)):
                os.remove(os.path.join(CARPETA_UPLOADS, nombre))
        return "<p>Error: " + repr(e) + "</p>"

@app.route("/tickets")
def tickets():
    try:
        connection = obtenerconexion()
        with connection:
            with connection.cursor() as cursor:
                sql = """SELECT t.`id`, t.`asunto`, t.`prioridad`, t.`estado`, t.`created_at`, u.`nombre` AS solicitante,
                                (SELECT e.`ruta_archivo` FROM `ticket_evidencias` e WHERE e.`ticket_id` = t.`id` ORDER BY e.`id` LIMIT 1) AS miniatura
                         FROM `tickets` t INNER JOIN `users` u ON u.`id` = t.`solicitante_id`
                         ORDER BY t.`created_at` DESC"""
                cursor.execute(sql)
                lista = cursor.fetchall()
        return render_template('tickets.html', tickets=lista)
    except Exception as e:
        return "<p>Error: " + repr(e) + "</p>"

@app.route("/ticket/<int:p_id>")
def ticket_detalle(p_id):
    try:
        connection = obtenerconexion()
        with connection:
            with connection.cursor() as cursor:
                sql = """SELECT t.*, u.`nombre` AS solicitante
                         FROM `tickets` t INNER JOIN `users` u ON u.`id` = t.`solicitante_id`
                         WHERE t.`id` = %s"""
                cursor.execute(sql, (p_id,))
                ticket = cursor.fetchone()
                if ticket is None:
                    return "<p>El ticket no existe</p>"
                cursor.execute("SELECT `ruta_archivo` FROM `ticket_evidencias` WHERE `ticket_id` = %s ORDER BY `id`", (p_id,))
                evidencias = cursor.fetchall()
        return render_template('ticket_detalle.html', ticket=ticket, evidencias=evidencias)
    except Exception as e:
        return "<p>Error: " + repr(e) + "</p>"

@app.route("/uploads/<nombre>")
def uploads(nombre):
    return send_from_directory(CARPETA_UPLOADS, nombre)

if __name__ == "__main__":
    app.run(debug=True)
