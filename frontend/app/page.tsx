"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Plus } from 'lucide-react'

interface Food {
  id: string
  name: string
  quantity: string
}

interface Meal {
  id: string
  name: string
  foods: Food[]
}

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]

export default function Home() {
  const [data, setData] = useState<Record<string, Meal[]>>({})
  const API_URL = "https://diet-backend.onrender.com" // 🔗 troque pelo link do Render

  useEffect(() => {
    async function fetchData() {
      const allData: Record<string, Meal[]> = {}
      for (let day of DAYS) {
        const res = await fetch(`${API_URL}/meals/${day}`)
        const json = await res.json()
        allData[day] = json.meals
      }
      setData(allData)
    }
    fetchData()
  }, [])

  async function addFood(day: string, mealId: string, name: string, quantity: string) {
    await fetch(`${API_URL}/meals/${day}/${mealId}/foods`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, quantity })
    })
    // recarregar
    const res = await fetch(`${API_URL}/meals/${day}`)
    const json = await res.json()
    setData(prev => ({ ...prev, [day]: json.meals }))
  }

  async function removeFood(day: string, mealId: string, foodId: string) {
    await fetch(`${API_URL}/meals/${day}/${mealId}/${foodId}`, { method: "DELETE" })
    const res = await fetch(`${API_URL}/meals/${day}`)
    const json = await res.json()
    setData(prev => ({ ...prev, [day]: json.meals }))
  }

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      {DAYS.map(day => (
        <div key={day} className="space-y-4">
          <h2 className="text-xl font-bold">{day}</h2>
          {data[day]?.map(meal => (
            <Card key={meal.id}>
              <CardHeader>
                <CardTitle>{meal.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {meal.foods?.map(food => (
                  <div key={food.id} className="flex justify-between items-center">
                    <span>{food.name} - {food.quantity}</span>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeFood(day, meal.id, food.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
                <FoodForm onAdd={(name, qty) => addFood(day, meal.id, name, qty)} />
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
}

function FoodForm({ onAdd }: { onAdd: (name: string, qty: string) => void }) {
  const [name, setName] = useState("")
  const [qty, setQty] = useState("")

  return (
    <div className="flex gap-2 items-end">
      <div>
        <Label>Alimento</Label>
        <Input value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <Label>Qtd.</Label>
        <Input value={qty} onChange={e => setQty(e.target.value)} />
      </div>
      <Button onClick={() => { onAdd(name, qty); setName(""); setQty(""); }}>
        <Plus size={16} />
      </Button>
    </div>
  )
}