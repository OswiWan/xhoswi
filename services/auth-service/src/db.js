import pg from 'pg';

// Un único Pool compartido. pg lee PGHOST, PGPORT, PGDATABASE, PGUSER,
// PGPASSWORD automáticamente del entorno si no le pasas config.
export const pool = new pg.Pool();

pool.on('error', (err) => {
  console.error('error inesperado en el pool de postgres', err);
});
