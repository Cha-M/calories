// import Image from "next/image";
"use client";
import { JSX, use, useCallback, useMemo, useState } from "react";
import { searchItems, askWolfram } from "@/utils/api";
import {
  SearchResults,
  SearchResultsWithOpen,
  Food,
  FoodWithAmount,
  FoodNutrient,
  Recipe,
  FoodWithOpen,
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
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { enGB } from "date-fns/locale";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { set } from "date-fns";

const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});

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
  const [searchResults, setSearchResults] =
    useState<SearchResultsWithOpen | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [areResultsLoading, setAreResultsLoading] = useState(false);

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
          (food: FoodWithOpen) =>
            food.description
              .toLowerCase()
              .includes(searchFilter.toLowerCase()) &&
            food.dataType !== "Branded",
        ),
      };
    }

    return {
      ...searchResults,
      foods: searchResults.foods.filter((food: FoodWithOpen) =>
        food.description.toLowerCase().includes(searchFilter.toLowerCase()),
      ),
    };
    //option to filter out branded results which have datatype "Branded". Unbranded I think have a different one
  }, [searchResults, searchFilter, brandFilter]);

  const searchHandler = useCallback(async () => {
    if (!query.trim()) return;
    setAreResultsLoading(true);
    const data = await searchItems(query);
    console.log(data);
    const resultsWithOpen: SearchResultsWithOpen = {
      ...data,
      foods: data.foods.map((food) => ({
        ...food,
        open: false,
      })),
    };
    setSearchResults(resultsWithOpen);
    setQuery("");
    setSearchFilter("");
    setAreResultsLoading(false);
    // put this into handler
  }, [query]);

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
  const [isUnitConversionModalOpen, setIsUnitConversionModalOpen] =
    useState(false);
  const [isUnitConversionLoading, setIsUnitConversionLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [selectedDayAndWeek, setSelectedDayAndWeek] = useState<{
    day: keyof (typeof savedDays)[0];
    week: number;
  }>({ day: "Monday", week: 0 });
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [isPortionModalOpen, setIsPortionModalOpen] = useState(false);
  const [portion, setPortion] = useState(0);

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

  const [unitConversionUnitText, setUnitConversionUnitText] = useState("");
  const wolframUnitConversion = useCallback(
    async (food: string, unit: string, index: number) => {
      setIsUnitConversionLoading(true);
      const xmlString = await askWolfram(`mass of ${unit} of ${food} in grams`);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "application/xml");

      // Extract pod titles and their plaintext results
      const pods = Array.from(xmlDoc.querySelectorAll("pod")).map((pod) => ({
        title: pod.getAttribute("title"),
        text: pod.getElementsByTagName("plaintext" as string)[0]?.textContent,
      }));

      const resultPod = pods.find((pod) => pod.title === "Result");
      const unitConversionPod = pods.find(
        (pod) => pod.title === "Unit conversion",
      );
      if (
        (!resultPod || !resultPod.text) &&
        (!unitConversionPod || !unitConversionPod.text)
      ) {
        setSnackbarMessage("Could not parse conversion result from Wolfram");
        setIsSnackbarOpen(true);
        setUnitConversionUnitText("");
        setIsUnitConversionLoading(false);
        return;
      }
      // Could be "Unit conversion" instead, result may not always return grams!
      let conversionResult: number;

      // Sometimes it returns 2 results, even considering this below
      if (unitConversionPod && unitConversionPod.text.includes("gram")) {
        conversionResult = parseFloat(unitConversionPod.text.split(" ")[0]);
      } else if (resultPod && resultPod.text.includes("gram")) {
        conversionResult = parseFloat(resultPod.text.split(" ")[0]);
      } else {
        setSnackbarMessage("Wolfram result did not include grams");
        setIsSnackbarOpen(true);
        setUnitConversionUnitText("");
        setIsUnitConversionLoading(false);
        return;
      }

      console.log("Parsed Wolfram Results:", pods, conversionResult);
      setSelectedItems((prevItems) =>
        prevItems.map((item, i) =>
          i === index ? { ...item, amount: conversionResult } : item,
        ),
      );
      setSnackbarMessage(
        `Converted ${unit} of ${food} to ${conversionResult} grams`,
      );
      setIsSnackbarOpen(true);
      setIsUnitConversionModalOpen(false);
      setUnitConversionUnitText("");
      setIsUnitConversionLoading(false);
      return;
    },
    [],
  );

  return (
    <ThemeProvider theme={theme}>
      <div className="flex flex-col flex-1 items-center justify-center bg-gray-50 font-sans dark:bg-black">
        <main className="flex flex-1 w-full flex-col gap-6 py-12 px-12 bg-white dark:bg-black sm:items-start">
          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={enGB}
          >
            <DatePicker
              label="Start of record"
              defaultValue={startDate}
              onChange={(e) => setStartDate(e as Date)}
            />
          </LocalizationProvider>
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
                      <AddIcon color="primary" />
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
                              recipe.foods.reduce(
                                (recipeTotal: number, food) => {
                                  const energyNutrient =
                                    food.foodNutrients.find(
                                      (n: FoodNutrient) =>
                                        n.nutrientId === 1008,
                                    );
                                  const kcal = energyNutrient
                                    ? energyNutrient.value * (food.amount / 100)
                                    : 0;
                                  return recipeTotal + kcal;
                                },
                                0,
                              )
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
              variant="outlined"
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
                  <h2 className="text-2xl font-semibold">Edit Recipes</h2>
                  <IconButton
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setIsAddRecipeModalOpen(false)}
                  >
                    <CloseIcon />
                  </IconButton>
                </div>
                <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex flex-row gap-2 bg-white pl-3 p-1 rounded-lg border border-gray-300 shadow-sm focus-within:border-primary transition-all">
                    <Input
                      className="flex-1"
                      type="text"
                      placeholder="Search for food..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      disableUnderline
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          searchHandler();
                        }
                      }}
                    />
                    <Button
                      onClick={searchHandler}
                      loading={areResultsLoading}
                      variant="contained"
                    >
                      Search
                    </Button>
                  </div>

                  {/* filter needs focus colour if the other has it */}
                  <div className="flex flex-row items-center gap-4">
                    <div className="flex-1 flex items-center bg-white pl-3 p-1 rounded-lg border border-gray-300 shadow-sm">
                      <Input
                        className="w-full text-sm"
                        type="text"
                        placeholder="Filter items..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        disableUnderline
                      />
                    </div>
                    <div className="flex items-center gap-1 whitespace-nowrap pr-1">
                      <Checkbox
                        size="small"
                        checked={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.checked)}
                        sx={{ p: 0.5 }}
                      />
                      <span className="text-sm text-gray-600 font-medium select-none">
                        Show branded
                      </span>
                    </div>
                  </div>
                </div>
                {filteredResults && !areResultsLoading && (
                  <div className="mt-8 w-full">
                    <h3 className="text-xs font-semibold text-gray-400 tracking-widest mb-3 ml-1">
                      Search Results
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {filteredResults.foods.map(
                        (item: FoodWithOpen, index: number) => (
                          <div
                            className="p-4 border border-gray-200 rounded-xl flex justify-between text-left items-start bg-white shadow-sm hover:shadow-md transition-all duration-200"
                            key={`${item.fdcId}-${index}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 truncate">
                                {toTitleCase(item.description)}
                              </p>
                              {item.open && (
                                <div className="mt-2 text-sm text-gray-500 space-y-1">
                                  {item.brandName && (
                                    <p>
                                      <span className="font-medium text-gray-700">
                                        Brand:
                                      </span>{" "}
                                      {toTitleCase(item.brandName)}
                                    </p>
                                  )}
                                  {item.foodCategory && (
                                    <p>
                                      <span className="font-medium text-gray-700">
                                        Category:
                                      </span>{" "}
                                      {item.foodCategory}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <IconButton
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  if (!searchResults) return;
                                  setSearchResults({
                                    ...searchResults,
                                    foods: searchResults.foods.map((f) =>
                                      f.fdcId === item.fdcId
                                        ? { ...f, open: !f.open }
                                        : f,
                                    ),
                                  });
                                }}
                              >
                                {item.open ? (
                                  <KeyboardArrowUpIcon />
                                ) : (
                                  <KeyboardArrowDownIcon />
                                )}
                              </IconButton>
                              <IconButton
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setSelectedItems([
                                    ...selectedItems,
                                    { ...item, amount: 100 },
                                  ]);
                                  setSearchResults(null);
                                }}
                                size="small"
                                color="primary"
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </div>
                          </div>
                        ),
                      )}
                    </ul>
                  </div>
                )}
                {selectedItems.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-xs font-semibold text-gray-400 tracking-widest">
                        Ingredients
                      </h3>
                      <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {selectedItems.length} item
                        {selectedItems.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <ul className="flex flex-col gap-2">
                      {selectedItems.map((item, index) => {
                        const energyNutrient = item.foodNutrients.find(
                          (n: FoodNutrient) => n.nutrientId === 1008,
                        );
                        return (
                          <li
                            key={`${item.fdcId}-${index}-selection`}
                            className="p-5 border border-gray-200 rounded-xl flex flex-col gap-3 relative bg-white shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-semibold truncate pr-2">
                                {toTitleCase(item.description)}
                                {item.brandName && ", "}
                                {item.brandName && toTitleCase(item.brandName)}
                              </h3>
                              <div>
                                <IconButton
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    const updatedItems = [...selectedItems];
                                    updatedItems[index] = {
                                      ...item,
                                      open: !item.open,
                                    };
                                    setSelectedItems(updatedItems);
                                  }}
                                >
                                  {item.open ? (
                                    <KeyboardArrowUpIcon />
                                  ) : (
                                    <KeyboardArrowDownIcon />
                                  )}
                                </IconButton>
                                <IconButton
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => removeSelectedItem(index)}
                                  size="small"
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </div>
                            </div>
                            {item.open && (
                              <div className="flex items-center text-sm gap-2">
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
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() =>
                                    setIsUnitConversionModalOpen(true)
                                  }
                                >
                                  Convert
                                </Button>
                                <span className="text-gray-400 text-xs tabular-nums">
                                  {energyNutrient
                                    ? `${Math.round(energyNutrient.value * (item.amount / 100))} kcal`
                                    : "N/A"}
                                </span>
                              </div>
                            )}
                            {isUnitConversionModalOpen && (
                              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-[40vw]">
                                  <div className="flex justify-end">
                                    <IconButton
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        setUnitConversionUnitText("");
                                        setIsUnitConversionModalOpen(false);
                                      }}
                                      size="small"
                                    >
                                      <CloseIcon fontSize="small" />
                                    </IconButton>
                                  </div>
                                  <p className="mt-2 text-gray-700">
                                    Enter the unit you wish to convert to grams
                                    e.g., &quot;1 UK tablespoon&quot;
                                  </p>
                                  <div className="flex flex-row gap-2 bg-white pl-3 p-1 rounded-lg border border-gray-300 shadow-sm focus-within:border-primary transition-all mt-4">
                                    <Input
                                      placeholder="Enter unit..."
                                      value={unitConversionUnitText}
                                      onChange={(e) =>
                                        setUnitConversionUnitText(
                                          e.target.value,
                                        )
                                      }
                                      className="flex-1"
                                      disableUnderline
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          wolframUnitConversion(
                                            item.description,
                                            unitConversionUnitText,
                                            index,
                                          );
                                        }
                                      }}
                                    />
                                    <Button
                                      size="small"
                                      loading={isUnitConversionLoading}
                                      variant="contained"
                                      onClick={() =>
                                        wolframUnitConversion(
                                          item.description,
                                          unitConversionUnitText,
                                          index,
                                        )
                                      }
                                    >
                                      Convert
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    <div className="mt-6">
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => {
                          setRecipes([
                            ...recipes,
                            {
                              name: "New recipe",
                              foods: selectedItems,
                              open: false,
                            },
                          ]);
                          setSelectedItems([]);
                        }}
                      >
                        Save as new recipe
                      </Button>
                    </div>
                  </div>
                )}
                {recipes.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-400 tracking-widest mb-4 ml-1">
                      Saved Recipes
                    </h3>
                    {recipes.map((recipe, index) => (
                      <div
                        key={`recipe-editor-${index}`}
                        className="p-5 border border-gray-200 rounded-xl mt-6 flex flex-col gap-3 relative bg-white shadow-sm hover:shadow-md transition-all duration-200"
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
                          <div className="flex items-center gap-1">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setIsPortionModalOpen(true)}
                            >
                              Portion
                            </Button>
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
                        </div>
                        {recipe.foods.map(
                          (food: FoodWithAmount, foodIndex: number) => {
                            const energyNutrient = food.foodNutrients.find(
                              (n: FoodNutrient) => n.nutrientId === 1008,
                            );
                            return (
                              <div
                                key={`${food.fdcId}-${foodIndex}`}
                                className="flex items-center text-sm gap-2"
                              >
                                <Input
                                  type="number"
                                  value={food.amount}
                                  onChange={(e) => {
                                    const newAmount =
                                      parseInt(e.target.value) || 1;
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
                          },
                        )}
                        <div className="mt-2 pt-3 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-400 tracking-widest">
                            Total Calories
                          </span>
                          <span className="text-lg font-semibold">
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
                            )}{" "}
                            KCAL
                          </span>
                        </div>
                        {isPortionModalOpen && (
                          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-[40vw] max-h-[40vh]">
                              <div className="flex justify-end">
                                <IconButton
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setIsPortionModalOpen(false);
                                  }}
                                  size="small"
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </div>
                              <p className="mt-2 text-gray-700">
                                Enter the portion size as a percentage of the
                                original recipe (e.g. 50 for half, 200 for
                                double)
                              </p>
                              <div className="mt-4 flex flex-col gap-4">
                                <Input
                                  placeholder="Portion %"
                                  type="number"
                                  fullWidth
                                  onChange={(e) =>
                                    setPortion(parseFloat(e.target.value))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      {
                                        const portionPercentage = portion / 100;
                                        const updatedRecipes = [...recipes];
                                        updatedRecipes.push({
                                          ...recipe,
                                          name: `${recipe.name} (${portion}%)`,
                                          foods: recipe.foods.map((food) => ({
                                            ...food,
                                            amount:
                                              food.amount * portionPercentage,
                                          })),
                                        });
                                        setRecipes(updatedRecipes);
                                        setPortion(0);
                                        setIsPortionModalOpen(false);
                                      }
                                    }
                                  }}
                                />
                                <Button
                                  size="small"
                                  variant="contained"
                                  disabled={portion <= 0 || !portion}
                                  onClick={() => {
                                    const portionPercentage = portion / 100;
                                    const updatedRecipes = [...recipes];
                                    updatedRecipes.push({
                                      ...recipe,
                                      name: `${recipe.name} (${portion}%)`,
                                      foods: recipe.foods.map((food) => ({
                                        ...food,
                                        amount: food.amount * portionPercentage,
                                      })),
                                    });
                                    setRecipes(updatedRecipes);
                                    setPortion(0);
                                    setIsPortionModalOpen(false);
                                  }}
                                >
                                  Save portion
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {isAddMealModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold">Add Meal</h2>
                  <IconButton
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setIsAddMealModalOpen(false)}
                  >
                    <CloseIcon />
                  </IconButton>
                </div>
                {recipes.length === 0 && (
                  <p>
                    No recipes created yet. Create a recipe in the &quot;Edit
                    Recipes&quot; section to add meals to your record.
                  </p>
                )}
                {recipes.length > 0 && (
                  <div className="mt-8 w-full">
                    {recipes.map((recipe, index) => (
                      <div
                        key={`meal-modal-recipe-${index}`}
                        className="p-5 border border-gray-200 rounded-xl mt-4 flex flex-col gap-3 relative bg-white shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <p className="text-lg font-semibold text-gray-800 flex-1">
                            {recipe.name}
                          </p>
                          <IconButton
                            onClick={() => {
                              const updatedRecipes = [...recipes];
                              updatedRecipes[index] = {
                                ...recipe,
                                open: !recipe.open,
                              };
                              setRecipes(updatedRecipes);
                            }}
                            size="small"
                          >
                            {recipe.open ? (
                              <KeyboardArrowUpIcon />
                            ) : (
                              <KeyboardArrowDownIcon />
                            )}
                          </IconButton>
                          <IconButton
                            onClick={() =>
                              addRecipeToDay(selectedDayAndWeek.day, index)
                            }
                            size="small"
                            color="primary"
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </div>
                        {recipe.open && (
                          <>
                            <div className="flex flex-col gap-1.5">
                              {recipe.foods.map(
                                (food: FoodWithAmount, foodIndex: number) => {
                                  const energyNutrient =
                                    food.foodNutrients.find(
                                      (n: FoodNutrient) =>
                                        n.nutrientId === 1008,
                                    );
                                  return (
                                    <div
                                      key={`${food.fdcId}-${foodIndex}`}
                                      className="flex items-center text-sm gap-2"
                                    >
                                      <Input
                                        type="number"
                                        value={food.amount}
                                        onChange={(e) => {
                                          const updatedRecipes = [...recipes];
                                          updatedRecipes[index] = {
                                            ...recipe,
                                            foods: updatedRecipes[
                                              index
                                            ].foods.map(
                                              (f: FoodWithAmount, i: number) =>
                                                i === foodIndex
                                                  ? {
                                                      ...f,
                                                      amount:
                                                        parseInt(
                                                          e.target.value,
                                                        ) || 1,
                                                    }
                                                  : f,
                                            ),
                                          };
                                          setRecipes(updatedRecipes);
                                        }}
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
                                      <span className="text-gray-400 w-4">
                                        g
                                      </span>
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
                                },
                              )}
                            </div>
                            <div className="mt-2 pt-3 border-t border-gray-100 flex justify-between items-center">
                              <span className="text-xs font-semibold text-gray-400 tracking-widest">
                                Total Calories
                              </span>
                              <span className="text-lg font-semibold">
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
                                )}{" "}
                                KCAL
                              </span>
                            </div>
                          </>
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
    </ThemeProvider>
  );
}
