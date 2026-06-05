# Guía Completa de Sustentación - Sistema de Reservas de Espacios SPA

Este documento ha sido diseñado como una guía teórica y práctica paso a paso para defender técnicamente el proyecto **Workspace Reservation System** ante un jurado o profesor. Aquí se detalla la arquitectura, la organización del código, la persistencia, las reglas de negocio clave y la secuencia exacta en la que se construyó el software.

---

## 1. Ficha Técnica del Proyecto

* **Tipo de Aplicación:** Single Page Application (SPA - Aplicación de Página Única).
* **Paradigma de Programación:** Orientada a Procedimientos / Programación Estructurada Funcional en JavaScript.
* **Tecnologías del Cliente (Frontend):**
  * **HTML5:** Estructura base del contenedor principal.
  * **Tailwind CSS v4:** Maquetación premium y responsiva a través de clases de utilidad modernas.
  * **JavaScript ES6+ (Vanilla JS):** Lógica del enrutador, vistas, guards de seguridad y peticiones HTTP.
  * **Vite:** Herramienta de construcción y servidor de desarrollo ágil.
  * **SweetAlert2 (v11):** Biblioteca de diálogos emergentes e interacciones estéticas (cargada mediante CDN).
* **Tecnologías del Servidor (Backend de Desarrollo):**
  * **json-server:** Servidor que simula una API RESTful real leyendo/escribiendo en un archivo plano en disco (`db.json`).

---

## 2. Arquitectura y Modularización del Sistema

El proyecto sigue una estructura limpia y modular diseñada para ser fácil de explicar y entender, evitando la complejidad de frameworks robustos (como React o Angular), pero manteniendo un orden profesional.

```
📁 pruebaJS/
├── 📁 api/                   # Backend de pruebas (API REST)
│   ├── db.json               # Base de datos simulada en formato JSON
│   ├── package.json          # Configuración e inicio de json-server
│   └── README.md             # Documentación del backend (Español)
│
├── 📁 client/                # Frontend (Cliente Web)
│   ├── 📁 public/            # Recursos estáticos
│   ├── 📁 src/               # Código fuente del cliente
│   │   ├── 📁 assets/        # Imágenes y logos
│   │   ├── 📁 components/    # Componentes de interfaz reutilizables
│   │   │   ├── Sidebar.js    # Barra lateral de navegación condicional por rol
│   │   │   ├── Modal.js      # Ventanas modales y adaptadores de diálogos
│   │   │   └── Toast.js      # Notificaciones rápidas tipo toast
│   │   │
│   │   ├── 📁 guards/        # Capa de seguridad y control de acceso
│   │   │   └── auth.js       # Guardias de rutas y gestión de sesiones
│   │   │
│   │   ├── 📁 router/        # Motor de enrutamiento SPA
│   │   │   └── index.js      # Enrutador basado en Hash de URL (#/)
│   │   │
│   │   ├── 📁 services/      # Cliente HTTP para la API
│   │   │   └── api.js        # Centralización de peticiones HTTP Fetch
│   │   │
│   │   ├── 📁 utils/         # Helpers de utilidad y lógica de negocio
│   │   │   ├── helpers.js    # Conversores, formatos de fechas y local storage
│   │   │   └── validation.js # Algoritmo de traslape de fechas y horas
│   │   │
│   │   ├── 📁 views/         # Vistas dinámicas (HTML + Escucha de eventos)
│   │   │   ├── AccessDeniedView.js # Interfaz de acceso restringido
│   │   │   ├── DashboardView.js    # Estadísticas para el Administrador
│   │   │   ├── LoginView.js        # Formulario de autenticación
│   │   │   ├── ReservationsView.js # CRUD e histórico de reservas
│   │   │   ├── UsersView.js        # Listado de usuarios registrados
│   │   │   └── WorkspacesView.js   # CRUD de espacios de trabajo
│   │   │
│   │   ├── main.js           # Punto de entrada de la aplicación
│   │   └── style.css         # Estilos globales y Tailwind CSS
│   │
│   ├── index.html            # Contenedor principal de la SPA
│   ├── package.json          # Dependencias y scripts de Vite
│   ├── vite.config.js        # Configuración de compilación de Vite
│   └── README.md             # Guía del cliente en español
│
├── SUSTENTACION.md           # Este documento
└── README.md                 # Documento principal del proyecto
```

### Principio de Funcionamiento de la SPA (Single Page Application)
En lugar de recargar la página entera cada vez que navegamos, el navegador carga inicialmente el archivo [index.html](file:///c:/Users/juanj/Desktop/JS/pruebaJS/client/index.html). Este archivo contiene una sola etiqueta contenedora `<div id="app"></div>`. 

El archivo JavaScript principal [main.js](file:///c:/Users/juanj/Desktop/JS/pruebaJS/client/src/main.js) inicia el enrutador ([router/index.js](file:///c:/Users/juanj/Desktop/JS/pruebaJS/client/src/router/index.js)), el cual escucha el evento `hashchange` del navegador. Cuando la URL cambia (por ejemplo, de `#/login` a `#/reservations`), el enrutador:
1. Valida los permisos de la ruta mediante los guards en [guards/auth.js](file:///c:/Users/juanj/Desktop/JS/pruebaJS/client/src/guards/auth.js).
2. Limpia el contenedor `#app`.
3. Carga e inyecta la estructura HTML correspondiente llamando a la función de renderizado de la vista asociada (por ejemplo, `renderReservations()`).
4. Asocia los event listeners (`click`, `submit`, etc.) a los botones y formularios recién inyectados en el DOM.

---

## 3. Persistencia y Seguridad

### Persistencia del Servidor (API REST con json-server)
Cuando el cliente crea o modifica información, realiza llamadas HTTP asíncronas (`fetch`) usando métodos del estándar REST:
* **`GET`** para recuperar datos.
* **`POST`** para crear nuevos recursos.
* **`PUT`** / **`PATCH`** para actualizar información existente de forma total o parcial.
* **`DELETE`** para remover elementos.

`json-server` procesa estas peticiones en el puerto `3000` y reescribe inmediatamente el archivo [api/db.json](file:///c:/Users/juanj/Desktop/JS/pruebaJS/api/db.json) para que los datos persistan de forma indefinida en el servidor.

### Persistencia de Sesión Local (localStorage vs sessionStorage)
En la pantalla de inicio de sesión, el usuario tiene un campo de verificación *"Recordar sesión en este equipo"*. 
* Si se **marca**, la sesión del usuario se almacena en `localStorage` (los datos persisten aun si el usuario cierra el navegador o reinicia la computadora).
* Si **no se marca**, se guarda en `sessionStorage` (los datos se destruyen automáticamente cuando el usuario cierra la pestaña del navegador).

La lógica se abstrae en el archivo [utils/helpers.js](file:///c:/Users/juanj/Desktop/JS/pruebaJS/client/src/utils/helpers.js) mediante las funciones `getStorageItem`, `setStorageItem` y `removeStorageItem`.

### Seguridad (Routing Guards)
La seguridad está gestionada en el frontend por la función `checkRouteAccess()` dentro del archivo [guards/auth.js](file:///c:/Users/juanj/Desktop/JS/pruebaJS/client/src/guards/auth.js). Antes de renderizar cualquier vista, el enrutador pasa la ruta destino por esta función, la cual evalúa:
1. Si la ruta requiere estar autenticado (`requiresAuth`) y no hay usuario activo, redirige al `/login`.
2. Si la ruta es solo para invitados (`guestOnly` como `/login`) y ya hay una sesión activa, redirige al dashboard o panel correspondiente.
3. Si la ruta requiere un rol de administrador (`role: 'admin'`) y el usuario logueado es de tipo empleado, bloquea la navegación y redirige a la vista `/access-denied`.

---

## 4. Paso a Paso Detallado: Cómo se Construyó el Proyecto

A continuación, se detalla cronológicamente la construcción de la aplicación. Esto te permitirá explicarle al evaluador exactamente cómo fuiste desarrollando el sistema módulo a módulo:

### Paso 1: Configuración del Entorno de Trabajo
1. Se inicializó la estructura del proyecto web utilizando **Vite** para el frontend, ejecutando el comando:
   ```bash
   npx -y create-vite-app@latest client
   ```
2. Se configuró [vite.config.js](file:///c:/Users/juanj/Desktop/JS/pruebaJS/client/vite.config.js) para que sirva la aplicación localmente en el puerto de desarrollo estándar de Vite (`5173`).
3. Se instaló **Tailwind CSS v4** mediante su importación nativa en el archivo [client/src/style.css](file:///c:/Users/juanj/Desktop/JS/pruebaJS/client/src/style.css), definiendo un tema personalizado con tipografías legibles y colores modernos (`slate`, `indigo`, `emerald`, `amber`).
4. Se importó SweetAlert2 a través de CDN en el archivo principal [client/index.html](file:///c:/Users/juanj/Desktop/JS/pruebaJS/client/index.html):
   ```html
   <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
   ```
   Esto nos permite usar alertas estéticas sin sobrecargar el paquete final del cliente web.

### Paso 2: Creación de la Base de Datos y Backend Simulado
1. Se estructuró la base de datos relacional de pruebas en [api/db.json](file:///c:/Users/juanj/Desktop/JS/pruebaJS/api/db.json). Se diseñaron tres tablas clave:
   * **`users`**: Contiene campos como `id`, `name`, `email`, `password` y `role` (`admin` o `user`).
   * **`workspaces`**: Contiene campos como `id`, `name`, `type` (`PrivateOffice`, `MeetingRoom`, `CoworkingSpace`, `Auditorium`), `capacity` y `description`.
   * **`reservations`**: Contiene relaciones de llaves foráneas (`userId` y `workspaceId`), la fecha `date`, `startTime`, `endTime` y el estado `status` (`Pending`, `Approved`, `Rejected`, `Cancelled`).
2. Se configuró [api/package.json](file:///c:/Users/juanj/Desktop/JS/pruebaJS/api/package.json) para levantar `json-server` en el puerto `3000`:
   ```json
   "scripts": {
     "start": "json-server --watch db.json --port 3000"
   }
   ```

### Paso 3: Implementación del Cliente de API (`api.js`)
Para evitar escribir llamadas `fetch` repetitivas por todas partes, se centralizó el acceso a la base de datos en [services/api.js](file:///c:/Users/juanj/Desktop/JS/pruebaJS/client/src/services/api.js) mediante una función base asíncrona llamada `request()`:
```javascript
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) throw new Error(`Error: ${response.status}`);
  if (response.status === 204) return true;
  return await response.json();
}
```
Sobre esta función se construyeron los métodos exportables. Un detalle muy importante para la sustentación es el uso de los operadores de expansión de `json-server`:
* En `apiFetchReservations()` se añade el parámetro `_expand=workspace&_expand=user`. Esto le dice al servidor que una la reserva con el objeto completo del espacio de trabajo y del usuario. Así, con una sola petición, obtenemos toda la información combinada para mostrarla en la tabla de reservas.

### Paso 4: Construcción del Router y el Layout SPA
1. Se configuró [router/index.js](file:///c:/Users/juanj/Desktop/JS/pruebaJS/client/src/router/index.js) mapeando las rutas (`/login`, `/dashboard`, etc.) a sus correspondientes funciones de vista.
2. Se definió la función `resolveRoute()` que limpia el contenedor principal e inyecta la barra de navegación lateral ([components/Sidebar.js](file:///c:/Users/juanj/Desktop/JS/pruebaJS/client/src/components/Sidebar.js)) solo si la página requiere autenticación y el usuario está logueado. Si es Login o Acceso Denegado, la renderiza en pantalla completa.
3. En [main.js](file:///c:/Users/juanj/Desktop/JS/pruebaJS/client/src/main.js), se inicializa el router:
   ```javascript
   import { router } from './router/index.js';
   router.init();
   ```

### Paso 5: Implementación de la Lógica de Cruces de Horarios
Evitar que se reserve el mismo espacio el mismo día a la misma hora es un requisito crítico. Se resolvió en [utils/validation.js](file:///c:/Users/juanj/Desktop/JS/pruebaJS/client/src/utils/validation.js) utilizando un algoritmo matemático óptimo:
* Dos rangos de tiempo $[S_1, E_1]$ y $[S_2, E_2]$ colisionan si y solo si:
  $$S_1 < E_2 \quad \text{y} \quad S_2 < E_1$$
* **Implementación en JS:**
  ```javascript
  export const isTimeOverlapping = (s1, e1, s2, e2) => {
    return compareTimes(s1, e2) < 0 && compareTimes(s2, e1) < 0;
  };
  ```
* **Validación completa (`checkReservationOverlap`):**
  1. Filtra las reservas existentes para el mismo espacio (`workspaceId`) y el mismo día (`date`).
  2. Excluye las reservas que estén en estado cancelado (`Cancelled`) o rechazado (`Rejected`), ya que estas liberan el espacio.
  3. Si la reserva se está editando, excluye su propio registro original (`id`) para no generar una falsa alarma consigo misma.
  4. Ejecuta `isTimeOverlapping` y si hay cruce, retorna los datos de la reserva conflictiva para mostrárselos al usuario.

### Paso 6: Encapsulación de Alertas (SweetAlert2)
Para dotar al sistema de diálogos interactivos profesionales sin ensuciar la lógica de las vistas, se crearon wrappers en `/components`:
* **[Toast.js](file:///c:/Users/juanj/Desktop/JS/pruebaJS/client/src/components/Toast.js):** Ejecuta notificaciones flotantes temporales (`Swal.fire({ toast: true, position: 'top-end', ... })`).
* **[Modal.js](file:///c:/Users/juanj/Desktop/JS/pruebaJS/client/src/components/Modal.js):** Ofrece la función `showConfirmModal()` que retorna una Promesa que resuelve a `true` si el usuario confirma una acción (como cancelar o borrar), y `false` si la declina.

### Paso 7: Diseño y Desarrollo de las Vistas Procedurales
Cada vista se codificó siguiendo un mismo ciclo de vida procedural:
1. **Pintar estructura base:** Modificar el `innerHTML` del contenedor con layouts Tailwind modernos, cargando indicadores visuales (*spinners*) mientras se descargan los datos.
2. **Descarga de datos:** Usar `await` llamando a los servicios de `api.js` para traer la información actualizada desde la API backend.
3. **Pintar los datos:** Reemplazar el contenedor de datos (como el cuerpo de una tabla) generando filas dinámicas con Template Strings.
4. **Vincular eventos:** Seleccionar elementos del DOM mediante `querySelector` y enlazar controladores de eventos (`click`, `submit`, `change`).

---

## 5. Reglas de Negocio Clave Implementadas

En tu sustentación, destaca cómo el sistema cumple estrictamente con el enunciado del problema a través de estas validaciones lógicas:

### A. Restricciones de Modificación
* **El Administrador** puede modificar cualquier reserva sin importar su estado. Puede cambiarle el estado a *Aprobado* (`Approved`) o *Rechazado* (`Rejected`).
* **El Empleado** solo puede editar o cancelar sus propias reservas.
* **Bloqueo por Estado:** Si una reserva del empleado ya fue aprobada (`Approved`) o rechazada (`Rejected`), el sistema oculta el botón de edición y bloquea la API. El empleado únicamente podrá hacer clic en *"Cancelar"* si desea desistir del espacio, lo cual pondrá el estado en `"Cancelled"`.

### B. Traductores de Datos (Internacionalización local)
La base de datos maneja terminología técnica en inglés (`Approved`, `Pending`, `PrivateOffice`, `MeetingRoom`) para simplificar consultas backend y mantener la consistencia con las convenciones estándar de desarrollo. Para el usuario final, la interfaz traduce dinámicamente esta información utilizando diccionarios en memoria en las vistas correspondientes:
```javascript
const typeTranslations = {
  PrivateOffice: 'Oficina Privada',
  MeetingRoom: 'Sala de Juntas',
  CoworkingSpace: 'Espacio de Coworking',
  Auditorium: 'Auditorio'
};

const statusTranslations = {
  Pending: 'Pendiente',
  Approved: 'Aprobada',
  Rejected: 'Rechazada',
  Cancelled: 'Cancelada'
};
```

---

## 6. Guía de Defensa Técnica (Preguntas del Jurado)

Aquí tienes las respuestas clave ante las preguntas más usuales que hacen los jurados o profesores en las sustentaciones de proyectos web:

### 💬 Pregunta 1: ¿Por qué usó una arquitectura SPA y no enlaces tradicionales `<a href="dashboard.html">`?
> **Respuesta:**
> "Usar una SPA mejora significativamente la experiencia de usuario (UX). Al no recargar la página completa con cada navegación, las transiciones se sienten instantáneas y fluidas. Además, el enrutamiento por Hash (`#/`) simula múltiples páginas de forma 100% cliente, permitiendo que si el usuario refresca el navegador, la aplicación sepa qué vista pintar leyendo el valor de `window.location.hash`, sin requerir configuraciones de redirección complejas en el servidor web de producción."

### 💬 Pregunta 2: ¿Cómo funciona el paso de parámetros en json-server para obtener la información unificada?
> **Respuesta:**
> "La base de datos almacena las reservas solo con identificadores numéricos (`userId` y `workspaceId`) para mantener la integridad relacional y evitar la duplicidad de datos. Para no tener que realizar tres llamadas HTTP consecutivas (una para la reserva, otra para los detalles del usuario y otra para el espacio), aprovechamos la funcionalidad de relaciones de `json-server` agregando los queries `_expand=workspace` y `_expand=user`. El backend interpreta esto como un *JOIN* y nos devuelve la reserva enriquecida con los datos completos del espacio y del usuario en una sola respuesta."

### 💬 Pregunta 3: Si alguien escribe la URL `http://localhost:5173/#/dashboard` manualmente en el navegador siendo un simple Empleado, ¿cómo evita el sistema que acceda?
> **Respuesta:**
> "El sistema cuenta con un control de acceso centralizado. Antes de pintar cualquier vista, la función `resolveRoute()` del enrutador ejecuta el guardia de seguridad `checkRouteAccess(path)`. Esta función consulta el rol del usuario guardado en la sesión activa. Si la ruta destino tiene definida la propiedad `role: 'admin'` y el usuario logueado es de tipo `user` (empleado común), el guardia bloquea el renderizado e inmediatamente redirige la aplicación a la ruta `#/access-denied`."

### 💬 Pregunta 4: Explique detalladamente el algoritmo para evitar el cruce de reservas en un mismo espacio de trabajo.
> **Respuesta:**
> "Para comprobar traslapes de tiempo, primero filtramos la base de datos de reservas quedándonos únicamente con las que compartan el mismo `workspaceId`, la misma fecha (`date`) y que no estén canceladas ni rechazadas.
> Luego aplicamos la regla matemática de intervalos abiertos: dos intervalos se cruzan si el inicio del primero es menor que el fin del segundo, y el inicio del segundo es menor que el fin del primero.
> Expresado en JS: `compareTimes(s1, e2) < 0 && compareTimes(s2, e1) < 0`.
> Si se cumple esta condición, significa que los horarios colisionan. En ese caso, la aplicación cancela el envío, alerta al usuario mostrando con qué reserva activa ocurre el conflicto y bloquea la transacción para asegurar que un espacio no sea agendado dos veces a la misma hora."

### 💬 Pregunta 5: ¿Cuál es la diferencia en el código al usar `localStorage` en lugar de `sessionStorage` para guardar la sesión del usuario?
> **Respuesta:**
> "Se implementaron ambas opciones para dar flexibilidad de privacidad al usuario mediante la casilla *'Recordar sesión en este equipo'*.
> Si el usuario la activa, el método `setCurrentUser()` llama a `localStorage.setItem()`, guardando los datos del usuario en el almacenamiento local persistente del navegador, lo que mantiene al usuario autenticado indefinidamente incluso si cierra la pestaña del navegador.
> Si no la activa, se llama a `sessionStorage.setItem()`, que almacena los datos únicamente en la memoria de la pestaña activa, por lo que al cerrar la pestaña o el navegador, la sesión expira automáticamente por seguridad."

### 💬 Pregunta 6: ¿Por qué encapsuló SweetAlert2 en módulos independientes (`Toast.js` y `Modal.js`) en lugar de llamarlo directamente en las vistas?
> **Respuesta:**
> "Aplicamos el principio de bajo acoplamiento y encapsulación. Si mañana decidimos cambiar **SweetAlert2** por otra biblioteca de diseño o por alertas nativas del navegador, no tendríamos que modificar los archivos de las vistas. Solo tendríamos que actualizar las funciones de los archivos `Toast.js` y `Modal.js`, y el resto del sistema seguiría funcionando intacto, manteniendo una arquitectura limpia y sumamente mantenible."
