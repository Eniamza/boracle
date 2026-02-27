'use client';

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
                    <div
                        key={feature.index}
                        className="bg-blue-50 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-800 rounded-xl shadow-sm h-[280px] w-[220px] flex flex-col p-5"
                    >
                        {/* Title */}
                        <h3 className="text-center font-semibold text-blue-400 mb-2">
                            {feature.title}
                        </h3>

                        {/* Description — takes remaining space, centers text vertically */}
                        <div className="flex-1 flex items-center justify-center text-center">
                            <p className="text-sm text-gray-500 dark:text-blue-200">
                                {feature.description}
                            </p>
                        </div>

                        {/* Footer — always pinned at the bottom */}
                        <div className="flex flex-col items-center gap-2 pt-2">
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
                        </div>
                    </div>
                );
            })}
        </div>
    )
}