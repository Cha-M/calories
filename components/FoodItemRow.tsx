"use client";
import { Input } from "@mui/material";
import { FoodWithAmount, FoodNutrient } from "@/data/interface";
import { toTitleCase } from "@/utils/helpers";

interface FoodItemRowProps {
  food: FoodWithAmount;
  onAmountChange: (newAmount: number) => void;
}

export function FoodItemRow({ food, onAmountChange }: FoodItemRowProps) {
  const energyNutrient = food.foodNutrients.find(
    (n: FoodNutrient) => n.nutrientId === 1008
  );

  return (
    <div className="flex items-center text-sm gap-2">
      <Input
        type="number"
        value={food.amount}
        onChange={(e) => onAmountChange(parseInt(e.target.value) || 1)}
        disableUnderline
        sx={{
          width: "5ch",
          fontSize: "0.875rem",
          "& input": {
            textAlign: "center",
            padding: 0,
          },
          borderBottom: "1px solid #e5e7eb",
        }}
        inputProps={{ min: 1, max: 10000 }}
      />
      <span className="text-gray-400 w-4">g</span>
      <span className="font-medium text-gray-700 flex-1 truncate">
        {toTitleCase(food.description)}
      </span>
      <span className="text-gray-400 text-xs tabular-nums">
        {energyNutrient
          ? `${Math.round(energyNutrient.value * (food.amount / 100))} kcal`
          : "N/A"}
      </span>
    </div>
  );
}