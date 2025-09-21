let db, ready = false;
const defaultSQL = `
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
INSERT INTO habitaciones_sensores VALUES (2, 3, 'sí',   '2025-09-21 16:30:00');
INSERT INTO habitaciones_sensores VALUES (3, 1, '19.2', '2025-09-21 16:30:00');
INSERT INTO habitaciones_sensores VALUES (3, 4, '20',   '2025-09-21 16:30:00');
INSERT INTO habitaciones_sensores VALUES (4, 1, '21.0', '2025-09-21 16:30:00');
INSERT INTO habitaciones_sensores VALUES (4, 2, '55',   '2025-09-21 16:30:00');
`;

function resetDB() {
    db = new window.initSqlJsDb.Database();
    db.run(defaultSQL);
    drawRooms();
    drawDbStructure();
    output.innerHTML = '';
}
function getInitSqlJsDb(cb) {
    if (window.initSqlJsDb) return cb();
    initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` })
        .then(SQL => {
            window.initSqlJsDb = SQL;
            db = new SQL.Database();
            db.run(defaultSQL);
            ready = true;
            drawRooms();
            drawDbStructure();
        });
}
getInitSqlJsDb(()=>{});

const sqlInput = document.getElementById('sqlInput');
const btnEjecutar = document.getElementById('btnEjecutar');
const btnReset = document.getElementById('btnReset');
const btnInicializar = document.getElementById('btnInicializar');
const btnBorrar = document.getElementById('btnBorrar');
const output = document.getElementById('output');
const roomGrid = document.getElementById('roomGrid');
const dbStructureDiv = document.getElementById('dbStructure');

// Tabulador en textarea (siempre opera dentro del área de texto)
sqlInput.addEventListener('keydown', function(e) {
    if (e.key === "Tab") {
        e.preventDefault();
        const { selectionStart, selectionEnd, value } = this;
        this.value = value.substring(0, selectionStart) + "\t" + value.substring(selectionEnd);
        this.selectionStart = this.selectionEnd = selectionStart + 1;
    }
});

// Botón Inicializar: pega el bloque de SQL para crear estructura y datos de ejemplo
btnInicializar.onclick = function() {
    sqlInput.value = defaultSQL.trim();
    sqlInput.focus();
    output.innerHTML = 'Código SQL de inicialización pegado. Puedes editarlo y pulsar <b>Ejecutar</b> para inicializar la base de datos.';
    output.style.color = '#1976d2';
};

// Ejecutar SQL
btnEjecutar.onclick = function() {
    if (!window.initSqlJsDb) return;
    const sql = sqlInput.value.trim();
    if (!sql) {
        output.innerHTML = 'Por favor, escribe un comando SQL.';
        output.style.color = '#d84315';
        return;
    }
    try {
        db.run(sql);
        output.style.color = '#388e3c';
        output.innerText = '¡Comando ejecutado correctamente!';
        drawRooms();
        drawDbStructure();
    } catch (e) {
        output.style.color = '#d84315';
        let helpMsg = getHelpMessage(sql, e.message);
        output.innerHTML = 'Error: ' + e.message + (helpMsg ? '<br><br>' + helpMsg : '');
    }
};

// Restablecer BD
btnReset.onclick = function() {
    resetDB();
    sqlInput.value = '';
    output.innerHTML = 'Base de datos restablecida al estado inicial.';
    output.style.color = '#1976d2';
};

// Borrar cuadro de texto
btnBorrar.onclick = function() {
    sqlInput.value = '';
    output.innerHTML = '';
    sqlInput.focus();
};

// Dibujar habitaciones y sensores
function drawRooms() {
    if (!window.initSqlJsDb) return;
    let rooms = db.exec("SELECT id_habitacion, nombre FROM habitaciones ORDER BY id_habitacion;");
    let sensors = db.exec("SELECT id_sensor, nombre, tipo FROM sensores;");
    let roomSensors = db.exec("SELECT id_habitacion, id_sensor, valor FROM habitaciones_sensores;");

    if (!rooms[0] || !rooms[0].values.length) {
        roomGrid.innerHTML = "<i>No hay habitaciones en la base de datos.</i>";
        return;
    }

    // Map sensors and roomSensors
    let sensorsMap = {};
    if (sensors[0])
        for (let row of sensors[0].values)
            sensorsMap[row[0]] = { nombre: row[1], tipo: row[2] };

    let roomSensorsMap = {};
    if (roomSensors[0])
        for (let row of roomSensors[0].values) {
            let key = row[0] + '-' + row[1];
            roomSensorsMap[key] = row[2];
        }

    let html = '';
    for (let i=0; i<rooms[0].values.length; ++i) {
        let room = rooms[0].values[i];
        let color = i % 5;
        html += `<div class="room-card room-color-${color}">
            <div class="room-title">${room[1]}</div>
            <div class="sensor-list">`;

        // Para cada sensor que esté en esta habitación
        for (let sensorId in sensorsMap) {
            let val = roomSensorsMap[room[0]+'-'+sensorId];
            if (typeof val !== "undefined") {
                html += `<div class="sensor-box">
                    <span class="sensor-name">${sensorsMap[sensorId].nombre}</span>
                    <span class="sensor-value">${val}</span>
                </div>`;
            }
        }

        html += `</div></div>`;
    }
    roomGrid.innerHTML = html;
}

// Dibujar estructura de BD (tablas y atributos)
function drawDbStructure() {
    if (!window.initSqlJsDb) return;
    const res = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;");
    dbStructureDiv.innerHTML = '';
    if (!res[0] || !res[0].values.length) {
        dbStructureDiv.innerHTML = "<i>No hay tablas en la base de datos.</i>";
        return;
    }
    let html = '';
    for (let row of res[0].values) {
        const tname = row[0];
        const cols = db.exec(`PRAGMA table_info(${tname});`);
        html += `<div class="db-table-title">${tname}</div>`;
        html += `<ul class="db-fields-list">`;
        for (let col of cols[0].values) {
            html += `<li>${col[1]} <span style="color:#607d8b;">:</span> <b>${col[2]}</b>${col[5] ? '<span class="pk-mark">PK</span>' : ''}</li>`;
        }
        html += `</ul>`;
    }
    dbStructureDiv.innerHTML = html;
}

// Mensajes de ayuda pedagógica para errores MySQL en SQLite
function getHelpMessage(sql, errorMsg) {
    if (/^\s*create\s+database/i.test(sql)) {
        return `
            <b>Ayuda:</b><br>
            <b>¿Por qué este error?</b> El comando <code>CREATE DATABASE</code> es válido en MySQL, pero <b>no está soportado en SQLite</b>.<br>
            <b>¿Cómo solucionarlo?</b> Omite este comando y comienza creando tablas.<br>
            <b>Ejemplo:</b> <code>CREATE TABLE habitaciones (...)</code>
        `;
    }
    if (/^\s*drop\s+database/i.test(sql)) {
        return `
            <b>Ayuda:</b> <code>DROP DATABASE</code> elimina una base de datos en MySQL, pero <b>no existe en SQLite</b>.<br>
            <b>¿Qué hacer?</b> Usa <code>DROP TABLE</code> para cada tabla.<br>
            <b>Ejemplo:</b> <code>DROP TABLE IF EXISTS habitaciones;</code>
        `;
    }
    if (/^\s*use\s+\w+/i.test(sql)) {
        return `
            <b>Ayuda:</b> <code>USE base_de_datos</code> no existe en SQLite. Trabaja directamente con las tablas.
        `;
    }
    if (/engine\s*=/i.test(sql)) {
        return `
            <b>Ayuda:</b> <code>ENGINE=...</code> no es soportado en SQLite. Elimina esta parte de la sentencia.
        `;
    }
    if (/charset\s*=/i.test(sql) || /collate\s*=/i.test(sql)) {
        return `<b>Ayuda:</b> <code>CHARSET</code> y <code>COLLATE</code> sólo son útiles en MySQL. Elimínalos.`;
    }
    if (/auto_increment/i.test(sql)) {
        return `
            <b>Ayuda:</b> En SQLite el equivalente a <code>AUTO_INCREMENT</code> es <code>INTEGER PRIMARY KEY AUTOINCREMENT</code>.
        `;
    }
    if (/unsigned/i.test(sql)) {
        return `<b>Ayuda:</b> SQLite no soporta <code>UNSIGNED</code>. Elimínalo.`;
    }
    if (/alter\s+table\s+\w+\s+drop\s+column/i.test(sql)) {
        return `
            <b>Ayuda:</b> SQLite no permite borrar columnas directamente.<br>
            <b>¿Qué hacer?</b> Crea una nueva tabla sin esa columna, copia los datos y renombra.
        `;
    }
    if (/alter\s+table\s+\w+\s+modify\s+column/i.test(sql) || /alter\s+table\s+\w+\s+change\s+column/i.test(sql)) {
        return `
            <b>Ayuda:</b> SQLite no soporta modificar columnas. Crea una tabla nueva con el diseño correcto y copia los datos.
        `;
    }
    if (/alter\s+table\s+\w+\s+add\s+primary\s+key/i.test(sql)) {
        return `
            <b>Ayuda:</b> Las claves primarias sólo pueden definirse al crear la tabla en SQLite.
        `;
    }
    if (/alter\s+table\s+\w+\s+add\s+constraint/i.test(sql)) {
        return `
            <b>Ayuda:</b> Las restricciones deben definirse en el <code>CREATE TABLE</code> en SQLite.
        `;
    }
    if (/alter\s+table\s+\w+\s+add\s+foreign\s+key/i.test(sql)) {
        return `
            <b>Ayuda:</b> Las claves foráneas deben definirse en el <code>CREATE TABLE</code> en SQLite.
        `;
    }
    if (/drop\s+index/i.test(sql) && /on\s+\w+/i.test(sql)) {
        return `
            <b>Ayuda:</b> En SQLite la sintaxis correcta es <code>DROP INDEX nombre_indice;</code>
        `;
    }
    if (/\b(enum|set|mediumint|tinyint|double|real|float|decimal|datetime|year|timestamp|tinytext|mediumtext|longtext|tinyblob|mediumblob|longblob)\b/i.test(sql)) {
        return `
            <b>Ayuda:</b> SQLite sólo reconoce <code>INTEGER</code>, <code>TEXT</code>, <code>REAL</code>, <code>BLOB</code> y <code>NUMERIC</code>. Usa esos tipos.
        `;
    }
    return "";
}
