import express from "express";
import cors from "cors";
import pool, { initDB } from "./db.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Inicializar banco
initDB();

// Buscar refeições de um dia
app.get("/meals/:day", async (req, res) => {
  const { day } = req.params;

  const dayRow = await pool.query("SELECT * FROM days WHERE name = $1", [day]);
  if (dayRow.rows.length === 0) return res.json({ meals: [] });

  const meals = await pool.query("SELECT * FROM meals WHERE dayId = $1", [dayRow.rows[0].id]);

  for (let meal of meals.rows) {
    const foods = await pool.query("SELECT * FROM foods WHERE mealId = $1", [meal.id]);
    meal.foods = foods.rows;
  }

  res.json({ day, meals: meals.rows });
});

// Adicionar alimento
app.post("/meals/:day/:mealId/foods", async (req, res) => {
  const { mealId } = req.params;
  const { name, quantity } = req.body;

  await pool.query("INSERT INTO foods (mealId, name, quantity) VALUES ($1, $2, $3)", [
    mealId,
    name,
    quantity
  ]);

  res.json({ message: "Alimento adicionado" });
});

// Remover alimento
app.delete("/meals/:day/:mealId/:foodId", async (req, res) => {
  const { foodId } = req.params;

  await pool.query("DELETE FROM foods WHERE id = $1", [foodId]);

  res.json({ message: "Alimento removido" });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});