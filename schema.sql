-- Base de datos del Sistema de Tickets de Soporte TI
-- Ejecutar en phpMyAdmin (XAMPP) > pestaña SQL
CREATE DATABASE IF NOT EXISTS helpdesk_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE helpdesk_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('Administrador','Técnico','Solicitante') NOT NULL DEFAULT 'Solicitante',
    estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo'
);

CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asunto VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    prioridad ENUM('Alta','Media','Baja') NOT NULL,
    estado ENUM('Abierto','En proceso','Resuelto','Cerrado') NOT NULL DEFAULT 'Abierto',
    solicitante_id INT NOT NULL,
    tecnico_id INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (solicitante_id) REFERENCES users(id),
    FOREIGN KEY (tecnico_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ticket_evidencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    ruta_archivo VARCHAR(255) NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Usuarios de prueba. La contraseña de los tres es: demo12345 (guardada como hash de werkzeug, no en texto plano)
INSERT IGNORE INTO users (id, nombre, email, password, rol) VALUES
    (1, 'Administrador',    'admin@demo.com',       'scrypt:32768:8:1$HyYCnnw5A0KBQp1l$83c0a84629c9b8392c21fef6abf569c91613afa4be419b34c4f2e0c9435646ba8379f3ed808d64d92d70bc2f97df7046729418348ef5ba00726843d2cbb6067d', 'Administrador'),
    (2, 'Técnico Uno',      'tecnico@demo.com',     'scrypt:32768:8:1$HyYCnnw5A0KBQp1l$83c0a84629c9b8392c21fef6abf569c91613afa4be419b34c4f2e0c9435646ba8379f3ed808d64d92d70bc2f97df7046729418348ef5ba00726843d2cbb6067d', 'Técnico'),
    (3, 'Solicitante Demo', 'solicitante@demo.com', 'scrypt:32768:8:1$HyYCnnw5A0KBQp1l$83c0a84629c9b8392c21fef6abf569c91613afa4be419b34c4f2e0c9435646ba8379f3ed808d64d92d70bc2f97df7046729418348ef5ba00726843d2cbb6067d', 'Solicitante');
