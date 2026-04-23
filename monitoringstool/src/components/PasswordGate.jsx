import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff } from "lucide-react";

const AUTH_KEY = "survey_authenticated";
const PASSWORD_KEY = "survey_password";
const ATTEMPTS_KEY = "survey_login_attempts";
const LOCKOUT_KEY = "survey_lockout_until";
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 6;

export default function PasswordGate({ children }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  const savedPassword = localStorage.getItem(PASSWORD_KEY);
  const defaultPassword = import.meta.env.VITE_ACCESS_PASSWORD || "monitoring2026";
  const activePassword = savedPassword || defaultPassword;

  const checkLockout = useCallback(() => {
    const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || "0", 10);
    if (lockoutUntil > Date.now()) {
      setLockoutRemaining(Math.ceil((lockoutUntil - Date.now()) / 1000));
      return true;
    }
    localStorage.removeItem(LOCKOUT_KEY);
    localStorage.removeItem(ATTEMPTS_KEY);
    setLockoutRemaining(0);
    return false;
  }, []);

  useEffect(() => {
    checkLockout();
    const interval = setInterval(() => {
      if (checkLockout()) {
        setLockoutRemaining(Math.max(0, Math.ceil((parseInt(localStorage.getItem(LOCKOUT_KEY) || "0", 10) - Date.now()) / 1000)));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [checkLockout]);

  const getAttempts = () => {
    try {
      const attempts = parseInt(sessionStorage.getItem(ATTEMPTS_KEY) || "0", 10);
      return attempts;
    } catch {
      return 0;
    }
  };

  const incrementAttempts = () => {
    const attempts = getAttempts() + 1;
    sessionStorage.setItem(ATTEMPTS_KEY, attempts.toString());
    if (attempts >= MAX_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION;
      localStorage.setItem(LOCKOUT_KEY, lockoutUntil.toString());
      setLockoutRemaining(Math.ceil(LOCKOUT_DURATION / 1000));
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (lockoutRemaining > 0) {
      return;
    }
    
    if (password === activePassword) {
      setPasswordError(false);
      sessionStorage.removeItem(ATTEMPTS_KEY);
      setAuthenticated();
    } else {
      setPasswordError(true);
      setPassword("");
      incrementAttempts();
    }
  };

  const setAuthenticated = () => {
    try {
      sessionStorage.setItem(AUTH_KEY, "true");
    } catch (_e) {
      // Silently fail
    }
    window.location.reload();
  };

  const isAuthenticated = () => {
    try {
      if (sessionStorage.getItem(AUTH_KEY) === "true") {
        return true;
      }
    } catch (_e) {
      // Silently fail
    }
    return false;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isAuthenticated()) {
    return children;
  }

  const attempts = getAttempts();
  const attemptsLeft = MAX_ATTEMPTS - attempts;
  const isLocked = lockoutRemaining > 0;

  return (
    <div className="min-h-screen bg-teal-800 flex flex-col items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center">
        <img
          src="/images/groen.avif"
          alt="Lock"
          className="w-20 mx-auto mb-4 rounded-lg"
        />
        <h1 className="text-2xl font-bold text-white mb-2">Toegang vereist</h1>
        <p className="text-teal-200 mb-6">
         Voer het wachtwoord in om de vragenlijst te starten.
        </p>

        {isLocked ? (
          <div className="bg-red-600/80 text-white p-4 rounded-xl">
            <p className="font-semibold mb-2">Te veel pogingen</p>
            <p>Probeer het over {formatTime(lockoutRemaining)} opnieuw</p>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);
                }}
                placeholder="Wachtwoord"
                className="w-full p-3 pr-12 rounded-lg text-gray-800 font-semibold text-center"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordError && (
              <p className="text-red-300 text-sm">
                Verkeerd wachtwoord - nog {attemptsLeft} poging(en)
              </p>
            )}
            <button
              type="submit"
              className="bg-yellow-400 text-teal-900 font-bold px-6 py-3 rounded-lg hover:bg-yellow-300 transition"
            >
              Inloggen
            </button>
          </form>
        )}
        <p className="text-teal-300/60 text-xs mt-4">
          Let op: Na 5 foute pogingen is {LOCKOUT_DURATION/60000} min geblokkeerd
        </p>
      </div>
    </div>
  );
}