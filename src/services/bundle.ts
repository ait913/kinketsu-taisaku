import type { BundleDTO, RecordDTO } from "./types.js";

export function bundleRecords(records: RecordDTO[]): BundleDTO[] {
  const groups = new Map<string, RecordDTO[]>();
  for (const rec of records) {
    groups.set(rec.description, [...(groups.get(rec.description) ?? []), rec]);
  }

  return [...groups.entries()]
    .filter(([, items]) => items.length >= 2)
    .map(([description, items]) => ({
      description,
      count: items.length,
      total: items.reduce((sum, item) => sum + item.signedAmount, 0),
      recordIds: items.map((item) => item.id),
    }))
    .sort((a, b) => a.count - b.count || a.description.localeCompare(b.description));
}
