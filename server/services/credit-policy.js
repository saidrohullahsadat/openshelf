export function calculateAllowance({ used, approvedContributions, freeAllowance = 3, contributionsPerUnlock = 3, downloadsPerUnlock = 10 }) {
  const free = Math.max(0, Number(freeAllowance) || 0);
  const milestone = Math.max(1, Number(contributionsPerUnlock) || 1);
  const unlocked = Math.max(0, Number(downloadsPerUnlock) || 0);
  const count = Math.max(0, Number(approvedContributions) || 0);
  const downloadsUsed = Math.max(0, Number(used) || 0);
  const credits = Math.floor(count / milestone) * unlocked;
  return {
    used: downloadsUsed,
    freeAllowance: free,
    freeUsed: Math.min(downloadsUsed, free),
    approvedContributions: count,
    credits,
    allowance: free + credits,
    remaining: Math.max(0, free + credits - downloadsUsed),
  };
}
