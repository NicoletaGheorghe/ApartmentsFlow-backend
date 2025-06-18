"use client";

export default function SearchBar({ value, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder="Search listings..."
      className="w-80 md:w-100 p-3  border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
    />
  );
}
