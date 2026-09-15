// Flexible predictive search utility matching any part of name, surname, plate, brand or model
export const flexSearchMatch = (textToSearch: string, searchQuery: string): boolean => {
  if (!searchQuery || !searchQuery.trim()) return true;
  const terms = searchQuery.toLowerCase().trim().split(/\s+/);
  const target = (textToSearch || '').toLowerCase();
  return terms.every(term => target.includes(term));
};
