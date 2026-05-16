import { SearchResults } from "@/data/interface";
// Y32WVV8X9Q Wolfram
// get item
// search for item
export async function searchItems(query: string): Promise<SearchResults> {
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
    const response = await fetch(`/api/search?query=${encodeURIComponent(finalQuery)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function askWolfram(query: string): Promise<string> {
  try {
    const response = await fetch(`/api/wolfram?input=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}
