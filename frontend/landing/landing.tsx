export default function Landing() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-black dark:to-indigo-950">
      <main className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to Boardcast
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Your broadcast platform
        </p>
        <button className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
          Get Started
        </button>
      </main>
    </div>
  );
}