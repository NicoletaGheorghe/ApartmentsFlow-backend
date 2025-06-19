"use client";

export default function Sidebar({ filters = {}, onFilterChange }) {
  const { minPrice = 0, maxPrice = 3000, bedrooms = 0, radius = 10 } = filters;

  const handleChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: parseInt(value),
    });
  };

  const resetFilters = () => {
    onFilterChange({
      minPrice: 0,
      maxPrice: 3000,
      bedrooms: 0,
      radius: 10,
    });
  };

  return (
    <aside className="w-64 h-screen p-6 bg-white border-r hidden md:block overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">Filters</h2>

      {/* Min Price */}
      <div className="mb-6">
        <label className="block font-semibold mb-1">Min Price (£): {minPrice}</label>
        <input
          type="range"
          min="0"
          max="3000"
          step="50"
          value={minPrice}
          onChange={(e) => handleChange("minPrice", e.target.value)}
          className="w-full"
        />
      </div>

      {/* Max Price */}
      <div className="mb-6">
        <label className="block font-semibold mb-1">Max Price (£): {maxPrice}</label>
        <input
          type="range"
          min="0"
          max="5000"
          step="50"
          value={maxPrice}
          onChange={(e) => handleChange("maxPrice", e.target.value)}
          className="w-full"
        />
      </div>

      {/* Bedrooms */}
      <div className="mb-6">
        <label className="block font-semibold mb-1">Bedrooms: {bedrooms}+</label>
        <input
          type="range"
          min="0"
          max="5"
          step="1"
          value={bedrooms}
          onChange={(e) => handleChange("bedrooms", e.target.value)}
          className="w-full"
        />
      </div>

      {/* Radius */}
      <div className="mb-6">
        <label className="block font-semibold mb-1">Radius: {radius} km</label>
        <input
          type="range"
          min="1"
          max="50"
          step="1"
          value={radius}
          onChange={(e) => handleChange("radius", e.target.value)}
          className="w-full"
        />
      </div>

      {/* Reset Filters */}
      <button
        onClick={resetFilters}
        className="w-full bg-gray-100 text-sm text-gray-700 py-2 rounded hover:bg-gray-200 transition"
      >
        Reset Filters
      </button>
    </aside>
  );
}