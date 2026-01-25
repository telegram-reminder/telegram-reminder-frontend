import "./SettingsPanel.css";
import { t, getLang } from "./i18n";


export default function SettingsPanel({
  open,
  onClose,
  theme,
  setTheme
}) {
  if (!open) return null;
  const lang = localStorage.getItem("lang") || getLang() || "it";

  const supportedLangs = ["it", "en", "ru", "zh", "ar"];
  const safeLang = supportedLangs.includes(lang) ? lang : "en";

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div
        className="settings-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-header">
          <h2>⚙️ {t("settings")}</h2>
          <button
            className="settings-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>


<section className="settings-section">
  <h3 className="settings-title">
    {t("appearance")}
  </h3>

  <div className="settings-radio">
    <label>
      <input
        type="radio"
        name="theme"
        value="system"
        checked={theme === "system"}
        onChange={() => setTheme("system")}
      />
      {t("themeSystem")}
    </label>

    <label>
      <input
        type="radio"
        name="theme"
        value="light"
        checked={theme === "light"}
        onChange={() => setTheme("light")}
      />
      {t("themeLight")}
    </label>

    <label>
      <input
        type="radio"
        name="theme"
        value="dark"
        checked={theme === "dark"}
        onChange={() => setTheme("dark")}
      />
      {t("themeDark")}
    </label>
  </div>
</section>

        {/* ===== INFO & SUPPORTO ===== */}
        <section className="settings-section">
          <h3 className="settings-title">
            {t("infoSupport")}
          </h3>

          <ul className="settings-list">
  <li
    className="settings-item"
    onClick={() => window.open(`/privacy/${safeLang}`, "_blank")}
  >
    🔐 {t("privacyPolicy")}
  </li>

  <li
    className="settings-item"
    onClick={() => window.open(`/terms/${safeLang}`, "_blank")}
  >
    📄 {t("termsOfService")}
  </li>

  <li
    className="settings-item"
    onClick={() =>
      window.open(
        "https://play.google.com/store/apps/details?id=TUO_PACKAGE_ID",
        "_blank"
      )
    }
  >
    ⭐ {t("writeReview")}
  </li>

  <li
    className="settings-item"
    onClick={() => {
      navigator.share?.({
        title: "Telegram Reminder",
        text: t("shareText"),
        url: window.location.origin
      });
    }}
  >
    📤 {t("shareApp")}
  </li>
</ul>


          <div className="settings-footer">
            @telegram-reminder · v1.1
          </div>
        </section>
      </div>
    </div>
  );
}
