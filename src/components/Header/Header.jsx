import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaSignOutAlt, FaGlobe } from "react-icons/fa";
import logo from "../../assets/logo2.png";


export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      return;
    }
    fetch("http://localhost:5000/api/verify", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.loggedIn) {
          setIsLoggedIn(true);
          setUserName(d.user?.firstName || "");
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsLoggedIn(false);
        }
      })
      .catch(() => setIsLoggedIn(!!token));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserName("");
    setMenuOpen(false);
    navigate("/", { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex flex-wrap items-center justify-between w-full px-4 py-3 sm:px-8 md:px-10 bg-gradient-to-r from-[#1EC6D7] via-[#4066E0] to-[#6A3FD7] shadow-lg">
      {/* ---------- Left Section: Logo + Title ---------- */}
      <div
        className="flex items-center gap-3 text-white cursor-pointer"
        onClick={() => navigate("/")}
      >
        <img
          src={logo}
          alt="VIADOCS Logo"
          className="w-10 h-10 border-2 border-white rounded-full shadow-md sm:w-12 sm:h-12"
          draggable="false"
        />
        <span className="text-xl font-bold tracking-wide sm:text-2xl">
          VIADOCS
        </span>
  
      </div>

      {/* ---------- Right Section: App + Login/Profile ---------- */}
      <div className="flex items-center gap-3 mt-3 sm:gap-6 sm:mt-0">
        {/* 🌐 App button (hidden text on small screens) */}
        <button
          onClick={() => navigate("/coming-soon")}
          className="flex items-center gap-1 text-sm font-medium text-white transition sm:text-lg hover:text-[#1EC6D7]"
        >
          <FaGlobe className="text-base sm:text-2xl" />
          <span className="hidden sm:inline">App</span>
        </button>

        {/* 👤 Login / Profile */}
        {!isLoggedIn ? (
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-transform transform rounded-full shadow-md bg-gradient-to-r from-[#1EC6D7] via-[#4066E0] to-[#6A3FD7] hover:scale-105 hover:opacity-90 sm:px-5 sm:py-2 sm:text-base"
          >
            <FaUserCircle className="text-lg sm:text-2xl" />
            <span>Login / Signup</span>
          </button>
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center gap-2 text-sm font-medium text-white transition sm:text-lg hover:text-[#1EC6D7]"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <FaUserCircle className="text-lg sm:text-2xl" />
              <span className="truncate max-w-[100px] sm:max-w-none">
                {userName}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-10 py-2 mt-2 bg-white border border-[#4066E0]/20 rounded-lg shadow-lg top-10 sm:top-12 w-40 sm:w-44 animate-fadeIn">
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center w-full gap-2 px-4 py-2 text-sm text-gray-700 transition sm:text-base hover:bg-[#1EC6D7]/10"
                >
                  <FaUserCircle className="text-[#4066E0]" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full gap-2 px-4 py-2 text-sm text-gray-700 transition sm:text-base hover:bg-[#1EC6D7]/10"
                >
                  <FaSignOutAlt className="text-[#6A3FD7]" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
