export default function WhyTelegramScreen({
  onNext,
}: {
  onNext: () => void;
}) {
  return (
    <div className="screen">
      <h2>Why Telegram?</h2>

      <ul>
        <li>Instant notifications</li>
        <li>No passwords or accounts</li>
        <li>Works even when the app is closed</li>
      </ul>

      <button onClick={onNext}>
        Continue
      </button>
    </div>
  );
}
