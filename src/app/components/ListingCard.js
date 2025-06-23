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

  let imageUrl = '/default-image.png'; // Default fallback
  let allImageUrls = [];
  if (images && images.length > 0) {
    const mainImage = images.find(img => img && img.isMain) || images[0];
    if (mainImage && mainImage.url && mainImage.url.trim() !== '') {
      const cleanUrl = mainImage.url.replace(/\\/g, '/').replace(/^\//, '');
      imageUrl = `${backendUrl}/${cleanUrl}`;
    }
    allImageUrls = images.map(img => img.url && img.url.trim() !== '' ? `${backendUrl}/${img.url.replace(/\\/g, '/').replace(/^\//, '')}` : '/default-image.png');
  }

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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative w-full h-48 cursor-pointer" onClick={() => { if (allImageUrls.length > 0) { setModalOpen(true); setCurrentIndex(0); } }}>
        <Image
          src={imageUrl}
          alt={`Image of ${title}`}
          fill
          style={{ objectFit: "cover" }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
        />
        {allImageUrls.length > 1 && (
          <span className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">{allImageUrls.length} photos</span>
        )}
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
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        <p className="text-gray-600 mt-1">
          {address.street}, {address.city}, {address.country}
        </p>
        <p className="text-lg font-bold text-blue-600 mt-2">£{price.toLocaleString()}</p>
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>{bedrooms} Beds</span>
          <span>{bathrooms} Baths</span>
          <span>{area} sqft</span>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
