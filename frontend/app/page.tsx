"use client";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const mealTypes = [
  { name: "Café da manhã", emoji: "☕" },
  { name: "Lanche da manhã", emoji: "🍎" },
  { name: "Almoço", emoji: "🍲" },
  { name: "Lanche da tarde", emoji: "🥪" },
  { name: "Jantar", emoji: "🍽️" },
  { name: "Momento feliz", emoji: "🍫" },
];

const dayClasses = [
  "bg-monday", "bg-tuesday", "bg-wednesday", "bg-thursday", "bg-friday", "bg-saturday", "bg-sunday"
];

export default function Home() {
  const [mealsByDay, setMealsByDay] = useState({});
  const [newFood, setNewFood] = useState({ day: "", meal_type: "", food_name: "", quantity: "" });

  useEffect(() => {
    days.forEach(day => fetchMeals(day));
  }, []);

  const fetchMeals = async (day) => {
    try {
      const res = await fetch(`${API_URL}/meals/${day}`);
      if (!res.ok) throw new Error(`Erro ao buscar refeições para ${day}: ${res.status}`);
      const data = await res.json();
      setMealsByDay(prev => ({ ...prev, [day]: data }));
    } catch (error) {
      console.error(error);
      setMealsByDay(prev => ({ ...prev, [day]: [] })); // Fallback para array vazio
    }
  };

  const addMeal = async () => {
    await fetch(`${API_URL}/meals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newFood),
    });
    fetchMeals(newFood.day);
    setNewFood({ day: "", meal_type: "", food_name: "", quantity: "" });
  };

  const removeMeal = async (id, day) => {
    await fetch(`${API_URL}/meals/${id}`, { method: "DELETE" });
    fetchMeals(day);
  };

  const clearDay = async (day) => {
    await fetch(`${API_URL}/meals/day/${day}`, { method: "DELETE" });
    fetchMeals(day);
  };

  const duplicateDay = async (fromDay, toDay) => {
    const fromMeals = mealsByDay[fromDay] || [];
    for (const meal of fromMeals) {
      await fetch(`${API_URL}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...meal, day: toDay }),
      });
    }
    fetchMeals(toDay);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8">Planejador de Dieta Semanal 🌟</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
        {days.map((day, idx) => (
          <div key={day} className={`card ${dayClasses[idx]}`}>
            <h2 className="text-xl font-semibold mb-4">{day} 📅</h2>
            {mealTypes.map((type) => (
              <div key={type.name} className="meal-section">
                <h3 className="meal-title">{type.emoji} {type.name}</h3>
                <ul className="meal-list">
                  {(mealsByDay[day] || []).filter(m => m.meal_type === type.name).map((m: any) => (
                    <li key={m.id} className="meal-item">
                      <span className="flex-1">{m.food_name} ({m.quantity})</span>
                      <button onClick={() => removeMeal(m.id, day)} className="text-red-300 hover:text-red-100">❌</button>
                    </li>
                  ))}
                </ul>
                <div className="add-form">
                  <input
                    placeholder="Nome do alimento"
                    value={newFood.food_name}
                    onChange={e => setNewFood({ ...newFood, day, meal_type: type.name, food_name: e.target.value })}
                    className="input-field"
                  />
                  <input
                    placeholder="Quantidade (ex: 200g)"
                    value={newFood.quantity}
                    onChange={e => setNewFood({ ...newFood, quantity: e.target.value })}
                    className="input-field"
                  />
                  <button onClick={addMeal} className="button">➕</button>
                </div>
              </div>
            ))}
            <div className="mt-4 flex justify-between items-center">
              <button onClick={() => clearDay(day)} className="clear-button">Limpar Dia 🗑️</button>
              <select onChange={e => duplicateDay(day, e.target.value)} className="duplicate-select">
                <option>Duplicar para...</option>
                {days.filter(d => d !== day).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}