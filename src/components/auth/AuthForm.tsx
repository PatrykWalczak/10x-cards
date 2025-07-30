import React, { useState, useCallback, useId } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthToast } from "../ui/use-toast";
import { loginSchema, registerSchema, passwordResetSchema, newPasswordSchema } from "../../lib/validation/auth.schemas";

export type AuthMode = "login" | "register" | "reset" | "new-password";

interface AuthFormProps {
  mode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export const AuthForm = ({ mode = "login", onModeChange }: AuthFormProps) => {
  const { signIn, signUp, resetPassword, updatePassword } = useAuth();
  const { showSuccess, showError } = useAuthToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  const validateForm = useCallback(
    (data: { email?: string; password?: string; confirmPassword?: string }): FormErrors => {
      const newErrors: FormErrors = {};

      try {
        if (mode === "login") {
          loginSchema.parse(data);
        } else if (mode === "register") {
          registerSchema.parse(data);
        } else if (mode === "reset") {
          passwordResetSchema.parse(data);
        } else if (mode === "new-password") {
          newPasswordSchema.parse(data);
        }
      } catch (error: unknown) {
        if (error && typeof error === "object" && "errors" in error) {
          const zodError = error as { errors: { path: string[]; message: string }[] };
          zodError.errors.forEach((err) => {
            const field = err.path[0] as keyof FormErrors;
            newErrors[field] = err.message;
          });
        }
      }

      return newErrors;
    },
    [mode]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setErrors({});

      const formData = {
        email: email.trim(),
        password,
        ...(mode === "register" && { confirmPassword }),
        ...(mode === "new-password" && { confirmPassword }),
      };

      // Validate form
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setIsLoading(false);
        return;
      }

      try {
        let result;

        if (mode === "login") {
          result = await signIn(formData.email, formData.password);
        } else if (mode === "register") {
          result = await signUp(formData.email, formData.password);
        } else if (mode === "reset") {
          result = await resetPassword(formData.email);
        } else if (mode === "new-password") {
          result = await updatePassword(formData.password);
        }

        if (result?.error) {
          setErrors({ general: result.error });
          showError(result.error);
        } else {
          if (mode === "register") {
            showSuccess("Konto zostało utworzone! Sprawdź email aby potwierdzić rejestrację.");
          } else if (mode === "reset") {
            showSuccess("Link do resetowania hasła został wysłany na Twój email.");
            onModeChange?.("login");
          } else if (mode === "new-password") {
            showSuccess("Hasło zostało zmienione pomyślnie!");
            onModeChange?.("login");
          } else if (mode === "login") {
            showSuccess("Zalogowano pomyślnie!");
            setTimeout(() => {
              window.location.href = "/generate";
            }, 1000);
          }
        }
      } catch {
        const errorMessage = "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";
        setErrors({ general: errorMessage });
        showError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [
      email,
      password,
      confirmPassword,
      mode,
      signIn,
      signUp,
      resetPassword,
      updatePassword,
      validateForm,
      showSuccess,
      showError,
      onModeChange,
    ]
  );

  const getTitle = () => {
    switch (mode) {
      case "register":
        return "Utwórz konto";
      case "reset":
        return "Resetuj hasło";
      case "new-password":
        return "Ustaw nowe hasło";
      default:
        return "Zaloguj się";
    }
  };

  const getSubmitText = () => {
    if (isLoading) return "Ładowanie...";
    switch (mode) {
      case "register":
        return "Utwórz konto";
      case "reset":
        return "Wyślij link";
      case "new-password":
        return "Ustaw hasło";
      default:
        return "Zaloguj się";
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{getTitle()}</h2>
        <p className="text-gray-600">
          {mode === "register"
            ? "Załóż nowe konto aby rozpocząć naukę z AI"
            : mode === "reset"
              ? "Wprowadź swój email aby otrzymać link resetujący"
              : mode === "new-password"
                ? "Wprowadź nowe hasło dla swojego konta"
                : "Wprowadź swoje dane aby kontynuować"}
        </p>
      </div>

      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠</span>
            <p className="text-sm text-red-700">{errors.general}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email field */}
        {mode !== "new-password" && (
          <div>
            <label htmlFor={emailId} className="block text-sm font-semibold text-gray-700 mb-2">
              📧 Adres email
            </label>
            <div className="relative">
              <input
                id={emailId}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                  errors.email
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"
                }`}
                placeholder="twoj@email.com"
                disabled={isLoading}
                autoComplete="email"
                aria-describedby={errors.email ? `${emailId}-error` : undefined}
              />
            </div>
            {errors.email && (
              <p id={`${emailId}-error`} className="mt-2 text-sm text-red-600 flex items-center">
                <span className="mr-1">⚠</span> {errors.email}
              </p>
            )}
          </div>
        )}

        {/* Password field */}
        {mode !== "reset" && (
          <div>
            <label htmlFor={passwordId} className="block text-sm font-semibold text-gray-700 mb-2">
              🔒 Hasło
            </label>
            <div className="relative">
              <input
                id={passwordId}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                  errors.password
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"
                }`}
                placeholder="Twoje hasło"
                disabled={isLoading}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                aria-describedby={errors.password ? `${passwordId}-error` : undefined}
              />
            </div>
            {errors.password && (
              <p id={`${passwordId}-error`} className="mt-2 text-sm text-red-600 flex items-center">
                <span className="mr-1">⚠</span> {errors.password}
              </p>
            )}
          </div>
        )}

        {/* Confirm Password field */}
        {(mode === "register" || mode === "new-password") && (
          <div>
            <label htmlFor={confirmPasswordId} className="block text-sm font-semibold text-gray-700 mb-2">
              🔐 Powtórz hasło
            </label>
            <div className="relative">
              <input
                id={confirmPasswordId}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl shadow-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                  errors.confirmPassword
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"
                }`}
                placeholder="Powtórz hasło"
                disabled={isLoading}
                autoComplete="new-password"
                aria-describedby={errors.confirmPassword ? `${confirmPasswordId}-error` : undefined}
              />
            </div>
            {errors.confirmPassword && (
              <p id={`${confirmPasswordId}-error`} className="mt-2 text-sm text-red-600 flex items-center">
                <span className="mr-1">⚠</span> {errors.confirmPassword}
              </p>
            )}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
              Ładowanie...
            </div>
          ) : (
            <span className="flex items-center justify-center">
              {mode === "register" ? "🚀 " : mode === "reset" ? "📧 " : mode === "new-password" ? "🔑 " : "🎯 "}
              {getSubmitText()}
            </span>
          )}
        </button>
      </form>

      {/* Mode switch links */}
      <div className="mt-8 text-center space-y-4">
        {mode === "login" && (
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">lub</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Nie masz konta?{" "}
              <button
                type="button"
                onClick={() => onModeChange?.("register")}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
              >
                Zarejestruj się tutaj 🚀
              </button>
            </p>
            <p className="text-sm text-gray-600">
              <button
                type="button"
                onClick={() => onModeChange?.("reset")}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
              >
                Zapomniałeś hasła? 🔄
              </button>
            </p>
          </div>
        )}

        {mode === "register" && (
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">lub</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Masz już konto?{" "}
              <button
                type="button"
                onClick={() => onModeChange?.("login")}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
              >
                Zaloguj się tutaj 🎯
              </button>
            </p>
          </div>
        )}

        {mode === "reset" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Wróć do{" "}
              <button
                type="button"
                onClick={() => onModeChange?.("login")}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
              >
                logowania ←
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
