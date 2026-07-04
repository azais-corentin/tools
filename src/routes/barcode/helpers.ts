import {
  wifi,
  url,
  email,
  sms,
  geo,
  phone,
  vcard,
  mecard,
  event,
  swissQR,
  gs1DigitalLink,
} from "etiket";
import type { RenderStyle } from "./render";

export interface HelperField {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "datetime" | "select";
  required?: boolean;
  placeholder?: string;
  default?: string;
  /** Options for `type: 'select'`. */
  options?: { value: string; label: string }[];
}

export interface HelperDef {
  id: string;
  label: string;
  fields: HelperField[];
  /** Builds a QR SVG from the collected field values. May throw on invalid input. */
  render: (v: Record<string, string>, s: RenderStyle) => string;
}

/** Shared QR style object passed to every content helper. */
const qr = (s: RenderStyle) => ({
  size: s.size,
  ecLevel: s.ecLevel,
  dotType: s.dotType,
  color: s.color,
  background: s.background,
  margin: s.margin,
});

const YES_NO: HelperField["options"] = [
  { value: "false", label: "No" },
  { value: "true", label: "Yes" },
];

export const HELPERS: HelperDef[] = [
  {
    id: "wifi",
    label: "Wi-Fi network",
    fields: [
      {
        name: "ssid",
        label: "Network name (SSID)",
        type: "text",
        required: true,
        default: "MyNetwork",
      },
      { name: "password", label: "Password", type: "text", default: "secret123" },
      {
        name: "encryption",
        label: "Encryption",
        type: "select",
        default: "WPA",
        options: [
          { value: "WPA", label: "WPA/WPA2" },
          { value: "WEP", label: "WEP" },
          { value: "nopass", label: "None" },
        ],
      },
      {
        name: "hidden",
        label: "Hidden network",
        type: "select",
        default: "false",
        options: YES_NO,
      },
    ],
    render: (v, s) =>
      wifi(v.ssid, v.password, {
        encryption: v.encryption as "WPA" | "WEP" | "nopass",
        hidden: v.hidden === "true",
        ...qr(s),
      }),
  },
  {
    id: "url",
    label: "URL",
    fields: [
      { name: "url", label: "URL", type: "text", required: true, default: "https://example.com" },
    ],
    render: (v, s) => url(v.url, qr(s)),
  },
  {
    id: "email",
    label: "Email",
    fields: [
      {
        name: "address",
        label: "Email address",
        type: "text",
        required: true,
        default: "hi@example.com",
      },
    ],
    render: (v, s) => email(v.address, qr(s)),
  },
  {
    id: "sms",
    label: "SMS",
    fields: [
      {
        name: "number",
        label: "Phone number",
        type: "text",
        required: true,
        default: "+15551234567",
      },
      { name: "body", label: "Message", type: "textarea" },
    ],
    render: (v, s) => sms(v.number, v.body || undefined, qr(s)),
  },
  {
    id: "geo",
    label: "Geo location",
    fields: [
      { name: "lat", label: "Latitude", type: "number", required: true, default: "37.7749" },
      { name: "lng", label: "Longitude", type: "number", required: true, default: "-122.4194" },
    ],
    render: (v, s) => geo(Number(v.lat), Number(v.lng), qr(s)),
  },
  {
    id: "phone",
    label: "Phone",
    fields: [
      {
        name: "number",
        label: "Phone number",
        type: "text",
        required: true,
        default: "+15551234567",
      },
    ],
    render: (v, s) => phone(v.number, qr(s)),
  },
  {
    id: "vcard",
    label: "Contact (vCard)",
    fields: [
      { name: "firstName", label: "First name", type: "text", required: true, default: "Jane" },
      { name: "lastName", label: "Last name", type: "text" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "email", label: "Email", type: "text" },
      { name: "org", label: "Organization", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "url", label: "Website", type: "text" },
      { name: "address", label: "Address", type: "text" },
    ],
    render: (v, s) =>
      vcard(
        {
          firstName: v.firstName,
          lastName: v.lastName || undefined,
          phone: v.phone || undefined,
          email: v.email || undefined,
          org: v.org || undefined,
          title: v.title || undefined,
          url: v.url || undefined,
          address: v.address || undefined,
        },
        qr(s),
      ),
  },
  {
    id: "mecard",
    label: "Contact (MeCard)",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, default: "Jane Doe" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "email", label: "Email", type: "text" },
      { name: "url", label: "Website", type: "text" },
      { name: "address", label: "Address", type: "text" },
    ],
    render: (v, s) =>
      mecard(
        {
          name: v.name,
          phone: v.phone || undefined,
          email: v.email || undefined,
          url: v.url || undefined,
          address: v.address || undefined,
        },
        qr(s),
      ),
  },
  {
    id: "event",
    label: "Calendar event",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, default: "Meeting" },
      {
        name: "start",
        label: "Start",
        type: "datetime",
        required: true,
        default: "2026-06-08T10:00",
      },
      { name: "end", label: "End", type: "datetime", default: "2026-06-08T11:00" },
      { name: "location", label: "Location", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
    ],
    render: (v, s) =>
      event(
        {
          title: v.title,
          start: v.start,
          end: v.end || undefined,
          location: v.location || undefined,
          description: v.description || undefined,
        },
        qr(s),
      ),
  },
  {
    id: "swissqr",
    label: "Swiss QR-bill",
    fields: [
      {
        name: "iban",
        label: "IBAN",
        type: "text",
        required: true,
        default: "CH4431999123000889012",
      },
      {
        name: "creditorName",
        label: "Creditor name",
        type: "text",
        required: true,
        default: "Max Muster",
      },
      {
        name: "creditorPostalCode",
        label: "Creditor postal code",
        type: "text",
        required: true,
        default: "8000",
      },
      {
        name: "creditorCity",
        label: "Creditor city",
        type: "text",
        required: true,
        default: "Zürich",
      },
      {
        name: "creditorCountry",
        label: "Creditor country",
        type: "text",
        required: true,
        default: "CH",
      },
      { name: "amount", label: "Amount", type: "number" },
      {
        name: "currency",
        label: "Currency",
        type: "select",
        default: "CHF",
        options: [
          { value: "CHF", label: "CHF" },
          { value: "EUR", label: "EUR" },
        ],
      },
      { name: "reference", label: "Reference", type: "text" },
      {
        name: "referenceType",
        label: "Reference type",
        type: "select",
        default: "NON",
        options: [
          { value: "NON", label: "None" },
          { value: "QRR", label: "QRR" },
          { value: "SCOR", label: "SCOR" },
        ],
      },
    ],
    render: (v, s) =>
      swissQR(
        {
          iban: v.iban,
          creditor: {
            name: v.creditorName,
            postalCode: v.creditorPostalCode,
            city: v.creditorCity,
            country: v.creditorCountry,
          },
          amount: v.amount ? Number(v.amount) : undefined,
          currency: v.currency as "CHF" | "EUR",
          reference: v.reference || undefined,
          referenceType: v.referenceType as "QRR" | "SCOR" | "NON",
        },
        qr(s),
      ),
  },
  {
    id: "gs1link",
    label: "GS1 Digital Link",
    fields: [
      { name: "gtin", label: "GTIN", type: "text", required: true, default: "09520123456788" },
      { name: "batch", label: "Batch", type: "text" },
      { name: "serial", label: "Serial", type: "text" },
      { name: "expiry", label: "Expiry (YYMMDD)", type: "text" },
    ],
    render: (v, s) =>
      gs1DigitalLink(
        {
          gtin: v.gtin,
          batch: v.batch || undefined,
          serial: v.serial || undefined,
          expiry: v.expiry || undefined,
        },
        qr(s),
      ),
  },
];

/** Render a content helper by id. Throws on unknown id or invalid input (surfaced in the UI). */
export function renderHelper(id: string, v: Record<string, string>, s: RenderStyle): string {
  const def = HELPERS.find((h) => h.id === id);
  if (!def) throw new Error(`Unknown content type: ${id}`);
  return def.render(v, s);
}

/** Build the initial field values for a helper from each field's `default`. */
export function helperDefaults(def: HelperDef): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of def.fields) out[f.name] = f.default ?? "";
  return out;
}
