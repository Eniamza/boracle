import FeatureCards from "@/components/homepage/feature-cards";
import SignInOrDashboard from "@/components/homepage/signAndDashboard";
import Counts from "@/components/homepage/counts";
import ServiceStatus from "@/components/homepage/serviceStatus";
import FooterHome from "@/components/homepage/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)] bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <main className="flex-1 flex flex-col gap-10 items-center justify-center px-4 py-16 sm:px-8 sm:py-24">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/40 rounded-full mb-4">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Live & Running</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 dark:from-blue-400 dark:via-blue-300 dark:to-blue-500 bg-clip-text text-transparent">
            BRACU O.R.A.C.L.E
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
            Euphoria for BRACU Students
          </p>
        </div>
        
        <SignInOrDashboard />
        <FeatureCards />
        <Counts />
        <ServiceStatus />
      </main>
      <FooterHome />
    </div>
  );
}