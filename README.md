# Sistema de Reserva de Espacios de Trabajo

Una aplicación de página única (SPA) para la gestión de reservas de espacios de trabajo. Los empleados pueden ver los espacios disponibles, reservar oficinas o salas de reuniones y gestionar sus reservas. Los administradores del sistema pueden gestionar los espacios (CRUD), revisar y aprobar/rechazar reservas, ver estadísticas en el panel de control y acceder al directorio de empleados.

Desarrollado con **JavaScript Vanilla (Módulos ES6)**, **Tailwind CSS v4** y **json-server**.

---

## Estructura del Proyecto

Este espacio de trabajo está dividido en dos módulos principales:

* **/api**: Contiene la base de datos REST simulada mediante `json-server` con datos iniciales de espacios, empleados y reservas.
* **/client**: El frontend de la SPA construido con Vite, Tailwind CSS v4, enrutamiento basado en hash y guardias de protección de rutas.

---

## Configuración y Arranque Rápido

Para iniciar esta aplicación de forma local, debe ejecutar tanto la base de datos API como el servidor cliente.

### Requisitos Previos
Asegúrese de tener [Node.js](https://nodejs.org/) instalado (se recomienda v18 o superior).

### 1. Iniciar la Base de Datos (API)
Abra una terminal en el directorio `/api`, instale las dependencias e inicie el servidor:
```bash
cd api
npm install
npm start
```
La base de datos se ejecutará en **`http://localhost:3000`**.

### 2. Iniciar el Cliente Web
Abra una segunda terminal en el directorio `/client`, instale las dependencias e inicie Vite:
```bash
cd client
npm install
npm run dev
```
La aplicación cliente se ejecutará en **`http://localhost:5173/`** (o en la dirección IP IPv6 de bucle local `http://[::1]:5173/`).

---

## Credenciales de Demostración

Puede utilizar estas credenciales pre-registradas para iniciar sesión y probar los diferentes roles del sistema:

### Perfil de Administrador
* **Correo Electrónico**: `admin@empresa.com`
* **Contraseña**: `123456`
* **Privilegios**: Ver estadísticas del panel de control, gestionar espacios de trabajo (CRUD), editar/eliminar/aprobar/rechazar cualquier reserva y ver el listado de empleados.

### Perfil de Empleado (Usuario)
* **Correo Electrónico**: `juan@empresa.com`
* **Contraseña**: `123456`
* **Privilegios**: Crear solicitudes de reserva, ver únicamente sus propias reservas, editar sus reservas (solo cuando el estado sea "Pending") y cancelar reservas aprobadas. No puede acceder a módulos administrativos.

---

## Características Técnicas

1. **Enrutamiento por Hash**: Router personalizado y ligero que maneja rutas en el hash de la URL (ej. `#/dashboard`, `#/reservations`) sin recargar la página.
2. **Guardias de Acceso**: Restringe vistas según el rol del usuario. Los usuarios que intenten ingresar a pantallas administrativas sin permisos son redirigidos a la pantalla `#/access-denied`.
3. **Prevención de Duplicados**: Valida las reservas antes de crearlas o modificarlas para evitar cruces de horarios en el mismo espacio y fecha.
4. **Diseño Moderno**: Interfaz estilizada con Tailwind CSS v4, barra lateral de navegación responsive, alertas de notificación dinámicas (toasts) y formularios modales.
