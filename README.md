# SQL Learning Lab 03 
# App de Domótica

Esta aplicación es una herramienta didáctica para practicar SQL y aprender conceptos de bases de datos, usando como ejemplo una casa domótica. Los sensores y habitaciones se gestionan en una base de datos relacional **simulada en el navegador** con SQLite (sql.js).

## ¿Cómo funciona?
- Puedes escribir comandos SQL directamente en la consola de la web (INSERT, UPDATE, DELETE, SELECT...).
- El estado de la casa (sensores, habitaciones, etc.) se almacena en la base de datos y se muestra en la interfaz.
- Puedes añadir, borrar o modificar sensores, habitaciones y su estado usando consultas SQL.

## Archivos principales

- `index.html`: Página principal y estructura del plano de la casa.
- `style.css`: Estilos visuales de la interfaz.
- `app.js`: Lógica de la aplicación, conexión y manipulación de la base de datos SQLite en memoria usando sql.js.
- `sql-wasm.js` + `sql-wasm.wasm`: Librería para simular SQLite en el navegador. Descárgalos desde https://github.com/sql-js/sql.js/releases
- `README.md`: Este archivo de explicación.

## Ejemplo de comandos SQL que puedes probar

```
-- Ver todos los sensores
SELECT * FROM sensores;

-- Añadir un nuevo sensor a la cocina
INSERT INTO sensores (nombre, tipo, estado, habitacion_id) VALUES ('Sensor luminosidad', 'luz', 'apagado', 2);

-- Cambiar el estado de la luz del salón
UPDATE sensores SET estado='encendido' WHERE nombre LIKE 'Luz principal salón';

-- Eliminar un sensor
DELETE FROM sensores WHERE nombre='Detector humedad baño';

-- Ver sensores de una habitación
SELECT * FROM sensores WHERE habitacion_id=1;
```

## ¿Cómo alojar esta app en GitHub Pages?

1. Sube todos los archivos a tu repositorio.
2. Descarga `sql-wasm.js` y `sql-wasm.wasm` desde [sql.js releases](https://github.com/sql-js/sql.js/releases).
3. Ve a la configuración del repositorio y habilita GitHub Pages en la rama principal.
4. Accede a la URL que te da GitHub Pages.

---

**Notas para el profesor:**
- Puedes modificar el plano de la casa en `index.html` (añadir/quitar habitaciones).
- Puedes crear ejercicios tipo: “Crea un sensor nuevo en el dormitorio”, “Apaga todas las luces”, etc.
- Todo el código está comentado para facilitar su uso y aprendizaje.

---

**¡Diviértete aprendiendo y enseñando SQL!**
