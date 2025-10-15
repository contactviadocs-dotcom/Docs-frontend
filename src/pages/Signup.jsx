// Clean Signup component (debounced username check, abort controller, robust fetch handling)
import React, { useState, useRef } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logo from "../assets/logo.jpg";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    gender: "other",
  });

  const [usernameError, setUsernameError] = useState("");
  const usernameTimer = useRef(null);
  const usernameAbort = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "username") {
      const trimmed = value.trim();
      if (!trimmed) {
        setUsernameError("");
        return;
      }

      if (usernameTimer.current) clearTimeout(usernameTimer.current);

      if (usernameAbort.current) {
        try {
          usernameAbort.current.abort();
        } catch (e) {
          /* ignore */
        }
      }

      usernameTimer.current = setTimeout(async () => {
        const controller = new AbortController();
        usernameAbort.current = controller;
        try {
          const url = `${API_BASE}/api/check-username?username=${encodeURIComponent(trimmed)}`;
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) {
            setUsernameError("");
            return;
          }
          const contentType = res.headers.get("content-type") || "";
          if (!contentType.includes("application/json")) {
            const text = await res.text();
            console.warn("Non-JSON response from username check:", text.slice(0, 200));
            setUsernameError("");
            return;
          }
          const data = await res.json();
          setUsernameError(!data.available ? "Username already taken" : "");
        } catch (err) {
          if (err.name === "AbortError") return;
          console.error("Error checking username:", err);
        } finally {
          usernameAbort.current = null;
        }
      }, 400);
    }
  };

  const togglePassword = () => setShowPassword((prev) => !prev);
  const toggleConfirmPassword = () => setShowConfirmPassword((prev) => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (usernameError) {
      toast.error("Please choose a different username");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const contentType = res.headers.get("content-type") || "";
      let data = null;
      if (contentType.includes("application/json")) data = await res.json();
      else {
        const text = await res.text();
        console.warn("Non-JSON signup response:", text.slice(0, 200));
        data = { message: text };
      }

      if (!res.ok) {
        toast.error(data?.message || "Signup failed");
        return;
      }

      toast.success("Signup successful! Redirecting...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-b from-[#EAF4FC] to-[#CFE3FA]">
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        closeOnClick
        transition={Slide}
        toastStyle={{
          fontSize: window.innerWidth < 480 ? "0.8rem" : "1rem",
          padding: window.innerWidth < 480 ? "6px 10px" : "10px 14px",
          minHeight: "40px",
          borderRadius: "8px",
        }}
      />

      <div className="flex flex-col w-full max-w-5xl overflow-hidden bg-white shadow-2xl md:flex-row rounded-2xl">
        <div className="relative flex items-center justify-center w-full bg-white md:flex-1 md:py-10">
          <div className="absolute z-10 top-4 left-4">
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 px-4 py-2 text-white transition-all rounded-lg shadow-md bg-gradient-to-r from-[#4FC3F7] to-[#3F51B5] hover:opacity-90 hover:scale-[1.03] active:scale-[0.97]"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium sm:text-base">Back</span>
            </button>
          </div>

          <img
            src={logo}
            alt="Logo"
            className="object-contain w-3/4 max-w-[300px] sm:max-w-[360px] md:max-w-[420px] lg:max-w-[500px] transition-all duration-300"
            draggable="false"
          />
        </div>

        <div className="flex flex-col justify-center flex-1 p-6 md:p-10">
          <h2 className="mb-2 text-3xl font-bold text-[#304FFE] sm:text-4xl">Create Account</h2>
          <p className="mb-6 text-gray-600">Join ProDoc and get started today!</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="text"
                name="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-3 py-2 border-b-2 outline-none transition-all ${
                  usernameError ? "border-red-500" : "border-gray-300 focus:border-[#3F51B5]"
                }`}
                required
              />
              {usernameError && <p className="mt-1 text-sm text-red-500">{usernameError}</p>}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border-b-2 border-gray-300 outline-none focus:border-[#3F51B5]"
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border-b-2 border-gray-300 outline-none focus:border-[#3F51B5]"
                required
              />
            </div>

            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border-b-2 border-gray-300 outline-none focus:border-[#3F51B5]"
              required
            />

            <div className="relative flex items-center border-b-2 border-gray-300 focus-within:border-[#3F51B5]">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full py-2 bg-transparent outline-none"
                required
                minLength={6}
              />
              <span className="text-[#3F51B5] cursor-pointer hover:text-[#1E88E5]" onClick={togglePassword}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="relative flex items-center border-b-2 border-gray-300 focus-within:border-[#3F51B5]">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full py-2 bg-transparent outline-none"
                required
              />
              <span className="text-[#3F51B5] cursor-pointer hover:text-[#1E88E5]" onClick={toggleConfirmPassword}>
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border-b-2 border-gray-300 outline-none focus:border-[#3F51B5]"
                required
              />
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border-b-2 border-gray-300 outline-none focus:border-[#3F51B5]"
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-semibold text-white transition-all rounded-full shadow-md bg-gradient-to-r from-[#4FC3F7] to-[#3F51B5] hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                    <path d="M22 12a10 10 0 00-10-10" stroke="white" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  <span>Creating...</span>
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-700">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")} className="font-semibold cursor-pointer text-[#1E88E5] hover:underline">
              Log in
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
