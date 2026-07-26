import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE,
} from "@/lib/session";

// Very small in-memory rate limit (per server instance) to slow down
// brute-force attempts. For real production traffic, consider a proper
// rate-limiter (e.g. Vercel Edge Config / Upstash) instead.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 8;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Quá nhiều lần thử. Vui lòng thử lại sau." },
      { status: 429 }
    );
  }

  const storedHash = process.env.DASHBOARD_PASSWORD_HASH;
  if (!storedHash) {
    return NextResponse.json(
      { error: "Server chưa cấu hình mật khẩu (DASHBOARD_PASSWORD_HASH)." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const password = body?.password;
  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "Thiếu mật khẩu." }, { status: 400 });
  }

  const ok = verifyPassword(password, storedHash);
  if (!ok) {
    return NextResponse.json({ error: "Sai mật khẩu." }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
  return res;
}
