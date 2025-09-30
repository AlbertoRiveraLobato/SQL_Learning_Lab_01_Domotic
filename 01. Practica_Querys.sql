-- Inicialización de la bbdd
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

-- ------------------------------------------
-- ------------------------------------------

-- Queries para obtener info de la bbdd:
-- SELECT * FROM HABITACIONES;
-- SELECT * FROM SENSORES;
-- SELECT name FROM sqlite_master WHERE type='table';

-- Revisa el contenido de la tabla que relaciones sensores y habitaciones
SELECT * FROM habitaciones_sensores;

-- Modifica el valor de un sensor de una habitación: el valor del sensor de humedad del dormitorio):
UPDATE habitaciones_sensores SET valor = 99 WHERE (id_habitacion = 2 AND id_sensor = 2);

-- Inserta un par de nuevos sensores en la Cocina: de humedad y de presencia, con valores de 99 y 'no', respectivamente.
INSERT INTO habitaciones_sensores (id_habitacion, id_sensor, valor, fecha) VALUES (3, 2, 99, DATE('now')), (3, 3, 'no', DATE('now'));

-- Borra el sensor de humedad de la Cocina.
DELETE FROM habitaciones_sensores WHERE id_habitacion = 3 and id_sensor = 2;

-- Modifica o inserta, según corresponda, en el baño: un sensor de presencia a 'si' y un sensor de luminosidad a 90.
-- En SQLite es diferente a la sentencia de MySQL (ON DUPLICATE KEY), pero igulamente, necesita que haya una clave con la que realizar la 
-- comprobación de que ya exista una fila para ese mismo registro.
INSERT INTO habitaciones_sensores (id_habitacion, id_sensor, valor, fecha)
  VALUES 
    (4, 4, 99, DATE('now')),
    (4, 3, 'si', DATE('now'))
  ON CONFLICT(id_habitacion, id_sensor) DO UPDATE SET
    valor = excluded.valor,
    fecha = excluded.fecha;
