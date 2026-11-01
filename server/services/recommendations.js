const asSet = values => new Set((values || []).map(value => String(value).trim().toLocaleLowerCase()).filter(Boolean));

/** Rank published candidates using content similarity, reader interests, popularity, and recency. */
export function recommendBooks({ target, candidates, userInterests = [], similarUserBooks = [], excludeIds = [], limit = 6 }) {
  const targetSubjects = asSet(target?.subjects);
  const interests = userInterests || [];
  const preferredCategories = asSet(interests.map(item => item.categoryId));
  const preferredSubjects = asSet(interests.flatMap(item => item.subjects || []));
  const socialCounts = new Map();
  for (const item of similarUserBooks || []) socialCounts.set(String(item.id), (socialCounts.get(String(item.id)) || 0) + 1);
  const excluded = new Set([...(excludeIds || []), target?.id].filter(value => value != null).map(String));
  const now = Date.now();

  return (candidates || []).filter(book => !excluded.has(String(book.id)) && book.status === "approved").map(book => {
    const sharedSubjects = (book.subjects || []).filter(subject => targetSubjects.has(String(subject).trim().toLocaleLowerCase())).map(subject => (target.subjects || []).find(targetSubject => String(targetSubject).trim().toLocaleLowerCase() === String(subject).trim().toLocaleLowerCase()) || subject);
    const readerSubjects = (book.subjects || []).filter(subject => preferredSubjects.has(String(subject).trim().toLocaleLowerCase()));
    const categoryMatch = Boolean(target?.categoryId && book.categoryId === target.categoryId);
    const readerCategoryMatch = Boolean(book.categoryId && preferredCategories.has(String(book.categoryId)));
    const socialCount = socialCounts.get(String(book.id)) || 0;
    const downloads = Math.max(0, Number(book.downloadCount) || 0);
    const reads = Math.max(0, Number(book.readCount) || 0);
    const timestamp = book.createdAt ? new Date(book.createdAt).getTime() : NaN;
    const ageDays = Number.isFinite(timestamp) ? Math.max(0, (now - timestamp) / 86400000) : Infinity;
    const recentScore = Number.isFinite(ageDays) ? Math.exp(-ageDays / 45) : 0;
    const score = sharedSubjects.length * 3 + (categoryMatch ? 2.5 : 0) + readerSubjects.length * 1.25 + (readerCategoryMatch ? 1.4 : 0) + Math.log1p(socialCount) * 1.8 + Math.log1p(downloads) * 0.3 + Math.log1p(reads) * 0.15 + recentScore * 0.6;
    let reason;
    if (sharedSubjects.length) reason = `Shares the subject${sharedSubjects.length > 1 ? "s" : ""} ${sharedSubjects.slice(0, 3).join(", ")} with this book`;
    else if (categoryMatch) reason = `More to explore in ${book.category || "this category"}`;
    else if (readerSubjects.length) reason = `Matches subjects in your reading activity: ${readerSubjects.slice(0, 3).join(", ")}`;
    else if (readerCategoryMatch) reason = "Popular in a category you have explored";
    else if (socialCount) reason = "Readers with interests similar to yours enjoyed this book";
    else if (downloads || reads) reason = "Popular with Open Shelf readers";
    else reason = "A recent addition to the collection";
    return { ...book, recommendationScore: score, recommendationReason: reason };
  }).sort((a, b) => b.recommendationScore - a.recommendationScore || Number(b.downloadCount || 0) - Number(a.downloadCount || 0) || String(a.title).localeCompare(String(b.title))).slice(0, limit);
}
