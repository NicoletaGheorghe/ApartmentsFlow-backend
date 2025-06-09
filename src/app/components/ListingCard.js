"use client";
import Image from "next/image";

export default function ListingCard({ title, price, location, image }) {
  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">
      <div className="relative w-full aspect-square">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold text-[var(--color-primary)]">{title}</h3>
        <p className="text-gray-600">{location}</p>
        <p className="text-[var(--color-accent)] font-bold mt-2">{price}</p>
        <button className="mt-4 px-4 py-2 text-sm bg-[var(--color-accent)] text-white rounded hover:bg-opacity-90 transition">
          View Details
        </button>
      </div>
    </div>
  );
}
