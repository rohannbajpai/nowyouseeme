"use client"

import { useState, useEffect } from "react"
import { VideoPreview } from "./VideoPreview"
import { useWebRTC } from "@/hooks/useWebRTC"
import { User } from "next-auth"
import { Copy, Phone, PhoneIncoming } from "lucide-react"

interface DashboardProps {
    user: User
}

export function Dashboard({ user }: DashboardProps) {
    const {
        localStream,
        setLocalStream,
        remoteStream,
        callStatus,
        incomingCalls,
        startCall,
        acceptCall,
        endCall
    } = useWebRTC(user.id!)

    const [isTransitioning, setIsTransitioning] = useState(false)
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [friendIdInput, setFriendIdInput] = useState("")

    const activeStream = localStream || remoteStream

    const handleStartCall = async (receiverId: string) => {
        setIsTransitioning(true)
        try {
            const mediaStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            })
            setLocalStream(mediaStream)

            // Handle stream stop from browser UI
            mediaStream.getVideoTracks()[0].onended = () => {
                handleStopCall()
            }

            await startCall(receiverId)
            setIsTransitioning(false)
        } catch (err) {
            console.error("Error sharing screen:", err)
            setIsTransitioning(false)
        }
    }

    const handleStopCall = () => {
        endCall()
        setIsFullScreen(false)
    }

    const copyUserId = () => {
        if (user.id) {
            navigator.clipboard.writeText(user.id)
            // Could add toast here
        }
    }

    return (
        <div className={`relative flex min-h-screen flex-col items-center px-8 text-white selection:bg-white/20 overflow-hidden transition-all duration-700 ${activeStream ? 'pt-0 pb-0 justify-center' : 'pt-32 pb-8'}`}>
            {/* Red Glow Curtains with Texture */}
            <div className={`absolute top-0 left-0 h-full w-[60vw] transition-transform duration-1000 ease-in-out z-20 pointer-events-none ${activeStream ? '-translate-x-[85%]' : ''} ${isFullScreen ? '-translate-x-full' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-red-950 via-red-900/80 to-transparent blur-[60px]" />
                <div className="absolute inset-0 opacity-40 mix-blend-multiply" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, #2a0a0a 60px, transparent 100px)' }} />
            </div>

            <div className={`absolute top-0 right-0 h-full w-[60vw] transition-transform duration-1000 ease-in-out z-20 pointer-events-none ${activeStream ? 'translate-x-[85%]' : ''} ${isFullScreen ? 'translate-x-full' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-l from-red-950 via-red-900/80 to-transparent blur-[60px]" />
                <div className="absolute inset-0 opacity-40 mix-blend-multiply" style={{ backgroundImage: 'repeating-linear-gradient(-90deg, transparent, transparent 40px, #2a0a0a 60px, transparent 100px)' }} />
            </div>

            {!activeStream && (
                <header className={`relative z-30 text-center transition-all duration-700 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'} mt-32 mb-16`}>
                    <h1 className="text-glow font-serif text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-yellow-200 to-amber-500 sm:text-9xl drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                        ShareTime
                    </h1>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <span className="text-white/60">Your ID:</span>
                        <code className="bg-white/10 px-2 py-1 rounded text-amber-200">{user.id}</code>
                        <button onClick={copyUserId} className="p-1 hover:bg-white/10 rounded transition-colors">
                            <Copy className="w-4 h-4 text-white/60" />
                        </button>
                    </div>
                </header>
            )}

            <main className={`relative z-30 w-full transition-all duration-700 ${isTransitioning ? 'opacity-0' : 'opacity-100'} ${activeStream ? 'h-screen flex items-center justify-center' : 'max-w-7xl'}`}>
                {activeStream ? (
                    <div className={`relative transition-all duration-1000 ease-in-out ${isFullScreen ? 'w-screen h-screen fixed inset-0 z-50' : 'w-[80%] h-[80%] perspective-[2000px]'}`}>
                        {!isFullScreen && (
                            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[120%] h-[400px] bg-gradient-to-b from-red-950/50 to-black transform rotate-x-[60deg] blur-xl" />
                        )}

                        <div className={`w-full h-full transition-all duration-700 ${!isFullScreen && 'transform rotate-x-2 hover:rotate-x-0 hover:scale-105 hover:-translate-y-4'}`}>
                            <VideoPreview
                                stream={activeStream}
                                onStop={handleStopCall}
                                isFullScreen={isFullScreen}
                                onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-8">

                        {/* Call Input */}
                        <div className="w-full max-w-md bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                            <h3 className="text-lg font-medium text-white mb-4">Start a Call</h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter Friend's User ID"
                                    value={friendIdInput}
                                    onChange={(e) => setFriendIdInput(e.target.value)}
                                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                                />
                                <button
                                    onClick={() => handleStartCall(friendIdInput)}
                                    disabled={!friendIdInput}
                                    className="bg-amber-500 text-black px-4 py-2 rounded-xl font-medium hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    <Phone className="w-4 h-4" />
                                    Call
                                </button>
                            </div>
                        </div>

                        {/* Incoming Calls List */}
                        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-amber-600/50 bg-black/80 p-8 shadow-[0_0_50px_-12px_rgba(217,119,6,0.5)] backdrop-blur-xl transition-all duration-500 hover:border-amber-500 hover:shadow-[0_0_70px_-12px_rgba(217,119,6,0.7)]">
                            {/* Marquee Lights Effect (Top/Bottom) */}
                            <div className="absolute top-2 left-4 right-4 flex justify-between opacity-50">
                                {[...Array(5)].map((_, i) => (
                                    <div key={`t-${i}`} className="h-1.5 w-1.5 rounded-full bg-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                                ))}
                            </div>
                            <div className="absolute bottom-2 left-4 right-4 flex justify-between opacity-50">
                                {[...Array(5)].map((_, i) => (
                                    <div key={`b-${i}`} className="h-1.5 w-1.5 rounded-full bg-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                                ))}
                            </div>

                            <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
                                <h2 className="font-serif text-2xl font-bold tracking-wide text-amber-100 drop-shadow-md">INCOMING CALLS</h2>
                                <span className="rounded-full bg-amber-900/30 px-3 py-1 text-xs font-medium text-amber-400 border border-amber-500/30">
                                    {incomingCalls.length} WAITING
                                </span>
                            </div>

                            <div className="space-y-3">
                                {incomingCalls.length === 0 ? (
                                    <div className="text-center py-8 text-white/30 italic">
                                        No incoming calls...
                                    </div>
                                ) : (
                                    incomingCalls.map((call) => (
                                        <div
                                            key={call.callId}
                                            className="group flex w-full items-center justify-between gap-4 rounded-xl border border-transparent bg-white/5 p-4 transition-all hover:border-amber-500/50 hover:bg-amber-900/20"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse">
                                                    <PhoneIncoming className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-medium text-amber-50 group-hover:text-amber-200 transition-colors">
                                                        {call.callerId}
                                                    </p>
                                                    <p className="text-xs text-white/40 group-hover:text-amber-200/60">
                                                        Wants to share screen
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => acceptCall(call.callId, call.offer)}
                                                className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-sm font-medium border border-emerald-500/20 hover:border-emerald-500"
                                            >
                                                Accept
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
