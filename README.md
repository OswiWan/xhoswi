# 🎬 Xhoswi — Plataforma de Streaming de Video

Mini-plataforma de streaming tipo Netflix construida como **proyecto de orquestación de microservicios con Kubernetes**.

> Desarrollado para la materia/proyecto de despliegue continuo en clúster Kubernetes (DOKS).

---

## 🏗️ Arquitectura

```
┌──────────────────────┐
│   Frontend (React)   │  ← localhost:5173
└──────────┬───────────┘
           │
   ┌───────┼─────────┐
   ▼       ▼         ▼
 :3001   :3002     :3003
┌────┐  ┌────┐   ┌──────────┐
│auth│  │cat │   │streaming │
└────┘  └────┘   └──────────┘
   ▲       ▲         ▲
   └───────┴─────────┘
              │
   Kubernetes (kind / DOKS)
   con 5 pods + Helm chart
```

| Microservicio | Puerto | Responsabilidad |
|---|---|---|
| `auth-service` | 3001 | Registro/login, emisión y validación de JWT |
| `catalog-service` | 3002 | Listado y metadata de videos |
| `streaming-service` | 3003 | Servir archivos HLS (`.m3u8` + `.ts`) |
| `frontend` | 5173 | UI React con reproductor HLS.js |

---

## 🚀 Quickstart

### Requisitos

- Node.js 20+
- Docker Desktop
- kubectl, kind, helm

### 1. Levantar todo con Docker Compose (modo desarrollo simple)

```bash
docker compose up -d --build
cd frontend && npm install && npm run dev
```

Abre http://localhost:5173

### 2. Desplegar en Kubernetes local (kind + Helm)

```bash
# 1. Crear cluster
kind create cluster --config k8s/kind-config.yaml

# 2. Construir y cargar imágenes al cluster
docker compose build
for svc in auth-service catalog-service streaming-service; do
  kind load docker-image xhoswi/$svc:latest --name xhoswi
done

# 3. Instalar el chart
helm install xhoswi k8s/charts/xhoswi/

# 4. Verificar
kubectl get pods -n xhoswi
curl http://localhost:3001/health
```

### 3. Frontend dev

```bash
cd frontend && npm install && npm run dev
```

---

## 📦 Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Node.js 20 + Express 5 |
| Frontend | React 19 + Vite + HLS.js |
| Auth | bcryptjs + jsonwebtoken (JWT) |
| Contenedores | Docker (multi-stage no, Alpine) |
| Orquestación | Kubernetes (kind local, DOKS-ready) |
| Empaquetado K8s | Helm 3 chart genérico |
| CI/CD | GitHub Actions (build + push a GHCR) |
| Registry | GitHub Container Registry (ghcr.io) |

---

## 🧪 Comandos útiles

```bash
# Helm
helm list
helm upgrade xhoswi k8s/charts/xhoswi/
helm rollback xhoswi 1
helm uninstall xhoswi

# Kubernetes
kubectl get pods -n xhoswi
kubectl logs -n xhoswi -f deployment/auth-service
kubectl scale deployment/auth-service -n xhoswi --replicas=4

# Docker
docker compose ps
docker compose logs -f

# Cluster
kind delete cluster --name xhoswi
```

---

## 📚 Documentación

- **[docs/GUIA.md](docs/GUIA.md)** — Guía completa educativa: qué es cada tecnología, por qué se eligió, cómo funcionan
- **[CLAUDE.md](CLAUDE.md)** — Estado del proyecto, decisiones técnicas, pendientes

---

## 📝 Pendientes / próximos pasos

- [ ] Migrar a DigitalOcean Kubernetes (DOKS)
- [ ] Configurar DigitalOcean Container Registry
- [ ] Reemplazar storage en memoria por PostgreSQL
- [ ] Subir videos HLS reales al `streaming-service`
- [ ] Agregar Ingress + cert-manager (TLS)

---

## 🧑‍💻 Autor

**OswiWan** (Oswaldo Balderas)
