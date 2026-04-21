-- Schema inicial del catalog-service.
-- En docker-compose se monta en /docker-entrypoint-initdb.d/ (Postgres lo corre
-- la primera vez que crea el volumen). En Kubernetes lo aplica el Job db-migrate.

CREATE TABLE IF NOT EXISTS videos (
  id               UUID PRIMARY KEY,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  thumbnail        TEXT NOT NULL DEFAULT '',
  hls_path         TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
