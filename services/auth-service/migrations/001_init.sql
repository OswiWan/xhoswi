-- Schema inicial del auth-service.
-- En docker-compose se monta en /docker-entrypoint-initdb.d/ (Postgres lo corre
-- automáticamente al crear el volumen por primera vez).
-- En Kubernetes lo aplica el Job auth-migrate definido en el chart de Helm.

CREATE TABLE IF NOT EXISTS users (
  email         TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Si la tabla ya existía (de una versión anterior sin la columna role),
-- la añade sin romper nada.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
