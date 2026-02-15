export default async function RandomQuote() {
    const res = await fetch(`https://zenquotes.io/api/random`, {
        next: { revalidate: 3600 } // Revalidate every 3660 seconds
    });

    if (!res.ok) {
        throw new Error('Failed to fetch random quote');
    }

    const data = await res.json()
    const quote = data[0].q;
    const author = data[0].a;

    return (
        <div className="text-center px-4">
            <p className="text-base sm:text-lg italic text-gray-600 dark:text-gray-300 leading-relaxed">
                "{quote}"
            </p>
            <p className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                — {author}
            </p>
        </div>
    );
}