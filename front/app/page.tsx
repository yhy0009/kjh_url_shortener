import { UrlShortenerForm } from "@/components/url-shortener-form";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      {/* Hero section */}
      <section className="flex flex-col items-center gap-4 pt-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl text-balance">
          Smart Links, Smarter Insights
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground text-pretty leading-relaxed">
          Shorten your URLs, track every click in real-time, and unlock
          AI-powered marketing trends — all in one dashboard.
        </p>
      </section>

      {/* Shortener form */}
      <section className="mx-auto w-full max-w-2xl">
        <UrlShortenerForm />
      </section>

      {/* Feature highlights */}
      <section className="grid gap-6 sm:grid-cols-3">
        <FeatureCard
          title="Instant Shortening"
          description="Paste any URL and get a clean, memorable short link in milliseconds."
        />
        <FeatureCard
          title="Click Analytics"
          description="Track clicks by hour, day, and referrer with detailed visual charts."
        />
        <FeatureCard
          title="AI Trend Insights"
          description="Get automated marketing insights powered by GPT-4o-mini analysis."
        />
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 text-center transition-shadow hover:shadow-md">
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
