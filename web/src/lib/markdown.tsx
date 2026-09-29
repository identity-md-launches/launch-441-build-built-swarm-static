// A small, safe Markdown renderer: it produces React elements only (no innerHTML),
// allows http(s), mailto and relative links, resolves relative image paths against a base
// and lazy-loads images. Supports headings, paragraphs, lists, blockquotes, fenced code,
// tables, rules, emphasis, inline code, links and images.
import type { ReactNode } from 'react';

type Inline = ReactNode;

const SAFE_URL = /^(https?:|mailto:)/i;

export function resolveUrl(src: string, base: string): string | null {
  if (!src) return null;
  if (/^(javascript|data|vbscript):/i.test(src.trim())) return null;
  if (SAFE_URL.test(src) || src.startsWith('#')) return src;
  if (src.startsWith('//')) return null;
  return base.replace(/\/?$/, '/') + src.replace(/^\.?\//, '');
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function inline(text: string, base: string, keyPrefix: string): Inline[] {
  const out: Inline[] = [];
  let rest = text;
  let k = 0;
  const re = /(!\[([^\]]*)\]\(([^)\s]+)\))|(\[([^\]]+)\]\(([^)\s]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)/;
  while (rest.length) {
    const m = re.exec(rest);
    if (!m || m.index === undefined) {
      out.push(rest);
      break;
    }
    if (m.index > 0) out.push(rest.slice(0, m.index));
    const key = `${keyPrefix}-${k++}`;
    if (m[1]) {
      const src = resolveUrl(m[3] ?? '', base);
      out.push(src ? <img key={key} src={src} alt={m[2] ?? ''} loading="lazy" decoding="async" /> : m[2]);
    } else if (m[4]) {
      const url = resolveUrl(m[6] ?? '', base);
      const label = inline(m[5] ?? '', base, key);
      out.push(url ? <a key={key} href={url} rel={SAFE_URL.test(url) ? 'noopener noreferrer' : undefined} target={/^https?:/i.test(url) ? '_blank' : undefined}>{label}</a> : <span key={key}>{label}</span>);
    } else if (m[7]) {
      out.push(<code key={key}>{m[8]}</code>);
    } else if (m[9]) {
      out.push(<strong key={key}>{inline(m[10] ?? '', base, key)}</strong>);
    } else if (m[11]) {
      out.push(<em key={key}>{inline(m[12] ?? '', base, key)}</em>);
    } else if (m[13]) {
      out.push(<em key={key}>{inline(m[14] ?? '', base, key)}</em>);
    }
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
}

export function renderMarkdown(md: string, base = './'): ReactNode[] {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;
  const next = () => `md-${key++}`;

  while (i < lines.length) {
    const line = lines[i] ?? '';
    if (!line.trim()) {
      i++;
      continue;
    }
    // fenced code
    if (/^```/.test(line)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i] ?? '')) buf.push(lines[i] ?? ''), i++;
      i++;
      nodes.push(<pre key={next()}><code>{buf.join('\n')}</code></pre>);
      continue;
    }
    // heading
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = (h[1] ?? '#').length;
      const text = h[2] ?? '';
      const id = slug(text);
      const content = inline(text, base, next());
      const k = next();
      nodes.push(
        level === 1 ? <h1 key={k} id={id}>{content}</h1>
          : level === 2 ? <h2 key={k} id={id}>{content}</h2>
            : level === 3 ? <h3 key={k} id={id}>{content}</h3>
              : level === 4 ? <h4 key={k} id={id}>{content}</h4>
                : level === 5 ? <h5 key={k} id={id}>{content}</h5>
                  : <h6 key={k} id={id}>{content}</h6>,
      );
      i++;
      continue;
    }
    // rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      nodes.push(<hr key={next()} />);
      i++;
      continue;
    }
    // blockquote
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i] ?? '')) buf.push((lines[i] ?? '').replace(/^>\s?/, '')), i++;
      nodes.push(<blockquote key={next()}>{renderMarkdown(buf.join('\n'), base)}</blockquote>);
      continue;
    }
    // table
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1] ?? '')) {
      const cells = (l: string) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && (lines[i] ?? '').includes('|')) rows.push(cells(lines[i] ?? '')), i++;
      const k = next();
      nodes.push(
        <div key={k} className="table-wrap">
          <table>
            <thead><tr>{head.map((c, ci) => <th key={ci} scope="col">{inline(c, base, `${k}h${ci}`)}</th>)}</tr></thead>
            <tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci}>{inline(c, base, `${k}r${ri}c${ci}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    // lists
    const li = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (li) {
      const ordered = /\d/.test(li[2] ?? '');
      const items: string[] = [];
      while (i < lines.length) {
        const m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(lines[i] ?? '');
        if (m) {
          items.push(m[3] ?? '');
          i++;
        } else if ((lines[i] ?? '').trim() && /^\s{2,}/.test(lines[i] ?? '') && items.length) {
          items[items.length - 1] += ' ' + (lines[i] ?? '').trim();
          i++;
        } else break;
      }
      const k = next();
      const children = items.map((t, idx) => <li key={idx}>{inline(t, base, `${k}i${idx}`)}</li>);
      nodes.push(ordered ? <ol key={k}>{children}</ol> : <ul key={k}>{children}</ul>);
      continue;
    }
    // paragraph
    const buf: string[] = [line];
    i++;
    while (i < lines.length && (lines[i] ?? '').trim() && !/^(#{1,6}\s|```|>|\s*([-*+]|\d+[.)])\s|(-{3,}|\*{3,})\s*$)/.test(lines[i] ?? '') && !((lines[i] ?? '').includes('|') && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1] ?? ''))) {
      buf.push(lines[i] ?? '');
      i++;
    }
    const k = next();
    const text = buf.join(' ');
    // a paragraph that is only an image becomes a figure
    const onlyImg = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(text.trim());
    if (onlyImg) {
      const src = resolveUrl(onlyImg[2] ?? '', base);
      nodes.push(<figure key={k}>{src ? <img src={src} alt={onlyImg[1] ?? ''} loading="lazy" decoding="async" /> : null}{onlyImg[1] ? <figcaption>{onlyImg[1]}</figcaption> : null}</figure>);
    } else {
      nodes.push(<p key={k}>{inline(text, base, k)}</p>);
    }
  }
  return nodes;
}

// Counts whitespace-separated tokens that contain a letter or digit (markdown marks and bullets are skipped).
export function wordCount(md: string): number {
  return md.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}
