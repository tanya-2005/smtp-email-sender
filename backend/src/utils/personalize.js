const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

function personalize(template, data) {
  if (!template) return template;

  return template.replace(PLACEHOLDER_REGEX, (match, key) => {
    const value = data[key.toLowerCase()];
    return value !== undefined && value !== null ? String(value) : match;
  });
}

module.exports = personalize;
