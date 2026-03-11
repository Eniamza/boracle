'use client';

export default function DiscordBanner() {
    return (
        <a
            href="https://discord.eniamza.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-transparent border border-blue-300 dark:border-blue-800 hover:bg-blue-900/20 dark:hover:bg-blue-400/15 transition-colors duration-200"
        >
            <span
                className="text-sm font-semibold text-blue-900 dark:text-blue-300 tracking-wide uppercase whitespace-nowrap"
                style={{ fontFamily: "'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
            >
                Join us on Discord
            </span>
        </a>
    );
}
