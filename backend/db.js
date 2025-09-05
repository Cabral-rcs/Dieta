// backend/db.js
import pkg from "pg";
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL || null;

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: connectionString.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : false,
    })
  : null;

export async function migrate() {
  if (!pool) return;
  const client = await pool.connect();
  try {
    // extensão para gerar uuid em algumas infra (pgcrypto)
    await client.query(`create extension if not exists pgcrypto;`);

    await client.query(`
      create table if not exists meals_by_day (
        day text primary key,
        data jsonb not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `);

    await client.query(`
      create or replace function set_updated_at()
      returns trigger as $$
      begin
        new.updated_at = now();
        return new;
      end;
      $$ language plpgsql;
    `);

    await client.query(`
      drop trigger if exists meals_set_updated_at on meals_by_day;
      create trigger meals_set_updated_at
      before update on meals_by_day
      for each row execute procedure set_updated_at();
    `);

    await client.query(`create index if not exists idx_meals_by_day_day on meals_by_day (day);`);
  } finally {
    client.release();
  }
}

export async function getAllDays() {
  if (!pool) throw new Error("No DB pool");
  const { rows } = await pool.query(`select day, data from meals_by_day`);
  const result = {};
  rows.forEach((r) => {
    result[r.day] = r.data;
  });
  return result;
}

export async function getDay(day) {
  if (!pool) throw new Error("No DB pool");
  const { rows } = await pool.query(`select data from meals_by_day where day = $1 limit 1`, [day]);
  return rows[0] ? rows[0].data : null;
}

export async function upsertDay(day, data) {
  if (!pool) throw new Error("No DB pool");
  const { rows } = await pool.query(
    `insert into meals_by_day (day, data) values ($1, $2)
     on conflict (day) do update set data = EXCLUDED.data
     returning day, data, created_at, updated_at`,
    [day, data]
  );
  return rows[0];
}