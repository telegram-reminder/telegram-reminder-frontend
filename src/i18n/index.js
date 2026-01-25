import it from "./it";
import en from "./en";
import ru from "./ru";
import zh from "./zh";
import ar from "./ar";

const languages = { it, en, ru, zh, ar };

export const getLang = () => {
  const stored = localStorage.getItem("lang");
  if (stored && languages[stored]) return stored;

  const browser = navigator.language.slice(0, 2);
  return languages[browser] ? browser : "it";
};

export const t = (key, vars = {}) => {
  const lang = getLang();
  let text = languages[lang][key] || languages.it[key] || key;

  Object.keys(vars).forEach(k => {
    text = text.replace(`{${k}}`, vars[k]);
  });

  return text;
};
