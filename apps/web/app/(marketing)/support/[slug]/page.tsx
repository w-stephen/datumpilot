import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import {
  getSupportArticle,
  getSupportSlugs,
  getAdjacentArticles,
} from "@/lib/content/support";
import { mdxComponents } from "@/components/mdx";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getSupportSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = getSupportArticle(slug);

  if (!article) {
    return {
      title: "Not Found | DatumPilot Support",
    };
  }

  return {
    title: `${article.title} | DatumPilot Support`,
    description: article.description,
  };
}

export default async function SupportArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getSupportArticle(slug);

  if (!article) {
    notFound();
  }

  const { prev, next } = getAdjacentArticles(slug);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link
            href="/support"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Support
          </Link>
        </nav>

        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {article.title}
          </h1>
          {article.description && (
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
              {article.description}
            </p>
          )}
          {article.lastUpdated && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              Last updated: {article.lastUpdated}
            </p>
          )}
        </header>

        {/* Article Content */}
        <article className="prose prose-gray dark:prose-invert max-w-none">
          <MDXRemote
            source={article.content}
            components={mdxComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              },
            }}
          />
        </article>

        {/* Navigation */}
        <nav className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-800">
          {prev ? (
            <Link
              href={`/support/${prev.slug}`}
              className="group flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  Previous
                </div>
                <div className="font-medium">{prev.title}</div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {next ? (
            <Link
              href={`/support/${next.slug}`}
              className="group flex items-center gap-2 text-right text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  Next
                </div>
                <div className="font-medium">{next.title}</div>
              </div>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </div>
    </div>
  );
}
