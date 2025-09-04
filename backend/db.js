import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Inicializar tabelas
export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS days (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS meals (
      id SERIAL PRIMARY KEY,
      dayId INT REFERENCES days(id),
      name TEXT
    );

    CREATE TABLE IF NOT EXISTS foods (
      id SERIAL PRIMARY KEY,
      mealId INT REFERENCES meals(id),
      name TEXT,
      quantity TEXT
    );
  `);

  // Criar dias e refeições padrão se ainda não existirem
  const DAYS = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  const MEALS = [
    "🌅 Café da manhã",
    "🍎 Lanche da manhã", 
    "🍽️ Almoço",
    "🥨 Lanche da tarde",
    "🌙 Jantar",
    "🍰 Momento feliz"
  ];

  for (let day of DAYS) {
    const dayRes = await pool.query("INSERT INTO days (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id", [day]);
    const dayId = dayRes.rows[0]?.id || (await pool.query("SELECT id FROM days WHERE name = $1", [day])).rows[0].id;

    for (let meal of MEALS) {
      await pool.query("INSERT INTO meals (dayId, name) VALUES ($1, $2) ON CONFLICT DO NOTHING", [dayId, meal]);
    }
  }
}

export default pool;
