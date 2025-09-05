// backend/server.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import crypto from "crypto";

dotenv.config();

const PORT = process.env.PORT || 10000;
const ORIGIN = process.env.CORS_ORIGIN || "https://dieta-frontend.onrender.com";

const useDb = !!process.env.DATABASE_URL;

let db;
if (useDb) {
  // import dinamicamente para evitar erro quando não há DATABASE_URL
  db = await import("./db.js");
  try {
    await db.migrate();
    console.log("Migração/DB OK");
  } catch (e) {
    console.error("Erro na migração:", e);
    process.exit(1);
  }
} else {
  console.warn("DATABASE_URL não definido — usando fallback em arquivo (/tmp/meals.json).");
}

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: ORIGIN }));
app.use(express.json({ limit: "1mb" }));

// fallback store file
const filePath = "/tmp/meals.json";
function readStore() {
  try {
    if (!fs.existsSync(filePath)) return {};
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
function writeStore(obj) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(obj));
  } catch (e) {
    console.error("Erro escrevendo fallback file:", e);
  }
}

// default DAYS & MEAL_TYPES (mesmo que o frontend usa — caso queira seeds)
const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

app.get("/health", (_req, res) => {
  res.json({ ok: true, db: useDb ? "postgres" : "file" });
});

// GET /meals -> retorna objeto { "Segunda": [...], ... }
app.get("/meals", async (req, res) => {
  try {
    if (!useDb) {
      const store = readStore();
      return res.json(store);
    }
    const all = await db.getAllDays(); // retorna { day: data }
    // garantir que todas as DAYS existem (pelo menos arrays vazios)
    DAYS.forEach((d) => {
      if (!all[d]) all[d] = []; // frontend aguenta arrays vazios
    });
    return res.json(all);
  } catch (err) {
    console.error("GET /meals error:", err);
    res.status(500).json({ error: "Erro ao listar meals" });
  }
});

// PUT /meals/:day -> body: array de meals (substitui dia inteiro)
app.put("/meals/:day", async (req, res) => {
  try {
    const { day } = req.params;
    const payload = req.body;
    if (!Array.isArray(payload)) {
      return res.status(400).json({ error: "Payload deve ser um array de meals" });
    }
    if (!DAYS.includes(day)) {
      // aceita qualquer string, mas informa caso incomum
      console.warn("Dia desconhecido:", day);
    }

    if (!useDb) {
      const store = readStore();
      store[day] = payload;
      writeStore(store);
      return res.json({ day, data: payload });
    }

    const row = await db.upsertDay(day, payload);
    return res.json({ day: row.day, data: row.data });
  } catch (err) {
    console.error("PUT /meals/:day error:", err);
    res.status(500).json({ error: "Erro ao atualizar dia" });
  }
});

// PUT /meals/:day/:mealIndex -> body: meal object (substitui meal no índice)
app.put("/meals/:day/:mealIndex", async (req, res) => {
  try {
    const { day, mealIndex } = req.params;
    const index = Number(mealIndex);
    if (Number.isNaN(index)) return res.status(400).json({ error: "mealIndex inválido" });

    const incomingMeal = req.body;
    if (!incomingMeal || typeof incomingMeal !== "object") {
      return res.status(400).json({ error: "Payload inválido - enviar meal object" });
    }

    if (!useDb) {
      const store = readStore();
      const dayArr = store[day] || [];
      if (index < 0 || index >= dayArr.length) {
        return res.status(400).json({ error: "Índice fora do intervalo" });
      }
      // Substitui
      dayArr[index] = incomingMeal;
      store[day] = dayArr;
      writeStore(store);
      return res.json({ day, index, data: incomingMeal });
    }

    // com DB: buscar dia, modificar o índice, upsert
    const current = await db.getDay(day);
    const arr = Array.isArray(current) ? current : [];

    if (index < 0 || index >= arr.length) {
      return res.status(400).json({ error: "Índice fora do intervalo" });
    }

    arr[index] = incomingMeal;
    const row = await db.upsertDay(day, arr);
    return res.json({ day: row.day, data: row.data });
  } catch (err) {
    console.error("PUT /meals/:day/:mealIndex error:", err);
    res.status(500).json({ error: "Erro ao atualizar meal" });
  }
});

// Optional: POST /meals to create day (não obrigatório pro seu frontend)
app.post("/meals/:day", async (req, res) => {
  try {
    const { day } = req.params;
    const payload = req.body; // espera array
    if (!Array.isArray(payload)) return res.status(400).json({ error: "Payload deve ser array" });

    if (!useDb) {
      const store = readStore();
      store[day] = payload;
      writeStore(store);
      return res.status(201).json({ day });
    }

    const row = await db.upsertDay(day, payload);
    res.status(201).json({ day: row.day });
  } catch (err) {
    console.error("POST /meals/:day error:", err);
    res.status(500).json({ error: "Erro ao criar dia" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT} (useDb=${useDb})`);
});