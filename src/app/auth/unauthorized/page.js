"use client";
import { useRouter } from "next/navigation"

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-light)] ">
        <div className="bg-white/50 p-8 rounded-xl shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-[var(--color-error)] mb-4">
          Unauthorized Access
        </h1>
        <p className="text-gray-600 mb-6">
          Please log in to access this page.
        </p>
        <button
          onClick={() => router.push('/auth/login')}
          className="w-full py-2 px-4 rounded-lg font-medium"
        >
          Go to Login
        </button>
      </div>
    </div>
  )
}
