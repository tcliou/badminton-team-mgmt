import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/shared/utils/cn';

/**
 * 簡易 Markdown 預覽。Phase 3 用基本 textarea 編輯器，Tiptap 留待 Phase 4。
 * 樣式：用 prose-like utilities 直接寫，不依賴 @tailwindcss/typography 套件。
 */
export function MarkdownPreview({
  body,
  className,
}: {
  body: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'space-y-2 text-sm leading-relaxed text-foreground',
        '[&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold',
        '[&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
        '[&_a]:text-primary [&_a]:underline',
        '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs',
        '[&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-2',
        '[&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
    </div>
  );
}
