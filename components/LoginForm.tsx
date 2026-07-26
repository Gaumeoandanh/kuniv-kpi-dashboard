"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Đăng nhập thất bại.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-600">
          Mật khẩu
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl2 border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          placeholder="Nhập mật khẩu dashboard"
          required
        />
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl2 bg-brand-600 px-4 py-3 font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}
