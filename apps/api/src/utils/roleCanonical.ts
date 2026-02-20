/**
 * Canonical role names for dropdowns and demand. DB roles (e.g. "Front End Developer", "FE Engineer")
 * map to one display name per bucket so the UI shows merged options and the AI matches all variants.
 */
export const CANONICAL_ROLE_NAMES: Record<string, string> = {
  frontend: 'Frontend Developer',
  backend: 'Backend Developer',
  devops: 'DevOps Engineer',
  mobile: 'Mobile Developer',
  qa: 'QA Engineer',
  design: 'UI/UX Designer',
  manager: 'Project Manager',
  data: 'Data Engineer',
};

/** Synonyms per bucket – same grouping as allocationAdvisor ROLE_SYNONYMS. */
const ROLE_GROUP_SYNONYMS: Record<string, string[]> = {
  backend: [
    'backend', 'back end', 'server', 'api', 'node', 'java', 'go', 'python',
    'ror', 'ruby', '.net', 'net', 'architect', 'full-stack', 'full stack',
    'python/sql', 'backend - java', 'senior software engineer', 'software engineer',
    'senior developer', 'technical lead', 'technical architect', 'team lead',
    'back end developer', 'backend developer',
  ],
  frontend: [
    'frontend', 'front end', 'fe engineer', 'fe ', 'ui', 'react', 'angular', 'vue', 'web',
    'frontend developer', 'front end developer', 'full-stack', 'full stack',
    'senior developer', 'software engineer', 'technical lead', 'team lead',
    '.net engineers', 'ui/ux', 'ux ', 'figma', 'dev - full stack', 'dev- full stack',
    'front end engineer', 'fe engineer', 'fe developer', 'frontend engineer',
  ],
  devops: [
    'devops', 'dev-ops', 'infra', 'sre', 'cloud', 'aws', 'platform',
    'docker', 'kubernetes', 'devops operator', 'devops consultant', 'devops engineer',
  ],
  mobile: ['mobile', 'ios', 'android', 'react native', 'flutter'],
  qa: [
    'qa', 'testing', 'automation', 'sdet', 'quality assurance',
    'qa engineer', 'qa automation', 'tech lead - qa', 'tech lead- qa',
    'team lead qa', 'consultant test engineer', 'selenium', 'cypress',
    'qa automation engineer', 'qa automation tester',
  ],
  design: [
    'design', 'ux', 'ui', 'product designer', 'ui/ux', 'figma',
    'team lead ui/ux', 'ui/ux consultant', 'ux sme', 'ui/ux designer',
  ],
  manager: [
    'manager', 'lead', 'director', 'project manager', 'product manager',
    'delivery manager', 'scrum master', 'scrum', 'product analyst',
    'engagement lead', 'senior ba', 'ba', 'business analyst',
    'technical pm', 'senior project manager', 'senior product manager',
    'senior manager', 'vice president', 'avp', 'svp', 'vp',
    'associate vice president', 'chief ', 'cto', 'coo', 'cfo',
    'scrum master/product analyst',
  ],
  data: [
    'data engineer', 'data-qa', 'data/bi', 'bi developer', 'databricks',
    'data - sql', 'data - aiml', 'data bricks', 'lead data', 'senior data engineer',
    'data/bi engineer', 'data bricks lead', 'bi developer', 'data - sql',
  ],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s*-\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/front\s+end/g, 'frontend')
    .replace(/back\s+end/g, 'backend')
    .replace(/full\s*stack/g, 'fullstack')
    .replace(/\s*\/\s*/g, ' ')
    .trim();
}

/**
 * Maps a raw DB role (e.g. "Front End Developer", "FE Engineer") to a canonical display name.
 * Returns the canonical name if the role matches a group; otherwise returns the original role.
 */
export function getCanonicalRole(rawRole: string): string {
  if (!rawRole || !rawRole.trim()) return rawRole;
  const n = normalize(rawRole);
  for (const [group, synonyms] of Object.entries(ROLE_GROUP_SYNONYMS)) {
    const canonical = CANONICAL_ROLE_NAMES[group];
    if (!canonical) continue;
    const matches = synonyms.some((s) => n.includes(s) || s.includes(n));
    if (matches) return canonical;
  }
  return rawRole.trim();
}

/**
 * Given a list of raw roles from DB, returns unique canonical role names (merged).
 */
export function getCanonicalRoleList(rawRoles: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rawRoles) {
    const c = getCanonicalRole(r);
    if (!c || seen.has(c)) continue;
    seen.add(c);
    out.push(c);
  }
  return out.sort((a, b) => a.localeCompare(b));
}
