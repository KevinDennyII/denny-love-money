export default function OurStory() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-950 via-background to-amber-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full space-y-10 text-center">
        <div className="space-y-3">
          <div className="flex justify-center items-center gap-4 mb-2">
            <img src="/honey-dipper.png" alt="Honey Dipper" className="w-16 h-16" />
            <img src="/strawberry-cupcake.png" alt="Strawberry Cupcake" className="w-16 h-16" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-amber-400 bg-clip-text text-transparent">
            Denny Love Money
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            A little place Kevin built so HB &amp; SC can see their full financial picture — together.
          </p>
        </div>

        <div className="space-y-8">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-pink-500/20 bg-black/30 backdrop-blur">
            <video
              className="w-full"
              controls
              muted
              loop
              playsInline
            >
              <source src="/denny-love-money-intro.mp4" type="video/mp4" />
            </video>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-2xl border border-amber-500/20 bg-black/30 backdrop-blur">
            <video
              className="w-full"
              controls
              muted
              loop
              playsInline
            >
              <source src="/denny-love-money-together.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        <div className="bg-card/60 backdrop-blur border border-border/30 rounded-2xl p-8 shadow-xl space-y-4">
          <p className="text-xl font-medium text-foreground">
            Hey Jamie 💕
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Kevin has been keeping everything up to date — every account, every bill, every debt, and every dollar we're saving. This is our one place to see it all clearly.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Even just a peek once a month makes a huge difference. We're in this together. ❤️
          </p>
          <a
            href="/auth"
            className="inline-block mt-2 px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-amber-500 text-white font-semibold text-lg hover:from-pink-600 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-pink-500/25"
          >
            Let's look together →
          </a>
        </div>

        <p className="text-xs text-muted-foreground/50">
          Built with love for the Denny family 🏠
        </p>
      </div>
    </div>
  );
}
