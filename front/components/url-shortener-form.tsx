"use client";

import { useState, useCallback } from "react";
import { Link2, Copy, Check, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { shortenUrl } from "@/services/api";
import type { ShortenResponse } from "@/types";

export function UrlShortenerForm() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ShortenResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setResult(null);

      // Basic URL validation
      if (!url.trim()) {
        setError("Please enter a URL.");
        return;
      }

      try {
        new URL(url);
      } catch {
        setError("Please enter a valid URL (e.g. https://example.com).");
        return;
      }

      setIsLoading(true);
      try {
        const data = await shortenUrl(url);
        setResult(data);
        setUrl("");
        toast.success("URL shortened successfully!");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to shorten URL.";
        setError(message);
        toast.error("Failed to shorten URL.");
      } finally {
        setIsLoading(false);
      }
    },
    [url]
  );

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy.");
    }
  }, [result]);

  return (
    <div className="flex flex-col gap-8">
      {/* Shorten form */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-balance">
            Shorten any URL in seconds
          </CardTitle>
          <CardDescription className="text-pretty">
            Paste your long URL below and get a clean, trackable short link
            instantly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="https://example.com/very/long/url..."
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError(null);
                  }}
                  className="h-12 pl-10 font-mono text-sm"
                  disabled={isLoading}
                  aria-label="URL to shorten"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="h-12 min-w-[140px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Shortening...
                  </>
                ) : (
                  "Shorten URL"
                )}
              </Button>
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive" role="alert">
                {error}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Result card */}
      {result && (
        <Card className="border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1 overflow-hidden">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Your short URL
              </p>
              <a
                href={result.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 truncate font-mono text-lg font-semibold text-primary hover:underline"
              >
                {result.shortUrl}
                <ExternalLink className="h-4 w-4 shrink-0" />
              </a>
              <p className="text-xs text-muted-foreground">
                {"ID: "}
                {result.shortId}
              </p>
            </div>
            <Button
              onClick={handleCopy}
              variant={copied ? "secondary" : "default"}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy URL
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
