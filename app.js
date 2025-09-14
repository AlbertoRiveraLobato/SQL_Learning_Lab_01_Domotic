/**
 * app.js
 * Lógica principal para la app domótica educativa.
 * Usa sql.js para simular una base de datos SQL relacional en el navegador.
 * 
 * Puedes editar las tablas, los sensores y las consultas para ampliar la app.
 */

// Cargamos el entorno SQLite (sql.js usa WebAssembly)
// sql-wasm.js debe estar en tu repo. Descárgalo de https://github.com/sql-js/sql.js/releases
let db;
let SQL;

// Definición inicial de la base de datos y datos de ejemplo
const initSQL = `
-- Tabla de habitaciones
CREATE TABLE IF NOT EXISTS habitaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL
);

-- Tabla de sensores
CREATE TABLE IF NOT EXISTS sensores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL,
    estado TEXT NOT NULL,
    habitacion_id INTEGER,
    FOREIGN KEY(habitacion_id) REFERENCES habitaciones(id)
);

-- Insertar habitaciones de ejemplo
INSERT INTO habitaciones (nombre) VALUES ('salon'), ('cocina'), ('dormitorio'), ('baño');

-- Insertar sensores de ejemplo
INSERT INTO sensores (nombre, tipo, estado, habitacion_id) VALUES
    ('Luz principal salón', 'luz', 'apagado', 1),
    ('Sensor temperatura cocina', 'temperatura', '22°C', 2),
    ('Luz dormitorio', 'luz', 'encendido', 3),
    ('Detector humedad baño', 'humedad', '45%', 4);
`;

async function initDB() {
    SQL = await initSqlJs({ locateFile: file => `sql-wasm.wasm` });
    db = new SQL.Database();
    db.run(initSQL);
    renderSensors();
}

// Ejecutar consulta SQL del usuario y mostrar resultado
function runSQL() {
    const sql = document.getElementById('sql-input').value;
    let resultDiv = document.getElementById('sql-result');
    try {
        // Ejecuta la consulta (puede ser SELECT, INSERT, UPDATE, DELETE, etc.)
        let res = db.exec(sql);
        if (res.length > 0) {
            // Hay resultados (SELECT)
            let html = '<table border="1"><tr>';
            res[0].columns.forEach(col => html += `<th>${col}</th>`);
            html += '</tr>';
            res[0].values.forEach(row => {
                html += '<tr>';
                row.forEach(val => html += `<td>${val}</td>`);
                html += '</tr>';
            });
            html += '</table>';
            resultDiv.innerHTML = html;
        } else {
            // No hay resultados, pero la consulta fue válida (INSERT, UPDATE, etc.)
            resultDiv.textContent = 'Consulta ejecutada correctamente.';
        }
        // Tras ejecutar, actualiza la vista de sensores
        renderSensors();
    } catch (e) {
        resultDiv.textContent = 'Error: ' + e.message;
    }
}

// Restablece la BBDD a su estado original
function resetDB() {
    db.close();
    initDB();
    document.getElementById('sql-result').textContent = 'La base de datos ha sido restablecida.';
    document.getElementById('sql-input').value = '';
}

// Muestra los sensores y su estado actual agrupados por habitación
function renderSensors() {
    let html = '<h2>Estado de sensores por habitación</h2>';
    const rooms = db.exec('SELECT * FROM habitaciones');
    if (rooms.length === 0) {
        document.getElementById('sensors-status').innerHTML = 'No hay habitaciones en la BBDD.';
        return;
    }
    rooms[0].values.forEach(room => {
        html += `<div class="sensor-room"><strong>${room[1]}</strong><ul>`;
        const sensors = db.exec(`SELECT nombre, tipo, estado FROM sensores WHERE habitacion_id = ${room[0]}`);
        if (sensors.length > 0) {
            sensors[0].values.forEach(sensor => {
                html += `<li>${sensor[0]} (${sensor[1]}): <b>${sensor[2]}</b></li>`;
            });
        } else {
            html += '<li><em>No hay sensores en esta habitación.</em></li>';
        }
        html += '</ul></div>';
    });
    document.getElementById('sensors-status').innerHTML = html;
}

// Inicializa la base de datos al cargar la página
window.onload = initDB;