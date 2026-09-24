// Safe renderer for assistant replies. Supports the small formatting subset
// the system prompt allows — paragraphs, "- " / "1. " lists and **bold** —
// plus auto-linked https:// URLs and email addresses. Everything is built as
// React elements (no dangerouslySetInnerHTML), so any HTML in a reply is
// shown as text, and only https:/mailto: links are ever produced.
const LINK_PATTERN = /(https:\/\/[^\s<>"')\]]+[^\s<>"')\].,;:!?])|([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;

function renderLinks(text, keyPrefix) {
  const parts = [];
  let lastIndex = 0;
  let match;
  LINK_PATTERN.lastIndex = 0;
  while ((match = LINK_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const [value, url, email] = match;
    const key = `${keyPrefix}-link-${match.index}`;
    if (url) {
      parts.push(
        <a key={key} href={url} target="_blank" rel="noopener noreferrer">
          {url.replace(/^https:\/\//, '')}
        </a>,
      );
    } else {
      parts.push(
        <a key={key} href={`mailto:${email}`}>
          {value}
        </a>,
      );
    }
    lastIndex = match.index + value.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function renderInline(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*)/g).flatMap((segment, index) => {
    const key = `${keyPrefix}-${index}`;
    if (/^\*\*[^*]+\*\*$/.test(segment)) {
      return <strong key={key}>{renderLinks(segment.slice(2, -2), key)}</strong>;
    }
    return renderLinks(segment, key);
  });
}

const BULLET = /^\s*[-*•]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;

function renderList(lines, key) {
  const ListTag = lines.every((line) => NUMBERED.test(line)) ? 'ol' : 'ul';
  return (
    <ListTag key={key}>
      {lines.map((line, lineIndex) => (
        <li key={lineIndex}>{renderInline(line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, ''), `${key}-${lineIndex}`)}</li>
      ))}
    </ListTag>
  );
}

function renderLines(lines, key) {
  return (
    <p key={key}>
      {lines.map((line, lineIndex) => (
        <span key={lineIndex} className="bms-ai-line">
          {renderInline(line.replace(BULLET, '• '), `${key}-${lineIndex}`)}
        </span>
      ))}
    </p>
  );
}

const isListLine = (line) => BULLET.test(line) || NUMBERED.test(line);
const isUniformList = (lines) => lines.every((line) => BULLET.test(line)) || lines.every((line) => NUMBERED.test(line));

export default function RichText({ text }) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return blocks.map((block, blockIndex) => {
    const lines = block.split('\n').filter((line) => line.trim());
    if (!lines.length) return null;
    if (isUniformList(lines)) return renderList(lines, blockIndex);
    // "Intro line(s)" followed by a list, e.g. "Are you mainly looking to:\n1. ...\n2. ..."
    const firstListLine = lines.findIndex(isListLine);
    const tail = firstListLine > 0 ? lines.slice(firstListLine) : [];
    if (tail.length > 1 && isUniformList(tail)) {
      return [renderLines(lines.slice(0, firstListLine), `${blockIndex}-intro`), renderList(tail, `${blockIndex}-list`)];
    }
    // Other mixed blocks: keep single line breaks (e.g. "Primary area: ..." lines).
    return renderLines(lines, blockIndex);
  });
}
