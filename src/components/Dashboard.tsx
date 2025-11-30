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

export function Dashboard() {
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [selectedFriend, setSelectedFriend] = useState<string | null>(null)

    const handleFriendClick = async (friend: { name: string }) => {
        try {
            const mediaStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            })
            setStream(mediaStream)
            setSelectedFriend(friend.name)

            // Handle stream stop (e.g. user clicks "Stop sharing" in browser UI)
            mediaStream.getVideoTracks()[0].onended = () => {
                stopSharing()
            }
        } catch (err) {
            console.error("Error sharing screen:", err)
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
        <div className="relative flex min-h-screen flex-col items-center pt-32 pb-8 px-8 text-white selection:bg-white/20 overflow-hidden">
            {/* Abstract Background Shapes */}
            <div className="animate-float absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[128px] opacity-50" />
            <div className="animate-float-delayed absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[128px] opacity-50" />

            <header className="relative z-10 mb-12 text-center">
                <h1 className="text-glow text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 sm:text-7xl">
                    Now You See Me
                </h1>
                <p className="mt-6 text-xl text-white/50 font-light tracking-wide">
                    {selectedFriend
                        ? <span className="text-emerald-400 text-glow">Sharing with {selectedFriend}</span>
                        : "Select a friend to start sharing"}
                </p>
            </header>

            <main className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-start lg:justify-center">
                <div className="w-full max-w-md shrink-0 transition-all duration-500">
                    <FriendsList friends={MOCK_FRIENDS} onFriendClick={handleFriendClick} />
                </div>

                {stream && (
                    <div className="w-full flex-1 animate-in fade-in zoom-in slide-in-from-bottom-10 duration-700 ease-out">
                        <VideoPreview stream={stream} onStop={stopSharing} />
                    </div>
                )}
            </main>
        </div>
    )
}
