"use client";
import { Input, Button, Checkbox } from "@mui/material";

interface SearchSectionProps {
  query: string;
  setQuery: (val: string) => void;
  searchHandler: () => void;
  areResultsLoading: boolean;
  searchFilter: string;
  setSearchFilter: (val: string) => void;
  brandFilter: boolean;
  setBrandFilter: (val: boolean) => void;
}

export function SearchSection({
  query,
  setQuery,
  searchHandler,
  areResultsLoading,
  searchFilter,
  setSearchFilter,
  brandFilter,
  setBrandFilter,
}: SearchSectionProps) {
  return (
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
  );
}