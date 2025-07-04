import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

const UNIT_OPTIONS = [
  { value: "g", label: "gramas", multiplier: 1 },
  { value: "kg", label: "quilogramas", multiplier: 1000 },
  { value: "ml", label: "mililitros", multiplier: 1 },
  { value: "l", label: "litros", multiplier: 1000 },
  { value: "colher-sopa", label: "colheres de sopa", multiplier: 15 },
  { value: "colher-cha", label: "colheres de chá", multiplier: 5 },
  { value: "xicara", label: "xícaras", multiplier: 240 },
  { value: "copo", label: "copos", multiplier: 200 },
  { value: "unidade", label: "unidades", multiplier: 1 },
  { value: "fatia", label: "fatias", multiplier: 30 },
  { value: "porcao", label: "porções", multiplier: 100 },
];

interface CustomFoodFormProps {
  onAddFood: (food: {
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => void;
}

export function CustomFoodForm({ onAddFood }: CustomFoodFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState("g");
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    onAddFood({
      name: name.trim(),
      quantity,
      unit,
      calories,
      protein,
      carbs,
      fat,
    });

    // Reset form
    setName("");
    setQuantity(100);
    setUnit("g");
    setCalories(0);
    setProtein(0);
    setCarbs(0);
    setFat(0);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full border-dashed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Alimento Manual
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Adicionar Alimento Manual</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="food-name">Nome do Alimento</Label>
            <Input
              id="food-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Arroz integral cozido"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
                required
              />
            </div>
            <div>
              <Label htmlFor="unit">Unidade</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="calories">Calorias (kcal)</Label>
              <Input
                id="calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
                required
              />
            </div>
            <div>
              <Label htmlFor="protein">Proteína (g)</Label>
              <Input
                id="protein"
                type="number"
                value={protein}
                onChange={(e) => setProtein(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="carbs">Carboidratos (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
                required
              />
            </div>
            <div>
              <Label htmlFor="fat">Gorduras (g)</Label>
              <Input
                id="fat"
                type="number"
                value={fat}
                onChange={(e) => setFat(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.1"
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Adicionar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}