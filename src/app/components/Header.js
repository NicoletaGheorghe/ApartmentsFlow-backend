"use client";
import Link from "next/link";
import Image from "next/image";
import Dropdown from "./Dropdown";

export default function Header() {
  

  return (
    <header className="bg-[var(--color-secondary)] text-white px-6 py-1 flex justify-between items-center">
      <Image src="/images/logo.png" alt="ApartmentsFlow logo" width={200} height={50} priority/>
      <nav className="flex  space-x-6 text-xl font-semibold">
        <Link href="/" className="hover:text-[var(--color-primary)] ">Home</Link>
        <Link href="/apartmentAdd" className="hover:text-[var(--color-primary)] ">Add</Link>
        <Link href="/listings" className="hover:text-[var(--color-primary)] ">Listings</Link>
        <Link href="/favorites" className="hover:text-[var(--color-primary)]">Favorites</Link>
        <Dropdown/>
      </nav>
    </header>
  );
}
