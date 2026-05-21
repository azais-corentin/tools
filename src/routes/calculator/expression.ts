/**
 * Safe arithmetic expression evaluator.
 *
 * Supports:
 *   - Numbers: decimal (`12`, `3.14`, `.5`) and scientific (`1e3`, `2.5E-4`).
 *   - Binary operators: `+ - * / % ^` (with `^` right-associative).
 *   - Unary `+` and `-`.
 *   - Parentheses for grouping.
 *   - Identifiers: `pi`, `e`.
 *
 * Pure parsing — never uses `eval` or `new Function`.
 */

export type EvalResult =
	| { ok: true; value: number }
	| { ok: false; error: string };

type TokenKind = 'number' | 'ident' | 'op' | 'lparen' | 'rparen';

interface Token {
	kind: TokenKind;
	text: string;
	/** Position in the source string, for error messages. */
	pos: number;
}

const CONSTANTS: Record<string, number> = {
	pi: Math.PI,
	e: Math.E
};

const BINARY_OPS = new Set(['+', '-', '*', '/', '%', '^']);

function isDigit(c: string): boolean {
	return c >= '0' && c <= '9';
}

function isIdentStart(c: string): boolean {
	return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
}

function isIdentPart(c: string): boolean {
	return isIdentStart(c) || isDigit(c);
}

function tokenize(src: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;
	while (i < src.length) {
		const c = src[i];

		if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
			i++;
			continue;
		}

		if (c === '(' || c === ')') {
			tokens.push({ kind: c === '(' ? 'lparen' : 'rparen', text: c, pos: i });
			i++;
			continue;
		}

		if (BINARY_OPS.has(c)) {
			tokens.push({ kind: 'op', text: c, pos: i });
			i++;
			continue;
		}

		if (isDigit(c) || (c === '.' && isDigit(src[i + 1] ?? ''))) {
			const start = i;
			while (i < src.length && isDigit(src[i])) i++;
			if (src[i] === '.') {
				i++;
				while (i < src.length && isDigit(src[i])) i++;
			}
			if (src[i] === 'e' || src[i] === 'E') {
				i++;
				if (src[i] === '+' || src[i] === '-') i++;
				const expStart = i;
				while (i < src.length && isDigit(src[i])) i++;
				if (i === expStart) {
					throw new SyntaxError(`Malformed exponent at position ${start + 1}`);
				}
			}
			tokens.push({ kind: 'number', text: src.slice(start, i), pos: start });
			continue;
		}

		if (isIdentStart(c)) {
			const start = i;
			while (i < src.length && isIdentPart(src[i])) i++;
			tokens.push({ kind: 'ident', text: src.slice(start, i), pos: start });
			continue;
		}

		throw new SyntaxError(`Unexpected character '${c}' at position ${i + 1}`);
	}
	return tokens;
}

/** Binding powers for binary operators: `[left, right]`. */
function infixBp(op: string): [number, number] | null {
	switch (op) {
		case '+':
		case '-':
			return [1, 2];
		case '*':
		case '/':
		case '%':
			return [3, 4];
		case '^':
			// Right-associative: right bp lower than left bp.
			return [6, 5];
		default:
			return null;
	}
}

/** Binding power applied by a unary prefix operator. */
const PREFIX_BP = 7;

function apply(op: string, lhs: number, rhs: number): number {
	switch (op) {
		case '+':
			return lhs + rhs;
		case '-':
			return lhs - rhs;
		case '*':
			return lhs * rhs;
		case '/':
			return lhs / rhs;
		case '%':
			return lhs % rhs;
		case '^':
			return Math.pow(lhs, rhs);
		default:
			throw new SyntaxError(`Unknown operator '${op}'`);
	}
}

class Parser {
	private i = 0;
	constructor(private readonly tokens: Token[]) {}

	private peek(): Token | undefined {
		return this.tokens[this.i];
	}

	private next(): Token {
		const t = this.tokens[this.i];
		if (!t) throw new SyntaxError('Unexpected end of expression');
		this.i++;
		return t;
	}

	parseExpr(minBp = 0): number {
		let lhs = this.parsePrefix();

		// eslint-disable-next-line no-constant-condition
		while (true) {
			const t = this.peek();
			if (!t) break;
			if (t.kind === 'rparen') break;
			if (t.kind !== 'op') {
				throw new SyntaxError(`Unexpected token '${t.text}' at position ${t.pos + 1}`);
			}
			const bp = infixBp(t.text);
			if (!bp) throw new SyntaxError(`Unknown operator '${t.text}'`);
			const [lbp, rbp] = bp;
			if (lbp < minBp) break;

			this.next();
			const rhs = this.parseExpr(rbp);
			lhs = apply(t.text, lhs, rhs);
		}

		return lhs;
	}

	private parsePrefix(): number {
		const t = this.next();

		if (t.kind === 'number') {
			const n = Number(t.text);
			if (!Number.isFinite(n)) {
				throw new SyntaxError(`Invalid number '${t.text}' at position ${t.pos + 1}`);
			}
			return n;
		}

		if (t.kind === 'ident') {
			const c = CONSTANTS[t.text.toLowerCase()];
			if (c === undefined) {
				throw new SyntaxError(`Unknown identifier '${t.text}' at position ${t.pos + 1}`);
			}
			return c;
		}

		if (t.kind === 'lparen') {
			const v = this.parseExpr(0);
			const close = this.peek();
			if (!close || close.kind !== 'rparen') {
				throw new SyntaxError(`Missing ')' at position ${t.pos + 1}`);
			}
			this.next();
			return v;
		}

		if (t.kind === 'op' && (t.text === '-' || t.text === '+')) {
			const v = this.parseExpr(PREFIX_BP);
			return t.text === '-' ? -v : v;
		}

		throw new SyntaxError(`Unexpected token '${t.text}' at position ${t.pos + 1}`);
	}

	atEnd(): boolean {
		return this.i >= this.tokens.length;
	}

	current(): Token | undefined {
		return this.tokens[this.i];
	}
}

export function evaluate(expr: string): EvalResult {
	const trimmed = expr.trim();
	if (trimmed === '') return { ok: false, error: 'Empty expression' };

	try {
		const tokens = tokenize(trimmed);
		const parser = new Parser(tokens);
		const value = parser.parseExpr(0);
		if (!parser.atEnd()) {
			const t = parser.current()!;
			return {
				ok: false,
				error: `Unexpected token '${t.text}' at position ${t.pos + 1}`
			};
		}
		if (!Number.isFinite(value)) {
			return { ok: false, error: 'Result is not a finite number' };
		}
		return { ok: true, value };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return { ok: false, error: message };
	}
}
