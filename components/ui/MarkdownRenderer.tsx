import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { Components } from 'react-markdown';

const TIMESTAMP_RE = /\[(\d{1,3}):([0-5]?\d)\]/g;

function injectTimestampLinks(content: string): string {
  return content.replace(TIMESTAMP_RE, (_match, m: string, s: string) => {
    const sec = Number(m) * 60 + Number(s);
    return `[▶ ${m.padStart(2, '0')}:${s.padStart(2, '0')}](tutor-seek:${sec})`;
  });
}

export function MarkdownRenderer({ content, onSeek }: { content: string; onSeek?: (sec: number) => void }) {
  const processedContent = onSeek ? injectTimestampLinks(content) : content;

  const components: Components = {
    a: ({ href, children, ...props }: any) => {
      if (href?.startsWith('tutor-seek:')) {
        const sec = Number(href.slice('tutor-seek:'.length));
        return (
          <button
            type="button"
            onClick={() => onSeek?.(sec)}
            className="mx-0.5 inline rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent hover:bg-accent/20"
            {...props}
          >
            {children}
          </button>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline" {...props}>
          {children}
        </a>
      );
    },
    p: ({ children, ...props }: any) => <p className="mb-1.5 last:mb-0" {...props}>{children}</p>,
    ul: ({ children, ...props }: any) => <ul className="mb-1.5 list-disc pl-5 last:mb-0" {...props}>{children}</ul>,
    ol: ({ children, ...props }: any) => <ol className="mb-1.5 list-decimal pl-5 last:mb-0" {...props}>{children}</ol>,
    li: ({ children, ...props }: any) => <li className="mb-0.5" {...props}>{children}</li>,
    h3: ({ children, ...props }: any) => <h3 className="mb-1 mt-2 text-[14px] font-bold first:mt-0" {...props}>{children}</h3>,
    strong: ({ children, ...props }: any) => <strong className="font-semibold" {...props}>{children}</strong>,
    code: ({ children, ...props }: any) => <code className="rounded bg-ink/[0.06] px-1 py-0.5 font-mono text-[13px]" {...props}>{children}</code>,
    table: ({ children, ...props }: any) => (
      <div className="mb-1.5 overflow-x-auto last:mb-0">
        <table className="w-full border-collapse text-[13px]" {...props}>{children}</table>
      </div>
    ),
    th: ({ children, ...props }: any) => <th className="border border-line bg-surface px-2 py-1 text-left font-semibold" {...props}>{children}</th>,
    td: ({ children, ...props }: any) => <td className="border border-line px-2 py-1" {...props}>{children}</td>,
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {processedContent}
    </ReactMarkdown>
  );
}
