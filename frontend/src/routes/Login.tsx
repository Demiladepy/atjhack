import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router";
import { motion } from "framer-motion";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithCustomToken,
  GoogleAuthProvider,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { sendWhatsAppOtp, verifyWhatsAppOtp } from "@/lib/api";
import {
  Shield,
  Smartphone,
  ArrowRight,
  Loader2,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type AuthTab = "phone" | "whatsapp";

export default function Login() {
  const [tab, setTab] = useState<AuthTab>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [whatsappOtpSent, setWhatsappOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  const from = (location.state as { from?: string })?.from || "/dashboard";

  // Initialize reCAPTCHA once via ref (not recreated on render)
  useEffect(() => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
    return () => {
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    };
  }, []);

  if (!authLoading && user) {
    return <Navigate to={from} replace />;
  }

  const formatPhone = (input: string) => {
    const cleaned = input.replace(/\s/g, "");
    if (cleaned.startsWith("+")) return cleaned;
    return `+234${cleaned.replace(/^0/, "")}`;
  };

  // ──── Google Sign-In ────
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Google sign-in failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // ──── Phone OTP ────
  const handlePhoneSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setLoading(true);
    setError("");

    try {
      const formatted = formatPhone(phoneNumber);
      const appVerifier = recaptchaRef.current!;
      const confirmation = await signInWithPhoneNumber(auth, formatted, appVerifier);
      setConfirmationResult(confirmation);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send code. Please try again.");
      // Reset reCAPTCHA on failure
      recaptchaRef.current?.clear();
      recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !confirmationResult) return;
    setLoading(true);
    setError("");

    try {
      await confirmationResult.confirm(otp);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ──── WhatsApp OTP ────
  const handleWhatsAppSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setLoading(true);
    setError("");

    try {
      const formatted = formatPhone(phoneNumber);
      await sendWhatsAppOtp(formatted);
      setWhatsappOtpSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send WhatsApp code.");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    setError("");

    try {
      const formatted = formatPhone(phoneNumber);
      const { token } = await verifyWhatsAppOtp(formatted, otp);
      await signInWithCustomToken(auth, token);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // ──── Reset state when switching tabs ────
  const switchTab = (newTab: AuthTab) => {
    setTab(newTab);
    setOtp("");
    setError("");
    setConfirmationResult(null);
    setWhatsappOtpSent(false);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg-primary)">
        <Loader2 className="h-8 w-8 animate-spin text-(--green-500)" />
      </div>
    );
  }

  const showOtpInput = tab === "phone" ? !!confirmationResult : whatsappOtpSent;

  return (
    <div className="relative min-h-screen bg-(--bg-primary) text-white overflow-hidden flex items-center justify-center p-6">
      <div className="pointer-events-none absolute top-1/2 left-1/2 w-[800px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-(--green-500)/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl p-1.5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-(--green-600) to-(--green-400) opacity-20" />
              <div className="absolute inset-px bg-(--bg-tertiary) rounded-[10px]" />
              <img src="/logo.png" alt="StarkZap" className="relative h-full w-full object-contain filter invert z-10" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-white/70">
              StarkZap SMB
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-(--green-500)/10 text-(--green-400) mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-(--text-secondary)">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Google Sign-In */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-12 text-sm font-semibold bg-white text-gray-800 hover:bg-gray-100 border border-gray-300 transition-all mb-4"
          >
            {loading && tab !== "phone" && tab !== "whatsapp" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black/40 px-3 text-(--text-secondary)">or</span>
            </div>
          </div>

          {/* Tab Toggle: Phone | WhatsApp */}
          <div className="flex rounded-xl bg-white/5 p-1 mb-5">
            <button
              onClick={() => switchTab("phone")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                tab === "phone"
                  ? "bg-(--green-600) text-white shadow-lg"
                  : "text-(--text-secondary) hover:text-white"
              }`}
            >
              <Phone className="h-4 w-4" />
              Phone
            </button>
            <button
              onClick={() => switchTab("whatsapp")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                tab === "whatsapp"
                  ? "bg-(--green-600) text-white shadow-lg"
                  : "text-(--text-secondary) hover:text-white"
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </button>
          </div>

          {/* OTP Forms */}
          {!showOtpInput ? (
            <form
              onSubmit={tab === "phone" ? handlePhoneSendOtp : handleWhatsAppSendOtp}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-(--text-secondary) uppercase tracking-wider mb-2">
                  {tab === "phone" ? "Phone Number" : "WhatsApp Number"}
                </label>
                <div className="relative flex items-center">
                  <Smartphone className="absolute left-4 h-5 w-5 text-white/40" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+234 801 234 5678"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-base text-white placeholder-white/30 focus:border-(--green-500)/50 focus:outline-none focus:ring-1 focus:ring-(--green-500)/50 transition-colors"
                    required
                  />
                </div>
              </div>

              {error && <div className="text-red-400 text-sm">{error}</div>}

              <Button
                type="submit"
                disabled={loading || !phoneNumber}
                className="w-full h-14 text-base font-semibold bg-(--green-600) hover:bg-(--green-500) text-white shadow-(--shadow-glow-green) transition-all"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : tab === "phone" ? (
                  "Send Verification Code"
                ) : (
                  <>
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Send Code via WhatsApp
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={tab === "phone" ? handlePhoneVerifyOtp : handleWhatsAppVerifyOtp}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-(--text-secondary) uppercase tracking-wider mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 6) setOtp(val);
                  }}
                  placeholder="Enter 6-digit code"
                  className="w-full text-center tracking-[0.5em] rounded-xl border border-white/10 bg-white/5 py-4 px-4 text-xl font-mono text-white placeholder-white/20 focus:border-(--green-500)/50 focus:outline-none focus:ring-1 focus:ring-(--green-500)/50 transition-colors"
                  required
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <p className="mt-2 text-xs text-(--text-secondary) text-center">
                  {tab === "phone"
                    ? "Enter the code sent to your phone via SMS"
                    : "Enter the code sent to your WhatsApp"}
                </p>
              </div>

              {error && <div className="text-red-400 text-sm text-center">{error}</div>}

              <Button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full h-14 text-base font-semibold bg-(--green-600) hover:bg-(--green-500) text-white shadow-(--shadow-glow-green) transition-all"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Continue"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setConfirmationResult(null);
                  setWhatsappOtpSent(false);
                  setOtp("");
                  setError("");
                }}
                className="w-full text-sm text-(--text-secondary) hover:text-white transition-colors py-2"
              >
                Use a different number
              </button>
            </form>
          )}

          <div id="recaptcha-container" />
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-(--text-secondary) hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" /> Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
