export function parseTsv(text) {
  const rows = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const [, ...data] = rows;
  const words = data.map((line, index) => {
    const [word, definition, ...extra] = line.split("\t");
    if (!word?.trim() || !definition?.trim() || extra.length) {
      throw new Error(`第 ${index + 2} 行不是“英文<TAB>中文释义”格式。`);
    }
    return { id: `${index + 1}`, word: word.trim(), definition: definition.trim() };
  });
  if (words.length < 12) throw new Error("词库至少需要 12 个单词，才能生成 12 个选项。");
  if (new Set(words.map((word) => word.definition)).size < 12) {
    throw new Error("词库至少需要 12 个不同的中文释义，才能生成 12 个选项。");
  }
  return words;
}

export function createQuestion(words, completedIds, random = Math.random, preferredWordId = null) {
  const remaining = words.filter((word) => !completedIds.includes(word.id));
  if (!remaining.length) return null;

  const answer = remaining.find((word) => word.id === preferredWordId) ?? remaining[Math.floor(random() * remaining.length)];
  const distractors = [...new Map(words
    .filter((word) => word.id !== answer.id && word.definition !== answer.definition)
    .map((word) => [word.definition, word])).values()]
    .sort(() => random() - 0.5)
    .slice(0, 11)
    .map((word) => word.definition);
  const choices = [answer.definition, ...distractors].sort(() => random() - 0.5);
  return { answer, choices };
}
