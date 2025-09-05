import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { query, initDB } from "./db.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

await initDB();

// GET refeições de um dia
app.get("/meals/:day", async (req, res) => {
  const { day } = req.params;
  const result = await query("SELECT * FROM meals WHERE day = $1", [day]);
  res.json(result.rows);
});

// POST adicionar refeição
app.post("/meals", async (req, res) => {
  const { day, meal_type, food_name, quantity } = req.body;
  const result = await query(
    "INSERT INTO meals (day, meal_type, food_name, quantity) VALUES ($1,$2,$3,$4) RETURNING *",
    [day, meal_type, food_name, quantity]
  );
  res.json(result.rows[0]);
});

// DELETE refeição específica por ID
app.delete("/meals/:id", async (req, res) => {
  const { id } = req.params;
  await query("DELETE FROM meals WHERE id = $1", [id]);
  res.sendStatus(204);
});

// DELETE todas as refeições de um dia (limpar dia)
app.delete("/meals/day/:day", async (req, res) => {
  const { day } = req.params;
  await query("DELETE FROM meals WHERE day = $1", [day]);
  res.sendStatus(204);
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend rodando na porta ${port}`));