"use client";
import Image from "next/image";
import { useState } from "react";
import React from "react";

const ListingCard = ({ apartment }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    title = "Untitled",
    description = "",
    price = 0,
    location = {},
    bedrooms = 0,
    bathrooms = 0,
    area = 0,
    amenities = [],
    images = [],
    status = "available",
  } = apartment || {};

  const { address = {} } = location;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  // Ensure we always have a valid image URL
  const getImageUrl = (imageObj) => {
    if (!imageObj || !imageObj.url || imageObj.url.trim() === '') {
      return '/default-image.png';
    }
    const cleanUrl = imageObj.url.replace(/\\/g, '/').replace(/^\//, '');
    return `${backendUrl}/${cleanUrl}`;
  };

  // Get main image URL with proper fallback
  const imageUrl = images && images.length > 0 
    ? getImageUrl(images.find(img => img && img.isMain) || images[0])
    : '/default-image.png';

  // Get all image URLs with proper fallbacks
  const allImageUrls = images && images.length > 0
    ? images.map(img => getImageUrl(img))
    : ['/default-image.png'];

  // Status badge styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { text: 'Available', color: 'bg-green-100 text-green-800' },
      rented: { text: 'Rented', color: 'bg-red-100 text-red-800' },
      pending: { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      unavailable: { text: 'Unavailable', color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[status.toLowerCase()] || statusConfig.available;
    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Format amenities for display
  const formatAmenities = (amenities) => {
    if (!amenities || amenities.length === 0) return [];
    
    // Handle both string and array formats
    const amenityList = Array.isArray(amenities) 
      ? amenities 
      : amenities.split(',').map(item => item.trim()).filter(item => item);
    
    return amenityList.slice(0, 3); // Show only first 3 amenities
  };

  // Modal navigation
  const goPrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? allImageUrls.length - 1 : prev - 1));
  };
  const goNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === allImageUrls.length - 1 ? 0 : prev + 1));
  };
  const closeModal = () => setModalOpen(false);

  // Keyboard close
  React.useEffect(() => {
    if (!modalOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [modalOpen]);

  const displayAmenities = formatAmenities(amenities);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative w-full h-48 cursor-pointer" onClick={() => { if (allImageUrls.length > 0) { setModalOpen(true); setCurrentIndex(0); } }}>
        <Image
          src={imageUrl}
          alt={`Image of ${title}`}
          fill
          style={{ objectFit: "cover" }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={true}
        />
        {allImageUrls.length > 1 && (
          <span className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">{allImageUrls.length} photos</span>
        )}
        {/* Status badge overlay */}
        <div className="absolute top-2 left-2">
          {getStatusBadge(status)}
        </div>
      </div>
      {/* Modal Gallery */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={closeModal}>
          <div className="relative max-w-2xl w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-2 right-2 text-white text-2xl font-bold">&times;</button>
            <Image
              src={allImageUrls[currentIndex]}
              alt={`Gallery image ${currentIndex + 1} of ${title}`}
              width={600}
              height={400}
              className="rounded shadow max-h-[70vh] object-contain"
            />
            {allImageUrls.length > 1 && (
              <>
                <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white text-2xl px-3 py-1 rounded-full">&#8592;</button>
                <button onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white text-2xl px-3 py-1 rounded-full">&#8594;</button>
                <div className="mt-2 text-white text-sm">{currentIndex + 1} / {allImageUrls.length}</div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-gray-600 text-sm mb-2">
          {address.street}, {address.city}, {address.country}
        </p>
        <p className="text-lg font-bold text-blue-600 mb-3">£{price.toLocaleString()}</p>
        
        {/* Property details */}
        <div className="flex justify-between text-sm text-gray-600 mb-3">
          <span className="flex items-center">
            <span className="font-medium">{bedrooms}</span> Beds
          </span>
          <span className="flex items-center">
            <span className="font-medium">{bathrooms}</span> Baths
          </span>
          <span className="flex items-center">
            <span className="font-medium">{area}</span> sqft
          </span>
        </div>

        {/* Amenities */}
        {displayAmenities.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 font-medium mb-1">Amenities:</p>
            <div className="flex flex-wrap gap-1">
              {displayAmenities.map((amenity, index) => (
                <span 
                  key={index} 
                  className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                >
                  {amenity}
                </span>
              ))}
              {formatAmenities(amenities).length > 3 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">
                  +{formatAmenities(amenities).length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Description preview */}
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {description.length > 100 ? `${description.substring(0, 100)}...` : description}
          </p>
        )}
      </div>
    </div>
  );
};

export default ListingCard;
