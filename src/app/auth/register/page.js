"use client";
import { ApiClient } from "../../../../apiClient/apiClient";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function Register() {
  const [registrationForm, setRegistrationForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  function handleChange(e) {
    setRegistrationForm({ ...registrationForm, [e.target.name]: e.target.value });
    setError("");
  }

  const handleSubmit =async (e) => {
    e.preventDefault();
    if (!registrationForm.name || !registrationForm.email || !registrationForm.password){
      setError("All fields must be completed before submitting.");
      return;
    }
    setLoading(true);
    try{
      const apiClient = new ApiClient();
      const response = await register(registrationForm.name, registrationForm.email, registrationForm.password);
      if (response.data && response.data.token){
        router.push("/listings");
      } else {
        setError("Registered successfully but no token received.");
      }
    }catch (err) {
      console.error("Register error:", err.response || err);
      setError(err.response?.data?.message || "Invalid credentials.");
    }finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center text-[var(--color-primary)]">
        Register
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={registrationForm.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={registrationForm.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={registrationForm.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        {error && <p className="mb-4 text-red-500 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-[var(--color-secondary)] text-white py-2 px-4 rounded hover:bg-[var(--color-accent)]"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}
