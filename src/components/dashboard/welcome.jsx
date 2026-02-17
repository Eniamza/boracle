import { auth } from "@/auth";
import RandomQuote from "@/components/dashboard/randomQuote";

export default async function Welcome() {
 try {
    const session = await auth()
    const firstName = session?.user?.name ? session.user.name.split(" ")[0] : "";
    
    return (
        <div className="w-full flex flex-col items-center gap-8">
            <div className="w-full pt-7">
                <div className="w-full text-center px-4">
                    <h1 className="text-4xl font-bold mb-4">
                        <span className="dark:text-blue-400 text-blue-900">Welcome to O.R.A.C.L.E</span>{" "}
                    </h1>
                </div>
            </div>

            {/* Dashboard stats section */}
            <div className="w-full max-w-xl px-4">
                <RandomQuote />
            </div>
        </div>
    );
    
 } catch (error) {
    console.error("Failed to fetch user session:", error)
    return (
        <div className="w-full flex items-center justify-center min-h-screen">
            <div className="w-full text-center px-4">
                <h1 className="text-4xl font-bold mb-4">
                    <span className="dark:text-blue-400 text-blue-900">Welcome to O.R.A.C.L.E</span>
                </h1>
                <p className="text-lg">Failed to Get Your Session Data. Please clear your cookies and try logging in again</p>
            </div>
        </div>
    )
    
 }
}