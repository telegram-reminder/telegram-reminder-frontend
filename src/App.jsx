import "./App.css";
import { useEffect, useState, useRef } from "react";
import MonthlyCalendar from "./MonthlyCalendar.jsx";
import SettingsPanel from "./SettingsPanel.jsx"; // ✅ QUESTA RIGA
import { t, getLang } from "./i18n";
import OnboardingGate from './onboarding/OnboardingGate.tsx';


console.log("🔥 FRONTEND BUILD NUOVA —", new Date().toISOString());



/*
====================================================
CONFIG
====================================================
*/

const API = "https://telegram-reminder.sandropiu78.workers.dev";
const SENT_SEEN_KEY = "telegram_reminder_last_seen_sent";
const LAST_SEEN_SENT_AT_KEY = "telegram_reminder_last_seen_sent_at";


/*


/*
====================================================
SPEECH API
====================================================
*/

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

/*
====================================================
DATE HELPERS
====================================================
*/

const toLocalInput = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

/*
====================================================
PARSING VOCALE ITALIANO
====================================================
*/

const parseDateFromText = (input) => {
  const now = new Date();
  let text = input.toLowerCase();
  let date = null;

  if (text.includes("dopodomani")) {
    date = new Date(now);
    date.setDate(date.getDate() + 2);
    text = text.replace("dopodomani", "");
  } else if (text.includes("domani")) {
    date = new Date(now);
    date.setDate(date.getDate() + 1);
    text = text.replace("domani", "");
  }

  const inMinutes = text.match(/(tra|fra)\s+(\d+)\s+minuti?/);
  if (!date && inMinutes) {
    date = new Date(now.getTime() + parseInt(inMinutes[2]) * 60000);
    text = text.replace(inMinutes[0], "");
  }

  const inHours = text.match(/(tra|fra)\s+(\d+)\s+ore?/);
  if (!date && inHours) {
    date = new Date(now.getTime() + parseInt(inHours[2]) * 3600000);
    text = text.replace(inHours[0], "");
  }

  const time = text.match(/alle\s+(\d{1,2})([:\s](\d{2}))?/);
  if (time) {
    date = date || new Date(now);
    date.setHours(
      parseInt(time[1]),
      time[3] ? parseInt(time[3]) : 0,
      0,
      0
    );
    text = text.replace(time[0], "");
  }

  return { cleanText: text.trim(), date };
};

function upgradeToPremium() {
  if (window.Android && typeof window.Android.purchasePremium === "function") {
    window.Android.purchasePremium();
  } else {
    alert("Premium purchase is only available in the Android app");
  }
}

window.onPremiumPurchased = async (purchaseToken) => {
  // 🔹 1) Recupero telegram_id dal WebApp Telegram
  const telegramId =
    window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

  if (!telegramId) {
    console.error("❌ telegram_id MANCANTE in onPremiumPurchased");
    alert("Errore: telegram_id non trovato. Riapri l’app da Telegram.");
    return;
  }

  console.log("✅ PREMIUM VERIFY → telegram_id:", telegramId);

  // 🔹 2) Chiamata corretta al backend
  const res = await fetch(
    "https://api.telegram-reminder.app/api/premium/verify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegram_id: String(telegramId),   // ← FONDAMENTALE
        purchaseToken                     // ← token Play
      })
    }
  );

  const data = await res.json();
  console.log("🎯 /api/premium/verify RESPONSE:", data);

if (res.ok) {
  const token = localStorage.getItem("token");

  const status = await fetch(
    "https://api.telegram-reminder.app/api/user/status",
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  ).then(r => r.json());

    console.log("🔄 NUOVO USER STATUS DOPO ACQUISTO:", status);

    // Aggiorna lo stato React (se vuoi evitare reload)
    window._setUserStatus?.(status);

    // Ricarica pulita (opzionale ma consigliata)
    window.location.reload();
  } else {
    alert("Errore verifica premium: " + (data.error || "sconosciuto"));
  }
};


function Toast({ toast, onClose }) {
	 console.log("🧪 TOAST RENDER", toast);
  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.type}`}>
      <span>{toast.message}</span>

      {toast.onAction && (
        <button className="toast-action" onClick={toast.onAction}>
          {toast.actionLabel}
        </button>
      )}

      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}


(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (token) {
    localStorage.setItem("token", token);
    window.history.replaceState({}, document.title, "/");
  }
})();


/*
====================================================
APP
====================================================
*/

export default function App() {
  //const token = localStorage.getItem("user_token");
  
    const token = localStorage.getItem("token");

  // ⛔ GATE UNICO
  if (!token) {
    return <OnboardingGate />;
  }
const [userStatus, setUserStatus] = useState({
  is_premium: false,
  max_active_reminders: 3
});
const [statusLoaded, setStatusLoaded] = useState(false);


// espone setter a window SOLO DOPO il primo render
useEffect(() => {
  window._setUserStatus = setUserStatus;
}, []);


  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);
  
  useEffect(() => {
  const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

  if (telegramId && window.Android?.saveTelegramId) {
    window.Android.saveTelegramId(String(telegramId));
    console.log("📲 telegram_id inviato ad Android:", telegramId);
  } else {
    console.warn("⚠️ NON è stato possibile salvare telegram_id in Android");
  }
}, []);

  
 useEffect(() => {
  if (!token) return;

  fetch(`${API}/api/user/status`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(r => r.json())
    .then(data => {
      console.log("👤 USER STATUS", data);

      // 🔥 NORMALIZZAZIONE SICURA (chiave!)
      setUserStatus({
        is_premium: !!data.is_premium,
        max_active_reminders: data.max_active_reminders ?? 3,
        can_use_email: !!data.can_use_email,
        voice_remaining_today: data.voice_remaining_today
      });
	  setStatusLoaded(true);
    })
    .catch(err => {
      console.error("Errore user/status:", err);
    });
}, [token]);
  /*
  --------------------------------------------------
  STATE
  --------------------------------------------------
  */
  
  const [text, setText] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [pending, setPending] = useState([]);
  const [sent, setSent] = useState([]);
  const [listening, setListening] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showBadge, setShowBadge] = useState(false);
  const [newSentCount, setNewSentCount] = useState(0);
  const [justAddedId, setJustAddedId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const pendingRefs = useRef([]);

  const dayToFirstIndex = {};
  
const [theme, setTheme] = useState(
  localStorage.getItem("theme") || "system"
);

const [lang, setLang] = useState(
  localStorage.getItem("lang") || getLang()
);



const today = new Date();

const formattedToday = today.toLocaleDateString(lang, {
  weekday: "long",
  day: "numeric",
  month: "long"
});


useEffect(() => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const isDark =
    theme === "dark" ||
    (theme === "system" && prefersDark);

  document.body.classList.toggle("dark", isDark);

  localStorage.setItem("theme", theme);
}, [theme]);


useEffect(() => {
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}, [lang]);


const hasNoReminders =
  !loading &&
  pending.length === 0 &&
  sent.length === 0;


pending.forEach((r, index) => {
  const dayKey = new Date(r.remind_at)
    .toLocaleDateString("en-CA"); // YYYY-MM-DD locale

  if (dayToFirstIndex[dayKey] === undefined) {
    dayToFirstIndex[dayKey] = index;
  }
});

const handleDaySelect = (dayKey) => {
  const index = dayToFirstIndex[dayKey];
  if (index === undefined) return;

  const el = pendingRefs.current[index];
  if (!el) return;

  el.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  // ✨ evidenziazione temporanea
  el.classList.add("highlight");

  setTimeout(() => {
    el.classList.remove("highlight");
  }, 3000);
};


  /*
  --------------------------------------------------
  LOAD DATA
  --------------------------------------------------
  */

  const loadData = async () => {
  if (initialLoad) setLoading(true);

  try {
    const [p, s] = await Promise.all([
      fetch(`${API}/api/reminders`, {
        headers: { Authorization: `Bearer ${token}`,
			"Cache-Control": "no-store"}
      }),
      fetch(`${API}/api/reminders/sent`, {
        headers: { Authorization: `Bearer ${token}`,
			"Cache-Control": "no-store"}
      })
    ]);

    const pendingData = await p.json();
    const sentData = await s.json();

    if (Array.isArray(pendingData)) setPending(pendingData);
if (Array.isArray(sentData)) {
  setSent(sentData);

  const lastSeen = localStorage.getItem(LAST_SEEN_SENT_AT_KEY);

  const unseen = lastSeen
    ? sentData.filter(r => r.sent_at && r.sent_at > lastSeen)
    : sentData.filter(r => r.sent_at);

  if (unseen.length > 0) {
    setShowBadge(true);
    setNewSentCount(unseen.length);
  }
}




  } catch (err) {
    console.error("Errore loadData:", err);
  } finally {
    if (initialLoad) {
      setLoading(false);
      setInitialLoad(false);
    }
  }
};

  /*
  --------------------------------------------------
  POLLING
  --------------------------------------------------
  */
useEffect(() => {
  if (!token) return;

  loadData(); // 👈 primo e UNICO load iniziale

  const interval = setInterval(() => {
    loadData();
  }, 60000);

  return () => clearInterval(interval);
}, [token]);


useEffect(() => {
  if (!toast) return;

  const t = setTimeout(() => {
    setToast(null);
  }, toast.onAction ? 5000 : 3000);

  return () => clearTimeout(t);
}, [toast]);


useEffect(() => {
  if (!showBadge) return;

  const timer = setTimeout(() => {
    setShowBadge(false);
    setNewSentCount(0);

    const newest = sent.find(r => r.sent_at)?.sent_at;
    if (newest) {
      localStorage.setItem(LAST_SEEN_SENT_AT_KEY, newest);
    }
  }, 5000);

  return () => clearTimeout(timer);
}, [showBadge, sent]);

useEffect(() => {
  if (!showBadge || newSentCount === 0) return;

  setToast({
    type: "info",
    message:
      newSentCount === 1
        ? t("newSentOne")
        : t("newSentMany", { count: newSentCount })
  });
}, [showBadge, newSentCount]);


  /*
  --------------------------------------------------
  ADD / UPDATE REMINDER
  --------------------------------------------------
  */
console.log("STATUS IN SAVE:", userStatus, "loaded:", statusLoaded);
  const saveReminder = async () => {
	  
const isFreeLimitReached =
  statusLoaded &&               // 🔥 NOVITÀ
  !userStatus.is_premium &&
  !editingId &&
  pending.length >= (userStatus.max_active_reminders ?? 3);



if (isFreeLimitReached) {
	console.log("🔥 FREE LIMIT — TOAST SHOULD SHOW");
  setToast({
    type: "info",
    message: t("freeLimitReached"),
    actionLabel: t("upgradePremium"),
    onAction: () =>
      window.open("https://t.me/AxelPBot", "_blank")
  });

  return;
}



    if (!text) return;

    let finalText = text;
    let finalDate = remindAt ? new Date(remindAt) : null;

    const parsed = parseDateFromText(text);
    if (parsed.date) finalDate = parsed.date;
    if (parsed.cleanText) finalText = parsed.cleanText;
    if (!finalDate) {
setToast({
  type: "error",
  message: t("missingDate")
});

  return;
}


const utcDate = finalDate;


const payload = {
  text: finalText,
  remindAt: utcDate.toISOString(),
  lang: localStorage.getItem("lang") || lang
};

		  console.log("📦 PAYLOAD REMINDER =", payload);

		  console.log("🚨 PAYLOAD LANG =", lang, "localStorage =", localStorage.getItem("lang"));


    try {
      if (editingId) {
		  

await fetch(`${API}/api/reminder/${editingId}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify(payload)
});

setPending(list =>
  list.map(r =>
    r.id === editingId
      ? { ...r, text: payload.text, remind_at: payload.remindAt }
      : r
  )
);

setEditingId(null);

      } else {
  const res = await fetch(`${API}/api/reminder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error("Create failed");

  // ✅ optimistic UI
const newReminder = {
  id: "__temp__" + Date.now(),
  text: payload.text,
  remind_at: payload.remindAt
};

setPending(list =>
  [...list, newReminder].sort(
    (a, b) => new Date(a.remind_at) - new Date(b.remind_at)
  )
);

}

setToast({
  type: "success",
  message: t("reminderUpdated")
});


setText("");
setRemindAt("");

//setJustAddedId("pending"); // placeholder
//loadData();

    } catch (err) {
      console.error("Errore saveReminder:", err);
    }
  };

useEffect(() => {
  if (!justAddedId) return;

  if (pending.length > 0) {
    setJustAddedId(pending[0].id);

    setTimeout(() => {
      setJustAddedId(null);
    }, 300);
  }
}, [pending, justAddedId]);


  /*
  --------------------------------------------------
  CLEAR SENT REMINDERS
  --------------------------------------------------
  */

const [clearing, setClearing] = useState(false);

const clearSentReminders = async () => {
  setClearing(true);

  try {
    await fetch(`${API}/api/reminders/sent`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    setSent([]);

    // ✅ SEGNA COME VISTI
    localStorage.setItem(
      SENT_SEEN_KEY,
      sent.length.toString()
    );

    setToast({
      type: "success",
      message: t("sentCleared")
    });
  } catch {
    setToast({
      type: "error",
      message: t("deleteError")
    });
  } finally {
    setClearing(false);
  }
};



const deleteReminder = async (reminder) => {
  try {
    const res = await fetch(`${API}/api/reminder`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ id: reminder.id })
    });

    if (!res.ok) {
      throw new Error("Delete failed");
    }

    // ✅ aggiorna stato LOCALE
    setPending(list => list.filter(r => r.id !== reminder.id));

setToast({
  type: "success",
   message: t("reminderDeleted")
});

  } catch (err) {
setToast({
  type: "error",
  message: t("reminderDeleteError")
});;
  }
};




  /*
  --------------------------------------------------
  VOICE INPUT
  --------------------------------------------------
  */

  const startVoice = () => {
    if (!SpeechRecognition) {
      alert("Browser non supportato");
      return;
    }

    const rec = new SpeechRecognition();
const SPEECH_LANG = {
  it: "it-IT",
  en: "en-US",
  ru: "ru-RU",
  ar: "ar-SA",
  zh: "zh-CN"
};
rec.lang = SPEECH_LANG[lang] || "it-IT";

    setListening(true);
    rec.start();

    rec.onresult = (e) => {
      const spoken = e.results[0][0].transcript;
      const parsed = parseDateFromText(spoken);

      setText(parsed.cleanText || spoken);
      if (parsed.date) setRemindAt(toLocalInput(parsed.date));
      setListening(false);
    };

    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
  };

  /*
  --------------------------------------------------
  UI
  --------------------------------------------------
  */
return (
  <div className="app">
 <Toast
  toast={toast}
  onClose={() => setToast(null)}
/>

<div className="app-header">
  <div className="header-left">
    <h1 className="app-title">
      {t("appTitle")}
{userStatus?.is_premium === false && (
  <span className="badge-free">FREE</span>
)}

    </h1>
  </div>

  <button
    className="settings-button"
    onClick={() => setSettingsOpen(true)}
  >
    ⚙️
  </button>
</div>

{/* ACTION ROW */}
<div className="header-actions">
  <select
    className="lang-select"
    value={lang}
    onChange={async (e) => {
      const newLang = e.target.value;
      setLang(newLang);
      localStorage.setItem("lang", newLang);

      await fetch(`${API}/api/user/lang`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ lang: newLang })
      });
    }}
  >
    <option value="en">🇬🇧 English</option>
	<option value="ar">🇸🇦 العربية</option>
	<option value="it">🇮🇹 Italiano</option>
    <option value="ru">🇷🇺 Русский</option> 
    <option value="zh">🇨🇳 中文</option>
  </select>

{userStatus && !userStatus.is_premium && (
  <button
    className="upgrade-btn"
    onClick={() => {
      const telegramId =
  window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

const url =
  "intent://billing?" +
  "tid=" + encodeURIComponent(telegramId) +
  "#Intent;" +
  "scheme=app;" +
  "package=app.telegram.reminder;" +
  "end";

window.location.href = url;
    }}
  >
    ⭐ {t("upgradePremium")}
  </button>
)}



</div>



      <textarea
       placeholder={t("placeholder")}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button className="voice" onClick={startVoice}>
  {listening ? `🎙️ ${t("listening")}` : `🎤 ${t("voiceInput")}`}
</button>


      <input
        type="datetime-local"
        value={remindAt}
        onChange={(e) => setRemindAt(e.target.value)}
      />

<button className="primary"
  onClick={() => {
    navigator.vibrate?.(25);
    saveReminder();
  }}
>
  {t("save")}
</button>

<hr />

<hr />

<div className="today-header">
  <div className="today-label">
    {t("today")}
  </div>
  <div className="today-date">
    {formattedToday}
  </div>
</div>

<MonthlyCalendar
  reminders={pending}
  onDaySelect={handleDaySelect}
/>



      <h2>⏳ {t("pending")}</h2>
	  
	  {hasNoReminders && (
  <p className="empty">⏰ {t("empty")}</p>
)}


      {loading && (
  <div className="skeleton-list">
    <div className="skeleton" />
    <div className="skeleton" />
  </div>
)}



{!loading && (
  <ul>
    {pending.map((r, index) => (
<li
  key={r.id}
  ref={(el) => (pendingRefs.current[index] = el)}
  className={`reminder-card ${r.id === justAddedId ? "enter" : ""}`}
>

        <strong>{r.text}</strong><br />
        <small>{new Date(r.remind_at).toLocaleString()}</small><br />
        <button
          onClick={() => {
            setText(r.text);
            setRemindAt(toLocalInput(new Date(r.remind_at)));
            setEditingId(r.id);
          }}
        >
         ✏️ {t("edit")}
        </button>
        <button onClick={() => deleteReminder(r)}>
          🗑️ {t("delete")}
        </button>
      </li>
    ))}
  </ul>
)}


      <hr />

<h2 style={{ position: "relative", display: "inline-block" }}>
  ✅ {t("sentLast")} 
  {showBadge && (
    <span className="sent-badge">
      {newSentCount}
    </span>
  )}
</h2>

{loading && (
  <div className="skeleton-list">
    <div className="skeleton" />
  </div>
)}

      {sent.length > 0 && (
<button onClick={clearSentReminders} disabled={clearing}>
  {clearing ? t("deleting") : t("delete")}
</button>

      )}

     {sent.length === 0 && <p>{t("emptySent")}</p>}

      <ul>
        {sent.slice(0, 10).map((r) => (
          <li key={r.id}>
            <strong>{r.text}</strong><br />
            <small>{new Date(r.remind_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>

      {/* SETTINGS PANEL – overlay, non influisce sul layout */}
<SettingsPanel
  open={settingsOpen}
  onClose={() => setSettingsOpen(false)}
  theme={theme}
  setTheme={setTheme}
/>


  </div>
);
}
