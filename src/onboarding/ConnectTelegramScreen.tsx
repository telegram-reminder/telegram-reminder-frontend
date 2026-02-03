export default function ConnectTelegramScreen() {
  const telegramBotUrl =
  'https://t.me/AxelPBot?start=android';


  return (
    <div className="screen">
      <h2>Connect Telegram</h2>

      <p>
        To use the app, connect your Telegram account.
      </p>

      <a href={telegramBotUrl} className="primary-button">
        Open Telegram Bot
      </a>

      <p className="small">
        No registration required
      </p>
    </div>
  );
}
