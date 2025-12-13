import Link from "next/link";
import { getAllSupportArticles } from "@/lib/content/support";
import { BookOpen, Layers, Calculator, ArrowLeft } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  "getting-started": <BookOpen className="h-6 w-6" />,
  "fcf-builder-guide": <Layers className="h-6 w-6" />,
  "stack-up-guide": <Calculator className="h-6 w-6" />,
};

export const metadata = {
  title: "Support | DatumPilot",
  description:
    "Learn how to use DatumPilot for GD&T Feature Control Frames and tolerance stack-up analysis.",
};

export default function SupportPage() {
  const articles = getAllSupportArticles();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            DatumPilot Support
          </span>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Support Documentation
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Learn how to build Feature Control Frames and perform tolerance
            stack-up analysis with DatumPilot.
          </p>
        </div>

        {/* Article Cards */}
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-1">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/support/${article.slug}`}
              className="group block"
            >
              <article className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    {iconMap[article.slug] || <BookOpen className="h-6 w-6" />}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                      {article.title}
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      {article.description}
                    </p>
                    {article.lastUpdated && (
                      <p className="mt-3 text-sm text-gray-500 dark:text-gray-500">
                        Last updated: {article.lastUpdated}
                      </p>
                    )}
                  </div>
                  <div className="text-gray-400 transition-transform group-hover:translate-x-1 dark:text-gray-600">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 rounded-xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Need more help?
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Can&apos;t find what you&apos;re looking for? Contact our support team.
          </p>
          <a
            href="mailto:support@datumpilot.com"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
