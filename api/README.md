# 🗄️ Base de Datos API Simulada (`/api`)

Este directorio contiene el backend de simulación para **CineGestor**. Utiliza `json-server` para crear una API RESTful de desarrollo completa e interactiva a partir de un archivo JSON local.

---

## 🛠️ Tecnologías Utilizadas

*   **json-server**: Un paquete ligero de Node.js que expone endpoints REST completos (GET, POST, PUT, DELETE, PATCH) en segundos a partir de un archivo JSON.
*   **db.json**: Archivo de texto plano que simula nuestra base de datos relacional para el cine.

---

## 🚀 Instrucciones de Ejecución

1.  Asegúrate de haber instalado los módulos de Node.js en esta carpeta ejecutando en tu terminal:
    ```bash
    npm install
    ```
2.  Inicia el servidor local de base de datos:
    ```bash
    npm start
    ```

El servidor REST estará escuchando peticiones en **`http://localhost:3000`**.

---

## 📊 Colecciones y Endpoints Disponibles

La base de datos expone de forma automática los siguientes recursos:

*   **`/users`**: Contiene la lista de usuarios del sistema (administradores y clientes comunes) con sus correos y contraseñas de demostración.
*   **`/salas`**: Contiene las salas de cine configuradas (IMAX, 3D, 2D) y su capacidad máxima de asientos.
*   **`/movies`**: Contiene las funciones de películas individuales programadas en la cartelera, indicando la fecha, la hora, la sala asignada, la capacidad total de asientos, los cupos actualmente libres/disponibles y la URL del póster de la película.
*   **`/reservations`**: Contiene el registro físico de los boletos comprados por los clientes, relacionando al usuario y la función de película reservada, la fecha en que se realizó la reserva y la cantidad de asientos adquiridos.
