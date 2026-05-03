// import Image from "next/image";
"use client";
import { JSX, use, useCallback, useMemo, useState } from "react";
import { searchItems } from "@/utils/api";
import {
  SearchResults,
  Food,
  FoodWithAmount,
  FoodNutrient,
  Recipe,
} from "@/data/interface";
import Button from "@mui/material/Button";
import Input from "@mui/material/Input";
import Modal from "@mui/material/Modal";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(
    null,
  );
  const [searchFilter, setSearchFilter] = useState("");

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedItems, setSelectedItems] = useState<FoodWithAmount[]>([]);
  const [savedItems, setSavedItems] = useState<FoodWithAmount[]>([]);
  const [savedDays, setSavedDays] = useState<
    {
      Monday: Recipe[];
      Tuesday: Recipe[];
      Wednesday: Recipe[];
      Thursday: Recipe[];
      Friday: Recipe[];
      Saturday: Recipe[];
      Sunday: Recipe[];
    }[]
  >([
    {
      Monday: [] as Recipe[],
      Tuesday: [] as Recipe[],
      Wednesday: [] as Recipe[],
      Thursday: [] as Recipe[],
      Friday: [] as Recipe[],
      Saturday: [] as Recipe[],
      Sunday: [] as Recipe[],
    },
  ]);

  const filteredResults = useMemo(() => {
    if (searchFilter.length === 0 || !searchResults) return searchResults;
    return {
      ...searchResults,
      foods: searchResults.foods.filter((food: Food) =>
        food.description.toLowerCase().includes(searchFilter.toLowerCase()),
      ),
    };
  }, [searchResults, searchFilter]);

  const removeSelectedItem = useCallback<(indexToRemove: number) => void>(
    (indexToRemove: number) => {
      setSelectedItems((prevItems) =>
        prevItems.filter((_, i) => i !== indexToRemove),
      );
    },
    [],
  );

  const removeRecipe = useCallback<(indexToRemove: number) => void>(
    (indexToRemove: number) => {
      setRecipes((prevRecipes) =>
        prevRecipes.filter((_, i) => i !== indexToRemove),
      );
    },
    [],
  );

  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
  const [isAddRecipeModalOpen, setIsAddRecipeModalOpen] = useState(false);
  const [selectedDayAndWeek, setSelectedDayAndWeek] = useState<{
    day: keyof (typeof savedDays)[0];
    week: number;
  }>({ day: "Monday", week: 0 });
  const [startDate, setStartDate] = useState<Date>(new Date());

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ] as const;

  const addRecipeToDay = useCallback(
    (day: keyof (typeof savedDays)[0], recipeIndex: number) => {
      setSavedDays((prev) => {
        if (recipes.length === 0) return prev;
        const recipeToAdd = { ...recipes[recipeIndex] };
        const updatedWeek = {
          ...prev[selectedDayAndWeek.week],
          [day]: [...(prev[selectedDayAndWeek.week][day] || []), recipeToAdd],
        };
        const updatedDays = [...prev];
        updatedDays[selectedDayAndWeek.week] = updatedWeek;
        return updatedDays;
      });
    },
    [recipes, selectedDayAndWeek.week],
  );

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-32 px-16 bg-white dark:bg-black sm:items-start">
        <input></input>
        <input
          type="number"
          value={selectedDayAndWeek.week + 1}
          onChange={(e) =>
            setSelectedDayAndWeek({
              ...selectedDayAndWeek,
              week: parseInt(e.target.value) - 1,
            })
          }
          min="1"
          max={savedDays.length}
        />
        <p>Week {selectedDayAndWeek.week + 1}</p>
        <Table>
          <TableHead>
            <TableRow>
              {daysOfWeek.map((day) => (
                <TableCell key={day}>{day}</TableCell>
              ))}
              <TableCell>
                <Button
                  onClick={() =>
                    setSavedDays((prev) => [
                      ...prev,
                      {
                        Monday: [],
                        Tuesday: [],
                        Wednesday: [],
                        Thursday: [],
                        Friday: [],
                        Saturday: [],
                        Sunday: [],
                      },
                    ])
                  }
                >
                  +
                </Button>
              </TableCell>
            </TableRow>
          </TableHead>
          <tbody>
            <TableRow>
              {daysOfWeek.map((day) => (
                <TableCell key={day}>
                  {savedDays[selectedDayAndWeek.week]?.[day]?.map(
                    (recipe, index) => (
                      <div key={`${recipe.name}-${index}`}>
                        {recipe.name}
                        <ul>
                          {recipe.foods?.map((food, foodIndex) => (
                            <li key={`${food.fdcId}-${foodIndex}`}>
                              {food.amount}g {food.description}
                            </li>
                          ))}
                        </ul>
                        <Button
                          onClick={() => {
                            setSavedDays((prev) => {
                              const dayRecipes = prev[selectedDayAndWeek.week][
                                day
                              ].filter((_, i) => i !== index);
                              const updatedWeek = {
                                ...prev[selectedDayAndWeek.week],
                                [day]: dayRecipes,
                              };
                              const updatedDays = [...prev];
                              updatedDays[selectedDayAndWeek.week] =
                                updatedWeek;
                              return updatedDays;
                            });
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          🗙
                        </Button>
                      </div>
                    ),
                  )}
                  <Button
                    onClick={() => {
                      setSelectedDayAndWeek({
                        ...selectedDayAndWeek,
                        day,
                      });
                      setIsAddMealModalOpen(true);
                    }}
                  >
                    +
                  </Button>
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
          </tbody>
        </Table>
        <Button onClick={() => setIsAddRecipeModalOpen(true)}>
          Edit recipes
        </Button>
        {isAddRecipeModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded">
              <div className="flex justify-between items-start pt-3 pl-4 pr-3 pb-2">
                <h2 className="text-2xl font-bold mb-4">Edit Recipes</h2>
                <Button
                  className="px-2 py-1"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setIsAddRecipeModalOpen(false)}
                >
                  🗙
                </Button>
              </div>
              <input
                className="pl-1"
                type="text"
                placeholder="Search for food..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button
                onClick={async () => {
                  if (!query.trim()) return;
                  const data = await searchItems(query);
                  setSearchResults(data);
                  // Clean this up later
                  navigator.clipboard.writeText(JSON.stringify(data));
                  console.log(data);
                  //
                  setQuery("");
                  setSearchFilter("");
                }}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Search
              </Button>
              <input
                className="pl-1 mt-4"
                type="text"
                placeholder="Filter results..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
              {filteredResults && (
                <div className="mt-8 w-full">
                  <ul className="space-y-4">
                    {filteredResults.foods.map((item: Food, index: number) => (
                      <li
                        key={`${item.fdcId}-${index}-selection`}
                        className="p-4 border rounded"
                      >
                        <Button
                          key={`${item.fdcId}-${index}`}
                          onClick={() => {
                            setSelectedItems([
                              ...selectedItems,
                              { ...item, amount: 100 },
                            ]);
                            setSearchResults(null);
                          }}
                        >
                          {item.description}
                          {/* yeah need more info than this even at the start */}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedItems.length > 0 && (
                <ul className="space-y-4">
                  {selectedItems.map((item, index) => {
                    const energyNutrient = item.foodNutrients.find(
                      (n: FoodNutrient) => n.nutrientId === 1008,
                    );
                    return (
                      <li
                        key={`${item.fdcId}-${index}-selection`}
                        className="p-4 border rounded"
                      >
                        <h3 className="text-xl font-semibold">
                          {item.description}
                        </h3>
                        <p>
                          Weight:
                          <input
                            type="number"
                            min={1}
                            max={10000}
                            value={item.amount}
                            onChange={(e) => {
                              const updatedItems = [...selectedItems];
                              updatedItems[index] = {
                                ...item,
                                amount: parseInt(e.target.value) || 1,
                              };
                              setSelectedItems(updatedItems);
                            }}
                          />
                          g
                        </p>
                        <p>
                          KCAL:
                          {energyNutrient
                            ? Math.round(
                                energyNutrient.value * (item.amount / 100),
                              )
                            : "N/A"}
                        </p>
                        <Button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            removeSelectedItem(index);
                          }}
                          className="px-2 py-1 my-1"
                        >
                          🗙
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Button
                onClick={() =>
                  setRecipes([
                    ...recipes,
                    { name: "New recipe", foods: selectedItems },
                  ])
                }
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
              >
                New recipe
              </Button>
              {recipes.map((recipe, index) => (
                <div
                  key={`recipe-editor-${index}`}
                  className="p-4 border rounded"
                >
                  <input
                    type="text"
                    placeholder="Recipe name"
                    value={recipe.name}
                    onChange={(e) => {
                      const updatedRecipes = [...recipes];
                      updatedRecipes[index] = {
                        ...recipe,
                        name: e.target.value,
                      };
                      setRecipes(updatedRecipes);
                    }}
                  />
                  {recipe.foods.map(
                    (food: FoodWithAmount, foodIndex: number) => {
                      const energyNutrient = food.foodNutrients.find(
                        (n: FoodNutrient) => n.nutrientId === 1008,
                      );
                      return (
                        <div
                          key={`${food.fdcId}-${foodIndex}`}
                          className="ml-4"
                        >
                          <p>
                            <input
                              type="number"
                              min={1}
                              max={10000}
                              value={food.amount}
                              onChange={(e) => {
                                const newAmount = parseInt(e.target.value) || 1;
                                const updatedRecipes = [...recipes];
                                const updatedFoods = [...recipe.foods];
                                updatedFoods[foodIndex] = {
                                  ...food,
                                  amount: newAmount,
                                };
                                updatedRecipes[index] = {
                                  ...recipe,
                                  foods: updatedFoods,
                                };
                                setRecipes(updatedRecipes);
                              }}
                            />
                            g {food.description}
                          </p>
                          <p>
                            KCAL:{" "}
                            {energyNutrient
                              ? Math.round(
                                  energyNutrient.value * (food.amount / 100),
                                )
                              : "N/A"}
                          </p>
                        </div>
                      );
                    },
                  )}
                  Total KCAL:{" "}
                  {Math.round(
                    recipe.foods.reduce(
                      (total: number, food: FoodWithAmount) => {
                        const kcal =
                          food.foodNutrients.find(
                            (nutrient: FoodNutrient) =>
                              nutrient.nutrientId === 1008,
                          )?.value || 0;
                        return total + kcal * (food.amount / 100);
                      },
                      0,
                    ),
                  )}
                  <Button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      removeRecipe(index);
                    }}
                    className="px-2 py-1 my-1"
                  >
                    🗙
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        {isAddMealModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded">
              <div className="flex justify-between items-start pt-3 pl-4 pr-3 pb-2">
                <h2 className="text-2xl font-bold mb-4">Add Meal</h2>
                <Button
                  className="px-2 py-1"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setIsAddMealModalOpen(false)}
                >
                  🗙
                </Button>
              </div>
              {recipes.length > 0 && (
                <div className="mt-8 w-full">
                  <h2 className="text-2xl font-bold mb-4">Recipes</h2>
                  {recipes.map((recipe, index) => (
                    <div
                      key={`meal-modal-recipe-${index}`}
                      className="p-4 border rounded"
                    >
                      <input
                        type="text"
                        placeholder="Recipe name"
                        value={recipe.name}
                        onChange={(e) => {
                          const updatedRecipes = [...recipes];
                          updatedRecipes[index] = {
                            ...recipe,
                            name: e.target.value,
                          };
                          setRecipes(updatedRecipes);
                        }}
                      />
                      {recipe.foods.map(
                        (food: FoodWithAmount, foodIndex: number) => {
                          const energyNutrient = food.foodNutrients.find(
                            (n: FoodNutrient) => n.nutrientId === 1008,
                          );
                          return (
                            <div
                              key={`${food.fdcId}-${foodIndex}`}
                              className="ml-4"
                            >
                              <p>
                                <input
                                  type="number"
                                  min={1}
                                  max={10000}
                                  value={food.amount}
                                  onChange={(e) => {
                                    const updatedRecipes = [...recipes];
                                    updatedRecipes[index] = {
                                      ...recipe,
                                      foods: updatedRecipes[index].foods.map(
                                        (f: FoodWithAmount, i: number) =>
                                          i === foodIndex
                                            ? {
                                                ...f,
                                                amount:
                                                  parseInt(e.target.value) || 1,
                                              }
                                            : f,
                                      ),
                                    };
                                    setRecipes(updatedRecipes);
                                  }}
                                />
                                g {food.description}
                              </p>
                              <p>
                                KCAL:{" "}
                                {energyNutrient
                                  ? Math.round(
                                      energyNutrient.value *
                                        (food.amount / 100),
                                    )
                                  : "N/A"}
                              </p>
                            </div>
                          );
                        },
                      )}
                      Total KCAL:{" "}
                      {Math.round(
                        recipe.foods.reduce(
                          (total: number, food: FoodWithAmount) => {
                            const kcal =
                              food.foodNutrients.find(
                                (nutrient: FoodNutrient) =>
                                  nutrient.nutrientId === 1008,
                              )?.value || 0;
                            return total + kcal * (food.amount / 100);
                          },
                          0,
                        ),
                      )}
                      <Button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          removeRecipe(index);
                        }}
                        className="px-2 py-1 my-1"
                      >
                        🗙
                      </Button>
                      <Button
                        onClick={() =>
                          addRecipeToDay(selectedDayAndWeek.day, index)
                        }
                      >
                        +
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      {/* need modal for selections */}
    </div>
  );
}
