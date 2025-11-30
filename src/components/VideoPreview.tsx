import { useEffect, useRef } from "react"
import { X, Monitor, Maximize, Minimize } from "lucide-react"

interface VideoPreviewProps {
    stream: MediaStream | null
    onStop: () => void
    isFullScreen: boolean
    onToggleFullScreen: () => void
}

export function VideoPreview({ stream, onStop, isFullScreen, onToggleFullScreen }: VideoPreviewProps) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream
        }
    }, [stream])

    if (!stream) return null

    return (
        <div className={`glass group relative overflow-hidden rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] transition-all duration-500 ${isFullScreen ? 'h-full w-full !rounded-none' : 'hover:scale-[1.01]'}`}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-10" />

            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-contain rounded-2xl"
            />

            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 backdrop-blur-xl border border-white/10">
                    <Monitor className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium text-white">Live Preview</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleFullScreen}
                        className="rounded-full bg-white/10 p-3 text-white backdrop-blur-xl border border-white/10 transition-all hover:bg-white/20 hover:scale-110 active:scale-95"
                    >
                        {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                    </button>
                    <button
                        onClick={onStop}
                        className="rounded-full bg-red-500/20 p-3 text-red-400 backdrop-blur-xl border border-red-500/20 transition-all hover:bg-red-500 hover:text-white hover:scale-110 active:scale-95"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                <div className="rounded-full bg-black/60 px-6 py-2 backdrop-blur-xl border border-white/10 text-sm font-medium text-white/80 shadow-lg">
                    Sharing your screen
                </div>
            </div>
        </div>
    )
}
