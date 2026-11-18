// The community templates (templates/ at the repository's root), as templates/_scripts/website.tsx wrote them into
// src/generated/kits.json: every template in every sample brand, by format, with its copyable single file.
import data from "../generated/kits.json";
import type { Example } from "./examples";

export interface BrandInfo {
  id: string;
  name: string;
  colors: Record<string, string>;
  /** The brand's block, as the single file and the playground's Brand menu write it. */
  block: string;
}
export interface KitInfo {
  id: string;
  name: string;
  description: string;
  author: string;
  tags?: string[];
  recreates?: { company: string };
  brand?: BrandInfo;
}
export interface FieldInfo {
  path: string;
  kind: string;
  label: string;
  required: boolean;
  fromCategory: boolean;
}
export interface TemplateInfo {
  key: string;
  id: string;
  kit: string;
  folder: "emails" | "pages" | "documents" | "images";
  output: string;
  root: "Email" | "Page" | "Document" | "Canvas";
  category: string;
  label: string;
  description: string;
  guidance: string;
  author: string;
  formats: string[];
  fields: FieldInfo[];
  rules: { lint: Array<{ id: string; summary: string }>; core: Array<{ code: string }>; links?: { domains?: string[] } };
  file: string;
  byBrand: Record<string, { views: Record<string, Example>; single: string }>;
}
export interface CategoryInfo {
  label: string;
  group: string;
  useWhen: string;
  avoidWhen: string;
  roots: string[];
}

const kits = data as unknown as { assets: string; brands: BrandInfo[]; kits: KitInfo[]; templates: TemplateInfo[]; categories: Record<string, CategoryInfo> };

export const brands = kits.brands;
export const kitList = kits.kits;
export const kitTemplates = kits.templates;
export const kitCategories = kits.categories;
export const GROUPS = ["Account", "Billing", "Orders", "Launches", "Content", "Events", "Social", "People", "Records", "Marketing"];

/** The brands a template is shown in: its kit's own first, where it's a recreation, then the samples. */
export const brandsFor = (t: TemplateInfo): BrandInfo[] => {
  const own = kitList.find((k) => k.id === t.kit)?.brand;
  return own ? [own, ...brands] : brands;
};
export const templateUrl = (t: TemplateInfo) => `/templates/${t.kit}/${t.folder}/${t.category}`;
export const kitUrl = (kit: string) => `/templates/${kit}`;
/** The first view of a template in a brand: its first format. */
export const firstView = (t: TemplateInfo, brand: string): Example => {
  const views = t.byBrand[brand]?.views ?? {};
  return views[t.formats[0] ?? "default"] ?? Object.values(views)[0];
};
