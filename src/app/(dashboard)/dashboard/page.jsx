import { auth } from '@/auth'
import Welcome from '@/components/dashboard/welcome'
import UserStats from '@/components/dashboard/userStats'
import DiscordBanner from '@/components/dashboard/discordBanner'
import RecentActivity from '@/components/dashboard/recentActivity'

export default async function DashboardPage() {
        return (
            <div className="w-full min-h-screen">
                <div className="flex flex-col items-center gap-8 px-4 py-6">
                    <Welcome />
                    <UserStats />
                    <DiscordBanner />
                    <RecentActivity />
                </div>
            </div>
        )
};
