"use client";

export default function SearchBar({ value, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder="Search listings..."
      className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
    />
  );
}
