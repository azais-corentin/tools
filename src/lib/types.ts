export interface Tool {
	/** Matches the route segment, e.g. "calculator". */
	slug: string;
	title: string;
	description: string;
	tags?: string[];
	/** ISO date (`YYYY-MM-DD`) used to sort newest tools first. */
	added?: string;
}
