import type { ReactNode, HTMLAttributes, AnchorHTMLAttributes } from "react";
import Link from "next/link";
import { Callout } from "./Callout";

type ComponentProps = HTMLAttributes<HTMLElement> & { children?: ReactNode };
type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & { children?: ReactNode };

/**
 * Custom MDX components for support documentation
 */
export const mdxComponents = {
  // Custom components
  Callout,

  // Override default elements with styled versions
  h1: ({ children, ...props }: ComponentProps) => (
    <h1
      className="scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl mb-6"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: ComponentProps) => (
    <h2
      className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight mt-10 mb-4"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: ComponentProps) => (
    <h3
      className="scroll-m-20 text-xl font-semibold tracking-tight mt-8 mb-3"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: ComponentProps) => (
    <h4
      className="scroll-m-20 text-lg font-semibold tracking-tight mt-6 mb-2"
      {...props}
    >
      {children}
    </h4>
  ),
  p: ({ children, ...props }: ComponentProps) => (
    <p className="leading-7 [&:not(:first-child)]:mt-4" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: ComponentProps) => (
    <ul className="my-4 ml-6 list-disc [&>li]:mt-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: ComponentProps) => (
    <ol className="my-4 ml-6 list-decimal [&>li]:mt-2" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: ComponentProps) => (
    <li className="leading-7" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: ComponentProps) => (
    <blockquote
      className="mt-6 border-l-4 border-gray-300 pl-4 italic text-gray-700 dark:border-gray-600 dark:text-gray-300"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, ...props }: ComponentProps) => (
    <code
      className="relative rounded bg-gray-100 px-[0.3rem] py-[0.2rem] font-mono text-sm dark:bg-gray-800"
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }: ComponentProps) => (
    <pre
      className="mt-4 mb-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100"
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, ...props }: ComponentProps) => (
    <div className="my-6 w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: ComponentProps) => (
    <thead className="bg-gray-50 dark:bg-gray-800" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: ComponentProps) => (
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }: ComponentProps) => (
    <tr className="border-b border-gray-200 dark:border-gray-700" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: ComponentProps) => (
    <th
      className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: ComponentProps) => (
    <td
      className="px-4 py-3 text-gray-700 dark:text-gray-300"
      {...props}
    >
      {children}
    </td>
  ),
  a: ({ href, children, ...props }: AnchorProps) => {
    const isInternal = href?.startsWith("/") || href?.startsWith("#");
    if (isInternal && href) {
      return (
        <Link
          href={href}
          className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          {...props}
        >
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  },
  hr: (props: ComponentProps) => <hr className="my-8 border-gray-200 dark:border-gray-700" {...props} />,
  strong: ({ children, ...props }: ComponentProps) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
};

export { Callout };
