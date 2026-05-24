import { FoodWithAmount, FoodNutrient } from "@/data/interface";

export const toTitleCase = (str: string): string => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

export const calculateTotalKcal = (foods: FoodWithAmount[]): number => {
  return Math.round(
    foods.reduce((total: number, food: FoodWithAmount) => {
      const kcal =
        food.foodNutrients.find(
          (nutrient: FoodNutrient) => nutrient.nutrientId === 1008,
        )?.value || 0;
      return total + kcal * (food.amount / 100);
    }, 0),
  );
};
