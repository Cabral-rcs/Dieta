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

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend rodando na porta ${port}`));