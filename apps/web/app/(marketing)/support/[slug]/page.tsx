import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import {
  getSupportArticle,
  getSupportSlugs,
  getAdjacentArticles,
} from "@/lib/content/support";
import { mdxComponents } from "@/components/mdx";
import { TableOfContents } from "@/components/mdx/TableOfContents";
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
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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
        <header className="mb-8 max-w-4xl">
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

        {/* Mobile TOC - shown above content on small screens */}
        <div className="mb-8 lg:hidden">
          <TableOfContents content={article.content} />
        </div>

        {/* Main content with sidebar TOC */}
        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-8">
          {/* Article Content */}
          <article className="prose prose-gray prose-headings:text-gray-900 prose-headings:scroll-mt-24 prose-p:text-gray-700 prose-strong:text-gray-900 prose-a:text-blue-600 hover:prose-a:text-blue-800 dark:prose-invert dark:prose-headings:text-white dark:prose-p:text-gray-300 dark:prose-strong:text-white dark:prose-a:text-blue-400 max-w-none article-numbered-headings">
            <MDXRemote
              source={article.content}
              components={mdxComponents}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [rehypeSlug],
                },
              }}
            />
          </article>

          {/* Sidebar TOC - sticky on desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <TableOfContents content={article.content} />
            </div>
          </aside>
        </div>

        {/* Navigation */}
        <nav className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-800 max-w-4xl">
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
