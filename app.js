// Configuración de versión
const APP_VERSION = "v26";

let db, ready = false;
let SQL;

// Inicializa SQL.js y espera a que esté listo antes de permitir usar la BD
initSqlJs({
    locateFile: file => `./${file}`
}).then(SQLLib => {
    SQL = SQLLib;
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
    if (!SQL) {
        printError("La librería SQL.js aún no está lista.");
        return;
    }
    
    // Si no hay una base de datos o se está ejecutando código de inicialización, crear una nueva BD
    if (!db || !ready) {
        db = new SQL.Database();
        ready = true;
    }
    
    try {
        const results = db.exec(sql);
        
        // Si hay resultados, mostrarlos
        if (results.length > 0 && results[0].values.length > 0) {
            const rows = results[0].values || [];
            const columns = results[0].columns || [];
            // Formatear como array de objetos
            let data = [];
            rows.forEach(row => {
                let obj = {};
                columns.forEach((col, i) => obj[col] = row[i]);
                data.push(obj);
            });
            printResult(data);
        } else {
            // Si no hay resultados pero la consulta fue exitosa
            output.innerHTML = "<pre style='color: green;'>Consulta ejecutada correctamente.</pre>";
        }
        
        // Si parece que se ejecutó una inicialización, cargar las habitaciones
        if (sql.includes('CREATE TABLE') && sql.includes('habitaciones')) {
            cargarRooms();
        }
        
        // Si se realizaron cambios en la tabla habitaciones, actualizar la vista
        if (sql.toUpperCase().includes('INSERT INTO HABITACIONES') || 
            sql.toUpperCase().includes('UPDATE HABITACIONES') || 
            sql.toUpperCase().includes('DELETE FROM HABITACIONES') ||
            sql.toUpperCase().includes('ALTER TABLE HABITACIONES')) {
            cargarRooms();
        }
        
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
    // Pegar el código SQL en el textarea para que el usuario pueda editarlo o ejecutarlo
    sqlInput.value = initSQL.trim();
    output.innerHTML = `<pre style="color: green;">Código SQL de inicialización cargado en el editor. Puedes editarlo y luego pulsar 'Ejecutar' para crear la base de datos.</pre>`;
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
    if (!ready || !db) {
        roomGrid.innerHTML = '<div style="color: #666; padding: 1em; text-align: center; font-style: italic;">Base de datos no inicializada</div>';
        return;
    }
    
    try {
        // Consulta para obtener habitaciones
        let stmtHabitaciones = db.prepare('SELECT * FROM habitaciones ORDER BY id_habitacion');
        roomGrid.innerHTML = '';
        let idx = 0;
        
        while (stmtHabitaciones.step()) {
            let habitacion = stmtHabitaciones.getAsObject();
            
            // Consulta para obtener sensores de esta habitación
            let stmtSensores = db.prepare(`
                SELECT s.nombre as sensor_nombre, s.tipo, hs.valor, hs.fecha
                FROM sensores s
                JOIN habitaciones_sensores hs ON s.id_sensor = hs.id_sensor
                WHERE hs.id_habitacion = ?
                ORDER BY s.nombre
            `);
            stmtSensores.bind([habitacion.id_habitacion]);
            
            let sensoresInfo = [];
            while (stmtSensores.step()) {
                let sensor = stmtSensores.getAsObject();
                sensoresInfo.push(sensor);
            }
            stmtSensores.free();
            
            // Crear la tarjeta de habitación
            const roomCard = document.createElement('div');
            roomCard.className = `room-card room-color-${idx % 5}`;
            
            // Generar HTML para los sensores
            let sensoresHTML = '';
            if (sensoresInfo.length > 0) {
                sensoresHTML = '<div class="sensors-info">';
                sensoresInfo.forEach(sensor => {
                    let estadoClass = '';
                    let estadoIcon = '';
                    
                    // Determinar estado visual según el tipo de sensor
                    if (sensor.tipo === 'booleano') {
                        estadoClass = sensor.valor === 'si' ? 'sensor-active' : 'sensor-inactive';
                        estadoIcon = sensor.valor === 'si' ? '🟢' : '🔴';
                    } else {
                        estadoClass = 'sensor-numeric';
                        estadoIcon = '📊';
                    }
                    
                    sensoresHTML += `
                        <div class="sensor-item ${estadoClass}">
                            <span class="sensor-icon">${estadoIcon}</span>
                            <span class="sensor-name">${sensor.sensor_nombre}:</span>
                            <span class="sensor-value">${sensor.valor}${sensor.tipo === 'numérico' && (sensor.sensor_nombre === 'Temperatura') ? '°C' : sensor.tipo === 'numérico' && (sensor.sensor_nombre === 'Humedad') ? '%' : ''}</span>
                        </div>
                    `;
                });
                sensoresHTML += '</div>';
            } else {
                sensoresHTML = '<div class="no-sensors">Sin sensores</div>';
            }
            
            roomCard.innerHTML = `
                <div class="room-title">${habitacion.nombre}</div>
                <div class="room-info">ID: ${habitacion.id_habitacion} &nbsp;|&nbsp; Planta: ${habitacion.planta}</div>
                ${sensoresHTML}
            `;
            
            roomCard.onclick = () => sqlInput.value = `SELECT * FROM habitaciones_sensores WHERE id_habitacion = ${habitacion.id_habitacion};`;
            roomGrid.appendChild(roomCard);
            idx++;
        }
        stmtHabitaciones.free();
        
        // Si no hay habitaciones, mostrar mensaje informativo
        if (idx === 0) {
            roomGrid.innerHTML = '<div style="color: #666; padding: 1em; text-align: center; font-style: italic;">No hay habitaciones en la base de datos</div>';
        }
    } catch (e) {
        roomGrid.innerHTML = `<div style="color: #d32f2f; padding: 1em; text-align: center;">Error cargando habitaciones: ${e.message}</div>`;
    }
}

// Función para actualizar la vista de habitaciones
function actualizarVista() {
    if (!ready || !db) {
        output.innerHTML = `<pre class="error-message">La base de datos no está lista. Por favor, inicialice primero.</pre>`;
        return;
    }
    
    cargarRooms();
    output.innerHTML = `<pre style="color: green;">✅ Vista de habitaciones actualizada correctamente.</pre>`;
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
document.getElementById('btnBorrarQuery').addEventListener('click', () => {
    sqlInput.value = '';
    sqlInput.focus();
});
document.getElementById('btnActualizarVista').addEventListener('click', () => actualizarVista());
sqlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        ejecutarSQL(sqlInput.value.trim());
    }
    
    // Manejar el tabulador para insertar espacios/sangría
    if (e.key === 'Tab') {
        e.preventDefault(); // Evitar que el navegador cambie el foco al siguiente elemento
        
        // Obtener la posición actual del cursor
        const start = sqlInput.selectionStart;
        const end = sqlInput.selectionEnd;
        
        // Insertar 4 espacios (o puedes cambiar a '\t' si prefieres tabulador real)
        const tabString = '    '; // 4 espacios
        
        // Reemplazar el texto seleccionado (o insertar en la posición del cursor)
        sqlInput.value = sqlInput.value.substring(0, start) + 
                        tabString + 
                        sqlInput.value.substring(end);
        
        // Colocar el cursor después de la sangría insertada
        sqlInput.selectionStart = sqlInput.selectionEnd = start + tabString.length;
    }
});

// Actualizar versión en el DOM cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    const versionTag = document.getElementById('versionTag');
    if (versionTag) {
        versionTag.textContent = APP_VERSION;
    }
    
    // También actualizar el título del documento
    document.title = `SQL Learning Lab 03 ${APP_VERSION}`;
});