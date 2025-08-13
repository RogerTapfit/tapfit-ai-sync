
export function getDisplayName(user: any, profile: any) {
  // Prefer profile.first_name || profile.full_name || user.user_metadata?.name
  // Never show email as a name.
  const candidate =
    profile?.first_name ||
    profile?.full_name ||
    user?.user_metadata?.name;

  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    if (trimmed && !/^[^@]+@[^@]+\.[^@]+$/.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
}
