"use client";
import React from "react";
import { FoodWithAmount } from "@/data/interface";
import { calculateTotalKcal } from "@/utils/helpers";

interface TotalCaloriesProps {
  foods: FoodWithAmount[];
}

export function TotalCalories({ foods }: TotalCaloriesProps) {
  return (
    <div className="mt-2 pt-3 border-t border-gray-100 flex justify-between items-center">
      <span className="text-xs font-semibold text-gray-400 tracking-widest">
        Total Calories
      </span>
      <span className="text-lg font-semibold">
        {calculateTotalKcal(foods)} KCAL
      </span>
    </div>
  );
}