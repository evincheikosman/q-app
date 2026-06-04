export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen bg-canvas">
      <h1
        className="text-[12rem] font-extrabold leading-none text-forest"
        style={{ fontFamily: "var(--font-bricolage), sans-serif" }}
      >
        Q
      </h1>
      <p
        className="text-sm tracking-widest uppercase text-stone mt-4"
        style={{ fontFamily: "var(--font-bricolage), sans-serif" }}
      >
        Your class, on cue.
      </p>
    </main>
  );
}
