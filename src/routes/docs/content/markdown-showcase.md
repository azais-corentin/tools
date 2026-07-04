# Markdown Showcase

This document exercises the GitHub-flavored markdown features the renderer
supports.

## Text

_Italic_, **bold**, ~~strikethrough~~, and `inline code`.

## Table

| Feature   | Supported |
| --------- | :-------: |
| Tables    |    yes    |
| Task list |    yes    |

## Task list

- [x] Render markdown
- [x] Highlight code
- [ ] Write more docs

## Code

```ts
export function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

> Blockquotes and [links](https://example.com) work too.
