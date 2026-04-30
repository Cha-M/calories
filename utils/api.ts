import { SearchResults } from "@/data/interface";
//
// get item
// search for item
export async function searchItems(query: string): Promise<SearchResults> {
  // remove hard coded api key and move to env variable
  // const apiKey = process.env.NUTRITION_API_KEY;

  // Sanitize the query: The USDA API expects balanced double quotes for phrase searching.
  // If quotes are unbalanced (e.g., a stray leading quote), we strip them to prevent 400 errors.
  const quoteCount = (query.match(/"/g) || []).length;
  const sanitizedQuery = quoteCount % 2 !== 0 ? query.replace(/"/g, "") : query;

  try {
    console.log(
      `Searching for: ${sanitizedQuery}, encoded: ${encodeURIComponent(sanitizedQuery)}`,
    );
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=mhsAB8E6u9d5TfxXgcE1irYFMFhokyvdpa8S0GlF&query=${encodeURIComponent(sanitizedQuery)}`,
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
