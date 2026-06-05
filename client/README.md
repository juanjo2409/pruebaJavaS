# 💻 Frontend de CineRiwi (`/client`)

Esta carpeta contiene todo el frontend de la Single Page Application (SPA) para la gestión de cine y la compra de boletos.

---

## 🛠️ Tecnologías Utilizadas

*   **Vite**: Herramienta de compilación rápida para desarrollo web moderno.
*   **JavaScript Vanilla**: Código puro en módulos ES6, estructurado de forma secuencial y declarativa para facilitar su sustentación y comprensión por parte del estudiante.
*   **Tailwind CSS v4**: Utilidades CSS modernas para un diseño visual responsivo de alta calidad, con barra lateral y diseño adaptativo a móviles.
*   **SweetAlert2**: Para confirmaciones dinámicas y seguras al realizar acciones destructivas (ej. eliminar funciones).

---

## 📂 Estructura de la Carpeta de Fuentes (`src`)

El código está dividido lógicamente para simplificar su mantenimiento y facilitar la explicación del flujo:

*   **`/components`**: Elementos modulares del diseño, como la barra lateral de navegación interactiva (`Sidebar.js`) y las notificaciones dinámicas tipo Toast (`Toast.js`).
*   **`/guards`**: Archivo `auth.js` que controla la sesión actual, permite verificar si el usuario es administrador o cliente común y decide si el usuario tiene acceso a la pantalla que está solicitando.
*   **`/router`**: El enrutador `index.js` que escucha los cambios en el hash de la URL (`#/movies`, `#/rooms`) y renderiza la vista correspondiente dentro de la envoltura principal de la SPA.
*   **`/services`**: Centraliza la comunicación HTTP en `api.js` mediante la API Fetch para obtener y modificar los datos de películas, salas, usuarios y reservas.
*   **`/utils`**: Funciones auxiliares en `helpers.js` para formatear fechas amigables en español, comprobar si una función de cine ya comenzó y almacenar objetos en `localStorage`.
*   **`/views`**: Las plantillas HTML dinámicas y lógica de eventos para cada pantalla:
    *   `LoginView.js`: Formulario de inicio de sesión seguro.
    *   `DashboardView.js`: Métricas, contadores de taquilla y película más vendida.
    *   `MoviesView.js`: Catálogo de películas, pósteres e interactividad de compra/administración.
    *   `RoomsView.js`: Listado y configuración de salas de proyección.
    *   `ReservationsView.js`: Visualización de boletos con miniatura de póster y control de estado (Confirmada, Pendiente, Cancelada).
    *   `AccessDeniedView.js`: Mensaje de error si un cliente intenta entrar a un módulo administrativo.
*   **`main.js`**: Punto de entrada de la aplicación, importa el CSS general e inicializa el router.
*   **`style.css`**: Configuración de Tailwind CSS y animaciones fluidas (como transiciones de carga de vistas).

---

## 🚀 Instrucciones de Ejecución

1.  Asegúrate de haber instalado los módulos de Node.js en esta carpeta ejecutando en tu terminal:
    ```bash
    npm install
    ```
2.  Inicia el servidor de desarrollo local de Vite:
    ```bash
    npm run dev
    ```
3.  Abre el navegador en **`http://localhost:5173/`**.

> ⚠️ **IMPORTANTE:** Para que la interfaz de usuario cargue datos y guarde registros, el servidor backend simulado en `/api` debe estar en ejecución paralela en el puerto `3000`.
