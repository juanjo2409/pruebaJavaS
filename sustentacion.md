# 🎓 Guía Completa de Sustentación y Defensa Técnica: CineRiwi SPA

Este documento es tu **hoja de ruta oficial para obtener la máxima calificación (10/10)** en la sustentación de tu proyecto. Explica de manera didáctica y con código de nivel de estudiante cómo está construido el sistema, cómo interactúa el Frontend con el Backend, cómo funciona la seguridad y cómo se maneja la persistencia de datos.

---

## 1. 🎯 Ficha Técnica del Proyecto

*   **Nombre del Sistema:** CineRiwi
*   **Arquitectura:** SPA (Single Page Application - Aplicación de una Sola Página) sin frameworks pesados.
*   **Lenguajes:** HTML5, CSS3 (Tailwind CSS v4) y JavaScript Moderno (Vanilla ES6 Módulos).
*   **Base de Datos y API:** Simulación de API REST con `json-server` mediante almacenamiento JSON local (`api/db.json`).
*   **Enfoque de Desarrollo:** Código secuencial, estructurado y procedimental, libre de lógica compleja de arreglos (sin encadenamientos raros de `.map().reduce()`), priorizando bucles sencillos `for...of` y funciones declaradas tradicionales para facilitar la explicación verbal.

---

## 2. 🏛️ Arquitectura General de una SPA (Single Page Application)

Una **SPA** es una aplicación web que se carga una sola vez en el navegador (`index.html`). Cuando el usuario hace clic en los enlaces o navega, el navegador **no recarga la pestaña**. En su lugar, JavaScript intercepta el cambio de URL y redibuja la sección central del DOM.

### Flujo de Ejecución al Arrancar la Aplicación:

graph TD
    subgraph Navegador [Cliente Web - SPA]
        A[index.html] -->|1. Carga inicial| B[principal.js]
        B -->|2. Arranca router| C[enrutador/index.js]
        C -->|3. Valida sesión| D[guards/autenticacion.js]
        D -->|4. Inyecta HTML| E[views/ Módulos de Pantallas]
        E -->|5. Peticiones HTTP| F[servicios/api.js]
      end
      subgraph Servidor [Backend de Datos]
        F <-->|Fetch asíncrono| G[json-server: Puerto 3000]
        G <-->|Lee y escribe| H[db.json]
      end
```

---

## 3. 🖥️ Explicación Detallada de Cada Vista (Módulo a Módulo)

Cada pantalla del sistema reside en `client/src/views/` y exporta una función principal `render...` que recibe el contenedor principal del DOM.

### 🔑 A. Vista de Login (`VistaLogin.js`)
*   **Función:** Permite la entrada de usuarios autenticándose por su correo y contraseña.
*   **Cómo funciona:**
    1.  Dibuja un formulario estilizado con temática de **Riwi Barranquilla** en pantalla dividida (split-screen).
    2.  Al hacer *Submit*, lee los campos `email` y `password`.
    3.  Llama a `apiFetchUserByEmail(email)` en el servicio de la API.
    4.  Si el usuario existe, compara la contraseña en texto plano.
    5.  Si es correcta, llama a `setCurrentUser(user, rememberMe)` para registrar la sesión y redirige al Dashboard (si es `admin`) o a la Cartelera (si es `user`).

### 📊 B. Vista de Dashboard (`VistaDashboard.js`)
*   **Función:** Muestra estadísticas en tiempo real y gráficos visuales sobre la taquilla.
*   **Cómo funciona:**
    1.  Obtiene películas, salas, usuarios y reservas mediante peticiones paralelas (`Promise.all`).
    2.  **Cálculo de Métricas:** Con un bucle `for...of` sobre las reservas calcula boletos vendidos, reservas confirmadas y pendientes.
    3.  **Lógica del Gráfico Estadístico de Barras (Nivel Estudiante):**
        *   **Acumulación:** Recorremos las reservas no canceladas sumando la cantidad de entradas vendidas por cada película en un objeto acumulador (`movieCounter`).
        *   **Clasificación:** Convertimos ese objeto en un arreglo y lo ordenamos con `.sort()` de mayor a menor según el total de entradas vendidas.
        *   **Cálculo Porcentual Dinámico:** Para representar visualmente los valores como barras horizontales, tomamos como base (100%) la película con mayores ventas (`bestSeller`). Para cada una de las otras películas calculamos su porcentaje proporcional:
            $$\text{porcentaje} = \left( \frac{\text{entradas de película}}{\text{entradas de la película más vendida}} \right) \times 100$$
        *   **Renderizado de la Barra:** En lugar de usar pesadas librerías externas de gráficos (como Chart.js o Canvas), utilizamos etiquetas HTML `div` anidadas: un contenedor que sirve de fondo y una barra interna de color con un estilo en línea dinámico (`style="width: ${percentage}%"`). Al combinarlo con clases de transición de Tailwind CSS (`transition-all duration-500`), la barra se anima y expande suavemente al cargar.
    4.  **Ocupación de Salas:** Cruza las funciones en cartelera con la capacidad total de cada sala (`salas`), calculando el porcentaje de ocupación actual. Muestra una barra indicadora con un condicional interactivo que cambia el color de la barra (de verde `bg-emerald-500` a rojo/rosa `bg-rose-500` si la sala supera el 80% de su capacidad total).
    5.  **Actividad Reciente:** Ordena y expone en una tabla las últimas 5 reservas procesadas.

### 🎬 C. Vista de Películas / Cartelera (`VistaPeliculas.js`)
*   **Función:** Muestra el catálogo de películas y permite al Administrador programar funciones en salas específicas.
*   **Cómo funciona:**
    1.  **Modo Cliente:** Renderiza tarjetas de películas con sus pósteres mapeados de alta calidad, salas asignadas, cupos de aforo e incluye un botón "Reservar".
    2.  **Modo Administrador:** Muestra botones para "+ Nueva Función" y "Eliminar".
    3.  **Prevención de Choques/Solapamiento:** Antes de guardar una nueva función, el código recorre en un bucle `for...of` todas las películas en cartelera. Compara si existe alguna función programada en la **misma sala (`salaId`), misma fecha (`fecha`) y mismo horario (`hora`)**. Si hay coincidencia, frena el flujo y muestra una alerta con `SweetAlert2`.
    4.  **Escritura Secuencial:** Para evitar colisiones en `json-server` al agregar horarios múltiples, el código realiza peticiones `POST` individuales de forma ordenada en un bucle utilizando `await` en cada paso.

### 🍿 D. Vista de Salas (`VistaSalas.js`)
*   **Función:** Permite al administrador crear, editar y eliminar salas físicas del cine.
*   **Cómo funciona:**
    1.  Renderiza un listado con las especificaciones de cada sala: Nombre, Capacidad de asientos, Tipo (2D, 3D, IMAX) y Estado (Activa, En Mantenimiento).
    2.  Permite abrir un modal interactivo para crear o editar salas, validando que la capacidad no sea menor a cero antes de guardar la información en `/salas`.

### 🎟️ E. Vista de Reservas (`VistaReservas.js`)
*   **Función:** Permite a los clientes comprar boletos y ver su historial, y a los administradores auditar todas las reservas.
*   **Cómo funciona:**
    1.  **Filtros Interactivos:** Contiene un buscador dinámico por nombre de cliente y un filtro por estado de reserva (Confirmada, Pendiente, Cancelada).
    2.  **Integridad de Aforo (Proceso de Compra):** Al registrar una reserva, se verifica si hay suficientes `cupos_disponibles`. Si es así, se resta la cantidad del aforo, se actualiza la película con un método `PUT` en `/movies/:id` y luego se crea la reserva con un `POST` en `/reservations`.
    3.  **Proceso de Cancelación:** Si se cancela la reserva, se le devuelve el aforo a la película sumando los cupos correspondientes en el servidor.

### 👥 F. Vista de Usuarios (`VistaUsuarios.js`)
*   **Función:** Directorio administrativo y gestión de todas las cuentas registradas en el sistema.
*   **Cómo funciona:**
    1.  **Métricas Rápidas:** Muestra tarjetas dinámicas con el total de usuarios, cuántos son administradores, cuántos clientes y la suma de boletos activos.
    2.  **Registro de Usuarios (Creación):** Incorpora un botón `➕ Registrar Usuario` que abre un formulario modal interactivo para crear cuentas directamente (Admin o Cliente) ingresando Nombre, Correo, Contraseña y Rol, verificando previamente que el correo no esté duplicado.
    3.  **Actualización de Privilegios (Rol):** El botón `🔄 Cambiar Rol` permite al administrador cambiar el rol del usuario de cliente a administrador (o viceversa) con confirmación interactiva.
    4.  **Eliminación Segura:** El botón `🗑️ Eliminar` permite purgar una cuenta del sistema, validando antes mediante la sesión que el administrador activo no pueda eliminarse a sí mismo.

---

## 4. 🔗 Conexión Frontend-Backend (Consumo de la API REST)

Toda la comunicación con el servidor de datos ocurre en `client/src/servicios/api.js` mediante la API `fetch` nativa del navegador.

### La Función Centralizada `request()`:
Para no duplicar código, se creó una función genérica que maneja las cabeceras JSON, convierte las respuestas y captura errores:

```javascript
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    throw new Error(`Error en servidor: ${response.status}`);
  }
  
  if (response.status === 204) return true; // Código de éxito sin contenido
  return await response.json();
}
```

### Ejemplos de Consumo de Endpoints:
*   **GET (Obtener películas):** `request('/movies')` $\rightarrow$ Retorna un array con todas las películas.
*   **POST (Crear reserva):** `request('/reservations', { method: 'POST', body: JSON.stringify(reservaData) })`.
*   **PUT (Modificar película):** `request('/movies/1', { method: 'PUT', body: JSON.stringify(movieData) })`.
*   **DELETE (Borrar sala):** `request('/salas/2', { method: 'DELETE' })`.

---

## 5. 💾 Persistencia de Datos (Base de Datos y Sesiones)

La persistencia de datos se gestiona en dos niveles distintos:

### A. Persistencia en el Servidor (Base de Datos):
*   El backend utiliza `json-server` sobre el archivo físico `api/db.json`.
*   Cada vez que realizamos una petición `POST`, `PUT` o `DELETE`, `json-server` escribe directamente en el archivo `db.json`, asegurando que la información de las películas, salas, usuarios y reservas no se pierda al reiniciar la aplicación.

### B. Persistencia en el Cliente (Sesiones del Navegador):
Se administra en `guards/autenticacion.js` usando las APIs del navegador:
*   **`localStorage`:** Si el usuario selecciona "Recordar sesión", guardamos sus datos aquí. Los datos persisten incluso después de cerrar y abrir el navegador.
*   **`sessionStorage`:** Si no selecciona "Recordar sesión", se guarda aquí. La sesión se destruye automáticamente al cerrar la pestaña.

---

## 6. 🛡️ Seguridad y Control de Acceso (Guards)

La seguridad está implementada del lado del cliente mediante un sistema de **Guardianes de Ruta** configurado en `guards/autenticacion.js`.

### El Mapa de Reglas (`routeRules`):
Definimos los privilegios de cada ruta del sistema:

```javascript
const routeRules = {
  '/': { requiresAuth: true },
  '/login': { guestOnly: true },
  '/dashboard': { requiresAuth: true, role: 'admin' },
  '/movies': { requiresAuth: true },
  '/rooms': { requiresAuth: true, role: 'admin' },
  '/reservations': { requiresAuth: true },
  '/users': { requiresAuth: true, role: 'admin' }
};
```

### Lógica del Guardián (`checkRouteAccess`):
Cada vez que el usuario navega a una ruta en el enrutador:
1.  **Regla 1 (Usuario no logueado):** Si la ruta tiene `requiresAuth: true` y no hay una sesión activa, lo redirige automáticamente a `#/login`.
2.  **Regla 2 (Invitado intentando entrar al login):** Si la ruta tiene `guestOnly: true` (como `/login`) y el usuario ya está autenticado, lo redirige a su panel principal según su rol.
3.  **Regla 3 (Acceso no autorizado por Rol):** Si un cliente normal intenta acceder a una ruta administrativa como `#/dashboard`, `#/rooms` o `#/users` (que requieren `role: 'admin'`), el guardián deniega el acceso y lo redirige a la vista `#/access-denied` (Acceso Denegado).

---

## 7. 🙋‍♂️ Banco de Preguntas Académicas (Q&A)

### ❓ Pregunta 1: ¿Por qué no utilizaste base de datos SQL como MySQL o PostgreSQL?
> **Respuesta:** *"Para el alcance de este proyecto académico y la defensa de la arquitectura del Frontend, un motor relacional completo agregaría complejidad en el despliegue del evaluador. Al usar `json-server`, simulamos el comportamiento exacto de una API RESTful con persistencia real sobre un archivo plano JSON (`db.json`), lo que simplifica la demostración y permite concentrarnos en la lógica de negocio y enrutamiento del lado del cliente."*

### ❓ Pregunta 2: ¿Cómo evitas que un usuario inyecte código malicioso en tus formularios?
> **Respuesta:** *"Al construir el HTML dinámicamente y asignar los valores de los inputs mediante la lectura del atributo `.value` del DOM, el navegador trata estos datos como cadenas de texto puro y no como código ejecutable. Además, al enviarlos al backend con Fetch convertidos a formato JSON, se mitigan los riesgos de inyección de scripts básicos del lado del cliente."*

### ❓ Pregunta 3: ¿Qué es el método `Promise.all` que utilizas en tus vistas?
> **Respuesta:** *"Es un método que nos permite ejecutar múltiples peticiones HTTP (promesas asíncronas) de forma paralela en lugar de esperar a que termine una para iniciar la siguiente. Esto optimiza drásticamente el tiempo de carga del Dashboard y de las vistas, ya que solicitamos películas, usuarios y reservas de manera simultánea."*

### ❓ Pregunta 4: ¿Por qué se utilizó un bucle secuencial en lugar de `Promise.all` al guardar horarios múltiples?
> **Respuesta:** *"Debido a que `json-server` almacena los datos en un único archivo físico (`db.json`), si intentamos realizar varias escrituras simultáneas con `Promise.all`, el servidor choca consigo mismo al intentar escribir en el disco al mismo tiempo, lo que corrompe el archivo. Para solucionarlo, usamos un bucle `for...of` con `await` para forzar una escritura secuencial y ordenada en el disco del servidor."*

### ❓ Pregunta 5: ¿Cómo construiste los gráficos de estadísticas (barras de taquilla y ocupación de salas) sin usar librerías como Chart.js?
> **Respuesta:** *"Para mantener la aplicación ligera, evitar dependencias externas que puedan fallar en la carga y demostrar habilidades sólidas en HTML y CSS puro, creé los gráficos de forma nativa en el DOM.
> 1. Agrupo y sumo los datos en memoria con JavaScript estructurado.
> 2. Calculo un porcentaje proporcional para cada elemento comparando su valor con el valor máximo.
> 3. Renderizo barras de progreso horizontales usando elementos `<div>` anidados. La barra interna tiene un estilo CSS en línea dinámico (`style="width: ${percentage}%"`) y clases de Tailwind CSS (`transition-all duration-500`) que animan suavemente su ancho en pantalla al cargar la vista."*

### ❓ Pregunta 6: ¿Cómo funciona el enrutamiento de tu SPA y qué ocurre si el usuario presiona F5 o recarga la página?
> **Respuesta:** *"El enrutamiento está basado en Hash (`#/dashboard`, `#/movies`, etc.). Esto nos permite cambiar de vista interceptando el evento `hashchange` en la ventana del navegador (`window.addEventListener('hashchange', ...)`). 
> Si el usuario presiona F5, se dispara el evento `DOMContentLoaded`. El enrutador detecta el hash actual en la URL (`window.location.hash`) y renderiza la pantalla correspondiente de forma inmediata. Al usar hashes, evitamos que el navegador haga una petición real al servidor buscando una ruta física inexistente, lo que prevendría un error 404."*

### ❓ Pregunta 7: Si un usuario altera manualmente el `localStorage` para cambiarse el rol a `admin`, ¿cómo previenes que acceda a información confidencial?
> **Respuesta:** *"En el desarrollo web moderno, la seguridad en el Frontend mediante Guardianes (Guards) es únicamente para mejorar la experiencia de usuario (UX) e impedir accesos accidentales en la interfaz. La seguridad real debe estar en el Backend (API).
> En un entorno real de producción, cada petición HTTP debe enviar un token seguro de sesión (como un JWT) firmado por el servidor. Si el usuario altera su rol en el navegador de manera fraudulenta, el Frontend lo dejará ver los menús de administrador, pero cuando intente obtener los datos, el servidor rechazará la petición HTTP retornando un código de error `401 Unauthorized` o `403 Forbidden` al no poseer una firma válida."*

### ❓ Pregunta 8: ¿Por qué utilizas módulos de ES6 (`type="module"`) y cómo beneficia al proyecto en equipo?
> **Respuesta:** *"El uso de módulos de ES6 (`import`/`export`) encapsula el alcance (scope) de las variables de cada archivo. En proyectos antiguos de JavaScript, todo se cargaba en el espacio global del navegador, lo que provocaba que una variable con el mismo nombre en dos archivos distintos generara colisiones e inconsistencias difíciles de rastrear. Con los módulos de ES6, cada archivo es un contenedor aislado y solo expone las funciones o variables necesarias, lo que hace el código reutilizable y escalable."*

### ❓ Pregunta 9: ¿Cómo manejas el flujo de datos asíncronos y qué ocurre si el servidor de la API se cae?
> **Respuesta:** *"Utilizamos la sintaxis moderna de `async/await` para hacer el código asíncrono legible y secuencial. Cada petición a la API está envuelta en un bloque `try/catch`. Si el servidor está apagado o hay un fallo de red, la promesa de `fetch` es rechazada y el flujo entra en el bloque `catch`. Allí atrapamos el error y disparamos notificaciones visuales controladas (usando Toasts o SweetAlert2) para advertir al usuario con gracia sobre el problema técnico, en lugar de romper o congelar la interfaz."*

---

## 8. 💡 Simulación de Exposición Paso a Paso

1.  **Inicio de Sesión:** Entra a `#/login`, destaca el diseño con la temática de **Riwi Barranquilla** y accede como cliente (`juan@cine.com`).
2.  **Reserva:** Escoge una película, selecciona entradas y compra. Ve a "Reservas" y muestra tu boleto.
3.  **Intrusión:** Modifica manualmente la URL a `#/rooms` en el navegador para mostrar cómo el **Guardián de Seguridad** te bloquea.
4.  **Admin:** Entra como administrador (`admin@cine.com`), muestra las estadísticas y el gráfico de barras nativo en el **Dashboard**.
5.  **Conflicto:** Ve a Cartelera e intenta crear una función en la misma sala, fecha y hora de otra película existente para demostrar la validación anti-solapamiento.
