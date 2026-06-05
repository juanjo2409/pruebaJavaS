# Base de Datos API Simulada (`/api`)

Este directorio contiene el backend de simulación para el Sistema de Reserva de Espacios de Trabajo. Utiliza `json-server` para crear una API RESTful a partir de un archivo de base de datos JSON local.

---

## Tecnologías Utilizadas

* **json-server**: Un paquete de Node que provee endpoints REST completos y listos para usar.
* **db.json**: El archivo de base de datos local que contiene los perfiles de usuarios, espacios y registros de reservas.

---

## Instrucciones de Ejecución

1. Abra su terminal en este directorio (`/api`).
2. Instale las dependencias necesarias:
   ```bash
   npm install
   ```
3. Inicie el servidor de base de datos:
   ```bash
   npm start
   ```

La API estará activa escuchando peticiones en **`http://localhost:3000`**.

---

## Colecciones de la Base de Datos

* **`/users`**: Perfiles de usuarios pre-cargados que representan a empleados y administradores.
* **`/workspaces`**: Espacios compartidos de la empresa como oficinas privadas, salas de reuniones, áreas de coworking y auditorios.
* **`/reservations`**: Reservas realizadas. Soporta expansiones de relaciones (por ejemplo, al añadir el parámetro `_expand=workspace&_expand=user` se cargan los objetos vinculados).
