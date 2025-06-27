import { InputForm } from "./InputForm";

interface WelcomeScreenProps {
  handleSubmit: (
    submittedInputValue: string,
    effort: string,
    model: string
  ) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  handleSubmit,
  onCancel,
  isLoading,
}) => (
  <div className="flex flex-col items-center gap-4" style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
    <h1 className="text-6xl font-bold mb-2 text-center">Welcome.</h1>
    <p className="text-2xl text-neutral-400 mb-6 text-center">How can I help you today?</p>
    <InputForm
      onSubmit={handleSubmit}
      isLoading={isLoading}
      onCancel={onCancel}
      hasHistory={false}
    />
    <p className="text-xs text-neutral-500 mt-2">
      Powered by Google Gemini and LangChain LangGraph.
    </p>
  </div>
);
