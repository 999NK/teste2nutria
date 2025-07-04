import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Food {
  id?: number;
  usdaFdcId?: number;
  name: string;
  brand?: string;
  category?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  isCustom?: boolean;
}

interface FoodDropdownSearchProps {
  onAddFood: (food: Food & { 
    quantity: number; 
    unit: string; 
    calories: number; 
    protein: number; 
    carbs: number; 
    fat: number; 
  }) => void;
}

const UNIT_OPTIONS = [
  { value: "g", label: "Gramas (g)", multiplier: 1 },
  { value: "ml", label: "Mililitros (ml)", multiplier: 1 },
  { value: "colher_sopa", label: "Colher de sopa", multiplier: 15 },
  { value: "colher_cha", label: "Colher de chá", multiplier: 5 },
  { value: "xicara", label: "Xícara", multiplier: 240 },
  { value: "copo", label: "Copo (200ml)", multiplier: 200 },
  { value: "unidade", label: "Unidade", multiplier: 100 },
  { value: "fatia", label: "Fatia", multiplier: 30 },
  { value: "porcao", label: "Porção", multiplier: 150 },
];

export function FoodDropdownSearch({ onAddFood }: FoodDropdownSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState("g");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Debounce search query with validation
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchQuery.trim();
      if (trimmed.length >= 3) {
        setDebouncedQuery(trimmed);
      } else {
        setDebouncedQuery("");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search foods manually to prevent empty queries
  const [foods, setFoods] = useState<Food[]>([]);
  const [usdaFoods, setUsdaFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Manual search function
  const performSearch = async (query: string) => {
    const trimmedQuery = query?.trim() || "";

    if (!trimmedQuery || trimmedQuery.length < 3) {
      setFoods([]);
      setUsdaFoods([]);
      return;
    }

    setIsLoading(true);
    try {
      // Search user foods
      const userResponse = await fetch(`/api/foods?search=${encodeURIComponent(trimmedQuery)}`, {
        credentials: "include"
      });
      const userFoods = userResponse.ok ? await userResponse.json() : [];

      // Search USDA foods
      const usdaResponse = await fetch(`/api/foods/search?query=${encodeURIComponent(trimmedQuery)}`, {
        credentials: "include"
      });
      const usdaResults = usdaResponse.ok ? await usdaResponse.json() : [];

      setFoods(userFoods);
      setUsdaFoods(usdaResults);
    } catch (error) {
      console.error("Search error:", error);
      setFoods([]);
      setUsdaFoods([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger search when debounced query changes
  useEffect(() => {
    // Only perform search if query is valid, not empty, and user has interacted
    if (hasUserInteracted && debouncedQuery && debouncedQuery.trim().length >= 3) {
      performSearch(debouncedQuery);
    } else {
      setFoods([]);
      setUsdaFoods([]);
    }
  }, [debouncedQuery, hasUserInteracted]);

  // Combine both food sources
  const allFoods = [...(foods as Food[]), ...(usdaFoods as Food[])];

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    setOpen(false);
  };

  const handleAddFood = () => {
    if (!selectedFood) return;

    // Get unit multiplier
    const unitOption = UNIT_OPTIONS.find(opt => opt.value === unit);
    const multiplier = unitOption ? (quantity * unitOption.multiplier) / 100 : quantity / 100;

    const foodWithNutrition = {
      ...selectedFood,
      quantity,
      unit,
      calories: Math.round(selectedFood.caloriesPer100g * multiplier),
      protein: Math.round(selectedFood.proteinPer100g * multiplier),
      carbs: Math.round(selectedFood.carbsPer100g * multiplier),
      fat: Math.round(selectedFood.fatPer100g * multiplier),
    };

    onAddFood(foodWithNutrition);

    // Reset form
    setSelectedFood(null);
    setSearchQuery("");
    setQuantity(100);
    setUnit("g");
  };

  return (
    <div className="space-y-4">
      {/* Food Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Buscar Alimento</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedFood ? selectedFood.name : "Busque por alimentos..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Digite o nome do alimento..."
                value={searchQuery}
                onValueChange={(value) => {
                  setSearchQuery(value);
                  if (value.length > 0) {
                    setHasUserInteracted(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    performSearch(searchQuery);
                  }
                }}
              />
              <CommandList>
                <CommandEmpty>
                  {isLoading ? "Buscando..." : "Nenhum alimento encontrado."}
                </CommandEmpty>

                {allFoods.length > 0 && (
                  <CommandGroup heading="Alimentos">
                    {allFoods.slice(0, 10).map((food, index) => (
                      <CommandItem
                        key={`${food.id || food.usdaFdcId}-${index}`}
                        value={food.name}
                        onSelect={() => handleSelectFood(food)}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{food.name}</div>
                          {food.brand && (
                            <div className="text-xs text-muted-foreground">{food.brand}</div>
                          )}
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {food.caloriesPer100g} kcal/100g
                            </Badge>
                            {food.isCustom && (
                              <Badge variant="secondary" className="text-xs">
                                Personalizado
                              </Badge>
                            )}
                            {food.usdaFdcId && (
                              <Badge variant="secondary" className="text-xs">
                                USDA
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Check
                          className={cn(
                            "ml-2 h-4 w-4",
                            selectedFood?.name === food.name ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Quantity Selection */}
      {selectedFood && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="p-4 space-y-4">
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                Alimento Selecionado:
              </h4>
              <p className="font-semibold">{selectedFood.name}</p>
              {selectedFood.brand && (
                <p className="text-sm text-muted-foreground">{selectedFood.brand}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Quantidade</label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="0.1"
                  step="0.1"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Unidade</label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="mt-1">
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

            {/* Nutrition Preview */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Valores nutricionais (quantidade selecionada):
              </p>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium">{Math.round(selectedFood.caloriesPer100g * (UNIT_OPTIONS.find(opt => opt.value === unit)?.multiplier || 1) * quantity / 100)}</div>
                  <div className="text-muted-foreground">kcal</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{Math.round(selectedFood.proteinPer100g * (UNIT_OPTIONS.find(opt => opt.value === unit)?.multiplier || 1) * quantity / 100)}g</div>
                  <div className="text-muted-foreground">prot</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{Math.round(selectedFood.carbsPer100g * (UNIT_OPTIONS.find(opt => opt.value === unit)?.multiplier || 1) * quantity / 100)}g</div>
                  <div className="text-muted-foreground">carbs</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{Math.round(selectedFood.fatPer100g * (UNIT_OPTIONS.find(opt => opt.value === unit)?.multiplier || 1) * quantity / 100)}g</div>
                  <div className="text-muted-foreground">gord</div>
                </div>
              </div>
            </div>

            <Button onClick={handleAddFood} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar à Refeição
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

