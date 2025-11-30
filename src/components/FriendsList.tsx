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
}

export function FriendsList({ friends, onFriendClick }: FriendsListProps) {
    return (
        <div className="glass w-full max-w-md overflow-hidden rounded-3xl p-6 transition-all duration-500 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)]">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight text-white">Online Friends</h2>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400 backdrop-blur-md">
                    {friends.length} Active
                </span>
            </div>

            <div className="space-y-3">
                {friends.map((friend) => (
                    <button
                        key={friend.id}
                        onClick={() => onFriendClick(friend)}
                        className="glass-hover group flex w-full items-center gap-4 rounded-2xl p-3 text-left transition-all active:scale-95"
                    >
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/50 ring-2 ring-white/5 transition-all group-hover:ring-white/20">
                            {friend.avatar ? (
                                <img src={friend.avatar} alt={friend.name} className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <User className="h-6 w-6" />
                            )}
                            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-black bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-white group-hover:text-white/90 transition-colors">{friend.name}</p>
                            <p className="text-sm text-white/40 group-hover:text-white/60">Tap to share screen</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}
