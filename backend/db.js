import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // necessário no Render
});

export const query = (text, params) => pool.query(text, params);

export async function initDB() {
  await query(`
    CREATE TABLE IF NOT EXISTS meals (
      id SERIAL PRIMARY KEY,
      day VARCHAR(20),
      meal_type VARCHAR(50),
      food_name VARCHAR(100),
      quantity VARCHAR(50)
    );
  `);
}