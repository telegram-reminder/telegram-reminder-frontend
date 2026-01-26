import "./App.css";
import { useEffect, useState, useRef } from "react";
import MonthlyCalendar from "./MonthlyCalendar.jsx";
import SettingsPanel from "./SettingsPanel.jsx"; // ✅ QUESTA RIGA
import { t, getLang } from "./i18n";


console.log("VERSIONE NUOVA 2 ATTIVA");



/*
====================================================
CONFIG
====================================================
*/

const API = "https://telegram-reminder.sandropiu78.workers.dev";
const SENT_SEEN_KEY = "telegram_reminder_last_seen_sent";
const LAST_SEEN_SENT_AT_KEY = "telegram_reminder_last_seen_sent_at";


/*
====================================================
TOKEN BOOTSTRAP
====================================================
*/
(() => {
  let token = null;

  // 1️⃣ Token da URL classico
  const params = new URLSearchParams(window.location.search);
  token = params.get("token");

  // 2️⃣ Token da Telegram WebApp
  if (!token && window?.Telegram?.WebApp?.initDataUnsafe?.start_param) {
    token = window.Telegram.WebApp.initDataUnsafe.start_param;
  }

  if (token) {
    localStorage.setItem("user_token", token);
  }
})();


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

function Toast({ toast, onClose }) {
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


/*
====================================================
APP
====================================================
*/

export default function App() {
  const token = localStorage.getItem("user_token");

console.log("APP CON SETTINGS");

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);
  
  
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
  const lang = localStorage.getItem("lang") || getLang();

  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}, []);


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
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${API}/api/reminders/sent`, {
        headers: { Authorization: `Bearer ${token}` }
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
  loadData();
}, [token]);

useEffect(() => {
  if (!token) return;

  const interval = setInterval(() => {
    loadData();
  }, 60000); // ogni 10 secondi

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

  const saveReminder = async () => {
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

// 🔧 CONVERSIONE CORRETTA LOCALE → UTC
const localDate = finalDate;

const utcDate = new Date(
  localDate.getTime() - localDate.getTimezoneOffset() * 60000
);

const payload = {
  text: finalText,
  remindAt: utcDate.toISOString()
};

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

        setEditingId(null);
      } else {
        await fetch(`${API}/api/reminder`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify(payload)
});
}
setToast({
  type: "success",
  message: t("reminderUpdated")
});


setText("");
setRemindAt("");

setJustAddedId("pending"); // placeholder
loadData();

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



const deleteReminder = (reminder) => {
  // rimuove subito dalla UI
  setPending(list => list.filter(r => r.id !== reminder.id));

  setToast({
    type: "success",
    message: "Promemoria eliminato",
    actionLabel: "Annulla",
    onAction: () => {
      setPending(list => [...list, reminder]);
      setToast(null);
    }
  });

setTimeout(async () => {
  await fetch(`${API}/api/reminder`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ id: reminder.id })
  });
}, 5000);
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
    rec.lang = "it-IT";

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
  TOKEN CHECK
  --------------------------------------------------
  */

if (!token && !window?.Telegram?.WebApp) {
  return (
    <div className="app">
      <h2>⚠️ Apri l’app dal link ricevuto su Telegram</h2>
    </div>
  );
}

  /*
  --------------------------------------------------
  UI
  --------------------------------------------------
  */
return (
  <div className="app">
<div className="app-header">
  <h1 className="app-title">
    {t("appTitle")}
  </h1>

<button
  className="settings-button"
  onClick={() => {
    console.log("CLICK SETTINGS");
    setSettingsOpen(true);
  }}
>
  ⚙️
</button>

</div>


    <Toast toast={toast} onClose={() => setToast(null)} />



<select
  value={lang}
  onChange={async (e) => {
    const newLang = e.target.value;

    // 1️⃣ aggiorna React
    setLang(newLang);

    // 2️⃣ salva localmente
    localStorage.setItem("lang", newLang);

    // 3️⃣ POST al backend (ORA VISIBILE)
    try {
      await fetch(`${API}/api/user/lang`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ lang: newLang })
      });
      console.log("LANG POST OK:", newLang);
    } catch (err) {
      console.error("LANG POST ERROR", err);
    }
  }}
>

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

<button
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

      {loading && (
  <div className="skeleton-list">
    <div className="skeleton" />
    <div className="skeleton" />
  </div>
)}

{!loading && pending.length === 0 && (
  <p className="empty">⏰ Nessun promemoria</p>
)}

{!loading && (
  <ul>
    {pending.map((r, index) => (
<li
  key={r.id}
  ref={(el) => (pendingRefs.current[index] = el)}
  className={r.id === justAddedId ? "enter" : ""}
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
  {clearing ? "Eliminazione…" : "Elimina"}
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
