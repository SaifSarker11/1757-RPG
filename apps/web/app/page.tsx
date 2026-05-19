export default async function Home() {
  let apiStatus = "unreachable";
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "/health",
      { cache: "no-store" }
    );
    const data = await res.json();
    apiStatus = data.status;
  } catch {}

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">1757 🪶📜🌕ִֶָ</h1>
        <p className="mt-4 text-gray-500">API: <span className="text-green-500">{apiStatus}</span></p>
      </div>
    </main>
  );
}