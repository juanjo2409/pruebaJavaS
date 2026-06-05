# 🎬 CineRiwi - SPA de Gestión de Cine y Reserva de Entradas

¡Bienvenido a **CineRiwi**! Este proyecto es una **Single Page Application (SPA)** moderna, elegante y simplificada, diseñada para administrar la cartelera de un cine, configurar las salas de proyección y gestionar la compra y reserva de boletos de entrada.

El sistema está optimizado para ser **fácil de entender, explicar y sustentar** académicamente, utilizando programación estructurada clara y comentarios explicativos detallados en español en todo el código fuente.

---

## 🚀 Guía de Arranque Rápido

Para iniciar el proyecto localmente, debes ejecutar la base de datos simulada (API) y el servidor del cliente web.

### Requisitos Previos
Tener instalado [Node.js](https://nodejs.org/) (se recomienda versión 18 o superior).

### Paso 1: Iniciar el Servidor de Datos (API)
Abre una terminal en la raíz del proyecto y ejecuta:
```bash
cd api
npm install
npm start
```
La base de datos simulada se ejecutará en **`http://localhost:3000`**.

### Paso 2: Iniciar el Cliente Web (Frontend)
Abre una segunda terminal en la raíz del proyecto y ejecuta:
```bash
cd client
npm install
npm run dev
```
El cliente web se compilará y ejecutará en **`http://localhost:5173/`**. Abre esa URL en tu navegador.

---

## 🔑 Credenciales de Acceso para Pruebas

Usa estas cuentas de correo y contraseñas registradas en `api/db.json` para probar los diferentes accesos:

| Rol | Correo Electrónico | Contraseña | ¿Qué puede hacer en el sistema? |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@cine.com` | `123456` | CRUD de películas y salas, ver/confirmar/cancelar todas las reservas y auditar usuarios. |
| **Cliente 1** | `juan@cine.com` | `123456` | Comprar entradas, ver e interactuar únicamente con sus propias reservas de boletos. |
| **Cliente 2** | `maria@cine.com` | `123456` | Comprar entradas, ver e interactuar únicamente con sus propias reservas de boletos. |

---

## 📁 Estructura General del Código

El código está organizado de manera modular e intuitiva:

```text
├── api/
│   ├── db.json               # Base de datos simulada (Usuarios, Salas, Películas, Reservas)
│   └── package.json          # Configuración del servidor json-server
│
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.js    # Menú de navegación lateral responsivo
    │   │   └── Toast.js      # Notificaciones emergentes dinámicas
    │   │
    │   ├── guards/
    │   │   └── auth.js       # Control de sesión de usuario y protección de rutas
    │   │
    │   ├── router/
    │   │   └── index.js      # Enrutador SPA basado en el cambio de Hash (#/ruta)
    │   │
    │   ├── services/
    │   │   └── api.js        # Peticiones fetch centralizadas al servidor (localhost:3000)
    │   │
    │   ├── utils/
    │   │   └── helpers.js    # Funciones de utilidad (fechas, validaciones y almacenamiento)
    │   │
    │   ├── views/
    │   │   ├── LoginView.js          # Pantalla de inicio de sesión
    │   │   ├── DashboardView.js      # Panel de métricas y estadísticas (Admin)
    │   │   ├── MoviesView.js         # Vista de Cartelera (CRUD admin / Compra clientes)
    │   │   ├── RoomsView.js          # Gestión de Salas de Proyección (Admin)
    │   │   ├── ReservationsView.js   # Historial y gestión de boletos comprados
    │   │   ├── UsersView.js          # Directorio de usuarios registrados (Admin)
    │   │   └── AccessDeniedView.js   # Pantalla de advertencia si no tiene permisos
    │   │
    │   ├── main.js           # Punto de entrada de la aplicación
    │   └── style.css         # Archivo de estilos personalizados
```

---

## 🧠 Guía de Sustentación Académica (Preguntas Frecuentes)

Si tienes que presentar o sustentar este proyecto ante un evaluador o profesor, aquí tienes las respuestas clave a las preguntas técnicas más probables:

### 💬 Pregunta 1: ¿Cómo funciona el enrutamiento de la aplicación si es una SPA (Single Page Application)?
> **Respuesta:**  
> La aplicación no recarga el navegador cuando cambiamos de pantalla. El enrutamiento se maneja en el archivo [router/index.js](file:///home/coder/pruebaJavaS/client/src/router/index.js). Escucha el evento `hashchange` de la ventana (`window.addEventListener('hashchange', resolveRoute)`).  
> Cuando el usuario hace clic en un enlace como `#/movies`, el enrutador toma esa ruta, comprueba los permisos del usuario con el guardián de rutas, limpia el contenedor principal (`#app`) y ejecuta la función de renderizado correspondiente para pintar la pantalla de manera instantánea.

### 💬 Pregunta 2: ¿Cómo funciona la protección de rutas (Guardias) y el control de roles?
> **Respuesta:**  
> En el archivo [guards/auth.js](file:///home/coder/pruebaJavaS/client/src/guards/auth.js) se define la función `checkRouteAccess(path)`. Esta función tiene un mapa de reglas donde se especifica si una ruta requiere inicio de sesión (`requiresAuth`) o si pertenece exclusivamente a un rol, como administrador (`role: 'admin'`).  
> Si un cliente común intenta escribir `#/rooms` o `#/dashboard` en la URL del navegador, la función lo intercepta y lo redirige automáticamente a la pantalla de **Acceso Denegado** (`#/access-denied`).

### 💬 Pregunta 3: ¿Cómo funciona el paso de parámetros en json-server para obtener la información unificada?
> **Respuesta:**  
> `json-server` permite filtrar recursos usando parámetros en la URL de consulta (Query Parameters).  
> * Para autenticar a un usuario, buscamos por su correo usando `/users?email=correo@cine.com` en [api.js](file:///home/coder/pruebaJavaS/client/src/services/api.js#L32-L35).  
> * Para ver las reservas de un usuario en particular, filtramos usando `/reservations?usuario=NombreUsuario` en [api.js](file:///home/coder/pruebaJavaS/client/src/services/api.js#L92-L95).  
> * La información se unifica en el frontend. Por ejemplo, al cargar las reservas, combinamos los datos de la reserva con los datos de las películas mediante búsquedas lógicas (`.find()`) para emparejar los IDs y mostrar detalles como el nombre de la sala y el póster.

### 💬 Pregunta 4: ¿Cómo se evita que dos películas compartan la misma sala a la misma hora (Anti-solapamiento)?
> **Respuesta:**  
> Antes de registrar una nueva función en la cartelera o actualizar una existente en [MoviesView.js](file:///home/coder/pruebaJavaS/client/src/views/MoviesView.js#L281-L349), recorremos la lista de películas activas que están guardadas en el servidor.  
> Comparamos si existe algún registro que coincida exactamente en **salaId**, **fecha** y **hora**. Si se encuentra una coincidencia, el sistema bloquea el guardado de inmediato y muestra una alerta interactiva al administrador detallando qué película ya está ocupando ese espacio.

### 💬 Pregunta 5: ¿Por qué se usan bucles secuenciales `for...of` al guardar múltiples horarios en lugar de ejecutarlos en paralelo con `Promise.all`?
> **Respuesta:**  
> Como base de datos usamos `json-server`, el cual lee y escribe en un único archivo físico de disco (`api/db.json`). Si intentamos enviar varias peticiones de creación en paralelo (con `Promise.all`), `json-server` puede bloquearse, generar colisiones de escritura (race conditions) o corromper el archivo.  
> Al usar un bucle tradicional `for...of` con `await`, obligamos al navegador a esperar a que cada horario se cree y guarde correctamente antes de proceder con el siguiente, garantizando la consistencia de los datos.

### 💬 Pregunta 6: ¿Cómo funciona el control de aforo y cupos disponibles?
> **Respuesta:**  
> Cada función de película en la base de datos tiene `capacidad_total` y `cupos_disponibles`.  
> * Cuando un cliente **compra boletos**, se valida que la cantidad solicitada no sea mayor a los cupos disponibles. Si es válida, restamos la cantidad comprada de los `cupos_disponibles` y actualizamos la película con una petición `PUT` al servidor.  
> * Si el usuario o el administrador **cancela o elimina la reserva**, el sistema le suma de vuelta las entradas canceladas a los `cupos_disponibles` de la función de manera automática, liberando los asientos para otros clientes de inmediato.
