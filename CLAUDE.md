# CLAUDE.md

Este archivo guía a Claude Code (y a futuros desarrolladores) cuando trabajen en este repo.

---

## 🎯 Contexto del proyecto

**Xhoswi** es un proyecto educativo para la materia de microservicios y Kubernetes. Se trata de una mini-Netflix con 3 microservicios + frontend React, contenerizada con Docker, orquestada con Kubernetes (kind local, futuro DOKS), empaquetada con Helm y desplegada vía GitHub Actions.

**Nombre temporal**: `xhoswi` (la carpeta local sigue llamándose `spotifake` por compatibilidad).

---

## 🏗️ Estructura

```
spotifake/                       ← carpeta local (nombre cosmético)
├── services/
│   ├── auth-service/            Express + bcrypt + JWT
│   ├── catalog-service/         Express + datos seed en memoria
│   └── streaming-service/       Express sirve archivos estáticos HLS
├── frontend/                    Vite + React + HLS.js
├── k8s/
│   ├── kind-config.yaml         Cluster local (1 cp + 2 workers)
│   ├── manifests/               YAML directos (educativos, equivalentes al Helm)
│   └── charts/xhoswi/           Helm chart genérico (loop sobre values.services)
├── .github/workflows/ci.yml     Pipeline CI: build matrix + push a GHCR + helm lint
└── docker-compose.yml           Dev local sin K8s
```

---

## ✅ Hecho

- [x] 3 microservicios Node.js 20 + Express 5
- [x] Dockerfile por servicio (`node:20-alpine`)
- [x] Docker Compose para dev local
- [x] Frontend React (login + catálogo + reproductor HLS modal)
- [x] Cluster Kubernetes con kind (3 nodos)
- [x] Manifiestos YAML aplicados con `kubectl apply`
- [x] Helm chart con plantilla genérica que itera sobre `values.services`
- [x] GitHub Actions: build + push a `ghcr.io/oswiwan/<service>:latest` + helm lint
- [x] Push a GitHub (`origin`) y a Gitea propio (`gitea`)
- [x] Replicas múltiples + auto-healing demostrado

---

## ⏳ Pendiente

- [ ] **Cuenta y cluster en DigitalOcean (DOKS)** — el alumno aún no la consigue
- [ ] **DigitalOcean Container Registry (DOCR)** — alternativa o complemento a GHCR
- [ ] **CD real**: el pipeline solo hace CI (build+push). Falta job que haga `helm upgrade` contra DOKS automáticamente
- [ ] **Persistencia**: los users (auth) y videos (catalog) viven en `Map` en memoria — se pierden al reiniciar el pod. Migrar a PostgreSQL administrado
- [ ] **Videos HLS reales** en `streaming-service`. Actualmente el catalog devuelve URLs absolutas a `test-streams.mux.dev` para tener algo reproducible sin transcoder
- [ ] **Ingress NGINX + cert-manager** para TLS (en vez de NodePort)
- [ ] **Tests unitarios e integración** — no hay
- [ ] **Renombrar carpeta local** de `spotifake/` a `xhoswi/` (cosmético)

---

## 🧠 Decisiones técnicas clave

| Decisión | Razón |
|---|---|
| **In-memory storage** | Reduce dependencias para enfocarse en K8s; en producción → PostgreSQL |
| **NodePort en vez de Ingress** | Simplifica el setup local con kind; en DOKS sería Ingress + DO LoadBalancer |
| **URLs HLS públicas en seed** | Evita instalar FFmpeg + transcodear; el `streaming-service` está listo para servir archivos reales cuando se agreguen |
| **Helm con loop sobre `services`** | Una plantilla → 3 deployments + 3 services; añadir un microservicio = 5 líneas en values.yaml |
| **JWT secret hardcoded** | OK para dev/educativo; en prod sería un Secret de K8s |
| **GHCR sobre DOCR inicial** | Gratis, integrado con GitHub Actions sin configurar credenciales extra |

---

## 🧪 Cómo levantar/probar localmente

```bash
# 1. Levantar cluster + cargar imágenes + helm install
kind create cluster --config k8s/kind-config.yaml
docker compose build
for svc in auth-service catalog-service streaming-service; do
  kind load docker-image xhoswi/$svc:latest --name xhoswi
done
helm install xhoswi k8s/charts/xhoswi/

# 2. Frontend
cd frontend && npm install && npm run dev

# 3. Verificar
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
kubectl get pods -n xhoswi
```

---

## 🔐 Credenciales y secretos

- Token de Gitea guardado en macOS Keychain:
  ```bash
  security find-generic-password -a "oswian" -s "gitea-token-xhoswi" -w
  ```
- Token de GitHub: configurado en el git credential helper del usuario (no en archivos)
- `JWT_SECRET` del auth-service: `dev-secret-change-me` (hardcoded, cambiar en prod)

---

## 🗺️ Mapa de remotes

```bash
origin  https://github.com/OswiWan/xhoswi.git       (público)
gitea   calamardo-git:oswiwan/xhoswi.git            (server propio, vía SSH puerto 2222)
```

`calamardo-git` está definido en `~/.ssh/config` apuntando a `100.112.12.71:2222` (Gitea en Docker).

---

## 🚦 Cuando se consiga DigitalOcean

1. Crear cluster DOKS desde el dashboard
2. `doctl kubernetes cluster kubeconfig save <cluster-name>`
3. Cambiar imagen en `k8s/charts/xhoswi/values.yaml` a `ghcr.io/oswiwan/<service>:latest`
4. Si las imágenes son privadas: crear `imagePullSecret` para GHCR
5. `helm install xhoswi k8s/charts/xhoswi/` (los manifiestos son portables)
6. Agregar job `deploy` al pipeline de GitHub Actions con `azure/setup-kubectl` + `helm upgrade`

---

## ⚠️ Notas para Claude

- El usuario es estudiante; explicar conceptos antes de ejecutar comandos
- Confirmar antes de borrar recursos (`kind delete`, `helm uninstall`, `git reset`)
- Mantener todo en español (es la lengua del usuario)
- No instalar dependencias globales; preferir `npx`/`brew`
