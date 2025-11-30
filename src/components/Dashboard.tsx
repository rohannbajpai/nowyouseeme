"use client"

import { useState } from "react"
import { FriendsList } from "./FriendsList"
import { VideoPreview } from "./VideoPreview"

const MOCK_FRIENDS = [
    { id: "1", name: "Alice Johnson", status: "online" as const, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice" },
    { id: "2", name: "Bob Smith", status: "online" as const, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob" },
    { id: "3", name: "Charlie Brown", status: "online" as const, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie" },
    { id: "4", name: "Diana Prince", status: "online" as const, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Diana" },
]

import { RecentActivity } from "./RecentActivity"

export function Dashboard() {
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [selectedFriend, setSelectedFriend] = useState<string | null>(null)
    const [isHovering, setIsHovering] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [isFullScreen, setIsFullScreen] = useState(false)

    const handleFriendClick = async (friend: { name: string }) => {
        setIsTransitioning(true)

        // Wait for combine animation
        await new Promise(resolve => setTimeout(resolve, 1000))

        try {
            const mediaStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            })
            setStream(mediaStream)
            setSelectedFriend(friend.name)
            setIsTransitioning(false)

            // Handle stream stop (e.g. user clicks "Stop sharing" in browser UI)
            mediaStream.getVideoTracks()[0].onended = () => {
                stopSharing()
            }
        } catch (err) {
            console.error("Error sharing screen:", err)
            setIsTransitioning(false)
        }
    }

    const stopSharing = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop())
            setStream(null)
            setSelectedFriend(null)
        }
    }

    return (
        <div className={`relative flex min-h-screen flex-col items-center px-8 text-white selection:bg-white/20 overflow-hidden transition-all duration-700 ${stream ? 'pt-0 pb-0 justify-center' : 'pt-32 pb-8'}`}>
            {/* Red Glow Curtains with Texture */}
            {/* Left Curtain */}
            <div
                className={`absolute top-0 left-0 h-full w-[60vw] transition-transform duration-1000 ease-in-out z-20 pointer-events-none ${stream ? '-translate-x-[85%]' : ''} ${isFullScreen ? '-translate-x-full' : ''}`}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-red-950 via-red-900/80 to-transparent blur-[60px]" />
                <div
                    className="absolute inset-0 opacity-40 mix-blend-multiply"
                    style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, #2a0a0a 60px, transparent 100px)' }}
                />
            </div>

            {/* Right Curtain */}
            <div
                className={`absolute top-0 right-0 h-full w-[60vw] transition-transform duration-1000 ease-in-out z-20 pointer-events-none ${stream ? 'translate-x-[85%]' : ''} ${isFullScreen ? 'translate-x-full' : ''}`}
            >
                <div className="absolute inset-0 bg-gradient-to-l from-red-950 via-red-900/80 to-transparent blur-[60px]" />
                <div
                    className="absolute inset-0 opacity-40 mix-blend-multiply"
                    style={{ backgroundImage: 'repeating-linear-gradient(-90deg, transparent, transparent 40px, #2a0a0a 60px, transparent 100px)' }}
                />
            </div>

            {!stream && (
                <header
                    className={`relative z-30 text-center transition-all duration-700 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'} mt-32 mb-16`}
                >
                    <h1 className="text-glow font-serif text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-yellow-200 to-amber-500 sm:text-9xl drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                        ShareTime
                    </h1>
                </header>
            )}

            <main className={`relative z-30 w-full transition-all duration-700 ${isTransitioning ? 'opacity-0' : 'opacity-100'} ${stream ? 'h-screen flex items-center justify-center' : 'max-w-7xl'}`}>
                {stream ? (
                    <div className={`relative transition-all duration-1000 ease-in-out ${isFullScreen ? 'w-screen h-screen fixed inset-0 z-50' : 'w-[80%] h-[80%] perspective-[2000px]'}`}>
                        {/* Stage Floor */}
                        {!isFullScreen && (
                            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[120%] h-[400px] bg-gradient-to-b from-red-950/50 to-black transform rotate-x-[60deg] blur-xl" />
                        )}

                        <div className={`w-full h-full transition-all duration-700 ${!isFullScreen && 'transform rotate-x-2 hover:rotate-x-0 hover:scale-105 hover:-translate-y-4'}`}>
                            <VideoPreview
                                stream={stream}
                                onStop={stopSharing}
                                isFullScreen={isFullScreen}
                                onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <div className="relative group w-full max-w-md">
                            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500/10 to-red-500/10 blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
                            <FriendsList friends={MOCK_FRIENDS} onFriendClick={handleFriendClick} onHover={setIsHovering} />
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
