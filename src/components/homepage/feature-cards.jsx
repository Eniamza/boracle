'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { ArrowRight } from "lucide-react"
import featureList from "@/constants/featureList"

export default function FeatureCards() {
    const { data: session } = useSession();
    const isLoggedIn = !!session?.user?.email;

    return (
        <div className="flex flex-wrap justify-center gap-6">
            {featureList.map((feature) => {
                const visitHref = feature.href
                    ? (isLoggedIn ? feature.dashboardHref : feature.href)
                    : null;

                return (
                    <Card
                        className="bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 h-[280px] w-[220px] flex flex-col"
                        key={feature.index}
                    >
                        <CardHeader className="text-center pb-2 text-blue-400">
                            <CardTitle>{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center flex-grow flex flex-col justify-center pt-0 dark:text-blue-200">
                            <CardDescription><span className="text-gray-500 dark:text-blue-200">{feature.description}</span></CardDescription>
                        </CardContent>
                        <CardFooter className="pt-2 w-full flex flex-col items-center gap-2 mt-auto">
                            {visitHref && (
                                <Link
                                    href={visitHref}
                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
                                >
                                    Visit
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            )}
                            <span className="text-sm text-gray-400">{feature.footer}</span>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    )
}