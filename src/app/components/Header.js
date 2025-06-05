import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-[var(--color-primary)] text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">ApartmentsFlow</h1>
      <nav className="space-x-6">
        <Link href="/" className="hover:text-[var(--color-accent)]">Home</Link>
        <Link href="/listings" className="hover:text-[var(--color-accent)]">Listings</Link>
        <Link href="/favorites" className="hover:text-[var(--color-accent)]">Favorites</Link>
        <Link href="/auth/login" className="hover:text-[var(--color-accent)]">Login</Link>
      </nav>
    </header>
  );
}
