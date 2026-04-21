import pg from 'pg';

// pg lee PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD del entorno.
export const pool = new pg.Pool();

pool.on('error', (err) => {
  console.error('error inesperado en el pool de postgres', err);
});
