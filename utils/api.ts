import { SearchResults } from "@/data/interface";
//
// get item
// search for item
export async function searchItems(query: string): Promise<SearchResults> {
  const apiKey = process.env.NEXT_PUBLIC_USDA_API_KEY;

  let processedQuery = query.trim();
  processedQuery = processedQuery.replace(/\s+/g, " ");
  const quoteCount = (processedQuery.match(/"/g) || []).length;
  const finalQuery =
    quoteCount % 2 !== 0 ? processedQuery.replace(/"/g, "") : processedQuery;

  // need page in call to api, but for now just return first page of results
  try {
    console.log(
      `Searching for: ${finalQuery}, encoded: ${encodeURIComponent(finalQuery)}`,
    );
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(finalQuery)}`,
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
