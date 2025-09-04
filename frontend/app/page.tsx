"use client";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function Home() {
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/meals/Segunda`)
      .then((res) => res.json())
      .then(setMeals);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dieta da Semana</h1>
      <ul>
        {meals.map((m: any) => (
          <li key={m.id}>
            {m.meal_type}: {m.food_name} ({m.quantity})
          </li>
        ))}
      </ul>
    </div>
  );
}