/**
 * A template described for whoever fills it, before they start: its formats, every field (its kind, whether it's
 * required, its schema, its image rules and guidance), a JSON Schema of its values, and, for each image the template
 * shows, its region in each format and the smallest image that serves every one. Synchronous, and declared only:
 * what needs fonts or files is `checkLayout()`'s.
 */
import type { JsonSchema, PropSpec, PropSpecs, RootName } from "@hyper-elements/core";
import { coverCrop, regionsOf, type Definition, type Format } from "./checks";
import { imageRules, isList, isObjectSpec, specsOf, type ImageRules } from "./fields";

/** The shape of what `describe()` returns: a new version is a new shape. */
export const DESCRIBE_VERSION = 1;

export interface FieldDescription extends ImageRules {
  /** Its path (`headline`); a list's items and an object's fields too (`stories[].image`). */
  path: string;
  /** "text", "list", "object", "date", "choice", "image", "link", "number", … */
  kind: string;
  label: string;
  description?: string;
  guidance?: string;
  required: boolean;
  default?: unknown;
  schema: JsonSchema;
  /** An image the template shows: its box in each format, and the pixels that box needs at the format's scale. */
  regions?: Record<string, { box: [number, number]; pixels: [number, number] } | "measured by check">;
  /** A cover image: the smallest size that fills every format's region without upscaling, and what each crops. */
  suggested?: { width: number; height: number; crop: Record<string, string> };
}

export interface TemplateDescription {
  version: typeof DESCRIBE_VERSION;
  id: string;
  templateVersion: string;
  label: string;
  description?: string;
  root: RootName;
  guidance?: string;
  formats?: Record<string, Format>;
  fields: FieldDescription[];
  /** A JSON Schema of the values. */
  valuesSchema: JsonSchema;
  /** What's fixed: everything not a field. */
  fixed: string;
}

const KIND_NAMES: Record<string, string> = { enum: "choice", asset: "image" };

/** A spec's own JSON Schema, a list's and an object's from their children (so a schema says what each holds). */
export function schemaOf(spec: PropSpec): JsonSchema {
  if (isList(spec)) {
    const own = spec.kind.jsonSchema() as { minItems?: number; maxItems?: number };
    return { type: "array", items: schemaOf(spec.item), ...(own.minItems !== undefined ? { minItems: own.minItems } : {}), ...(own.maxItems !== undefined ? { maxItems: own.maxItems } : {}) };
  }
  if (isObjectSpec(spec)) return valuesSchemaOf(spec.fields);
  if (imageRules(spec)) {
    return { type: "object", required: ["src", "width", "height"], properties: { src: { type: "string", minLength: 1 }, width: { type: "number", exclusiveMinimum: 0 }, height: { type: "number", exclusiveMinimum: 0 } }, additionalProperties: false };
  }
  return spec.kind.jsonSchema();
}

/** A JSON Schema of fields' values: an object of exactly those, the required ones required. */
export function valuesSchemaOf(fields: PropSpecs): JsonSchema {
  const required = Object.entries(fields).filter(([, spec]) => spec.required).map(([name]) => name);
  return {
    type: "object",
    additionalProperties: false,
    ...(required.length ? { required } : {}),
    properties: Object.fromEntries(Object.entries(fields).map(([name, spec]) => [name, schemaOf(spec)])),
  };
}

/** The template described, with the regions read from `example` laid out in each format (`laidOut`). */
export function describeTemplate(
  definition: Definition & { description?: string; guidance?: string },
  laidOut: Array<{ format: string | undefined; values: Record<string, unknown>; root: import("@hyper-elements/core").ResolvedNode }>
): TemplateDescription {
  const regions = new Map<string, Record<string, { box: [number, number]; pixels: [number, number] } | "measured by check">>();
  for (const { format, values, root } of laidOut) {
    const scale = (format !== undefined && definition.formats?.[format]?.scale) || 1;
    for (const [path, region] of regionsOf(definition, values, root, scale)) {
      // A list's items share their pattern's entry (`stories[].image`): the first one shown says it.
      const pattern = path.replace(/\[\d+\]/g, "[]");
      const byFormat = regions.get(pattern) ?? {};
      byFormat[format ?? "default"] ??= region;
      regions.set(pattern, byFormat);
    }
  }
  const fields = specsOf(definition.fields).map(({ path, spec }): FieldDescription => {
    const rules = imageRules(spec);
    const kind = rules ? "image" : (KIND_NAMES[spec.kind.name] ?? spec.kind.name);
    const out: FieldDescription = {
      path,
      kind,
      label: spec.label,
      ...(spec.description ? { description: spec.description } : {}),
      required: !!spec.required,
      ...(spec.default !== undefined ? { default: spec.default } : {}),
      schema: schemaOf(spec),
      ...(rules ?? {}),
      ...(spec.guidance ? { guidance: spec.guidance } : {}),
    };
    const shown = regions.get(path);
    if (shown) {
      out.regions = shown;
      if (rules?.fit === "cover") {
        const suggested = suggest(shown);
        if (suggested) out.suggested = suggested;
      }
    }
    return out;
  });
  return {
    version: DESCRIBE_VERSION,
    id: definition.id,
    templateVersion: definition.version,
    label: definition.label,
    ...(definition.description ? { description: definition.description } : {}),
    root: definition.root,
    ...(definition.guidance ? { guidance: definition.guidance } : {}),
    ...(definition.formats ? { formats: definition.formats } : {}),
    fields,
    valuesSchema: valuesSchemaOf(definition.fields),
    fixed: "Everything not listed: the layout, typography, colors, the fixed text and images, and the arrangement per format.",
  };
}

/** The smallest image that covers every region at its pixels without upscaling, and the share each crops. */
function suggest(regions: Record<string, { box: [number, number]; pixels: [number, number] } | "measured by check">): FieldDescription["suggested"] {
  const sized = Object.entries(regions).filter((entry): entry is [string, { box: [number, number]; pixels: [number, number] }] => entry[1] !== "measured by check");
  if (!sized.length) return undefined;
  const width = Math.max(...sized.map(([, region]) => region.pixels[0]));
  const height = Math.max(...sized.map(([, region]) => region.pixels[1]));
  const crop: Record<string, string> = {};
  for (const [format, region] of sized) {
    const { share, side } = coverCrop({ width, height }, region.box);
    crop[format] = share < 0.005 ? "crops nothing" : `cuts ${Math.round(share * 100)}% of the ${side}`;
  }
  return { width, height, crop };
}
