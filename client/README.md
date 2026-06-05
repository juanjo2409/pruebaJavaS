# Frontend del Cliente Web (`/client`)

Esta carpeta contiene la interfaz de la aplicación de página única (SPA) para el Sistema de Reserva de Espacios de Trabajo.

---

## Tecnologías Utilizadas

* **Vite**: Herramienta de compilación rápida para desarrollo web moderno.
* **JavaScript Vanilla**: JS puro (módulos ES6) sin frameworks ni estados complejos.
* **Tailwind CSS v4**: Framework de CSS utilitario integrado mediante el plugin de `@tailwindcss/vite`.

---

## Estructura de Carpetas

```
src/
├── components/   # Elementos de UI reutilizables (Toasts de alerta, Modales de entrada, Barra lateral)
├── views/        # Plantillas de vistas de página (Login, Dashboard, Workspaces, Reservations, Users, AccessDenied)
├── router/       # Enrutador por Hash (resuelve eventos hashchange y evalúa guardias de acceso)
├── guards/       # Enrutamiento protegido (validación de sesiones y roles)
├── services/     # api.js (funciones directas y sencillas de Fetch API)
├── utils/        # helpers.js (formateadores e inputs) y validation.js (verificación de cruce de horarios)
├── styles/       # style.css (directivas de Tailwind CSS y animaciones personalizadas)
└── main.js       # Punto de entrada de la aplicación, inicializa el enrutador
```

---

## Instrucciones de Ejecución

1. Abra su terminal en este directorio (`/client`).
2. Instale las dependencias necesarias:
   ```bash
   npm install
   ```
3. Inicie el servidor de desarrollo:
   ```bash
   npm run dev
   ```

Vite servirá la aplicación en la dirección local **`http://localhost:5173/`** (o en la dirección IPv6 loopback `http://[::1]:5173/`).
Recuerde que el servidor **`/api`** debe estar ejecutándose en el puerto `3000` para poder proveer y guardar la información.
