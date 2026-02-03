export default function WelcomeScreen({
  onNext,
}: {
  onNext: () => void;
}) {
  return (
    <div className="screen">
      <h1>Welcome to Telegram Reminder</h1>
      <p>Smart reminders powered by Telegram</p>

      <button onClick={onNext}>
        Get started
      </button>
    </div>
  );
}
