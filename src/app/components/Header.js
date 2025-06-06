"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Image from "next/image";

export default function Header() {
  const {isLoggedIn, logout} = useAuth();


  return (
    <header className="bg-[var(--color-secondary)] text-white px-6 py-1 flex justify-between items-center">
      <Image src="/images/logo.png" alt="ApartmentsFlow logo" width={200} height={50}/>
      <nav className="space-x-6">
        <Link href="/" className="hover:text-[var(--color-accent)]">Home</Link>
        <Link href="/listings" className="hover:text-[var(--color-accent)]">Listings</Link>
        <Link href="/favorites" className="hover:text-[var(--color-accent)]">Favorites</Link>
        {!isLoggedIn && (
           <Link href="/auth/login" className="hover:text-[var(--color-accent)]">Login</Link>)}
        {isLoggedIn && (
          <button onClick={logout} >
              Logout
            </button>)}
      </nav>
    </header>
  );
}
