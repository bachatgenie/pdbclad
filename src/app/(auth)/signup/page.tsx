"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { registerUser } from "@/lib/auth-actions";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (password !== confirm) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const result = await registerUser(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/login?registered=1");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-xp-bar flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-xp-bar">PDBclad</h1>
          <p className="text-text-secondary mt-2">Create your account</p>
        </div>

        {/* Signup Card */}
        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1.5">
                Full Name <span className="text-accent-red">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-bg-primary border border-border text-text-primary placeholder-text-muted focus:border-xp-bar focus:ring-1 focus:ring-xp-bar transition-colors"
                placeholder="Avadh Chaudhary"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1.5">
                Email <span className="text-accent-red">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl bg-bg-primary border border-border text-text-primary placeholder-text-muted focus:border-xp-bar focus:ring-1 focus:ring-xp-bar transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1.5">
                Password <span className="text-accent-red">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-bg-primary border border-border text-text-primary placeholder-text-muted focus:border-xp-bar focus:ring-1 focus:ring-xp-bar transition-colors pr-10"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-text-secondary mb-1.5">
                Confirm Password <span className="text-accent-red">*</span>
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl bg-bg-primary border border-border text-text-primary placeholder-text-muted focus:border-xp-bar focus:ring-1 focus:ring-xp-bar transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* Beta Code */}
            <div className="pt-1">
              <label htmlFor="betaCode" className="block text-sm font-medium text-text-secondary mb-1.5">
                Beta Access Code <span className="text-accent-red">*</span>
              </label>
              <input
                id="betaCode"
                name="betaCode"
                type="text"
                required
                className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary placeholder-text-muted focus:border-xp-bar focus:ring-1 focus:ring-xp-bar transition-colors font-mono tracking-widest uppercase"
                placeholder="XXXX-XXXX"
              />
              <p className="text-xs text-text-muted mt-1.5">
                This is an invite-only beta. Get your code from Avadh.
              </p>
            </div>

            {error && (
              <div className="bg-accent-red/10 border border-accent-red/20 rounded-xl px-4 py-3">
                <p className="text-accent-red text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-xp-bar text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-xp-bar hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
