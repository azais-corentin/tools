import { error } from "@sveltejs/kit";
import type { EntryGenerator, PageLoad } from "./$types";
import { documents, renderDocument } from "../documents";

export const prerender = true;

export const entries: EntryGenerator = () => documents.map((d) => ({ doc: d.slug }));

export const load: PageLoad = ({ params }) => {
  const doc = renderDocument(params.doc);
  if (!doc) error(404, `No document at "${params.doc}".`);
  return doc;
};
