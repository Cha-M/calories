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

import {
  Dialog,
  DialogTitle,
  IconButton,
  Button,
  Input,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Checkbox,
} from "@mui/material";
import DatePicker from "@mui/lab/DatePicker";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";

const toTitleCase = (str: string): string => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(
    null,
  );
  const [searchFilter, setSearchFilter] = useState("");

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedItems, setSelectedItems] = useState<FoodWithAmount[]>([]);
  const [brandFilter, setBrandFilter] = useState(false);
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
    if (!searchResults) return searchResults;

    if (!brandFilter) {
      return {
        ...searchResults,
        foods: searchResults.foods.filter(
          (food: Food) =>
            food.description
              .toLowerCase()
              .includes(searchFilter.toLowerCase()) &&
            food.dataType !== "Branded",
        ),
      };
    }

    return {
      ...searchResults,
      foods: searchResults.foods.filter((food: Food) =>
        food.description.toLowerCase().includes(searchFilter.toLowerCase()),
      ),
    };
    //option to filter out branded results which have datatype "Branded". Unbranded I think have a different one
  }, [searchResults, searchFilter, brandFilter]);

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
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [selectedDayAndWeek, setSelectedDayAndWeek] = useState<{
    day: keyof (typeof savedDays)[0];
    week: number;
  }>({ day: "Monday", week: 0 });
  const [startDate, setStartDate] = useState<Date>(new Date());

  const addRecipeToDay = useCallback(
    (day: keyof (typeof savedDays)[0], recipeIndex: number) => {
      const recipeName = recipes[recipeIndex]?.name || "Recipe";
      setSnackbarMessage(`Added ${recipeName} to ${day}`);
      setIsSnackbarOpen(true);

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

  const doesWeekHaveRecipes = useMemo(
    () =>
      daysOfWeek.some(
        (day) => (savedDays[selectedDayAndWeek.week][day]?.length ?? 0) > 0,
      ),
    [savedDays, selectedDayAndWeek.week],
  );

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full flex-col gap-6 py-12 px-12 bg-white dark:bg-black sm:items-start">
        <Input />
        <div className="flex items-center gap-3">
          <label className="font-medium text-sm text-gray-600">Week</label>
          <Input
            type="number"
            value={selectedDayAndWeek.week + 1}
            onChange={(e) =>
              setSelectedDayAndWeek({
                ...selectedDayAndWeek,
                week: parseInt(e.target.value) - 1,
              })
            }
            disableUnderline
            sx={{ width: "6ch", "& input": { textAlign: "center" } }}
            inputProps={{
              min: 1,
              max: savedDays.length,
            }}
          />
          <p className="font-semibold">Week {selectedDayAndWeek.week + 1}</p>
        </div>
        <Table sx={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              {daysOfWeek.map((day) => (
                <TableCell align="center" key={day}>
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(() => {
              const maxRecipes = Math.max(
                ...daysOfWeek.map(
                  (day) =>
                    savedDays[selectedDayAndWeek.week]?.[day]?.length ?? 0,
                ),
                0,
              );
              return Array.from({ length: maxRecipes }, (_, rowIndex) => (
                <TableRow key={`recipe-row-${rowIndex}`}>
                  {daysOfWeek.map((day) => {
                    const recipe =
                      savedDays[selectedDayAndWeek.week]?.[day]?.[rowIndex];
                    return (
                      <TableCell key={day} align="center">
                        {recipe ? (
                          <div className="flex justify-between items-center">
                            <p className="font-medium">{recipe.name}</p>
                            <IconButton
                              onClick={() => {
                                setSavedDays((prev) => {
                                  const dayRecipes = prev[
                                    selectedDayAndWeek.week
                                  ][day].filter((_, i) => i !== rowIndex);
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
                              size="small"
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </div>
                        ) : null}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ));
            })()}
            <TableRow>
              {daysOfWeek.map((day) => (
                <TableCell key={day} align="center">
                  <IconButton
                    onClick={() => {
                      setSelectedDayAndWeek({
                        ...selectedDayAndWeek,
                        day,
                      });
                      setIsAddMealModalOpen(true);
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </TableCell>
              ))}
            </TableRow>
            {doesWeekHaveRecipes && (
              <TableRow>
                {daysOfWeek.map((day) => (
                  <TableCell key={day} align="center">
                    {Math.round(
                      savedDays[selectedDayAndWeek.week]?.[day]?.reduce(
                        (total: number, recipe: Recipe) => {
                          return (
                            total +
                            recipe.foods.reduce((recipeTotal: number, food) => {
                              const energyNutrient = food.foodNutrients.find(
                                (n: FoodNutrient) => n.nutrientId === 1008,
                              );
                              const kcal = energyNutrient
                                ? energyNutrient.value * (food.amount / 100)
                                : 0;
                              return recipeTotal + kcal;
                            }, 0)
                          );
                        },
                        0,
                      ),
                    )}{" "}
                    KCAL
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="mt-4 flex gap-3">
          <Button
            variant="contained"
            onClick={() => setIsAddRecipeModalOpen(true)}
          >
            Edit recipes
          </Button>
          <Button
            variant="contained"
            color="inherit"
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
            New week
          </Button>
        </div>
        {isAddRecipeModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-[70vw] max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Recipes</h2>
                <IconButton
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setIsAddRecipeModalOpen(false)}
                >
                  <CloseIcon />
                </IconButton>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-row gap-2">
                  <Input
                    className="flex-1"
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
                    variant="contained"
                  >
                    Search
                  </Button>
                </div>
                <Input
                  className="w-full"
                  type="text"
                  placeholder="Filter results..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
                <div>
                  <Checkbox
                    checked={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.checked)}
                  />
                  <label>Show branded items</label>
                </div>
              </div>
              {filteredResults && (
                <div className="mt-8 w-full">
                  <ul className="flex flex-col gap-2">
                    {filteredResults.foods.map((item: Food, index: number) => (
                      <Button
                        className="w-full justify-start text-left"
                        key={`${item.fdcId}-${index}`}
                        onClick={() => {
                          setSelectedItems([
                            ...selectedItems,
                            { ...item, amount: 100 },
                          ]);
                          setSearchResults(null);
                        }}
                      >
                        {toTitleCase(item.description)}
                        {item.brandName && ", "}
                        {item.brandName && toTitleCase(item.brandName)}
                        {/* yeah need more info than this even at the start */}
                      </Button>
                    ))}
                  </ul>
                </div>
              )}
              {selectedItems.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {selectedItems.map((item, index) => {
                    const energyNutrient = item.foodNutrients.find(
                      (n: FoodNutrient) => n.nutrientId === 1008,
                    );
                    return (
                      <li
                        key={`${item.fdcId}-${index}-selection`}
                        className="p-4 border rounded"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-xl font-semibold truncate pr-2">
                            {toTitleCase(item.description)}
                            {item.brandName && ", "}
                            {item.brandName && toTitleCase(item.brandName)}
                          </h3>
                          <IconButton
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              removeSelectedItem(index);
                            }}
                            size="small"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </div>
                        <div className="flex flex-row items-center align-center">
                          <p>
                            Weight:
                            <Input
                              type="number"
                              value={item.amount}
                              onChange={(e) => {
                                const updatedItems = [...selectedItems];
                                updatedItems[index] = {
                                  ...item,
                                  amount: parseInt(e.target.value) || 1,
                                };
                                setSelectedItems(updatedItems);
                              }}
                              disableUnderline
                              sx={{
                                width: "6ch",
                                "& input": { textAlign: "center" },
                              }}
                              inputProps={{ min: 1, max: 10000 }}
                            />
                            g{" "}
                          </p>
                          <p>
                            KCAL:{" "}
                            {energyNutrient
                              ? Math.round(
                                  energyNutrient.value * (item.amount / 100),
                                )
                              : "N/A"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-6">
                <Button
                  variant="contained"
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
              </div>
              {recipes.map((recipe, index) => (
                <div
                  key={`recipe-editor-${index}`}
                  className="p-4 border rounded mt-4 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Recipe name"
                      className="flex-1"
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
                    <IconButton
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        removeRecipe(index);
                      }}
                      size="small"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </div>
                  {recipe.foods.map(
                    (food: FoodWithAmount, foodIndex: number) => {
                      const energyNutrient = food.foodNutrients.find(
                        (n: FoodNutrient) => n.nutrientId === 1008,
                      );
                      return (
                        <div
                          key={`${food.fdcId}-${foodIndex}`}
                          className="ml-4 flex items-center gap-1"
                        >
                          <p className="flex items-center gap-1">
                            <Input
                              type="number"
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
                              disableUnderline
                              sx={{
                                width: "6ch",
                                "& input": { textAlign: "center" },
                              }}
                              inputProps={{ min: 1, max: 10000 }}
                            />
                            g {toTitleCase(food.description)}
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
                </div>
              ))}
            </div>
          </div>
        )}
        {isAddMealModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Add Meal</h2>
                <IconButton
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setIsAddMealModalOpen(false)}
                >
                  <CloseIcon />
                </IconButton>
              </div>
              {recipes.length > 0 && (
                <div className="mt-8 w-full">
                  {recipes.map((recipe, index) => (
                    <div
                      key={`meal-modal-recipe-${index}`}
                      className="p-4 border rounded mt-4 flex flex-col gap-2 relative"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-lg font-semibold flex-1">
                          {recipe.name}
                        </p>
                        <IconButton
                          onClick={() =>
                            addRecipeToDay(selectedDayAndWeek.day, index)
                          }
                          size="small"
                          color="primary" // Added color for visibility
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </div>
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
                                <Input
                                  type="number"
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
                                  disableUnderline
                                  sx={{
                                    width: "6ch",
                                    "& input": { textAlign: "center" },
                                  }}
                                  inputProps={{ min: 1, max: 10000 }}
                                />
                                g {toTitleCase(food.description)}
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Snackbar
        open={isSnackbarOpen}
        autoHideDuration={3000}
        onClose={() => setIsSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </div>
  );
}
