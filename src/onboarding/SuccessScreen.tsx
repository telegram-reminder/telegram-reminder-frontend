export default function SuccessScreen() {
  return (
    <div className="screen">
      <h2>Telegram connected 🎉</h2>

      <p>
        Your account is ready. You can now create reminders.
      </p>

      <button
        onClick={() => window.location.reload()}
      >
        Continue
      </button>
    </div>
  );
}
