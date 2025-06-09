"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Image from "next/image";

export default function Header() {
  const { isLoggedIn, logout } = useAuth();

  return (
    <header className="bg-[var(--color-primary)] text-white px-6 py-2 flex justify-between items-center">
      <Image
        src="/images/logo.png"
        alt="ApartmentsFlow logo"
        width={150} 
        height={40}
      />
      <nav className="space-x-6 text-lg font-medium">
        <Link href="/" className="hover:text-[var(--color-accent)]">Home</Link>
        <Link href="/listings" className="hover:text-[var(--color-accent)]">Listings</Link>
        <Link href="/favorites" className="hover:text-[var(--color-accent)]">Favorites</Link>
        {!isLoggedIn && (
          <Link href="/auth/login" className="hover:text-[var(--color-accent)]">Login</Link>
        )}
        {isLoggedIn && (
          <button
            onClick={logout}
            className="hover:text-[var(--color-accent)]"
          >
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}
