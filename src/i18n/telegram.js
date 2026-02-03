export const TG_I18N = {
  it: { ... },
  en: { ... },
  ru: { ... }
};

export const tg = (lang, key, vars = {}) => {
  let text =
    TG_I18N[lang]?.[key] ||
    TG_I18N.en[key] ||
    "";

  for (const k in vars) {
    text = text.replace(`{${k}}`, vars[k]);
  }

  return text;
};
