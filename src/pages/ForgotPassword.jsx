import React, { useState, useEffect } from "react";
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();

  // countdown effect
  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    }
  }, [timer]);

  // Step 1 — Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("https://docs-backend-r71d.onrender.com//api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("OTP sent to your email!");
        setStep(2);
        setTimer(60);
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch {
      toast.error("Server error — backend not responding.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("https://docs-backend-r71d.onrender.com//api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("OTP verified successfully!");
        setStep(3);
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch {
      toast.error("Server error — backend not responding.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.warning("Passwords do not match!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("https://docs-backend-r71d.onrender.com//api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Password reset successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2500);
      } else {
        toast.error(data.message || "Failed to reset password");
      }
    } catch {
      toast.error("Server error — backend not responding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#E3F2FD] to-[#E8EAF6] p-6">
      <div className="w-full max-w-3xl p-8 bg-white shadow-lg rounded-2xl md:p-12">
        {/* Back Button */}
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-sm mb-6 text-[#3F51B5] hover:text-[#1E88E5]"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Header */}
        <h2 className="text-2xl md:text-3xl font-bold text-[#1E88E5] mb-2 text-center">
          Forgot Password
        </h2>
        <p className="mb-8 text-sm text-center text-gray-600 md:text-base">
          {step === 1
            ? "Enter your email to receive a one-time password (OTP)."
            : step === 2
            ? "Enter the 4-digit OTP sent to your registered email."
            : "Set your new password below."}
        </p>

        {/* Step 1 - Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="max-w-md mx-auto space-y-6">
            <div className="flex items-center border-b border-gray-300 focus-within:border-[#3F51B5]">
              <Mail className="mr-3 text-gray-500" size={20} />
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full py-3 text-gray-700 bg-transparent outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-semibold text-white rounded-full bg-gradient-to-r from-[#3F51B5] to-[#1E88E5] hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2 - OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="max-w-md mx-auto space-y-5">
            <div className="flex items-center border-b border-gray-300 focus-within:border-[#3F51B5]">
              <KeyRound className="mr-3 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Enter 4-digit OTP"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-full py-3 tracking-widest text-center text-gray-700 bg-transparent outline-none"
              />
            </div>

            <p className="text-xs text-center text-gray-500">
              OTP sent to <span className="text-[#1E88E5] font-medium">{email}</span>
            </p>

            {timer > 0 ? (
              <p className="text-xs text-center text-gray-600">
                Resend available in{" "}
                <span className="text-[#1E88E5] font-semibold">{timer}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleSendOtp}
                className="block mx-auto text-sm text-[#3F51B5] hover:text-[#1E88E5]"
              >
                Resend OTP
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-semibold text-white rounded-full bg-gradient-to-r from-[#3F51B5] to-[#1E88E5] hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {/* Step 3 - New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="max-w-md mx-auto space-y-5">
            <div className="flex items-center border-b border-gray-300 focus-within:border-[#3F51B5]">
              <Lock className="mr-3 text-gray-500" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full py-3 text-gray-700 bg-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="flex items-center border-b border-gray-300 focus-within:border-[#3F51B5]">
              <Lock className="mr-3 text-gray-500" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full py-3 text-gray-700 bg-transparent outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-semibold text-white rounded-full bg-gradient-to-r from-[#3F51B5] to-[#1E88E5] hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
