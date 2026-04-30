import { SearchResults } from "@/data/interface";
//
// get item
// search for item
export async function searchItems(query: string): Promise<SearchResults> {
  // remove hard coded api key and move to env variable
  // const apiKey = process.env.NUTRITION_API_KEY;

  try {
    console.log(`Searching for: ${query}, encoded: ${encodeURIComponent(query)}`);
    const response = await fetch(
      //   `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=mhsAB8E6u9d5TfxXgcE1irYFMFhokyvdpa8S0GlF&query=${encodeURIComponent(query.replace(" ", "%20"))}`,
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=mhsAB8E6u9d5TfxXgcE1irYFMFhokyvdpa8S0GlF&query=${encodeURIComponent(query)}`,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}
