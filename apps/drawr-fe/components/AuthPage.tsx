"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@repo/ui/button";
import Link from "next/link";

import { HTTP_BACKEND } from "@/config";
import axios from "axios";

export function AuthPage({ isSignin }: { isSignin: boolean }) {
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!isSignin) {
      try {
        await axios.post(`${HTTP_BACKEND}/signup`, {
          email,
          password,
          username: email.split("@")[0],
        });

        // After successful signup, sign in
        await signInUser(email, password);
      } catch (error: any) {
        setIsPending(false);
        if (error.response?.data.message === "Validation Failed") {
          const validationErrors = error.response.data.error;
          const errorMessages = Object.keys(validationErrors)
            .filter((key) => key !== "_errors")
            .map((key) => validationErrors[key]._errors)
            .flat()
            .join(", ");
          setError(errorMessages);
        } else {
          setError(error.response?.data.message || "Signup failed");
        }
      }
    } else {
      try {
        await signInUser(email, password);
      } catch {
        setIsPending(false);
      }
    }
  };

  const signInUser = async (email: string, password: string) => {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-neutral-900">
      <form onSubmit={handleSubmit}>
        <input
          type="hidden"
          name="type"
          value={isSignin ? "signin" : "signup"}
        />
        <div className="p-8 bg-black rounded-lg shadow-md w-96 border border-neutral-800">
          <h2 className="text-2xl font-bold text-center mb-6 text-white">
            {isSignin ? "Welcome Back" : "Create Account"}
          </h2>
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Email"
                name="email"
                className="w-full px-4 py-2 border border-neutral-700 rounded-md bg-neutral-900 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                onChange={(e) => setError("")}
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                name="password"
                className="w-full px-4 py-2 border border-neutral-700 rounded-md bg-neutral-900 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                onChange={(e) => setError("")}
              />
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

            <div className="pt-4">
              <Button
                variant="primary"
                size="lg"
                disabled={isPending}
                className="w-full bg-white text-black rounded-md hover:bg-neutral-100 transition-opacity"
              >
                {isPending
                  ? isSignin
                    ? "Signing in..."
                    : "Signing up..."
                  : isSignin
                    ? "Sign In"
                    : "Sign Up"}
              </Button>
            </div>
            <div className="text-center text-sm text-neutral-400">
              {isSignin ? (
                <p>
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="text-white hover:underline">
                    Sign up
                  </Link>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <Link href="/signin" className="text-white hover:underline">
                    Sign in
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
