"use client";
import { useState } from "react";
import SearchBar from "../components/SearchBar";
import ListingCard from "../components/ListingCard";

export default function ListingsPage() {
  const [search, setSearch] = useState("");


  const listings = [
    {
      title: "Apartment one",
      price: "£1,000/mo",
      location: "London",
      image: "/images/studio.jpg", 
    },
    {
      title: "Apartment two",
      price: "£1,500/mo",
      location: "London",
      image: "/images/apartment.jpg",
    },
  ];

  const filteredListings = listings.filter((listing) =>
    listing.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Apartment Listings</h1>
      <p className="mb-6">Here you can browse all available apartments.</p>

      <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 max-w-5xl mx-auto px-2">
        {filteredListings.map((listing, index) => (
          <ListingCard key={index} {...listing} />
        ))}
      </div>
    </div>
  );
}
