import { User } from "lucide-react"

interface Friend {
    id: string
    name: string
    status: "online" | "offline"
    avatar?: string
}

interface FriendsListProps {
    friends: Friend[]
    onFriendClick: (friend: Friend) => void
    onHover: (isHovering: boolean) => void
}

export function FriendsList({ friends, onFriendClick, onHover }: FriendsListProps) {
    return (
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
                <h2 className="font-serif text-2xl font-bold tracking-wide text-amber-100 drop-shadow-md">GUEST LIST</h2>
                <span className="rounded-full bg-amber-900/30 px-3 py-1 text-xs font-medium text-amber-400 border border-amber-500/30">
                    {friends.filter(f => f.status === 'online').length} ONLINE
                </span>
            </div>

            <div className="space-y-3">
                {friends.map((friend) => (
                    <button
                        key={friend.id}
                        onClick={() => onFriendClick(friend)}
                        onMouseEnter={() => onHover(true)}
                        onMouseLeave={() => onHover(false)}
                        className="group flex w-full items-center gap-4 rounded-xl border border-transparent bg-white/5 p-3 transition-all hover:border-amber-500/50 hover:bg-amber-900/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <div className="relative">
                            <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-white/10 transition-all group-hover:ring-amber-500/50">
                                <img src={friend.avatar} alt={friend.name} className="h-full w-full object-cover" />
                            </div>
                            <div className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-black ${friend.status === 'online' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-500'}`} />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-amber-50 group-hover:text-amber-200 transition-colors">{friend.name}</p>
                            <p className="text-xs text-white/40 group-hover:text-amber-200/60">Tap to invite</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}
