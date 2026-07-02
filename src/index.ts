interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Open-source licenses MCP (SPDX).
 *
 * Keyless: look up an open-source license by its SPDX id (MIT, Apache-2.0,
 * GPL-3.0-only…), search the license list, and fetch the full license text —
 * from the official SPDX license-list-data. No key. Useful for dependency
 * compliance, license identification, and README/LICENSE work.
 */


const LIST = 'https://raw.githubusercontent.com/spdx/license-list-data/main/json/licenses.json';
const UA = 'pipeworx-mcp-licenses/1.0 (+https://pipeworx.io)';

interface Lic { licenseId: string; name: string; isOsiApproved?: boolean; isFsfLibre?: boolean; isDeprecatedLicenseId?: boolean; detailsUrl?: string; reference?: string; seeAlso?: string[]; }

async function getList(): Promise<Lic[]> {
  const res = await fetch(LIST, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`SPDX list error: ${res.status}`);
  const j = (await res.json()) as { licenses?: Lic[] };
  return j.licenses ?? [];
}
function meta(l: Lic) {
  return { spdx_id: l.licenseId, name: l.name, osi_approved: !!l.isOsiApproved, fsf_libre: !!l.isFsfLibre, deprecated: !!l.isDeprecatedLicenseId, reference_url: l.reference ?? l.seeAlso?.[0] ?? null, see_also: l.seeAlso ?? null };
}

const tools: McpToolExport['tools'] = [
  {
    name: 'lookup_license',
    description: 'Look up an open-source license by its exact SPDX id (e.g. "MIT", "Apache-2.0", "GPL-3.0-only", "BSD-3-Clause"). Returns the full name, OSI/FSF approval, deprecation status, and reference URLs. Keyless.',
    inputSchema: { type: 'object', properties: { spdx_id: { type: 'string', description: 'An SPDX license id, e.g. "Apache-2.0".' } }, required: ['spdx_id'] },
  },
  {
    name: 'search_licenses',
    description: 'Search the SPDX license list by keyword (matches the id or name), e.g. "GPL", "creative commons", "mozilla". Keyless.',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Keyword to search.' }, osi_only: { type: 'boolean', description: 'Only OSI-approved licenses (default false).' }, limit: { type: 'number', description: 'Max results (1-100, default 25).' } }, required: ['query'] },
  },
  {
    name: 'get_license_text',
    description: 'Fetch the full license text for an SPDX id (e.g. "MIT"). Keyless.',
    inputSchema: { type: 'object', properties: { spdx_id: { type: 'string', description: 'An SPDX license id.' } }, required: ['spdx_id'] },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'lookup_license': {
      const id = reqStr(args, 'spdx_id', '"MIT"').trim();
      const list = await getList();
      const l = list.find((x) => x.licenseId.toLowerCase() === id.toLowerCase());
      return l ? { found: true, ...meta(l) } : { input: id, found: false, reason: 'No license with that exact SPDX id. Use search_licenses to find it.' };
    }
    case 'search_licenses': {
      const q = reqStr(args, 'query', '"GPL"').toLowerCase();
      const limit = clamp(numArg(args.limit, 25), 1, 100);
      const osiOnly = args.osi_only === true;
      let hits = (await getList()).filter((l) => (l.licenseId.toLowerCase().includes(q) || l.name.toLowerCase().includes(q)) && (!osiOnly || l.isOsiApproved));
      return { query: q, count: Math.min(hits.length, limit), total_matches: hits.length, results: hits.slice(0, limit).map(meta) };
    }
    case 'get_license_text': {
      const id = reqStr(args, 'spdx_id', '"MIT"').trim();
      const l = (await getList()).find((x) => x.licenseId.toLowerCase() === id.toLowerCase());
      if (!l || !l.detailsUrl) return { input: id, found: false, reason: 'No license text available for that SPDX id.' };
      const res = await fetch(l.detailsUrl, { headers: { Accept: 'application/json', 'User-Agent': UA } });
      if (!res.ok) throw new Error(`SPDX details error: ${res.status}`);
      const d = (await res.json()) as { licenseText?: string; standardLicenseHeader?: string };
      return { spdx_id: l.licenseId, name: l.name, license_text: d.licenseText ?? null };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function reqStr(args: Record<string, unknown>, key: string, ex: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${ex}.`);
  return v;
}
function numArg(v: unknown, d: number): number { const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN; return Number.isFinite(n) ? n : d; }
function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, Math.trunc(n))); }

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
