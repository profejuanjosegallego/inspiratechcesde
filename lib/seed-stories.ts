import type { StoryDoc } from "./types";

type SeedStory = Omit<StoryDoc, "_id" | "createdAt" | "updatedAt" | "status" | "order">;

// 12 Historias de Usuario replicables para los 3 proyectos
// (Calma · Marketing IA · Salud). Progresión: Front (HTML+Bootstrap+CSS+JS) →
// FastAPI → MongoDB → Auth → Pulido → Deploy. Cada equipo cambia el "tema"
// pero el camino técnico es el mismo. 1 HU por semana (12 semanas).
export const SEED_STORIES: SeedStory[] = [
  {
    week: 1,
    title: "Maquetar la página principal con HTML + Bootstrap",
    role: "Como visitante",
    description:
      "quiero ver una página de inicio atractiva y clara del proyecto, para entender de qué trata y sentirme invitado a usarla.",
    codeLang: "html",
    code: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mi Proyecto</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container">
      <a class="navbar-brand fw-bold" href="#">MiProyecto</a>
    </div>
  </nav>

  <header class="text-center py-5 bg-light">
    <h1 class="display-4 fw-bold">Bienvenido 👋</h1>
    <p class="lead">Una frase que explique tu proyecto en pocas palabras.</p>
    <a href="#" class="btn btn-primary btn-lg">Empezar</a>
  </header>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`,
    estimation: 3,
    acceptanceCriteria: [
      { text: "La página abre en el navegador sin errores en la consola.", done: false },
      { text: "Tiene una barra de navegación (navbar) de Bootstrap.", done: false },
      { text: "Tiene un título grande (héroe) y un botón principal.", done: false },
      { text: "Se usan clases de Bootstrap, no estilos inventados.", done: false },
    ],
    tags: ["front", "html", "bootstrap"],
    tutorial: `## 🎯 Objetivo
Crear el "esqueleto" visual de tu proyecto usando HTML y Bootstrap.

## 🪜 Paso a paso
1. Crea una carpeta para tu proyecto y dentro un archivo **index.html**.
2. Copia la estructura base del código de la izquierda.
3. Pega el enlace del **CSS de Bootstrap** dentro del \`<head>\` (ya está en el ejemplo).
4. Cambia los textos por los de tu proyecto (Calma, Marketing o Salud).
5. Abre el archivo con doble clic o con "Live Server" en VS Code.

## 💡 Tips
- Bootstrap ya trae colores y espaciados: usa clases como \`btn btn-primary\`, \`container\`, \`py-5\`.
- No copies estilos de internet sin entenderlos: prueba una clase, mira qué hace.

## 🔗 Para aprender más
- Documentación oficial: getbootstrap.com/docs
- Busca en YouTube: "Bootstrap 5 desde cero en español".`,
  },
  {
    week: 2,
    title: "Dar identidad visual al proyecto con CSS propio",
    role: "Como equipo de diseño",
    description:
      "quiero definir los colores, la tipografía y el logo del proyecto, para que tenga una identidad única y no se vea genérico.",
    codeLang: "css",
    code: `/* styles.css  (enlázalo después del CSS de Bootstrap) */
:root {
  --color-principal: #6c5ce7;
  --color-secundario: #00cec9;
  --color-texto: #2d3436;
}

body {
  font-family: 'Poppins', sans-serif;
  color: var(--color-texto);
}

/* Sobrescribir el botón de Bootstrap con nuestra marca */
.btn-marca {
  background-color: var(--color-principal);
  color: white;
  border-radius: 999px;
  padding: 10px 24px;
}
.btn-marca:hover {
  background-color: var(--color-secundario);
  color: white;
}`,
    estimation: 3,
    acceptanceCriteria: [
      { text: "Existe un archivo styles.css enlazado en el HTML.", done: false },
      { text: "Se definen mínimo 3 colores de marca con variables CSS (:root).", done: false },
      { text: "Se usa una tipografía propia (Google Fonts).", done: false },
      { text: "Hay al menos un componente con estilo propio (no solo Bootstrap).", done: false },
    ],
    tags: ["front", "css", "diseño"],
    tutorial: `## 🎯 Objetivo
Que tu proyecto tenga personalidad: colores y tipografía propios.

## 🪜 Paso a paso
1. Crea **styles.css** y enlázalo DESPUÉS del CSS de Bootstrap:
\`\`\`
<link href="styles.css" rel="stylesheet">
\`\`\`
2. Define tus colores como **variables CSS** dentro de \`:root\`.
3. Elige una fuente en fonts.google.com y pégala en el \`<head>\`.
4. Crea una clase propia (ej: \`.btn-marca\`) y úsala en tu botón.

## 🎨 ¿Por qué variables CSS?
Si mañana cambias \`--color-principal\`, cambia en TODO el sitio de una vez.
Es como tener un control central de la marca.

## 💡 Tip de la retro de Globant
Calma pidió una experiencia "amigable y segura para jóvenes": los colores y la
tipografía comunican eso. ¡El diseño también resuelve problemas!`,
  },
  {
    week: 3,
    title: "Construir el formulario principal del proyecto",
    role: "Como usuario",
    description:
      "quiero llenar un formulario (test emocional / carga de datos / registro de salud) para interactuar con la aplicación.",
    codeLang: "html",
    code: `<form id="miForm" class="card p-4 shadow-sm">
  <div class="mb-3">
    <label class="form-label">Nombre</label>
    <input type="text" class="form-control" id="nombre" required>
  </div>
  <div class="mb-3">
    <label class="form-label">¿Cómo te sientes hoy?</label>
    <select class="form-select" id="estado">
      <option>Muy bien</option>
      <option>Normal</option>
      <option>Estresado</option>
    </select>
  </div>
  <button class="btn btn-success">Enviar</button>
</form>

<script>
  const form = document.getElementById("miForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();               // evita recargar la página
    const nombre = document.getElementById("nombre").value;
    const estado = document.getElementById("estado").value;
    console.log({ nombre, estado });  // por ahora solo mostramos en consola
    alert("¡Gracias, " + nombre + "!");
  });
</script>`,
    estimation: 5,
    acceptanceCriteria: [
      { text: "El formulario tiene al menos 3 campos con etiquetas (label).", done: false },
      { text: "Los campos obligatorios usan 'required'.", done: false },
      { text: "Al enviar NO se recarga la página (preventDefault).", done: false },
      { text: "Los datos se ven en la consola del navegador.", done: false },
    ],
    tags: ["front", "javascript", "formularios"],
    tutorial: `## 🎯 Objetivo
Capturar datos del usuario y reaccionar con JavaScript.

## 🪜 Paso a paso
1. Agrega el \`<form>\` dentro de tu página.
2. Cada campo necesita un **id** para poder leerlo desde JS.
3. Escucha el evento **submit** del formulario.
4. Usa \`e.preventDefault()\` para que la página no se recargue.
5. Lee los valores con \`document.getElementById("id").value\`.

## 🧠 Conceptos clave
- **Evento**: algo que pasa (un clic, enviar un form). JS "escucha" y responde.
- **console.log()**: tu mejor amigo para ver qué está pasando (abre F12 → Console).

## 🔗 Recuerda
Guarda los datos en un objeto \`{ }\`. Más adelante ese objeto viajará al backend.`,
  },
  {
    week: 4,
    title: "Hacer el sitio responsive y con navegación entre páginas",
    role: "Como usuario de celular",
    description:
      "quiero que la página se vea bien en mi teléfono y poder navegar entre varias secciones, para usarla cómodamente en cualquier dispositivo.",
    codeLang: "html",
    code: `<!-- Navbar con enlaces a varias páginas -->
<nav class="navbar navbar-expand-lg navbar-dark bg-primary">
  <div class="container">
    <a class="navbar-brand" href="index.html">MiProyecto</a>
    <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#menu">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="menu">
      <div class="navbar-nav ms-auto">
        <a class="nav-link" href="index.html">Inicio</a>
        <a class="nav-link" href="test.html">Test</a>
        <a class="nav-link" href="recursos.html">Recursos</a>
      </div>
    </div>
  </div>
</nav>

<!-- Grid responsive -->
<section class="container py-5">
  <div class="row g-4">
    <div class="col-12 col-md-6 col-lg-4"><div class="card h-100 p-3">Bloque 1</div></div>
    <div class="col-12 col-md-6 col-lg-4"><div class="card h-100 p-3">Bloque 2</div></div>
    <div class="col-12 col-md-6 col-lg-4"><div class="card h-100 p-3">Bloque 3</div></div>
  </div>
</section>`,
    estimation: 5,
    acceptanceCriteria: [
      { text: "El menú se colapsa en celular (botón hamburguesa) y funciona.", done: false },
      { text: "Hay al menos 2 páginas HTML enlazadas entre sí.", done: false },
      { text: "Usa el grid (row / col) y se reacomoda en móvil.", done: false },
      { text: "En computador las tarjetas se ven en fila.", done: false },
    ],
    tags: ["front", "bootstrap", "responsive"],
    tutorial: `## 🎯 Objetivo
Que tu sitio se adapte a cualquier pantalla y tenga varias páginas.

## 🧠 La idea del Grid
Bootstrap divide el ancho en **12 columnas**. Tú dices cuántas ocupa cada bloque:
- \`col-12\` → todo (celular) · \`col-md-6\` → mitad (tablet) · \`col-lg-4\` → un tercio (PC)

## 🪜 Paso a paso
1. Crea 2–3 archivos HTML (index, test, recursos) y enlázalos en la navbar.
2. Usa el mismo navbar en todas para que se sienta un solo sitio.
3. Envuelve el contenido en \`row\` y \`col-...\`.
4. Prueba: achica la ventana y mira cómo se reacomoda.

## 💡 Tip
\`h-100\` hace que las tarjetas de una fila tengan la misma altura. Se ve más pro.`,
  },
  {
    week: 5,
    title: "Crear el backend con FastAPI (primer endpoint)",
    role: "Como desarrollador",
    description:
      "quiero levantar un servidor con FastAPI que responda en una ruta, para tener la base del backend del proyecto.",
    codeLang: "python",
    code: `# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="API de mi Proyecto")

# Permitir que el front (otra dirección) hable con la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def inicio():
    return {"mensaje": "¡La API funciona! 🚀"}

@app.get("/salud")
def salud():
    return {"estado": "ok"}`,
    estimation: 5,
    acceptanceCriteria: [
      { text: "Se instala FastAPI y Uvicorn en un entorno virtual.", done: false },
      { text: "El servidor arranca con 'uvicorn main:app --reload'.", done: false },
      { text: "Al entrar a http://127.0.0.1:8000 responde un JSON.", done: false },
      { text: "La documentación automática abre en /docs.", done: false },
    ],
    tags: ["backend", "python", "fastapi"],
    tutorial: `## 🎯 Objetivo
Tener tu primer servidor (backend) hecho en Python con FastAPI.

## 🪜 Paso a paso
1. Instala Python 3.10+.
2. Crea un entorno virtual:
\`\`\`
python -m venv venv
venv\\Scripts\\activate     (Windows)
\`\`\`
3. Instala las librerías:
\`\`\`
pip install fastapi uvicorn
\`\`\`
4. Crea **main.py** con el código de la izquierda.
5. Arranca el servidor:
\`\`\`
uvicorn main:app --reload
\`\`\`
6. Abre en el navegador: http://127.0.0.1:8000 y también **/docs**.

## 💡 ¿Qué es un endpoint?
Es una "puerta" de tu API. \`@app.get("/salud")\` crea la puerta **/salud**.
Cuando alguien la visita, tu función responde.

## 🤯 Lo mágico
FastAPI crea **/docs** solo: una página para probar tu API sin escribir nada más.`,
  },
  {
    week: 6,
    title: "Conectar el front con el backend (fetch)",
    role: "Como usuario",
    description:
      "quiero que la información que veo en la página venga del backend, para que los datos sean reales y no estén escritos a mano.",
    codeLang: "javascript",
    code: `// En tu index.html, dentro de <script>
async function cargarMensaje() {
  try {
    const res = await fetch("http://127.0.0.1:8000/");
    const data = await res.json();
    document.getElementById("saludo").textContent = data.mensaje;
  } catch (error) {
    console.error("No se pudo conectar con la API", error);
  }
}

cargarMensaje();`,
    estimation: 5,
    acceptanceCriteria: [
      { text: "El front hace una petición fetch a la API de FastAPI.", done: false },
      { text: "Lo que muestra la página viene de la respuesta de la API.", done: false },
      { text: "Se maneja el error con try/catch si la API está apagada.", done: false },
      { text: "No hay errores de CORS (el middleware ya está puesto).", done: false },
    ],
    tags: ["front", "backend", "fetch", "integracion"],
    tutorial: `## 🎯 Objetivo
Unir los dos mundos: que el front **pida** datos al backend.

## 🧠 La palabra clave: fetch
\`fetch\` significa "ir a buscar". El front va a la dirección de la API y trae la respuesta.

## 🪜 Paso a paso
1. Ten el backend corriendo (uvicorn) **al mismo tiempo** que el front.
2. Agrega un elemento vacío: \`<h2 id="saludo"></h2>\`.
3. Usa el código de la izquierda para llenarlo con datos de la API.
4. Recarga la página: el texto debe aparecer solo.

## ⚠️ Error típico: CORS
Si ves un error rojo que dice "CORS", es porque el navegador bloquea la conexión.
Ya lo solucionamos en la HU anterior con \`CORSMiddleware\`. ¡Por eso lo pusimos!

## 💡 async / await
Traer datos toma tiempo. \`await\` significa "espera a que llegue la respuesta antes de seguir".`,
  },
  {
    week: 7,
    title: "Guardar datos en MongoDB desde FastAPI (POST)",
    role: "Como usuario",
    description:
      "quiero que lo que envío en el formulario se guarde en una base de datos, para que la información no se pierda al cerrar la página.",
    codeLang: "python",
    code: `# main.py
from fastapi import FastAPI
from pydantic import BaseModel
from pymongo import MongoClient

app = FastAPI()
client = MongoClient("TU_URI_DE_MONGODB")
db = client["mi_proyecto"]
coleccion = db["registros"]

class Registro(BaseModel):
    nombre: str
    estado: str

@app.post("/registros")
def crear(registro: Registro):
    resultado = coleccion.insert_one(registro.dict())
    return {"ok": True, "id": str(resultado.inserted_id)}`,
    estimation: 8,
    acceptanceCriteria: [
      { text: "Se crea una cuenta gratis en MongoDB Atlas y se obtiene la URI.", done: false },
      { text: "Se instala pymongo y se conecta sin error.", done: false },
      { text: "El endpoint POST /registros guarda un documento.", done: false },
      { text: "Se comprueba en Atlas que el dato aparece en la colección.", done: false },
    ],
    tags: ["backend", "mongodb", "post", "bd"],
    tutorial: `## 🎯 Objetivo
Guardar información de verdad en una base de datos en la nube.

## 🪜 Paso a paso
1. Entra a **mongodb.com/atlas** y crea una base gratis (M0).
2. Crea un usuario y copia tu **URI de conexión**.
3. Instala el conector: \`pip install pymongo\`
4. Pega tu URI en el código (¡nunca la subas a internet!).
5. Usa el endpoint POST para guardar lo que llega del formulario.

## 🧠 ¿Qué es Pydantic (BaseModel)?
Es el "portero" de tu API: revisa que los datos lleguen con la forma correcta
(que 'nombre' sea texto, por ejemplo). Si no, FastAPI avisa solo.

## 🧩 SQL vs NoSQL
MongoDB es **NoSQL**: guarda "documentos" parecidos a objetos JSON, no tablas.
Perfecto para empezar porque se parece mucho a lo que ya usas en JavaScript.

## 🔒 Seguridad
La URI es como la llave de tu casa. Guárdala en un archivo **.env**, nunca en el código público.`,
  },
  {
    week: 8,
    title: "Listar y mostrar los datos guardados (GET)",
    role: "Como usuario",
    description:
      "quiero ver en la página la lista de todo lo que se ha guardado, para que la información sea útil y visible.",
    codeLang: "python",
    code: `# Backend: leer todos los registros
@app.get("/registros")
def listar():
    datos = []
    for doc in coleccion.find():
        doc["_id"] = str(doc["_id"])   # ObjectId no es JSON, lo convertimos
        datos.append(doc)
    return datos`,
    estimation: 5,
    acceptanceCriteria: [
      { text: "GET /registros devuelve la lista de datos guardados.", done: false },
      { text: "El front hace fetch al GET y pinta la lista (tarjetas o filas).", done: false },
      { text: "Si no hay datos, la página muestra un mensaje amable.", done: false },
      { text: "El _id de Mongo se convierte a texto antes de enviarlo.", done: false },
    ],
    tags: ["backend", "front", "get", "mongodb"],
    tutorial: `## 🎯 Objetivo
Mostrar en pantalla la información que ya está guardada.

## 🪜 Paso a paso
1. Crea el endpoint GET que recorre la colección con \`find()\`.
2. En el front, haz \`fetch\` al GET.
3. Recorre la respuesta con \`.forEach\` y crea una tarjeta por cada dato.
4. Inserta las tarjetas en el HTML con \`innerHTML\` o \`appendChild\`.

## ⚠️ Detalle importante (el error #1 de principiantes)
El \`_id\` de Mongo es un **ObjectId**, no un texto. Hay que convertirlo con \`str()\`
para poder enviarlo como JSON. 😉

## 💡 Tip
Crea una función \`pintarLista()\` y llámala cada vez que agregues algo nuevo.`,
  },
  {
    week: 9,
    title: "Editar y borrar registros (completar el CRUD)",
    role: "Como usuario",
    description:
      "quiero poder editar y eliminar la información que guardé, para tener control total sobre mis datos.",
    codeLang: "python",
    code: `from bson import ObjectId

# Actualizar (PUT)
@app.put("/registros/{id}")
def actualizar(id: str, registro: Registro):
    coleccion.update_one(
        {"_id": ObjectId(id)},
        {"$set": registro.dict()}
    )
    return {"ok": True}

# Borrar (DELETE)
@app.delete("/registros/{id}")
def borrar(id: str):
    coleccion.delete_one({"_id": ObjectId(id)})
    return {"ok": True}`,
    estimation: 8,
    acceptanceCriteria: [
      { text: "Existe el endpoint PUT para editar un registro.", done: false },
      { text: "Existe el endpoint DELETE para borrar un registro.", done: false },
      { text: "Desde el front se puede editar y borrar, y la lista se actualiza.", done: false },
      { text: "Se entienden las 4 operaciones CRUD (crear, leer, editar, borrar).", done: false },
    ],
    tags: ["backend", "front", "crud", "mongodb"],
    tutorial: `## 🎯 Objetivo
Completar el **CRUD**: ya sabes Crear y Leer; faltan Editar y Borrar.

## 🔤 CRUD en la vida real
- **C**reate → POST (semana 7) · **R**ead → GET (semana 8)
- **U**pdate → PUT (editar) · **D**elete → DELETE (borrar)

## 🪜 Paso a paso
1. Crea el endpoint PUT que recibe un id y los nuevos datos (\`$set\`).
2. Crea el endpoint DELETE que recibe un id y usa \`delete_one\`.
3. En el front, agrega botones "Editar" y "Borrar" a cada tarjeta.
4. Tras editar o borrar, vuelve a cargar la lista (la función de la semana 8).

## 💡 Tip
Para editar, puedes rellenar el formulario con los datos actuales y, al enviar,
llamar al PUT en vez del POST. ¡Reutilizas casi todo!`,
  },
  {
    week: 10,
    title: "Registro e inicio de sesión de usuarios (seguridad)",
    role: "Como usuario",
    description:
      "quiero crear una cuenta e iniciar sesión de forma segura, para que mi información esté protegida.",
    codeLang: "python",
    code: `from passlib.hash import bcrypt

class Usuario(BaseModel):
    correo: str
    password: str

usuarios = db["usuarios"]

@app.post("/registro")
def registrar(u: Usuario):
    if usuarios.find_one({"correo": u.correo}):
        return {"ok": False, "error": "El correo ya existe"}
    # NUNCA guardar la contraseña tal cual: se "hashea"
    usuarios.insert_one({"correo": u.correo, "password": bcrypt.hash(u.password)})
    return {"ok": True}

@app.post("/login")
def login(u: Usuario):
    guardado = usuarios.find_one({"correo": u.correo})
    if guardado and bcrypt.verify(u.password, guardado["password"]):
        return {"ok": True}
    return {"ok": False, "error": "Datos incorrectos"}`,
    estimation: 8,
    acceptanceCriteria: [
      { text: "Las contraseñas se guardan con hash (bcrypt), nunca en texto plano.", done: false },
      { text: "No se permite registrar dos veces el mismo correo.", done: false },
      { text: "El login valida correo + contraseña correctamente.", done: false },
      { text: "Se explica por qué hashear es importante para la seguridad.", done: false },
    ],
    tags: ["backend", "seguridad", "auth"],
    tutorial: `## 🎯 Objetivo
Que los usuarios tengan cuenta y su información esté protegida.

## 🔒 La regla de oro
**Nunca** se guarda una contraseña tal cual. Se guarda un "hash": un código
imposible de revertir. Aunque roben la base de datos, no ven las claves.

## 🪜 Paso a paso
1. Instala: \`pip install "passlib[bcrypt]"\`
2. Al registrar, convierte la clave con \`bcrypt.hash(...)\`.
3. Al iniciar sesión, compara con \`bcrypt.verify(clave, hash_guardado)\`.
4. Revisa que el correo no exista antes de crear la cuenta.

## 💡 Conexión con la retro de Globant
En Calma pidieron **proteger los datos de los usuarios**. ¡Esto es exactamente eso!
La seguridad no es opcional cuando manejas datos de salud o personales.`,
  },
  {
    week: 11,
    title: "Validaciones, manejo de errores y pulido de la experiencia",
    role: "Como usuario",
    description:
      "quiero que la app me avise con mensajes claros cuando algo sale mal y se sienta cuidada, para confiar en ella.",
    codeLang: "javascript",
    code: `// Validar antes de enviar y mostrar mensajes amables
async function guardar(datos) {
  if (!datos.nombre.trim()) {
    mostrarAlerta("Escribe tu nombre 🙂", "warning");
    return;
  }
  try {
    const res = await fetch("http://127.0.0.1:8000/registros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    if (!res.ok) throw new Error("El servidor respondió con error");
    mostrarAlerta("¡Guardado con éxito! ✅", "success");
  } catch (e) {
    mostrarAlerta("No se pudo guardar. Intenta de nuevo.", "danger");
  }
}

function mostrarAlerta(msg, tipo) {
  const div = document.getElementById("alertas");
  div.innerHTML = \`<div class="alert alert-\${tipo}">\${msg}</div>\`;
}`,
    estimation: 5,
    acceptanceCriteria: [
      { text: "El formulario valida los datos antes de enviarlos.", done: false },
      { text: "Hay mensajes de éxito y de error visibles para el usuario.", done: false },
      { text: "Se usa un indicador de 'cargando' o se deshabilita el botón al enviar.", done: false },
      { text: "La app se revisó en celular y no hay elementos rotos.", done: false },
    ],
    tags: ["front", "ux", "validacion"],
    tutorial: `## 🎯 Objetivo
Que la app se sienta profesional y cuidada (¡esto impresiona a Globant!).

## 🪜 Qué revisar
1. **Validaciones**: no dejes enviar campos vacíos o con datos raros.
2. **Mensajes claros**: usa las alertas de Bootstrap (\`alert-success\`, \`alert-danger\`).
3. **Estados de carga**: deshabilita el botón mientras se envía, para no duplicar.
4. **Prueba en celular**: abre las herramientas del navegador (F12) y simula un móvil.

## 💡 Detalles que suman
- Textos amables en vez de errores técnicos.
- Confirmar antes de borrar ("¿Seguro?").
- Que se vea bien tanto vacío como lleno de datos.

## 🧠 Recuerda la retro
Globant pidió una app **atractiva que retenga usuarios**. El pulido es justo eso.`,
  },
  {
    week: 12,
    title: "Desplegar el proyecto en internet y presentar el MVP",
    role: "Como equipo",
    description:
      "quiero que el proyecto esté publicado en internet con una dirección real, para poder mostrarlo a Globant y a cualquier persona.",
    codeLang: "text",
    code: `# Estructura recomendada para desplegar
mi-proyecto/
├── frontend/        → se sube a Vercel o Netlify (HTML/CSS/JS)
│   └── index.html
└── backend/         → se sube a Render o Railway (FastAPI)
    ├── main.py
    └── requirements.txt   (fastapi, uvicorn, pymongo, passlib[bcrypt])

# requirements.txt
fastapi
uvicorn
pymongo
passlib[bcrypt]

# Comando de arranque en el hosting del backend:
uvicorn main:app --host 0.0.0.0 --port $PORT`,
    estimation: 5,
    acceptanceCriteria: [
      { text: "El frontend está publicado (Vercel/Netlify) con URL pública.", done: false },
      { text: "El backend está publicado (Render/Railway) y responde.", done: false },
      { text: "El front en producción usa la URL real del backend, no localhost.", done: false },
      { text: "Se preparó una demo/presentación corta del MVP para Globant.", done: false },
    ],
    tags: ["deploy", "vercel", "presentacion"],
    tutorial: `## 🎯 Objetivo
¡Publicar el proyecto y presentarlo!

## 🌐 Dos partes, dos hostings
- **Frontend** (HTML/CSS/JS) → Vercel o Netlify (gratis, súper fácil).
- **Backend** (FastAPI) → Render o Railway (tienen plan gratis).

## 🪜 Paso a paso
1. Sube tu código a **GitHub** (frontend y backend en carpetas separadas).
2. En Vercel: "Import Project" → elige la carpeta del frontend.
3. En Render: "New Web Service" → conecta el repo del backend.
4. Crea **requirements.txt** para que el hosting instale las librerías.
5. **Importante:** cambia \`http://127.0.0.1:8000\` por la URL real del backend
   en tu código del frontend. ¡Si no, en producción no conecta!

## 🎤 La presentación
Prepara 3–5 minutos: el problema, la solución (demo en vivo), y qué aprendieron.
Recuerden la recomendación de Globant: **un MVP alcanzable y terminado** vale más
que algo enorme sin acabar.

## 🔗 Siguiente nivel (opcional)
Aquí entra la parte de IA de cada reto (moderación en Calma, clasificador de
imágenes en Marketing). ¡Pero primero, el MVP en línea!`,
  },
];
