import "./App.css";
import { useEffect, useState, useRef } from "react";


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
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  // Se il token è presente nell'URL, viene salvato
  // in localStorage e l'URL viene ripulito
  if (token) {
    localStorage.setItem("user_token", token);
    window.history.replaceState({}, "", "/");
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
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [seenSentCount, setSeenSentCount] = useState(0);
  const [showBadge, setShowBadge] = useState(false);
  const [newSentCount, setNewSentCount] = useState(0);


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

const badgeTimerStartedRef = useRef(false);


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
    message: "Specifica una data o un orario"
  });
  return;
}


const payload = {
  text: finalText,
  remindAt: finalDate.toISOString()
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
  message: editingId ? "Promemoria aggiornato" : "Promemoria creato"
});

      setText("");
      setRemindAt("");

      loadData();
    } catch (err) {
      console.error("Errore saveReminder:", err);
    }
  };


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
      message: "Promemoria inviati eliminati"
    });
  } catch {
    setToast({
      type: "error",
      message: "Errore durante l'eliminazione"
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

  if (!token) {
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
      <h1>Telegram Reminder</h1>
<Toast toast={toast} onClose={() => setToast(null)} />


      <textarea
        placeholder="Es. pagare bolletta domani alle 18"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button className="voice" onClick={startVoice}>
        {listening ? "🎙️ Ascolto…" : "🎤 Dettatura vocale"}
      </button>

      <input
        type="datetime-local"
        value={remindAt}
        onChange={(e) => setRemindAt(e.target.value)}
      />

      <button onClick={saveReminder}>
        {editingId ? "Aggiorna promemoria" : "Salva promemoria"}
      </button>

      <hr />

      <h2>⏳ Da inviare</h2>
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
    {pending.map((r) => (
      <li key={r.id}>
        <strong>{r.text}</strong><br />
        <small>{new Date(r.remind_at).toLocaleString()}</small><br />
        <button
          onClick={() => {
            setText(r.text);
            setRemindAt(toLocalInput(new Date(r.remind_at)));
            setEditingId(r.id);
          }}
        >
          ✏️ Modifica
        </button>
        <button onClick={() => deleteReminder(r)}>
          🗑️ Elimina
        </button>
      </li>
    ))}
  </ul>
)}


      <hr />

<h2 style={{ position: "relative", display: "inline-block" }}>
  ✅ Inviati (ultimi 10)
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

      {sent.length === 0 && <p>Nessun promemoria inviato</p>}

      <ul>
        {sent.slice(0, 10).map((r) => (
          <li key={r.id}>
            <strong>{r.text}</strong><br />
            <small>{new Date(r.remind_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
