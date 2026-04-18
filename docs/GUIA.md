# 📘 Guía completa del proyecto Xhoswi

Esta guía explica **paso a paso** qué es cada tecnología que usamos, **por qué** la elegimos y **cómo encaja** en el proyecto. Está pensada para alguien que está aprendiendo y quiere entender el "qué" y el "por qué" detrás de cada herramienta.

---

## 📑 Índice

1. [JavaScript y Node.js](#1-javascript-y-nodejs)
2. [Express y los microservicios](#2-express-y-los-microservicios)
3. [npm y los paquetes](#3-npm-y-los-paquetes)
4. [React y el frontend](#4-react-y-el-frontend)
5. [Vite (servidor de desarrollo)](#5-vite-servidor-de-desarrollo)
6. [HLS (streaming de video)](#6-hls-streaming-de-video)
7. [Docker (contenedores)](#7-docker-contenedores)
8. [Docker Compose](#8-docker-compose)
9. [Kubernetes](#9-kubernetes)
10. [kind (Kubernetes local)](#10-kind-kubernetes-local)
11. [Helm](#11-helm)
12. [GitHub Actions (CI/CD)](#12-github-actions-cicd)
13. [Container Registry (GHCR)](#13-container-registry-ghcr)
14. [Git y los repositorios remotos](#14-git-y-los-repositorios-remotos)
15. [Glosario rápido](#15-glosario-rápido)

---

## 1. JavaScript y Node.js

### ¿Qué es JavaScript?

Es el lenguaje de programación de la web. Originalmente solo corría dentro de los navegadores para hacer las páginas interactivas (validar formularios, animaciones, etc.).

### ¿Qué es Node.js?

Es un **runtime** de JavaScript que permite ejecutar JS **fuera del navegador**, en tu computadora o en un servidor. Lo crearon en 2009 sacando el motor V8 de Chrome y poniéndolo en una aplicación independiente.

**Sin Node.js:** JavaScript solo vive en el navegador.
**Con Node.js:** puedes escribir servidores, herramientas CLI, scripts, etc., todo en JS.

### ¿Qué es un "nodo" entonces?

Cuidado, **dos significados distintos**:

| "Nodo" | Significado |
|---|---|
| **Node.js** (la tecnología) | Runtime de JavaScript del lado del servidor |
| **Nodo de Kubernetes** | Una máquina (real o virtual) que forma parte del cluster |

En este proyecto usamos los DOS:
- **Node.js** = lenguaje en el que están escritos los 3 microservicios
- **Nodos K8s** = las "máquinas" del cluster (en kind son contenedores Docker que simulan máquinas)

### ¿Por qué Node.js?

| Razón | Detalle |
|---|---|
| **Mismo lenguaje frontend y backend** | Si sabes JS para React, ya sabes Node.js |
| **Rapidísimo de empezar** | `node servidor.js` y ya tienes un servidor web |
| **Enorme ecosistema (npm)** | Hay paquetes para casi todo |
| **Ideal para APIs REST** | Es asíncrono por naturaleza, maneja muchas conexiones simultáneas |
| **Imágenes Docker pequeñas** | `node:20-alpine` pesa ~50MB |

### ¿Por qué versión 20 LTS?

LTS = "Long Term Support". Las versiones LTS reciben actualizaciones de seguridad por años. La 20 es estable y soportada hasta 2026.

---

## 2. Express y los microservicios

### ¿Qué es Express?

Es un **framework web** para Node.js. Sin Express, hacer un servidor HTTP en Node es tedioso (tienes que parsear las peticiones a mano). Express te lo simplifica con una API limpia:

```js
import express from 'express';
const app = express();
app.get('/saludo', (req, res) => res.json({ msg: 'hola' }));
app.listen(3000);
```

Eso ya es un servidor HTTP completo en 3 líneas.

### ¿Qué son los microservicios?

Es un **estilo de arquitectura** donde, en vez de tener una sola aplicación gigante (monolito) que lo hace todo, divides el sistema en **servicios pequeños** que cada uno hace UNA cosa.

**Monolito:**
```
┌─────────────────────────────────────┐
│  Mi App (50,000 líneas de código)   │
│  - Usuarios                         │
│  - Catálogo                         │
│  - Pagos                            │
│  - Streaming                        │
│  - Recomendaciones                  │
└─────────────────────────────────────┘
```

**Microservicios:**
```
┌──────┐  ┌─────────┐  ┌───────┐  ┌──────────┐  ┌─────────────────┐
│Users │  │Catalog  │  │Pagos  │  │Streaming │  │Recomendaciones  │
└──────┘  └─────────┘  └───────┘  └──────────┘  └─────────────────┘
```

### Ventajas de microservicios

- **Despliegue independiente:** actualizo `auth` sin tocar `streaming`
- **Escalado independiente:** `streaming` necesita 100 réplicas, `auth` solo 2
- **Tecnologías mixtas:** uno en Node, otro en Go, otro en Python
- **Equipos independientes:** un equipo por servicio
- **Fallas aisladas:** si `pagos` se cae, los demás siguen

### Desventajas

- **Más complejo de operar** (necesitas Kubernetes, etc. — por eso hicimos este proyecto)
- **Comunicación por red** entre servicios (más lento que llamadas locales)
- **Datos distribuidos** (cada servicio con su propia DB)

### En nuestro proyecto

3 microservicios, cada uno con Express, en su propio Dockerfile:

```
auth-service     (puerto 3001) — registro, login, JWT
catalog-service  (puerto 3002) — lista de videos
streaming-service (puerto 3003) — sirve archivos HLS
```

---

## 3. npm y los paquetes

### ¿Qué es npm?

**npm = Node Package Manager.** Es como una "tienda" gigantesca de librerías reutilizables. Cuando escribes:

```bash
npm install express
```

npm descarga Express e todas sus dependencias y las pone en `node_modules/`.

### Archivos clave

| Archivo | Para qué sirve |
|---|---|
| `package.json` | Lista las dependencias que tu proyecto necesita |
| `package-lock.json` | Versiones exactas instaladas (para reproducibilidad) |
| `node_modules/` | Las dependencias descargadas (NO se sube a git) |

### ¿Por qué `node_modules/` no va a git?

Porque pesa MUCHO (cientos de MB) y se puede regenerar con `npm install`. Está en `.gitignore`.

### Comandos útiles

```bash
npm install                # instala todas las deps del package.json
npm install <paquete>      # instala uno nuevo
npm install --save-dev <paquete>  # solo para desarrollo (no producción)
npm run start              # ejecuta el script "start" del package.json
npm run dev                # ejecuta el script "dev"
npm ci                     # instala respetando exactamente package-lock.json (ideal para Docker)
```

---

## 4. React y el frontend

### ¿Qué es React?

Es una **librería de JavaScript** creada por Facebook para construir interfaces de usuario en el navegador. **No es un lenguaje** — es JavaScript con superpoderes.

**Sin React (JS puro):** para cambiar un texto en pantalla tienes que escribir manualmente:
```js
document.getElementById('contador').textContent = count;
```

**Con React:** describes CÓMO se ve la UI según los datos, y React actualiza el DOM automáticamente:
```jsx
<p>Contador: {count}</p>
```

### ¿Por qué React (y no Vue, Angular, Svelte)?

| Razón | Detalle |
|---|---|
| **El más popular** | Más empleos, más tutoriales, más librerías |
| **Componentes reutilizables** | Un `<VideoPlayer />` se reusa en 10 lugares |
| **Ecosistema enorme** | HLS.js, routing, estado, testing — todo existe |
| **Comunidad activa** | Respuestas en Stack Overflow para todo |
| **Curva de aprendizaje razonable** | Solo necesitas saber JS y JSX |

### Concepto clave: Componentes

Una app React es un **árbol de componentes** (funciones que devuelven HTML):

```
<App>
  <Login />              ← cuando no estás logueado
  <Catalog>              ← cuando sí
    <VideoPlayer />      ← se abre al click
  </Catalog>
</App>
```

Cada componente tiene:
- **Props** (los datos que recibe del padre)
- **State** (sus datos internos)
- **JSX** (lo que renderiza)

Ejemplo real de nuestro `Login.jsx`:

```jsx
const [email, setEmail] = useState('');  // ← state
return (
  <input value={email} onChange={(e) => setEmail(e.target.value)} />
);
```

Cuando el usuario escribe, `email` cambia, y React **automáticamente** vuelve a pintar el `<input>`.

### ¿Qué es JSX?

Es JavaScript con sintaxis tipo HTML. Un transpilador (Vite/Babel) lo convierte en JS normal antes de mandarlo al navegador.

```jsx
// JSX
<button onClick={handleClick}>Click</button>

// se convierte en JS:
React.createElement('button', { onClick: handleClick }, 'Click')
```

### En nuestro proyecto

```
frontend/src/
├── main.jsx              ← punto de entrada (monta React en el HTML)
├── App.jsx               ← decide si mostrar Login o Catalog
├── api.js                ← funciones fetch() a los microservicios
└── components/
    ├── Login.jsx         ← formulario login/registro
    ├── Catalog.jsx       ← grid de tarjetas de video
    └── VideoPlayer.jsx   ← reproductor HLS modal
```

---

## 5. Vite (servidor de desarrollo)

### ¿Qué es Vite?

Es una herramienta de desarrollo para frontend moderno. Hace 2 cosas:

1. **Servidor de desarrollo** con hot reload (cambios instantáneos sin recargar)
2. **Bundler** para producción (empaqueta todo el JS/CSS en archivos optimizados)

### ¿Por qué Vite (y no webpack, Create React App)?

- **Ultra rápido:** arranca en ~1 segundo (webpack tarda 30+)
- **Hot reload mágico:** ves cambios en el navegador al instante de guardar
- **Configuración cero:** funciona out-of-the-box con React, TypeScript, etc.
- **Estándar moderno:** Create React App ya está descontinuado

### Cómo se usa

```bash
cd frontend
npm run dev     # arranca dev server en puerto 5173
npm run build   # construye versión de producción en dist/
```

---

## 6. HLS (streaming de video)

### ¿Qué es HLS?

**HLS = HTTP Live Streaming.** Es un protocolo creado por Apple para mandar video por internet.

### ¿Cómo funciona?

En vez de enviar UN archivo gigante de video (como un MP4 de 1GB), HLS:

1. **Divide el video en pedacitos** de 5-10 segundos cada uno (`segment000.ts`, `segment001.ts`, ...)
2. **Crea un "índice"** que lista esos pedacitos: `index.m3u8`
3. El reproductor descarga **solo los segmentos que necesita** según vas viendo

```
mi-video/
├── index.m3u8          ← "el segmento 0 está aquí, el 1 aquí, ..."
├── segment000.ts       ← primeros 10 segundos
├── segment001.ts       ← siguientes 10 segundos
├── segment002.ts
└── ...
```

### Ventajas de HLS

- **Inicio rápido:** comienza a reproducir con el primer segmento
- **Adaptativo:** puede tener varias calidades (480p, 720p, 1080p) y cambiar según tu conexión
- **No requiere protocolos especiales:** solo HTTP normal
- **Soporte nativo en Safari/iOS**

### ¿Por qué HLS y no otro?

| Protocolo | Pros | Contras |
|---|---|---|
| **HLS** | Apple/iOS lo soporta nativo, estándar de facto | Latencia ~10s |
| **DASH** | Más eficiente | No funciona en Safari sin polyfill |
| **WebRTC** | Latencia <1s | Diseñado para llamadas, no broadcast |
| **MP4 progresivo** | Simple | Tienes que descargar todo antes de ver |

### En nuestro proyecto

- El **streaming-service** sirve esos archivos `.m3u8` y `.ts` cuando tengas tus propios videos
- El **frontend** usa **HLS.js** (librería) para que el navegador (Chrome/Firefox) pueda leer HLS (Safari ya lo soporta nativo)

---

## 7. Docker (contenedores)

### El problema que resuelve Docker

> "En mi máquina funciona" 🙃

Diferentes computadoras tienen diferentes sistemas operativos, versiones de librerías, etc. Algo que funciona en tu Mac puede fallar en el servidor Linux.

### ¿Qué es un contenedor?

Es una **caja autocontenida** que tiene:
- Tu código
- Sus dependencias (librerías, runtime, etc.)
- Un mini sistema operativo Linux

Esa caja **se ejecuta IGUAL** en tu Mac, en Windows, en un servidor Linux, en la nube. Si funciona en una, funciona en todas.

### Imagen vs Contenedor

| Imagen | Contenedor |
|---|---|
| El "molde" | La instancia ejecutándose |
| Como una clase | Como un objeto |
| Se construye con `Dockerfile` | Se crea con `docker run` |
| Existe en disco | Existe en memoria |

Una imagen → muchos contenedores corriendo a la vez (eso son las "réplicas" en K8s).

### Dockerfile (la receta)

```dockerfile
FROM node:20-alpine          # parto de una imagen base
WORKDIR /app                 # creo /app dentro del contenedor
COPY package*.json ./        # copio solo el manifiesto primero (cache)
RUN npm ci --omit=dev        # instalo deps
COPY src ./src               # copio el código
EXPOSE 3001                  # documento el puerto
CMD ["node", "src/index.js"] # comando al arrancar
```

### Comandos básicos

```bash
docker build -t mi-imagen .     # construye una imagen
docker run -p 3001:3001 mi-imagen   # corre un contenedor
docker ps                       # lista contenedores corriendo
docker logs <container>         # ve los logs
docker stop <container>         # detiene un contenedor
docker images                   # lista imágenes
```

### En nuestro proyecto

3 Dockerfiles (uno por microservicio). Cada uno produce una imagen tipo `xhoswi/auth-service:latest`.

---

## 8. Docker Compose

### ¿Qué problema resuelve?

Si tienes 3 contenedores que necesitan correr juntos, ejecutar `docker run` 3 veces con los flags correctos es un dolor. Docker Compose te deja **declarar todo en YAML** y arrancarlo con UN comando.

### Nuestro `docker-compose.yml`

```yaml
services:
  auth-service:
    build: ./services/auth-service   # dónde está el Dockerfile
    ports: ["3001:3001"]              # mapea puertos
    environment:                      # variables de entorno
      JWT_SECRET: dev-secret

  catalog-service:
    ...
```

### Comandos

```bash
docker compose up -d --build    # construye y arranca todo en background
docker compose ps               # ver estado
docker compose logs -f          # ver logs de todos
docker compose down             # parar y eliminar
```

### ¿Cuándo usar Compose vs Kubernetes?

- **Docker Compose:** desarrollo local, prototipos, máquinas individuales
- **Kubernetes:** producción, alta disponibilidad, múltiples máquinas

En este proyecto usamos AMBOS:
- Compose para desarrollo rápido sin preocuparnos por K8s
- K8s cuando queremos demostrar la arquitectura productiva

---

## 9. Kubernetes

### ¿Qué es Kubernetes (K8s)?

Es un **orquestador de contenedores**. Si Docker corre UN contenedor, Kubernetes administra **cientos o miles de contenedores** distribuidos en muchas máquinas.

### Analogía

- **Docker** = un cocinero
- **Kubernetes** = el gerente de un restaurante con 50 cocineros, que:
  - Mantiene siempre suficientes cocineros activos
  - Reemplaza a los que se enferman
  - Reparte el trabajo entre ellos
  - Coordina cuándo entran cocineros nuevos sin que se note

### Conceptos clave

| Concepto | Qué es |
|---|---|
| **Cluster** | Conjunto de máquinas administradas por K8s |
| **Nodo** | Una máquina del cluster (puede ser física o virtual) |
| **Pod** | La unidad más pequeña: 1 o más contenedores que viven juntos |
| **Deployment** | Define "quiero N pods de esta imagen siempre corriendo" |
| **ReplicaSet** | El "vigilante" que mantiene N pods vivos |
| **Service** | Punto de acceso estable a un grupo de pods |
| **Namespace** | "Carpeta" para agrupar recursos relacionados |
| **NodePort** | Tipo de Service que expone un puerto en cada nodo |
| **Ingress** | Router HTTP que enruta tráfico a múltiples services |

### ¿Cómo se conecta todo?

```
┌─ Cluster Kubernetes ─────────────────────────────────┐
│                                                       │
│  ┌─ Namespace "xhoswi" ────────────────────────────┐ │
│  │                                                  │ │
│  │  Deployment "auth-service" (replicas: 2)        │ │
│  │   └─ ReplicaSet                                 │ │
│  │       ├─ Pod auth-xxx (en nodo worker1)         │ │
│  │       └─ Pod auth-yyy (en nodo worker2)         │ │
│  │                                                  │ │
│  │  Service "auth-service" (NodePort 30001)        │ │
│  │   └─ apunta a los pods con label app=auth       │ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

### Auto-curación (lo que demostraste)

Si matas un pod (`kubectl delete pod`), K8s detecta "me falta una réplica" y crea uno nuevo automáticamente en segundos. Mientras tanto, las otras réplicas siguen sirviendo tráfico → **zero downtime**.

### Manifiestos YAML

Los YAMLs declaran **el estado deseado** del cluster:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 2          # ← yo quiero SIEMPRE 2 pods
  template:
    spec:
      containers:
        - image: xhoswi/auth-service:latest
```

K8s se encarga de hacer realidad ese estado y mantenerlo.

---

## 10. kind (Kubernetes local)

### ¿Qué es kind?

**kind = Kubernetes IN Docker.** Te crea un cluster Kubernetes completo dentro de contenedores Docker en tu máquina, para desarrollo y aprendizaje.

### ¿Por qué kind?

- **Gratis** (no pagas por DOKS / EKS / GKE)
- **Idéntico al real** — los manifiestos funcionan igual en producción
- **Rápido** — cluster listo en 30 segundos
- **Múltiples nodos** simulados

### Lo que creamos

`k8s/kind-config.yaml`:
- 1 nodo control-plane (el "cerebro")
- 2 nodos worker (donde corren tus pods)
- Mapeo de puertos 30001-30003 → 3001-3003 de tu Mac

### Comandos

```bash
kind create cluster --config k8s/kind-config.yaml
kind get clusters
kind load docker-image <imagen> --name xhoswi   # mete una imagen al cluster
kind delete cluster --name xhoswi
```

### ¿Por qué `kind load` es necesario?

Las imágenes Docker que tienes en tu Mac NO están automáticamente disponibles en kind. Hay que cargarlas explícitamente. (En DOKS las descargarías de un Container Registry como GHCR.)

---

## 11. Helm

### El problema que resuelve

Si tienes 10 microservicios, necesitas 10 archivos YAML casi idénticos (cambia el nombre, puerto, imagen). Eso es:
- Repetitivo
- Propenso a errores
- Difícil de actualizar (cambiar un valor → editar 10 archivos)

### ¿Qué es Helm?

Es el **gestor de paquetes de Kubernetes**, como `npm` para Node.js o `apt` para Ubuntu, pero para clusters K8s.

Te deja:
- **Empaquetar** múltiples manifiestos en un "chart"
- **Parametrizar** los YAMLs con plantillas
- **Versionar** despliegues (rollback en 1 comando)
- **Distribuir** charts (instalar PostgreSQL, NGINX, etc., con `helm install`)

### Estructura de un chart

```
mi-chart/
├── Chart.yaml          ← metadata (nombre, versión)
├── values.yaml         ← variables configurables
└── templates/          ← plantillas YAML con sintaxis Go template
    ├── deployment.yaml
    └── service.yaml
```

### Nuestro chart

`k8s/charts/xhoswi/values.yaml`:
```yaml
services:
  auth-service:
    image: xhoswi/auth-service:latest
    replicas: 2
    port: 3001
  catalog-service: ...
  streaming-service: ...
```

`templates/deployments.yaml` itera sobre `services`:
```yaml
{{- range $name, $svc := .Values.services }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ $name }}
spec:
  replicas: {{ $svc.replicas }}
  ...
{{- end }}
```

**Resultado:** UN template genera 3 deployments + 3 services automáticamente.

### Comandos

```bash
helm install xhoswi ./chart            # instalar
helm upgrade xhoswi ./chart            # actualizar
helm rollback xhoswi 1                 # volver a la versión 1
helm list                              # ver releases
helm template xhoswi ./chart           # ver YAML generado sin instalar
helm uninstall xhoswi                  # eliminar todo
```

### ¿Por qué Helm sobre `kubectl apply`?

| `kubectl apply` | `helm install` |
|---|---|
| Aplica YAMLs estáticos | YAMLs dinámicos con variables |
| Sin versionado | Cada instalación es una "revisión" con rollback |
| Tienes que recordar qué aplicaste | `helm list` te lo dice |
| Difícil compartir | Distribuyes chart como un .tgz |

---

## 12. GitHub Actions (CI/CD)

### ¿Qué es CI/CD?

- **CI** = **Continuous Integration** — cada cambio se construye y testea automáticamente
- **CD** = **Continuous Delivery/Deployment** — cada cambio aprobado se despliega automáticamente

### El problema sin CI/CD

```
1. Cambias código
2. Construyes imagen Docker manualmente
3. La subes al registry manualmente
4. Actualizas Kubernetes manualmente
5. Si algo falla, debug a las 11pm
```

### Con GitHub Actions

```
git push → GitHub detecta → ejecuta tu pipeline → todo automatizado
```

### Anatomía de un workflow

`.github/workflows/ci.yml`:

```yaml
name: CI - Build and Push Images

on:
  push:
    branches: [main]   # ← se dispara con git push a main

jobs:
  build-and-push:
    runs-on: ubuntu-latest    # ← VM ubuntu de GitHub
    strategy:
      matrix:
        service: [auth-service, catalog-service, streaming-service]
        # ↑ ejecuta 3 jobs en paralelo, uno por servicio

    steps:
      - uses: actions/checkout@v4              # baja el código
      - uses: docker/setup-buildx-action@v3    # configura docker
      - uses: docker/login-action@v3           # login a GHCR
      - uses: docker/build-push-action@v6      # build + push
```

### ¿Qué hace nuestro pipeline?

1. Cuando haces `git push`:
2. GitHub levanta 3 VMs Ubuntu en paralelo
3. Cada una construye la imagen de un microservicio
4. Las sube a `ghcr.io/oswiwan/<servicio>:latest`
5. Otra VM valida el Helm chart con `helm lint`
6. ✅ Si todo pasa, ves un check verde en el commit

### Conceptos clave

| Concepto | Qué es |
|---|---|
| **Workflow** | Un archivo .yml en `.github/workflows/` |
| **Job** | Un conjunto de pasos que corren en una VM |
| **Step** | Un comando o acción dentro de un job |
| **Action** | Función reutilizable (como `actions/checkout`) |
| **Matrix** | Repetir un job con diferentes parámetros (paralelo) |
| **Runner** | La máquina virtual donde se ejecuta |

### Costos

- **Repos públicos**: ✅ ilimitado y gratis
- **Repos privados**: 2,000 minutos/mes gratis

---

## 13. Container Registry (GHCR)

### ¿Qué es un container registry?

Es un **almacén** de imágenes Docker en internet. Subes tus imágenes ahí y desde cualquier máquina puedes descargarlas.

### Registries populares

| Registry | Quién | Cuándo usarlo |
|---|---|---|
| **Docker Hub** | Docker Inc. | Histórico, gratis con límites |
| **GHCR** (ghcr.io) | GitHub | Si ya usas GitHub Actions |
| **DOCR** | DigitalOcean | Si despliegas en DOKS |
| **ECR** | AWS | Si usas EKS/AWS |
| **GCR/Artifact Registry** | Google | Si usas GKE |

### ¿Por qué elegimos GHCR?

- **Gratis** para repos públicos
- **Integración nativa** con GitHub Actions (sin configurar credenciales extra — usa `GITHUB_TOKEN`)
- **Imágenes públicas o privadas**
- **Migración fácil** a DOCR cuando se consiga DigitalOcean (solo cambia `ghcr.io/...` por `registry.digitalocean.com/...`)

### Nuestras imágenes

Después del primer `git push`:

```
ghcr.io/oswiwan/auth-service:latest
ghcr.io/oswiwan/catalog-service:latest
ghcr.io/oswiwan/streaming-service:latest
```

Cualquier cluster K8s en el mundo puede descargar estas imágenes.

---

## 14. Git y los repositorios remotos

### ¿Qué es git?

Sistema de control de versiones: guarda **toda la historia** de cambios en tu código. Te permite volver atrás, ver quién cambió qué, trabajar en paralelo, etc.

### ¿Qué es un "remote"?

Una **copia del repo en otro servidor** (GitHub, GitLab, Gitea, etc.). Tú trabajas localmente y "pusheas" tus cambios al remote.

### Nuestros 2 remotes

```
origin   → GitHub (https://github.com/OswiWan/xhoswi)  [público mundial]
gitea    → Tu server propio (Gitea en 100.112.12.71)   [red privada]
```

### ¿Por qué tener 2 remotes?

- **GitHub:** público, GitHub Actions gratis ilimitado, demo a profes
- **Gitea propio:** backup en infraestructura tuya, control total, privacidad

### Comandos esenciales

```bash
git init                       # inicializa repo local
git add .                      # marca archivos para commit
git commit -m "mensaje"        # crea un punto de guardado
git push origin main           # sube a GitHub
git push gitea main            # sube a Gitea
git pull                       # baja cambios del remote
git status                     # ver estado actual
git log --oneline              # ver historial
git remote -v                  # ver remotes configurados
```

### `.gitignore`

Lista de archivos/carpetas que git debe IGNORAR (no subir):
- `node_modules/` (pesa demasiado)
- `.env` (secretos)
- `videos/` (archivos grandes)

---

## 15. Glosario rápido

| Término | Definición corta |
|---|---|
| **API** | Conjunto de URLs (endpoints) que un servicio ofrece para que otros lo usen |
| **REST** | Estilo de API basado en HTTP (GET, POST, etc.) |
| **JWT** | Token firmado que prueba quién eres, dura unas horas |
| **Endpoint** | Una ruta específica de la API (ej: `POST /login`) |
| **Hash** | Función matemática unidireccional (passwords se guardan hasheados) |
| **CORS** | Permiso para que un navegador llame a otro dominio |
| **YAML** | Formato de archivo de configuración (legible, con indentación) |
| **Pod** | La unidad mínima en K8s: 1+ contenedores juntos |
| **Replica** | Copia idéntica de un pod corriendo en paralelo |
| **Self-healing** | Capacidad del sistema de recuperarse solo de fallas |
| **Hot reload** | Cambios en código se reflejan al instante sin reiniciar |
| **Bundle** | JavaScript empaquetado para producción (minificado) |
| **DOM** | El "árbol HTML" del navegador que React modifica |
| **State** | Datos internos de un componente que pueden cambiar |
| **Props** | Datos que un componente padre pasa al hijo |
| **DOKS** | DigitalOcean Kubernetes Service |
| **DOCR** | DigitalOcean Container Registry |
| **CI/CD** | Integración / Despliegue continuos |
| **PAT** | Personal Access Token (credencial para CLI) |

---

## 🎓 Camino de aprendizaje sugerido

Si quieres profundizar más:

1. **JavaScript moderno** (async/await, módulos ES) → MDN docs
2. **React fundamentos** → https://react.dev/learn
3. **Docker básico** → https://docs.docker.com/get-started/
4. **Kubernetes 101** → https://kubernetes.io/docs/tutorials/kubernetes-basics/
5. **Helm chart authoring** → https://helm.sh/docs/chart_best_practices/
6. **GitHub Actions** → https://docs.github.com/en/actions
7. **Diseño de microservicios** → libro "Building Microservices" de Sam Newman

---

*Esta guía cubre lo construido en el proyecto Xhoswi. Para detalles de implementación, ver el código y `CLAUDE.md`.*
