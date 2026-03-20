import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Shield, Smartphone, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          // recaptcha resolved
        },
      });
    }
  }, []);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setLoading(true);
    setError("");

    try {
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+234${phoneNumber.replace(/^0/, '')}`;
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !confirmationResult) return;
    setLoading(true);
    setError("");

    try {
      const result = await confirmationResult.confirm(otp);
      // result.user represents the authenticated user
      // For now, redirect to dashboard as a successful login
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-(--bg-primary) text-white overflow-hidden flex items-center justify-center p-6">
      <div className="pointer-events-none absolute top-1/2 left-1/2 w-[800px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-(--green-500)/10 blur-[120px]" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl p-1.5 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-(--green-600) to-(--green-400) opacity-20" />
                <div className="absolute inset-[1px] bg-(--bg-tertiary) rounded-[10px]" />
                <img src="/logo.png" alt="StarkZap" className="relative h-full w-full object-contain filter invert z-10" />
              </div>
              <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                StarkZap SMB
              </span>
            </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <div className="text-center mb-8">
             <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-(--green-500)/10 text-(--green-400) mb-4">
                <Shield className="h-6 w-6" />
             </div>
             <h2 className="text-2xl font-bold tracking-tight">Access your account</h2>
             <p className="mt-2 text-sm text-(--text-secondary)">
               Verify your phone number with Firebase to continue to your dashboard.
             </p>
          </div>

          {!confirmationResult ? (
            <form onSubmit={requestOtp} className="space-y-4">
               <div>
                  <label className="block text-xs font-semibold text-(--text-secondary) uppercase tracking-wider mb-2">Phone Number</label>
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
                 {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Verification Code"}
               </Button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
               <div>
                  <label className="block text-xs font-semibold text-(--text-secondary) uppercase tracking-wider mb-2">Verification Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full text-center tracking-[0.5em] rounded-xl border border-white/10 bg-white/5 py-4 px-4 text-xl font-mono text-white placeholder-white/20 focus:border-(--green-500)/50 focus:outline-none focus:ring-1 focus:ring-(--green-500)/50 transition-colors"
                    required
                    maxLength={6}
                  />
               </div>

               {error && <div className="text-red-400 text-sm text-center">{error}</div>}

               <Button 
                  type="submit" 
                  disabled={loading || otp.length < 6} 
                  className="w-full h-14 text-base font-semibold bg-(--green-600) hover:bg-(--green-500) text-white shadow-(--shadow-glow-green) transition-all"
               >
                 {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Continue"}
               </Button>
            </form>
          )}
          
          <div id="recaptcha-container"></div>
        </div>
        
        <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-(--text-secondary) hover:text-white transition-colors flex items-center justify-center gap-2">
                <ArrowRight className="h-4 w-4 rotate-180" /> Back to home
            </Link>
        </div>
      </motion.div>
    </div>
  );
}
