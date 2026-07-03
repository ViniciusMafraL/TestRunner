export function parseVersion(raw) {
  if (typeof raw !== 'string') return null;
  const match = raw.trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function compareVersions(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa && !pb) return 0;
  if (!pa) return -1;
  if (!pb) return 1;
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

export function findLatestVersion(versions) {
  return versions.reduce(
    (latest, current) => (compareVersions(current, latest) > 0 ? current : latest),
    versions[0] ?? null
  );
}
