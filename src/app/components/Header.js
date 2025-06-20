"use client";
import Link from "next/link";
import Image from "next/image";
import Dropdown from "./Dropdown";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-[var(--color-secondary)] text-white px-6 py-1 flex justify-between items-center">
      <div className="w-[120px] md:w-[200px]">
         <Image 
           src="/images/logo.png" 
           alt="ApartmentsFlow logo" 
           width={200} 
           height={50} 
           priority 
           style={{ width: 'auto', height: 'auto' }}
         />
       </div>
      <nav className="hidden md:flex space-x-6 text-xl font-semibold items-center">
        <Link href="/" className="hover:text-[var(--color-primary)]">
          Home
        </Link>
        <Link href="/apartmentAdd" className="hover:text-[var(--color-primary)]">
          Add
        </Link>
        <Link href="/listings" className="hover:text-[var(--color-primary)]">
          Listings
        </Link>
        <Link href="/favorites" className="hover:text-[var(--color-primary)]">
          Favorites
        </Link>
        <Dropdown />
      </nav>

      
      <div className="relative md:hidden">
        <button
          className="text-3xl"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✖" : "☰"}
        </button>

       
        {menuOpen && (
          <nav className="absolute right-0 mt-2 w-48 bg-[var(--color-secondary)] rounded-md border-1 border-solid border-[var(--color-primary)] shadow-lg z-50">
            <ul className="flex flex-col text-xl font-semibold">
              <li>
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 px-4 hover:text-[var(--color-primary)]"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/apartmentAdd"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 px-4 hover:text-[var(--color-primary)]"
                >
                  Add
                </Link>
              </li>
              <li>
                <Link
                  href="/listings"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 px-4 hover:text-[var(--color-primary)]"
                >
                  Listings
                </Link>
              </li>
              <li>
                <Link
                  href="/favorites"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 px-4 hover:text-[var(--color-primary)]"
                >
                  Favorites
                </Link>
              </li>
              <li className="ml-4">
                <Dropdown />
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
