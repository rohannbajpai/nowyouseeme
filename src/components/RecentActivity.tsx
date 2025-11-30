import { Clock } from "lucide-react"

export function RecentActivity() {
    const activities = [
        { id: 1, name: "Alice Johnson", time: "2 hours ago", duration: "45m" },
        { id: 2, name: "Bob Smith", time: "Yesterday", duration: "1h 20m" },
        { id: 3, name: "Team Sync", time: "2 days ago", duration: "30m" },
    ]

    return (
        <div className="glass relative w-full max-w-md overflow-hidden rounded-3xl border border-white/5 bg-black/40 p-6 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] h-full">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight text-white">Recent Activity</h2>
                <Clock className="h-5 w-5 text-white/50" />
            </div>

            <div className="space-y-3">
                {activities.map((activity) => (
                    <div
                        key={activity.id}
                        className="group flex w-full items-center gap-4 rounded-2xl bg-white/5 p-3 transition-all hover:bg-white/10"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/50 ring-1 ring-white/10">
                            <span className="text-lg font-bold">{activity.name[0]}</span>
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-white group-hover:text-white/90 transition-colors">{activity.name}</p>
                            <p className="text-sm text-white/40">Shared for {activity.duration}</p>
                        </div>
                        <span className="text-xs text-white/30">{activity.time}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
