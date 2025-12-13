import fs from "fs";
import path from "path";
import matter from "gray-matter";

const SUPPORT_CONTENT_DIR = path.join(process.cwd(), "content/support");

export interface SupportArticle {
  slug: string;
  title: string;
  description: string;
  lastUpdated: string;
  category: string;
  order: number;
  content: string;
}

export interface SupportArticleMeta {
  slug: string;
  title: string;
  description: string;
  lastUpdated: string;
  category: string;
  order: number;
}

/**
 * Get all support article slugs for static generation
 */
export function getSupportSlugs(): string[] {
  const files = fs.readdirSync(SUPPORT_CONTENT_DIR);
  return files
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

/**
 * Get metadata for all support articles (for index page)
 */
export function getAllSupportArticles(): SupportArticleMeta[] {
  const slugs = getSupportSlugs();
  const articles = slugs.map((slug) => {
    const filePath = path.join(SUPPORT_CONTENT_DIR, `${slug}.mdx`);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(fileContent);

    return {
      slug,
      title: data.title || slug,
      description: data.description || "",
      lastUpdated: data.lastUpdated || "",
      category: data.category || "support",
      order: data.order || 99,
    };
  });

  // Sort by order
  return articles.sort((a, b) => a.order - b.order);
}

/**
 * Get a single support article by slug
 */
export function getSupportArticle(slug: string): SupportArticle | null {
  const filePath = path.join(SUPPORT_CONTENT_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    slug,
    title: data.title || slug,
    description: data.description || "",
    lastUpdated: data.lastUpdated || "",
    category: data.category || "support",
    order: data.order || 99,
    content,
  };
}

/**
 * Get previous and next articles for navigation
 */
export function getAdjacentArticles(currentSlug: string): {
  prev: SupportArticleMeta | null;
  next: SupportArticleMeta | null;
} {
  const articles = getAllSupportArticles();
  const currentIndex = articles.findIndex((a) => a.slug === currentSlug);

  return {
    prev: currentIndex > 0 ? articles[currentIndex - 1] : null,
    next: currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null,
  };
}
