"use client"

import { signIn } from "next-auth/react"
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { app } from "@/lib/firebase"
import { useState } from "react"

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)

    const handleGoogleSignIn = async () => {
        setIsLoading(true)
        try {
            const auth = getAuth(app)
            const provider = new GoogleAuthProvider()
            const result = await signInWithPopup(auth, provider)
            const idToken = await result.user.getIdToken()

            await signIn("credentials", {
                idToken,
                callbackUrl: "/"
            })
        } catch (error) {
            console.error("Error signing in:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden text-white selection:bg-white/20">
            {/* Abstract Background Shapes */}
            <div className="animate-pulse-glow absolute -top-20 -left-20 h-96 w-96 rounded-full bg-red-600/30 blur-[128px]" />
            <div className="animate-pulse-glow absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-red-600/30 blur-[128px]" style={{ animationDelay: '2s' }} />

            <div className="glass relative z-10 w-full max-w-md space-y-8 rounded-3xl p-10 text-center">
                <div className="space-y-4">
                    <h1 className="text-glow text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                        Now You See Me
                    </h1>
                    <p className="text-lg text-white/50">
                        The future of screen sharing is here.
                    </p>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-white text-black transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="relative z-10 text-lg font-medium">
                        {isLoading ? "Signing in..." : "Sign in with Google"}
                    </span>
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </button>
            </div>
        </div>
    )
}
