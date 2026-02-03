import OnboardingGate from './onboarding/OnboardingGate';

function App() {
  const telegramUserId =
    localStorage.getItem('telegram_user_id');

  if (!telegramUserId) {
    return <OnboardingGate />;
  }

  return <MainApp />;
}

export default App;
