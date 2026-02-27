import ChatInterface from '../components/ChatInterface';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-zinc-50 dark:bg-black">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm lg:flex">
        <ChatInterface />
      </div>
    </main>
  );
}
