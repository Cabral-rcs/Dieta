"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Food {
  id: string;
  name: string;
  quantity: string;
}

interface Meal {
  id: string;
  name: string;
  foods: Food[];
}

interface DayMeals {
  [key: string]: Meal[];
}

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const MEAL_TYPES = [
  "🌅 Café da manhã",
  "🍎 Lanche da manhã",
  "🍽️ Almoço",
  "🥨 Lanche da tarde",
  "🌙 Jantar",
  "🍰 Momento feliz",
];

const DAY_COLORS: Record<string, string> = {
  Segunda: "from-rose-400 to-pink-500",
  Terça: "from-orange-400 to-amber-500",
  Quarta: "from-yellow-400 to-orange-500",
  Quinta: "from-green-400 to-emerald-500",
  Sexta: "from-blue-400 to-cyan-500",
  Sábado: "from-purple-400 to-violet-500",
  Domingo: "from-indigo-400 to-purple-500",
};

const DAY_EMOJIS: Record<string, string> = {
  Segunda: "💪",
  Terça: "🔥",
  Quarta: "⚡",
  Quinta: "🌟",
  Sexta: "🎉",
  Sábado: "🌈",
  Domingo: "☀️",
};

// Função para inicializar dados a partir da API
const fetchInitialData = async (): Promise<DayMeals> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meals`);
    if (!response.ok) throw new Error("Erro ao buscar dados");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao carregar dados iniciais:", error);
    // Retorna dados iniciais padrão se a API falhar
    const initialData: DayMeals = {};
    DAYS.forEach((day) => {
      initialData[day] = MEAL_TYPES.map((mealType, index) => ({
        id: `${day}-${index}`,
        name: mealType,
        foods: [],
      }));
    });
    initialData["Segunda"] = [
      { id: "1", name: "🌅 Café da manhã", foods: [{ id: "1", name: "Pão integral", quantity: "2 fatias" }] },
      { id: "2", name: "🍎 Lanche da manhã", foods: [] },
      { id: "3", name: "🍽️ Almoço", foods: [{ id: "2", name: "Arroz", quantity: "1 xícara" }] },
      { id: "4", name: "🥨 Lanche da tarde", foods: [] },
      { id: "5", name: "🌙 Jantar", foods: [] },
      { id: "6", name: "🍰 Momento feliz", foods: [] },
    ];
    return initialData;
  }
};

export default function DietOrganizer() {
  const [weekData, setWeekData] = useState<DayMeals>({});
  const [selectedMeal, setSelectedMeal] = useState<{ day: string; mealIndex: number } | null>(null);
  const [newFood, setNewFood] = useState({ name: "", quantity: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchInitialData();
      setWeekData(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const addFood = async () => {
    if (!selectedMeal || !newFood.name || !newFood.quantity) return;

    const { day, mealIndex } = selectedMeal;
    const newFoodItem: Food = {
      id: Date.now().toString(),
      name: newFood.name,
      quantity: newFood.quantity,
    };

    const updatedMeal = {
      ...weekData[day][mealIndex],
      foods: [...weekData[day][mealIndex].foods, newFoodItem],
    };

    setWeekData((prev) => ({
      ...prev,
      [day]: prev[day].map((meal, index) => (index === mealIndex ? updatedMeal : meal)),
    }));

    // Enviar atualização para o backend
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meals/${day}/${mealIndex}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedMeal),
    });

    setNewFood({ name: "", quantity: "" });
  };

  const removeFood = async (day: string, mealIndex: number, foodId: string) => {
    const updatedMeal = {
      ...weekData[day][mealIndex],
      foods: weekData[day][mealIndex].foods.filter((food) => food.id !== foodId),
    };

    setWeekData((prev) => ({
      ...prev,
      [day]: prev[day].map((meal, index) => (index === mealIndex ? updatedMeal : meal)),
    }));

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meals/${day}/${mealIndex}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedMeal),
    });
  };

  const clearDay = async (day: string) => {
    const updatedDay = weekData[day].map((meal) => ({ ...meal, foods: [] }));

    setWeekData((prev) => ({
      ...prev,
      [day]: updatedDay,
    }));

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meals/${day}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedDay),
    });
  };

  const duplicateMeal = async (fromDay: string, mealIndex: number, toDay: string) => {
    const mealToCopy = weekData[fromDay][mealIndex];
    const updatedToDay = weekData[toDay].map((meal, index) =>
      index === mealIndex ? { ...meal, foods: [...mealToCopy.foods] } : meal
    );

    setWeekData((prev) => ({
      ...prev,
      [toDay]: updatedToDay,
    }));

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/meals/${toDay}/${mealIndex}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedToDay[mealIndex]),
    });
  };

  if (loading) return <div className="text-center p-4">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
            🍽️ Organizador de Dieta Semanal 🥗
          </h1>
          <p className="text-lg text-gray-600">Planeje suas refeições com estilo e organização!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
          {DAYS.map((day) => (
            <Card
              key={day}
              className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`bg-gradient-to-r ${DAY_COLORS[day]} rounded-lg px-3 py-2 shadow-md`}>
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                      {DAY_EMOJIS[day]} {day}
                    </CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearDay(day)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {weekData[day]?.map((meal, mealIndex) => (
                  <div
                    key={meal.id}
                    className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-4 shadow-md border border-gray-100"
                  >
                    <h3 className="font-semibold text-gray-700 mb-3 text-sm">{meal.name}</h3>

                    <div className="space-y-2 mb-3">
                      {meal.foods.map((food) => (
                        <div
                          key={food.id}
                          className="flex items-center justify-between bg-white rounded-lg p-2 shadow-sm border border-gray-100"
                        >
                          <span className="text-gray-800 font-medium text-sm">
                            🥄 {food.name} - <span className="text-blue-600">{food.quantity}</span>
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFood(day, mealIndex, food.id)}
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedMeal({ day, mealIndex })}
                            className="flex-1 text-xs bg-gradient-to-r from-green-400 to-blue-500 text-white border-0 hover:from-green-500 hover:to-blue-600 shadow-md"
                          >
                            <Plus className="h-3 w-3 mr-1" />➕ Adicionar
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="bg-gradient-to-br from-white to-blue-50">
                          <DialogHeader>
                            <DialogTitle className="text-gray-800">
                              🍴 Adicionar alimento - {meal.name} ({day})
                            </DialogTitle>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="food-name" className="text-gray-700 font-medium">
                                🥘 Nome do alimento
                              </Label>
                              <Input
                                id="food-name"
                                value={newFood.name}
                                onChange={(e) => setNewFood((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="Ex: Pão integral, Banana, Frango grelhado..."
                                className="border-gray-200 focus:border-blue-400"
                              />
                            </div>

                            <div>
                              <Label htmlFor="food-quantity" className="text-gray-700 font-medium">
                                📏 Quantidade
                              </Label>
                              <Input
                                id="food-quantity"
                                value={newFood.quantity}
                                onChange={(e) => setNewFood((prev) => ({ ...prev, quantity: e.target.value }))}
                                placeholder="Ex: 2 fatias, 200g, 1 xícara, 1 unidade..."
                                className="border-gray-200 focus:border-blue-400"
                              />
                            </div>

                            <Button
                              onClick={addFood}
                              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                            >
                              ✨ Adicionar Alimento
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="bg-gradient-to-br from-white to-purple-50">
                          <DialogHeader>
                            <DialogTitle className="text-gray-800">📋 Duplicar {meal.name} para outro dia</DialogTitle>
                          </DialogHeader>

                          <div className="grid grid-cols-2 gap-3">
                            {DAYS.filter((d) => d !== day).map((targetDay) => (
                              <Button
                                key={targetDay}
                                variant="outline"
                                onClick={() => duplicateMeal(day, mealIndex, targetDay)}
                                className={`text-sm bg-gradient-to-r ${DAY_COLORS[targetDay]} text-white border-0 hover:scale-105 transition-transform shadow-md`}
                              >
                                {DAY_EMOJIS[targetDay]} {targetDay}
                              </Button>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}