"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Link from "next/link";


export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("You must fill in both email and password to continue.");
      return;
    }
    setLoading(true);
    try {
      const response = await login(form.email, form.password);

      if (response.data && response.data.token) {
        router.push("/listings");
      } else {
        setError("Login successful but no token received");}
      } catch (err) {
        console.error("Login error:", err.response || err);
        setError(err.response?.data?.message || "Invalid credentials or server error");
      } finally {
        setLoading(false);
      }
    }
  

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center text-[var(--color-primary)]">Login</h2>
      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="name@example.com"
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
        />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <Button type="submit">
          {loading ? 'Logging in...' : 'Login'}
        </Button>
        
        <p className="mt-4 text-center text-sm text-[var(--color-primary)]">
          Don't have an account?{" "}
        <Link href="/auth/register" className="underline hover:text-[var(--color-accent)]">
           Create an account
         </Link>
         </p>

      </form>
    </div>
  );
}