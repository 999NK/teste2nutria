import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CustomFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (food: {
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => void;
}

// Unit conversion constants (approximate values)
const UNIT_CONVERSIONS = {
  'unidades': 1,
  'gramas': 1,
  'colheres': 15, // 1 colher = 15g
  'xicaras': 240, // 1 xícara = 240ml/g
  'copos': 200, // 1 copo = 200ml
  'fatias': 25, // 1 fatia média = 25g
  'ml': 1,
  'litros': 1000,
};

export function CustomFoodModal({ isOpen, onClose, onAdd }: CustomFoodModalProps) {
  const [foodData, setFoodData] = useState({
    name: "",
    quantity: "",
    unit: "unidades",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const resetForm = () => {
    setFoodData({
      name: "",
      quantity: "",
      unit: "unidades",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAdd = () => {
    // Validate required fields
    if (!foodData.name.trim()) {
      return;
    }

    const quantity = parseFloat(foodData.quantity) || 0;
    const calories = parseFloat(foodData.calories) || 0;
    const protein = parseFloat(foodData.protein) || 0;
    const carbs = parseFloat(foodData.carbs) || 0;
    const fat = parseFloat(foodData.fat) || 0;

    if (quantity <= 0) {
      return;
    }

    onAdd({
      name: foodData.name.trim(),
      quantity,
      unit: foodData.unit,
      calories,
      protein,
      carbs,
      fat,
    });

    resetForm();
  };

  const unitOptions = [
    { value: "unidades", label: "Unidades" },
    { value: "gramas", label: "Gramas (g)" },
    { value: "colheres", label: "Colheres (15g)" },
    { value: "xicaras", label: "Xícaras (240ml)" },
    { value: "copos", label: "Copos (200ml)" },
    { value: "fatias", label: "Fatias (25g)" },
    { value: "ml", label: "Mililitros (ml)" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-4 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Alimento Personalizado</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
            >
              <i className="fas fa-times text-gray-500"></i>
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Food Name */}
          <div>
            <Label htmlFor="food-name">Nome do Alimento *</Label>
            <Input
              id="food-name"
              placeholder="Ex: Bolacha Danix"
              value={foodData.name}
              onChange={(e) => setFoodData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="4"
                value={foodData.quantity}
                onChange={(e) => setFoodData(prev => ({ ...prev, quantity: e.target.value }))}
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unidade</Label>
              <Select
                value={foodData.unit}
                onValueChange={(value) => setFoodData(prev => ({ ...prev, unit: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Nutritional Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="calories">Calorias (kcal)</Label>
              <Input
                id="calories"
                type="number"
                placeholder="300"
                value={foodData.calories}
                onChange={(e) => setFoodData(prev => ({ ...prev, calories: e.target.value }))}
                min="0"
                step="1"
              />
            </div>
            <div>
              <Label htmlFor="protein">Proteína (g)</Label>
              <Input
                id="protein"
                type="number"
                placeholder="10"
                value={foodData.protein}
                onChange={(e) => setFoodData(prev => ({ ...prev, protein: e.target.value }))}
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="carbs">Carboidratos (g)</Label>
              <Input
                id="carbs"
                type="number"
                placeholder="140"
                value={foodData.carbs}
                onChange={(e) => setFoodData(prev => ({ ...prev, carbs: e.target.value }))}
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <Label htmlFor="fat">Gordura (g)</Label>
              <Input
                id="fat"
                type="number"
                placeholder="5"
                value={foodData.fat}
                onChange={(e) => setFoodData(prev => ({ ...prev, fat: e.target.value }))}
                min="0"
                step="0.1"
              />
            </div>
          </div>

          {/* Unit Reference */}
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <p className="font-medium mb-1">Referência de unidades:</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <span>• 1 colher ≈ 15g</span>
              <span>• 1 xícara ≈ 240ml</span>
              <span>• 1 copo ≈ 200ml</span>
              <span>• 1 fatia ≈ 25g</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleAdd}
              disabled={!foodData.name.trim() || !foodData.quantity || parseFloat(foodData.quantity) <= 0}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
