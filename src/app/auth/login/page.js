"use client";
import { useState } from "react";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Link from "next/link";


export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    alert(`Logging in with email: ${form.email} and password: ${form.password}`);
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
        />
        <Input
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
        />
        <Button type="submit">Log In</Button>
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
