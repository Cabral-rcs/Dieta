"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, Plus, Copy, Wifi, WifiOff, Calendar, Clock } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

const weekdays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]
const weekends = ["Sábado", "Domingo"]
const allDays = [...weekdays, ...weekends]

const dayColors = {
  Segunda: "border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100",
  Terça: "border-green-300 bg-gradient-to-br from-green-50 to-green-100",
  Quarta: "border-purple-300 bg-gradient-to-br from-purple-50 to-purple-100",
  Quinta: "border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100",
  Sexta: "border-pink-300 bg-gradient-to-br from-pink-50 to-pink-100",
  Sábado: "border-indigo-300 bg-gradient-to-br from-indigo-50 to-indigo-100",
  Domingo: "border-red-300 bg-gradient-to-br from-red-50 to-red-100",
}

const mealTypes = [
  { name: "Café da manhã", emoji: "☕", color: "bg-amber-50 border-amber-200 text-amber-800" },
  { name: "Lanche da manhã", emoji: "🍎", color: "bg-green-50 border-green-200 text-green-800" },
  { name: "Almoço", emoji: "🍲", color: "bg-orange-50 border-orange-200 text-orange-800" },
  { name: "Lanche da tarde", emoji: "🥪", color: "bg-blue-50 border-blue-200 text-blue-800" },
  { name: "Jantar", emoji: "🍽️", color: "bg-purple-50 border-purple-200 text-purple-800" },
  { name: "Momento feliz", emoji: "🍫", color: "bg-pink-50 border-pink-200 text-pink-800" },
]

const sampleMeals = {
  Segunda: [
    { id: 1, food_name: "Aveia com frutas vermelhas", quantity: "1 tigela (200g)", meal_type: "Café da manhã" },
    { id: 2, food_name: "Banana nanica", quantity: "1 unidade média", meal_type: "Lanche da manhã" },
    { id: 3, food_name: "Frango grelhado com quinoa", quantity: "150g + 100g", meal_type: "Almoço" },
    { id: 4, food_name: "Iogurte grego natural", quantity: "1 pote (170g)", meal_type: "Lanche da tarde" },
    { id: 5, food_name: "Salmão com brócolis", quantity: "120g + 150g", meal_type: "Jantar" },
  ],
  Terça: [
    { id: 6, food_name: "Pão integral com abacate", quantity: "2 fatias + 1/2 abacate", meal_type: "Café da manhã" },
    { id: 7, food_name: "Mix de castanhas", quantity: "30g", meal_type: "Lanche da manhã" },
    { id: 8, food_name: "Salada de grão-de-bico", quantity: "1 prato fundo", meal_type: "Almoço" },
  ],
}

export default function Home() {
  const [mealsByDay, setMealsByDay] = useState({})
  const [newFood, setNewFood] = useState({ day: "", meal_type: "", food_name: "", quantity: "" })
  const [duplicateFrom, setDuplicateFrom] = useState("")
  const [duplicateTo, setDuplicateTo] = useState("")
  const [isOnline, setIsOnline] = useState(false)
  const [nextId, setNextId] = useState(100)
  const [duplicateDialog, setDuplicateDialog] = useState({ open: false, meal: null, sourceDay: "" })
  const [duplicateDestination, setDuplicateDestination] = useState({ day: "", mealType: "" })

  const checkApiAndLoadData = async () => {
    try {
      const res = await fetch(`${API_URL}/meals/Segunda`)
      if (res.ok) {
        setIsOnline(true)
        allDays.forEach((day) => fetchMeals(day))
      } else {
        throw new Error("API não disponível")
      }
    } catch (error) {
      console.log("API não disponível, usando dados de exemplo")
      setIsOnline(false)
      setMealsByDay(sampleMeals)
    }
  }

  const fetchMeals = async (day) => {
    if (!isOnline) return

    try {
      const res = await fetch(`${API_URL}/meals/${day}`)
      if (!res.ok) throw new Error(`Erro ao buscar refeições para ${day}: ${res.status}`)
      const data = await res.json()
      setMealsByDay((prev) => ({ ...prev, [day]: data }))
    } catch (error) {
      console.error(error)
      setMealsByDay((prev) => ({ ...prev, [day]: [] }))
    }
  }

  const addMeal = async () => {
    if (!newFood.food_name || !newFood.quantity || !newFood.day || !newFood.meal_type) return

    if (!isOnline) {
      const newMeal = {
        id: nextId,
        food_name: newFood.food_name,
        quantity: newFood.quantity,
        meal_type: newFood.meal_type,
      }

      setMealsByDay((prev) => ({
        ...prev,
        [newFood.day]: [...(prev[newFood.day] || []), newMeal],
      }))

      setNextId((prev) => prev + 1)
      setNewFood({ day: "", meal_type: "", food_name: "", quantity: "" })
      return
    }

    try {
      await fetch(`${API_URL}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFood),
      })
      fetchMeals(newFood.day)
      setNewFood({ day: "", meal_type: "", food_name: "", quantity: "" })
    } catch (error) {
      console.error("Erro ao adicionar refeição:", error)
    }
  }

  const removeMeal = async (id, day) => {
    if (!isOnline) {
      setMealsByDay((prev) => ({
        ...prev,
        [day]: (prev[day] || []).filter((meal) => meal.id !== id),
      }))
      return
    }

    try {
      await fetch(`${API_URL}/meals/${id}`, { method: "DELETE" })
      fetchMeals(day)
    } catch (error) {
      console.error("Erro ao remover refeição:", error)
    }
  }

  const clearDay = async (day) => {
    if (!isOnline) {
      setMealsByDay((prev) => ({
        ...prev,
        [day]: [],
      }))
      return
    }

    try {
      await fetch(`${API_URL}/meals/day/${day}`, { method: "DELETE" })
      fetchMeals(day)
    } catch (error) {
      console.error("Erro ao limpar dia:", error)
    }
  }

  const duplicateMeal = async (meal, sourceDay, destinationDay, destinationMealType) => {
    if (!isOnline) {
      const duplicatedMeal = {
        ...meal,
        id: nextId,
        meal_type: destinationMealType,
      }

      setMealsByDay((prev) => ({
        ...prev,
        [destinationDay]: [...(prev[destinationDay] || []), duplicatedMeal],
      }))

      setNextId((prev) => prev + 1)
      return
    }

    try {
      await fetch(`${API_URL}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...meal,
          day: destinationDay,
          meal_type: destinationMealType,
        }),
      })
      fetchMeals(destinationDay)
    } catch (error) {
      console.error("Erro ao duplicar refeição:", error)
    }
  }

  const handleDuplicateClick = (meal, sourceDay) => {
    setDuplicateDialog({ open: true, meal, sourceDay })
    setDuplicateDestination({ day: "", mealType: "" })
  }

  const confirmDuplicate = () => {
    if (duplicateDestination.day && duplicateDestination.mealType && duplicateDialog.meal) {
      duplicateMeal(
        duplicateDialog.meal,
        duplicateDialog.sourceDay,
        duplicateDestination.day,
        duplicateDestination.mealType,
      )
      setDuplicateDialog({ open: false, meal: null, sourceDay: "" })
      setDuplicateDestination({ day: "", mealType: "" })
    }
  }

  const DayCard = ({ day, isWeekend = false }) => (
    <Card
      className={`bg-card border-2 shadow-lg hover:shadow-xl transition-all duration-300 ${
        dayColors[day] ||
        (isWeekend
          ? "border-secondary/30 bg-gradient-to-br from-card to-secondary/5"
          : "border-primary/20 bg-gradient-to-br from-card to-primary/5")
      }`}
    >
      <CardHeader className="pb-4 border-b border-border/50">
        <CardTitle className="flex items-center justify-between text-card-foreground">
          <span className="flex items-center gap-3 text-lg font-semibold">
            {isWeekend ? <Calendar className="w-5 h-5 text-secondary" /> : <Clock className="w-5 h-5 text-primary" />}
            {day}
          </span>
          <Badge variant="outline" className="text-xs font-medium">
            {(mealsByDay[day] || []).length} refeições
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {mealTypes.map((type) => {
          const dayMeals = (mealsByDay[day] || []).filter((m) => m.meal_type === type.name)

          return (
            <div key={type.name} className={`rounded-xl border-2 border-dashed p-4 transition-colors ${type.color}`}>
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <span className="text-lg">{type.emoji}</span>
                <span>{type.name}</span>
              </h3>

              <div className="space-y-3 mb-4">
                {dayMeals.map((meal: any) => (
                  <div
                    key={meal.id}
                    className="flex items-start justify-between bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-border/50 shadow-sm"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-medium text-foreground text-sm leading-tight mb-1">{meal.food_name}</div>
                      <div className="text-muted-foreground text-xs">{meal.quantity}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDuplicateClick(meal, day)}
                        className="text-primary hover:text-primary-foreground hover:bg-primary/10 p-2 h-auto"
                        title="Duplicar refeição"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeMeal(meal.id, day)}
                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10 p-2 h-auto"
                        title="Remover refeição"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Nome do alimento"
                  value={newFood.day === day && newFood.meal_type === type.name ? newFood.food_name : ""}
                  onChange={(e) => setNewFood({ ...newFood, day, meal_type: type.name, food_name: e.target.value })}
                  className="text-sm h-9 bg-background/60 border-border/50"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Quantidade (ex: 200g)"
                    value={newFood.day === day && newFood.meal_type === type.name ? newFood.quantity : ""}
                    onChange={(e) => setNewFood({ ...newFood, quantity: e.target.value })}
                    className="text-sm h-9 flex-1 bg-background/60 border-border/50"
                  />
                  <Button
                    size="sm"
                    onClick={addMeal}
                    disabled={
                      !newFood.food_name || !newFood.quantity || newFood.day !== day || newFood.meal_type !== type.name
                    }
                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-4"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}

        <Button
          variant="outline"
          onClick={() => clearDay(day)}
          className="w-full mt-6 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 h-auto py-3 px-4"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Limpar Todas as Refeições</span>
        </Button>
      </CardContent>
    </Card>
  )

  useEffect(() => {
    checkApiAndLoadData()
  }, [])

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 text-balance">
            Planejador de Dieta Semanal
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
            Organize suas refeições de forma inteligente e saudável para uma vida mais equilibrada
          </p>

          <div className="flex items-center justify-center gap-2 mt-4">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">Conectado à API</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-secondary" />
                <span className="text-sm text-secondary font-medium">Modo demonstração (dados locais)</span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Dias da Semana</h2>
              <div className="flex-1 h-px bg-border"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {weekdays.map((day) => (
                <DayCard key={day} day={day} isWeekend={false} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-secondary" />
              <h2 className="text-2xl font-bold text-foreground">Final de Semana</h2>
              <div className="flex-1 h-px bg-border"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {weekends.map((day) => (
                <DayCard key={day} day={day} isWeekend={true} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={duplicateDialog.open} onOpenChange={(open) => setDuplicateDialog({ ...duplicateDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="w-5 h-5 text-primary" />
              Duplicar Refeição
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Alimento:</label>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium text-sm">{duplicateDialog.meal?.food_name}</div>
                <div className="text-xs text-muted-foreground">{duplicateDialog.meal?.quantity}</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Dia de destino:</label>
              <Select
                value={duplicateDestination.day}
                onValueChange={(value) => setDuplicateDestination({ ...duplicateDestination, day: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {allDays.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tipo de refeição:</label>
              <Select
                value={duplicateDestination.mealType}
                onValueChange={(value) => setDuplicateDestination({ ...duplicateDestination, mealType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a refeição" />
                </SelectTrigger>
                <SelectContent>
                  {mealTypes.map((type) => (
                    <SelectItem key={type.name} value={type.name}>
                      <span className="flex items-center gap-2">
                        <span>{type.emoji}</span>
                        <span>{type.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setDuplicateDialog({ open: false, meal: null, sourceDay: "" })}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmDuplicate}
                disabled={!duplicateDestination.day || !duplicateDestination.mealType}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}