export default function OnboardingGate() {
  return (
    <div className="welcome">
      <h1>Welcome to Telegram Reminder</h1>

      <p>
        To use the app you must start the bot on Telegram.
      </p>

      <a
        href="https://t.me/AxelPBot"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary"
      >
        👉 Open Telegram Bot
      </a>
    </div>
  );
}
