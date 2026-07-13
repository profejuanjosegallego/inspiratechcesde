# 🚀 InspiraTech — Academia de Proyectos

Plataforma de acompañamiento para los 7 jóvenes de InspiraTech que desarrollan sus 3
plataformas para Globant (Calma · Marketing IA · Salud).

Incluye:

- 🔐 **Registro y login** con verificación por código al correo (SMTP).
- 🗂️ **Tablero Kanban** de Historias de Usuario (1 por semana) con arrastrar-y-soltar,
  código de apoyo, criterios de aceptación marcables y mini-tutorial colapsable.
- 🏆 **Progreso gamificado**: suben el PDF del certificado de Platzi, el profe lo valida,
  el personaje sube de nivel y hay un ranking de la clase.
- ⏰ **Asistencia** con hora exacta de llegada y validación del profe (a tiempo / tarde / rechazar).

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 · framer-motion · MongoDB · nodemailer.

---

## ▶️ Correr en local

```bash
npm install --legacy-peer-deps      # ya está hecho
npm run dev
```

Abre **http://localhost:3000**

La primera vez que entres, la app crea sola en MongoDB:

- La **cuenta del profe** (definida en `.env.local`):
  - correo: `juan.gallegomesa@gmail.com`
  - clave: `Profe2026*`
- Las **9 Historias de Usuario** replicables.
- **7 cursos de Platzi** de ejemplo (los puedes editar/borrar desde la app).

Los estudiantes se registran ellos mismos (rol `estudiante`).

### Para probar rápido
1. Entra con la cuenta del profe → verás el **Panel Profe**.
2. En otra ventana (o incógnito) **regístrate** con un correo real → llega el código → actívalo.
3. Mueve historias en el **Tablero**, sube un PDF en **Progreso**, marca **Asistencia**.
4. Vuelve como profe al **Panel** para validar asistencia y certificados.

---

## 🔑 Variables de entorno (`.env.local`)

Ya están configuradas. Ver `.env.example` para la plantilla. Claves importantes:

| Variable | Para qué |
|----------|----------|
| `MONGODB_URI` | Cluster de MongoDB Atlas |
| `MONGODB_DB` | Base de datos (`inspiratech`, aislada del otro proyecto) |
| `SMTP_*` | Envío de correos (cuenta Kaizen) |
| `JWT_SECRET` | Firma de las sesiones |
| `TEACHER_*` | Cuenta del profe que se crea sola |

> La base de datos usada es **`inspiratech`** dentro del mismo cluster de Atlas, en
> colecciones separadas (`users`, `stories`, `courses`, `progress`, `attendance`),
> sin tocar `parroquia_calasanz`.

---

## ☁️ Desplegar en Vercel

1. Sube el proyecto a **GitHub** (el `.gitignore` ya excluye `.env.local` y `/proyectos/`).
2. En **vercel.com** → *Add New → Project* → importa el repo.
3. En **Settings → Environment Variables**, copia TODAS las variables de tu `.env.local`
   (excepto que `NEXT_PUBLIC_APP_URL` debe ser la URL final de Vercel, ej.
   `https://inspiratech.vercel.app`).
4. Deploy. Listo. 🎉

### Notas de despliegue
- En **MongoDB Atlas → Network Access**, permite el acceso desde cualquier IP
  (`0.0.0.0/0`) para que Vercel pueda conectarse.
- Los PDF de certificados se guardan en **GridFS** (dentro de Mongo), así que
  funcionan bien en Vercel sin almacenamiento externo.

---

## 🗺️ Estructura

```
app/
├── (app)/                 # zona con sesión (layout con guardia)
│   ├── dashboard/         # inicio con estadísticas
│   ├── tablero/           # Kanban de HU
│   ├── progreso/          # gamificación + ranking
│   ├── asistencia/        # registro de llegada
│   └── panel/             # validación del profe
├── api/                   # endpoints (auth, stories, courses, progress, attendance, files)
├── login/ · register/     # autenticación
components/                # UI (kanban, progreso, panel, asistencia, shell...)
lib/                       # mongodb, auth, mail, seed, gamificación, utilidades
```

## ➕ Ideas para después
- Semanas finales con la **parte de IA** de cada reto (moderación en Calma, clasificador
  de imágenes en Marketing).
- Tableros separados por equipo si más adelante lo prefieres.
