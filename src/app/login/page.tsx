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
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden text-white selection:bg-yellow-500/30 bg-black">
            {/* Red Glow Curtains with Texture */}
            <div className="absolute top-0 left-0 h-full w-[60vw] z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-red-950 via-red-900/60 to-transparent blur-[60px]" />
                <div className="absolute inset-0 opacity-40 mix-blend-multiply" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, #2a0a0a 60px, transparent 100px)' }} />
            </div>

            <div className="absolute top-0 right-0 h-full w-[60vw] z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-l from-red-950 via-red-900/60 to-transparent blur-[60px]" />
                <div className="absolute inset-0 opacity-40 mix-blend-multiply" style={{ backgroundImage: 'repeating-linear-gradient(-90deg, transparent, transparent 40px, #2a0a0a 60px, transparent 100px)' }} />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-md p-8">
                <div className="relative overflow-hidden rounded-3xl border-2 border-yellow-500/50 bg-black/80 p-10 shadow-[0_0_50px_-12px_rgba(234,179,8,0.5)] backdrop-blur-xl transition-all duration-500 hover:border-yellow-400 hover:shadow-[0_0_70px_-12px_rgba(234,179,8,0.7)]">

                    {/* Marquee Lights Effect (Top/Bottom) */}
                    <div className="absolute top-3 left-6 right-6 flex justify-between opacity-50">
                        {[...Array(5)].map((_, i) => (
                            <div key={`t-${i}`} className="h-1.5 w-1.5 rounded-full bg-yellow-200 shadow-[0_0_10px_rgba(253,224,71,0.8)] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                        ))}
                    </div>
                    <div className="absolute bottom-3 left-6 right-6 flex justify-between opacity-50">
                        {[...Array(5)].map((_, i) => (
                            <div key={`b-${i}`} className="h-1.5 w-1.5 rounded-full bg-yellow-200 shadow-[0_0_10px_rgba(253,224,71,0.8)] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                        ))}
                    </div>

                    <div className="space-y-8 text-center">
                        <div className="space-y-4">
                            <h1 className="text-glow font-serif text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-100 to-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                                ShareTime
                            </h1>
                            <p className="text-lg text-yellow-100/60 font-medium tracking-wide">
                                The Stage is Yours
                            </p>
                        </div>

                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-yellow-300 via-yellow-100 to-yellow-500 text-black transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(234,179,8,0.5)] focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="relative z-10 text-lg font-bold tracking-wide uppercase">
                                {isLoading ? "Signing in..." : "Enter the Show"}
                            </span>
                            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
