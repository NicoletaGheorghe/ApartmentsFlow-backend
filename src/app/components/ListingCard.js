"use client";
import Image from "next/image";

export default function ListingCard({ title, description, price, street, city, state, zipCode, country, bedrooms, bathrooms, area, amenities, images, status }) {
  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">
      <div className="relative w-full aspect-square">
        <Image
          src={images && images.length > 0 ? images[0] : "/default-image.png"}
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold text-[var(--color-primary)]">{title}</h3>
        <p className="text-gray-600">{description}</p>
        <p className="text-[var(--color-accent)] font-bold mt-2">{price}</p>

        <p className="text-gray-600"><span className="text-xs">Street:</span> {street}</p>
        <p className="text-gray-600"><span className="text-xs">City:</span> {city}</p>
        <p className="text-gray-600"><span className="text-xs">State:</span> {state}</p>
        <p className="text-gray-600"><span className="text-xs">Zip Code:</span> {zipCode}</p>
        <p className="text-gray-600"><span className="text-xs">Country:</span> {country}</p>
        <p className="text-gray-600"><span className="text-xs">Bedrooms:</span> {bedrooms}</p>
        <p className="text-gray-600"><span className="text-xs">Bathrooms:</span> {bathrooms}</p>
        <p className="text-gray-600"><span className="text-xs">Area:</span> {area} m²</p>
        <p className="text-gray-600"><span className="text-xs">Amenities:</span> {amenities}</p> 
        <p className="text-gray-600"><span className="text-xs">Status:</span> {status}</p>
        
      </div>
    </div>
  );
}
