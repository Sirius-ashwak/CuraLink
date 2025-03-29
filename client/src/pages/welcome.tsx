import WelcomeScreen from "@/components/welcome/WelcomeScreen";

export default function Welcome() {
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <WelcomeScreen />
    </div>
  );
}