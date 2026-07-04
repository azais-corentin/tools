import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import rust from "highlight.js/lib/languages/rust";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import python from "highlight.js/lib/languages/python";
import protobuf from "highlight.js/lib/languages/protobuf";
import markdown from "highlight.js/lib/languages/markdown";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("c", c);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("python", python);
hljs.registerLanguage("protobuf", protobuf);
hljs.registerLanguage("markdown", markdown);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const marked = new Marked(
  { gfm: true },
  markedHighlight({
    emptyLangClass: "hljs",
    langPrefix: "hljs language-",
    highlight(code, lang) {
      if (!lang || !hljs.getLanguage(lang)) return escapeHtml(code);
      return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
    },
  }),
);

export interface DocMeta {
  slug: string;
  title: string;
  filename: string;
}

function slugify(filename: string): string {
  return filename
    .replace(/\.md$/i, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.md$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractTitle(md: string, filename: string): string {
  const m = md.match(/^#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : titleFromFilename(filename);
}

const raw = import.meta.glob("./content/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const bySlug = new Map<string, { meta: DocMeta; source: string }>();

for (const [path, source] of Object.entries(raw)) {
  const filename = path.split("/").pop() as string;
  const slug = slugify(filename);
  if (!slug) throw new Error(`Document "${filename}" produced an empty slug.`);
  const existing = bySlug.get(slug);
  if (existing) {
    throw new Error(
      `Slug collision: "${filename}" and "${existing.meta.filename}" both map to "/docs/${slug}".`,
    );
  }
  bySlug.set(slug, {
    meta: { slug, title: extractTitle(source, filename), filename },
    source,
  });
}

export const documents: DocMeta[] = [...bySlug.values()]
  .map((d) => d.meta)
  .sort((a, b) => a.title.localeCompare(b.title));

export function renderDocument(slug: string): { title: string; html: string } | undefined {
  const doc = bySlug.get(slug);
  if (!doc) return undefined;
  return { title: doc.meta.title, html: marked.parse(doc.source) as string };
}
