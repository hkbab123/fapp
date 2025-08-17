'use client';
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const sp = useSearchParams();
  const router = useRouter();
  const next = sp.get("next") || "/accounts";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (r.ok) router.replace(next);
    else setError("Invalid password");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm border rounded-xl p-6 space-y-4">
        <h1 className="text-xl font-semibold text-center">Sign in</h1>
        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
        />
        <button className="w-full border p-2 rounded">Sign in</button>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <p className="text-xs text-gray-500 text-center">
          Local-only. Change password in <code>.env.local</code>
        </p>
      </form>
    </div>
  );
}
