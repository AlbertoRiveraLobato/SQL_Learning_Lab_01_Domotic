let db, ready = false;
let SQL;

// Inicializa SQL.js y espera a que esté listo antes de permitir usar la BD
initSqlJs({
    locateFile: file => file === "sql-wasm.wasm" ? "./sql-wasm.wasm" : file
}).then(SQLLib => {
    SQL = SQLLib;
    ready = false;
    document.getElementById('output').innerHTML = "<pre style='color: green;'>Librería SQL.js cargada. Pulsa 'Inicializar BD' para continuar.</pre>";
}).catch(err => {
    document.getElementById('output').innerHTML = `<pre class="error-message">Error cargando SQL.js: ${err.message}</pre>`;
});

// Definición del esquema y datos de ejemplo
const initSQL = `
CREATE TABLE habitaciones (
    id_habitacion INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    planta INTEGER
);

CREATE TABLE sensores (
    id_sensor INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    tipo TEXT
);

CREATE TABLE habitaciones_sensores (
    id_habitacion INTEGER,
    id_sensor INTEGER,
    valor TEXT,
    fecha DATETIME,
    PRIMARY KEY(id_habitacion, id_sensor)
);

INSERT INTO habitaciones (nombre, planta) VALUES
    ('Salón', 0),
    ('Dormitorio', 1),
    ('Cocina', 0),
    ('Baño', 1);

INSERT INTO sensores (nombre, tipo) VALUES
    ('Temperatura', 'numérico'),
    ('Humedad', 'numérico'),
    ('Presencia', 'booleano'),
    ('Luminosidad', 'numérico');

INSERT INTO habitaciones_sensores VALUES (1, 1, '22.1', '2025-09-21 16:30:00');
INSERT INTO habitaciones_sensores VALUES (1, 2, '38',   '2025-09-21 16:30:00');
INSERT INTO habitaciones_sensores VALUES (1, 3, 'no',   '2025-09-21 16:30:00');
INSERT INTO habitaciones_sensores VALUES (2, 1, '20.5', '2025-09-21 16:30:00');
INSERT INTO habitaciones_sensores VALUES (2, 2, '45',   '2025-09-21 16:30:00');
INSERT INTO habitaciones_sensores VALUES (2, 3, 'si',   '2025-09-21 16:30:00');
INSERT INTO habitaciones_sensores VALUES (3, 1, '23.8', '2025-09-21 16:30:00');
INSERT INTO habitaciones_sensores VALUES (4, 1, '21.0', '2025-09-21 16:30:00');
INSERT INTO habitaciones_sensores VALUES (4, 4, '120',  '2025-09-21 16:30:00');
`;

const output = document.getElementById('output');
const sqlInput = document.getElementById('sqlInput');
const roomGrid = document.getElementById('roomGrid');

// Mostrar resultados en una tabla
function printResult(rows) {
    if (!rows || rows.length === 0) {
        output.innerHTML = "<pre>No hay resultados para mostrar.</pre>";
        return;
    }
    let html = '<table><thead><tr>';
    for (const key in rows[0]) {
        html += `<th>${key}</th>`;
    }
    html += '</tr></thead><tbody>';
    rows.forEach(row => {
        html += '<tr>';
        for (const key in row) {
            html += `<td>${row[key]}</td>`;
        }
        html += '</tr>';
    });
    html += '</tbody></table>';
    output.innerHTML = html;
}

// Mostrar errores
function printError(msg) {
    output.innerHTML = `<pre class="error-message">Error: ${msg}</pre>`;
}

// Ejecutar SQL y mostrar resultados
async function ejecutarSQL(sql) {
    if (!ready || !db) {
        printError("La base de datos no está lista. Por favor, inicialice o espere.");
        return;
    }
    try {
        const rows = db.exec(sql)[0]?.values || [];
        const columns = db.exec(sql)[0]?.columns || [];
        // Formatear como array de objetos
        let data = [];
        rows.forEach(row => {
            let obj = {};
            columns.forEach((col, i) => obj[col] = row[i]);
            data.push(obj);
        });
        printResult(data);
    } catch (e) {
        printError(e.message);
    }
}

// Inicializar la base de datos
function inicializarDB() {
    if (!SQL) {
        printError("La librería SQL.js aún no está lista.");
        return;
    }
    db = new SQL.Database();
    db.exec(initSQL);
    ready = true;
    output.innerHTML = `<pre style="color: green;">Base de datos inicializada correctamente. Listo para ejecutar consultas.</pre>`;
    cargarRooms();
}

// Borrar la base de datos
function borrarDB() {
    if (db) db.close();
    ready = false;
    output.innerHTML = `<pre style="color: red;">Base de datos borrada. Debe inicializarla de nuevo para continuar.</pre>`;
    roomGrid.innerHTML = '';
}

// Cargar tarjetas de habitaciones
function cargarRooms() {
    if (!ready || !db) return;
    let stmt = db.prepare('SELECT * FROM habitaciones');
    roomGrid.innerHTML = '';
    let idx = 0;
    while (stmt.step()) {
        let row = stmt.getAsObject();
        const roomCard = document.createElement('div');
        roomCard.className = `room-card room-color-${idx % 5}`;
        roomCard.innerHTML = `
            <div class="room-title">${row.nombre}</div>
            <div class="room-info">ID: ${row.id_habitacion} &nbsp;|&nbsp; Planta: ${row.planta}</div>
        `;
        roomCard.onclick = () => sqlInput.value = `SELECT * FROM habitaciones_sensores WHERE id_habitacion = ${row.id_habitacion};`;
        roomGrid.appendChild(roomCard);
        idx++;
    }
    stmt.free();
}

// Botones
document.getElementById('btnEjecutar').addEventListener('click', () => {
    const sql = sqlInput.value.trim();
    if (sql) ejecutarSQL(sql);
});
document.getElementById('btnInicializar').addEventListener('click', () => inicializarDB());
document.getElementById('btnBorrarBD').addEventListener('click', () => borrarDB());
document.getElementById('btnBorrar').addEventListener('click', () => {
    output.innerHTML = '';
    const helpBox = document.querySelector('.help-box');
    if (helpBox) helpBox.remove();
});
sqlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        ejecutarSQL(sqlInput.value.trim());
    }
});