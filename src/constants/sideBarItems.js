import { Home,Sigma,Star,ChevronsLeftRightEllipsis,Hammer, Cable, BookOpen, Users, ArrowRightLeft } from "lucide-react"

const sidebarGroups = [
    {
        label: "Dashboard",
        items: [
            {
                title: 'Home',
                href: '/dashboard',
                description: 'Dashboard overview with your latest activity and statistics',
                icon: Home,
                enabled: true
            }
        ]
    },
    {
        label: "Academic",
        items: [
            {
                title: 'PrePreReg',
                href: '/dashboard/preprereg',
                description: 'The PrePreReg we love is now in Oracle! Build your routine with ease and get the best possible schedule based on live data',
                icon: Hammer,
                enabled: true
            },
            {
                title: 'Swap',
                href: '/dashboard/courseswap',
                description: 'A centralized platform to swap courses with other students. No more endless emails and waiting for replies!',
                icon: ChevronsLeftRightEllipsis,
                enabled: true
            },
            {
                title: "Merge Routines",
                href: '/dashboard/merge-routines',
                description: 'Merge multiple course routines into one optimized schedule. Perfect for group studies and project collaborations!',
                icon: Cable,
                enabled: true
            }
        ]
    },
    {
        label: "Your Arena",
        items: [
            {
                title: 'Saved Routines',
                href: '/dashboard/savedRoutines',
                description: 'View and manage your saved course routines',
                icon: Users,
                enabled: true
            }
        ]
    }
    // {
    //     label: "Settings",
    //     items: [
    //         {
    //             title: 'Settings',
    //             href: '/dashboard/settings',
    //             description: 'Manage your account and application preferences',
    //             icon: Settings,
    //             enabled: true
    //         }
    //     ]
    // }
]

export default sidebarGroups;