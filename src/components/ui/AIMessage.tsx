import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AIMessageProps {
  content: string
  isUser?: boolean
}

export function AIMessage({ content, isUser = false }: AIMessageProps) {
  if (isUser) {
    return (
      <div className="flex justify-end mb-6 group animate-in slide-in-from-right-2 duration-300">
        <div className="bg-accent/15 border border-accent/20 shadow-[0_4px_20px_rgba(255,184,0,0.05)] text-foreground rounded-2xl rounded-tr-sm px-5 py-3.5 max-w-[80%] text-[14px] leading-relaxed">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 mb-8 group animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface border border-accent/30 shadow-[0_0_15px_rgba(255,184,0,0.08)] flex items-center justify-center text-lg relative">
        <div className="absolute inset-0 rounded-full bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        🛡️
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className="bg-gradient-to-br from-card/90 to-surface-warm/50 border border-border/40 shadow-lg rounded-2xl rounded-tl-sm px-6 py-5 text-[15px] leading-[1.8] border-l-[3px] border-l-accent/60 transition-all hover:border-l-accent overflow-x-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="mb-4 last:mb-0 text-foreground/90 leading-[1.8] text-[15px]">
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-accent tracking-wide">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-foreground/80">
                  {children}
                </em>
              ),
              ul: ({ children }) => (
                <ul className="my-4 space-y-2.5">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="my-4 space-y-2.5 list-decimal list-inside text-foreground/90">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="flex gap-3 text-[14.5px] text-foreground/85 items-start">
                  <span className="text-accent mt-1 flex-shrink-0 font-bold text-lg leading-none">→</span>
                  <span className="leading-relaxed pt-[2px]">{children}</span>
                </li>
              ),
              h1: ({ children }) => (
                <h1 className="text-[18px] font-bold text-foreground mt-6 mb-3 first:mt-0 font-syne tracking-wide">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-[16px] font-bold text-accent mt-6 mb-3 first:mt-0 border-b border-border/30 pb-1.5 uppercase tracking-wider font-syne">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-[15px] font-bold text-foreground/95 mt-5 mb-2 first:mt-0 font-syne">
                  {children}
                </h3>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-[3px] border-accent/70 pl-4 my-4 text-foreground/80 italic bg-accent/5 rounded-r-xl py-3 pr-4">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-black/40 border border-border/30 text-accent px-1.5 py-0.5 rounded-md text-[13px] font-mono shadow-inner">
                  {children}
                </code>
              ),
              hr: () => (
                <hr className="border-border/30 my-5" />
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-5 rounded-xl border border-border/40 shadow-sm">
                  <table className="w-full text-left text-[14px] border-collapse bg-card/30">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-surface-warm/80 text-accent font-syne border-b border-border/40 tracking-wider text-[12px] uppercase">
                  {children}
                </thead>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-border/20">
                  {children}
                </tbody>
              ),
              tr: ({ children }) => (
                <tr className="hover:bg-surface-hover/30 transition-colors">
                  {children}
                </tr>
              ),
              th: ({ children }) => (
                <th className="px-5 py-3.5 font-bold">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-5 py-3.5 text-foreground/85">
                  {children}
                </td>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex gap-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface border border-accent/30 shadow-[0_0_15px_rgba(255,184,0,0.08)] flex items-center justify-center text-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-accent/10 animate-pulse"></div>
        🛡️
      </div>
      <div className="bg-gradient-to-br from-card/70 to-surface-warm/30 border border-border/40 rounded-2xl rounded-tl-sm px-6 py-4 flex items-center shadow-md">
        <div className="flex gap-2.5">
          <div className="w-2 h-2 rounded-full bg-accent/80 animate-bounce shadow-[0_0_8px_rgba(255,184,0,0.5)]" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-accent/80 animate-bounce shadow-[0_0_8px_rgba(255,184,0,0.5)]" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-accent/80 animate-bounce shadow-[0_0_8px_rgba(255,184,0,0.5)]" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="ml-4 text-[13px] text-accent/80 font-semibold font-syne tracking-widest uppercase animate-pulse">Analyzing...</span>
      </div>
    </div>
  )
}
