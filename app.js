let db, ready = false;
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

function printError(msg) {
    output.innerHTML = `<pre class="error-message">Error: ${msg}</pre>`;
}

async function ejecutarSQL(sql) {
    if (!ready) {
        printError("La base de datos no está lista. Por favor, inicialice o espere.");
        return;
    }
    try {
        const rows = await db.query(sql);
        printResult(rows);
    } catch (e) {
        printError(e.message);
    }
}

function getHelpText(sql) {
    sql = sql.trim().toLowerCase();
    if (sql.startsWith('create table') && sql.includes('primary key')) {
        return `
            <b>Ayuda:</b> Para definir una clave primaria auto-incremental en SQLite, usa ` + "`INTEGER PRIMARY KEY AUTOINCREMENT`" + `.
        `;
    }
    if (/drop\\s+table/i.test(sql) && !/if\\s+exists/i.test(sql)) {
        return `
            <b>Ayuda:</b> Es mejor usar ` + "`DROP TABLE IF EXISTS nombre_tabla;`" + ` para evitar errores si la tabla no existe.
        `;
    }
    if (/alter\\s+table\\s+\\w+\\s+rename\\s+column/i.test(sql)) {
        return `
            <b>Ayuda:</b> SQLite no soporta renombrar columnas directamente. Crea una tabla nueva, copia los datos y renombra.
        `;
    }
    if (/alter\\s+table\\s+\\w+\\s+modify\\s+column/i.test(sql) || /alter\\s+table\\s+\\w+\\s+change\\s+column/i.test(sql)) {
        return `
            <b>Ayuda:</b> SQLite no soporta modificar columnas. Crea una tabla nueva con el diseño correcto y copia los datos.
        `;
    }
    if (/alter\\s+table\\s+\\w+\\s+add\\s+primary\\s+key/i.test(sql)) {
        return `
            <b>Ayuda:</b> Las claves primarias sólo pueden definirse al crear la tabla en SQLite.
        `;
    }
    if (/alter\\s+table\\s+\\w+\\s+add\\s+constraint/i.test(sql)) {
        return `
            <b>Ayuda:</b> Las restricciones deben definirse en el ` + "`CREATE TABLE`" + ` en SQLite.
        `;
    }
    if (/alter\\s+table\\s+\\w+\\s+add\\s+foreign\\s+key/i.test(sql)) {
        return `
            <b>Ayuda:</b> Las claves foráneas deben definirse en el ` + "`CREATE TABLE`" + ` en SQLite.
        `;
    }
    if (/drop\\s+index/i.test(sql) && /on\\s+\\w+/i.test(sql)) {
        return `
            <b>Ayuda:</b> En SQLite la sintaxis correcta es ` + "`DROP INDEX nombre_indice;`" + `
        `;
    }
    if (/\\b(enum|set|mediumint|tinyint|double|longtext|geography|geometry|jsonb)\\b/i.test(sql)) {
        return `
            <b>Ayuda:</b> Algunos tipos de datos de bases de datos como MySQL o Postgres no son compatibles con SQLite. Usa los tipos: ` + "`TEXT`, `INTEGER`, `REAL`, `BLOB`, `NUMERIC`" + `.
        `;
    }
    return '';
}

function inicializarDB() {
    db = new SQL.Database();
    db.exec(initSQL);
    ready = true;
    output.innerHTML = `<pre style="color: green;">Base de datos inicializada correctamente. Listo para ejecutar consultas.</pre>`;
    cargarRooms();
}

function borrarDB() {
    db.close();
    ready = false;
    output.innerHTML = `<pre style="color: red;">Base de datos borrada. Debe inicializarla de nuevo para continuar.</pre>`;
    roomGrid.innerHTML = '';
}

function cargarRooms() {
    if (!ready) return;
    const rooms = db.query('SELECT * FROM habitaciones');
    roomGrid.innerHTML = '';
    rooms.forEach(room => {
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card';
        roomCard.innerHTML = `
            <h3>${room.nombre}</h3>
            <p>ID: ${room.id_habitacion}</p>
            <p>Planta: ${room.planta}</p>
        `;
        roomCard.onclick = () => sqlInput.value = `SELECT * FROM habitaciones_sensores WHERE id_habitacion = ${room.id_habitacion};`;
        roomGrid.appendChild(roomCard);
    });
}

document.getElementById('btnEjecutar').addEventListener('click', () => {
    const sql = sqlInput.value.trim();
    if (sql) {
        ejecutarSQL(sql);
    }
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
