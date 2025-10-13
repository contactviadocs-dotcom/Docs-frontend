// src/pages/Home.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import {
  MoreVertical,
  Star,
  Eye,
  Edit,
  Share2,
  Trash2,
  Plus,
  Bookmark,
  Settings,
  Sparkles,
  Bot,
} from "lucide-react";
import { jsPDF } from "jspdf";

// Animated typing text
const texts = [
  "Use Pro Doc\nto create your\nproject docs faster and smarter",
  "Use Pro Doc\nto create your\nprofessional documents easily",
  "Use Pro Doc\nto create your\ncollaborative workspaces quickly",
  "Use Pro Doc\nto create your\nstructured content efficiently",
];

const AnimatedText = () => {
  const [currentText, setCurrentText] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [speed, setSpeed] = useState(80);
  const longestText = texts.reduce((a, b) => (a.length > b.length ? a : b));

  useEffect(() => {
    const handleTyping = () => {
      const fullText = texts[currentText];
      if (isDeleting) {
        setDisplayedText((prev) => prev.slice(0, -1));
        setSpeed(40);
      } else {
        setDisplayedText((prev) => fullText.slice(0, prev.length + 1));
        setSpeed(80);
      }

      if (!isDeleting && displayedText === fullText) {
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && displayedText === "") {
        setIsDeleting(false);
        setCurrentText((prev) => (prev + 1) % texts.length);
      }
    };

    const timer = setTimeout(handleTyping, speed);
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentText, speed]);

  return (
    <div className="relative min-h-[120px]">
      <h2 className="invisible text-2xl font-extrabold whitespace-pre-line lg:text-3xl">
        {longestText}
      </h2>
      <h2 className="absolute top-0 left-0 text-2xl font-extrabold leading-snug text-gray-900 whitespace-pre-line lg:text-3xl">
        <span className="text-[#4066E0]">{displayedText}</span>
        <span className="animate-pulse">|</span>
      </h2>
    </div>
  );
};

export default function Home() {
  const [docs, setDocs] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteInput, setDeleteInput] = useState("");
  const timeoutRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const fetchDocs = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await axios.get("https://docs-backend-r71d.onrender.com//api/docs/my-docs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocs(res.data);
    } catch (err) {
      console.error("Error fetching docs:", err);
    }
  }, [token, isLoggedIn]);

  // ✅ Close dropdown on outside tap or scroll (mobile fix)
useEffect(() => {
  const handleOutsideTouch = (e) => {
    if (!e.target.closest(".doc-dropdown")) {
      setDropdownOpen(null);
    }
  };

  const handleScroll = () => setDropdownOpen(null);

  document.addEventListener("touchstart", handleOutsideTouch);
  document.addEventListener("scroll", handleScroll, true);

  return () => {
    document.removeEventListener("touchstart", handleOutsideTouch);
    document.removeEventListener("scroll", handleScroll, true);
  };
}, []);


  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const confirmDelete = async () => {
    if (!deleteTarget || deleteInput !== deleteTarget.name) return;
    try {
      await axios.delete(`https://docs-backend-r71d.onrender.com//api/docs/my-docs/${deleteTarget._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteTarget(null);
      setDeleteInput("");
      fetchDocs();
    } catch (err) {
      console.error("Error deleting doc:", err);
    }
  };

  const setFavorite = async (id) => {
    try {
      const res = await axios.patch(
        `https://docs-backend-r71d.onrender.com//api/docs/my-docs/${id}/favorite`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDocs((prev) =>
        prev.map((doc) =>
          doc._id === id ? { ...doc, favorite: res.data.favorite } : doc
        )
      );
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const shareDocAsPDF = async (doc) => {
    try {
      const res = await axios.get(`https://docs-backend-r71d.onrender.com//api/docs/my-docs/${doc._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fullDoc = res.data;
      const pdf = new jsPDF("p", "pt", "a4");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(fullDoc.name, 40, 50);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      await pdf.html(fullDoc.content || "<p></p>", {
        x: 40,
        y: 80,
        width: 500,
        windowWidth: 800,
      });

      const pdfBlob = pdf.output("blob");
      const pdfFile = new File([pdfBlob], `${fullDoc.name}.pdf`, {
        type: "application/pdf",
      });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: fullDoc.name,
          text: "Sharing my Pro Doc document",
          files: [pdfFile],
        });
      } else {
        pdf.save(`${fullDoc.name}.pdf`);
        alert("Sharing not supported — PDF downloaded instead");
      }
    } catch (err) {
      console.error("Error sharing doc:", err);
      alert("Failed to share document");
    }
  };

  const toggleDropdown = (id) => {
    clearTimeout(timeoutRef.current);
    setDropdownOpen((prev) => (prev === id ? null : id));
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setDropdownOpen(null), 300);
  };

  const handleNav = (path) => {
    if (isLoggedIn) navigate(path);
    else navigate("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#EAF6FF] via-[#F3F8FF] to-[#E4E1FF]">
      <Header />
      <main className="flex-1 px-6 py-10">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          {/* Welcome Section */}
<div className="p-8 mb-10 text-center bg-white border border-[#1EC6D7]/30 shadow-lg rounded-2xl">
  <h2 className="text-3xl font-extrabold text-gray-900">
    Welcome to <span className="text-[#4066E0]">Pro Doc</span>
  </h2>
  <p className="mt-3 text-lg text-gray-600">
    Create professional documents, collaborate with your team, and
    manage projects efficiently.
  </p>

  {!isLoggedIn && (
    <div className="flex flex-col items-center justify-center gap-3 mt-8 sm:flex-row sm:gap-6">
      {/* Login Button */}
      <button
        onClick={() => navigate("/login")}
        className="px-5 py-2 text-sm font-medium text-white transition-all rounded-full shadow-md bg-[#4066E0] hover:bg-[#1EC6D7] hover:shadow-lg sm:px-6 sm:py-2 sm:text-base"
      >
        Get Started - Login
      </button>

      {/* Create Account Button */}
      <button
        onClick={() => navigate("/signup")}
        className="px-5 py-2 text-sm font-medium text-[#4066E0] transition-all border border-[#1EC6D7] rounded-full shadow-sm hover:bg-[#1EC6D7]/10 hover:text-[#1EC6D7] hover:shadow-md sm:px-6 sm:py-2 sm:text-base"
      >
        Create Account
      </button>
    </div>
  )}
</div>


          {/* Top Section */}
          <div className="grid grid-cols-1 gap-6 mb-12 lg:grid-cols-2">
            {/* Left Boxes */}
            <div className="flex gap-4 p-6 bg-white border border-[#1EC6D7]/30 shadow-md rounded-2xl">
              <div
                onClick={() => handleNav("/create-doc")}
                className="flex flex-col items-center justify-center flex-1 p-8 transition-all duration-300 border-2 border-dashed cursor-pointer rounded-xl border-[#1EC6D7]/40 hover:border-[#4066E0] hover:bg-[#EAF6FF] hover:shadow-xl group"
              >
                <div className="flex items-center justify-center w-20 h-20 mb-4 transition-colors rounded-full bg-[#EAF6FF] group-hover:bg-[#1EC6D7]/20">
                  <Plus strokeWidth={3} className="w-10 h-10 text-[#4066E0]" />
                </div>
                <p className="text-lg font-semibold text-gray-900 group-hover:text-[#4066E0]">
                  Create a Doc
                </p>
              </div>

              <div className="flex flex-col w-1/2 gap-4">
                <div
                  onClick={() => handleNav("/favorites")}
                  className="flex flex-col items-center justify-center flex-1 p-4 transition-all duration-300 border cursor-pointer rounded-xl border-[#1EC6D7]/30 hover:border-[#4066E0] hover:bg-[#EAF6FF] hover:shadow-lg group"
                >
                  <Bookmark strokeWidth={3} className="mb-2 w-7 h-7 text-[#4066E0]" />
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-[#4066E0]">
                    Favorites
                  </p>
                </div>

                <div
                  onClick={() => handleNav("/tools")}
                  className="flex flex-col items-center justify-center flex-1 p-4 transition-all duration-300 border cursor-pointer rounded-xl border-[#1EC6D7]/30 hover:border-[#4066E0] hover:bg-[#EAF6FF] hover:shadow-lg group"
                >
                  <Settings strokeWidth={3} className="mb-2 w-7 h-7 text-[#4066E0]" />
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-[#4066E0]">
                    Tools
                  </p>
                </div>
              </div>
            </div>

            {/* AI Section with DocAI Background */}
            <div
              className="relative p-8 overflow-hidden border shadow-lg bg-gradient-to-br from-[#4066E0]/10 via-[#1EC6D7]/5 to-[#EAF6FF] border-[#1EC6D7]/30 rounded-2xl min-h-[240px] flex flex-col justify-between group cursor-pointer hover:shadow-2xl transition-all"
              onClick={() => handleNav("/DocAI")}
            >
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Floating Orbs */}
                <div className="absolute w-32 h-32 rounded-full bg-[#4066E0]/10 blur-2xl animate-float top-10 left-10"></div>
                <div className="absolute w-40 h-40 rounded-full bg-[#1EC6D7]/10 blur-3xl animate-float-delayed bottom-10 right-10"></div>
                <div className="absolute w-24 h-24 rounded-full bg-[#6A3FD7]/10 blur-xl animate-float-slow top-20 right-20"></div>

                {/* Moving Triangles */}
                <div className="absolute w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[60px] border-b-[#4066E0]/5 animate-triangle-float top-5 left-1/4"></div>
                <div className="absolute w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[45px] border-b-[#1EC6D7]/8 animate-triangle-rotate bottom-16 left-1/3"></div>
                <div className="absolute w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-b-[38px] border-b-[#6A3FD7]/6 animate-triangle-float-slow top-1/2 right-1/4"></div>

                {/* Geometric Lines */}
                <div className="absolute w-16 h-1 bg-gradient-to-r from-transparent via-[#4066E0]/20 to-transparent animate-line-move top-1/3 left-0"></div>
                <div className="absolute w-20 h-1 bg-gradient-to-r from-transparent via-[#1EC6D7]/15 to-transparent animate-line-move-reverse bottom-1/4 right-0"></div>
              </div>

              <div className="absolute z-20 flex flex-col items-center top-4 right-4">
                <Bot className="w-12 h-12 text-[#4066E0] drop-shadow-lg animate-bounce-slow group-hover:text-[#1EC6D7] transition-colors" />
                <span className="mt-1 text-sm font-bold text-gray-800">
                  Docxy
                </span>
              </div>

              <div className="relative z-10 max-w-md">
                <AnimatedText />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav("/DocAI");
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 mt-6 font-medium text-gray-800 transition-all bg-white/80 backdrop-blur-sm border border-[#1EC6D7]/30 rounded-full shadow-md hover:bg-[#1EC6D7]/10 hover:border-[#4066E0] hover:text-[#4066E0] hover:shadow-xl group"
                >
                  <Sparkles className="w-5 h-5 text-[#4066E0] group-hover:text-[#1EC6D7] animate-pulse" />
                  <span>Make me a Project Documentation ...</span>
                </button>
              </div>
            </div>
          </div>

          {/* Document List - Responsive Table */}
          {isLoggedIn && (
            <div className="mt-6 border-t-2 border-[#1EC6D7]/30">
              {/* Desktop Header */}
              <div className="hidden sm:grid grid-cols-[60px,1fr,140px,80px] md:grid-cols-[80px,1fr,180px,100px] font-semibold bg-[#EAF6FF] text-gray-700 py-3 px-2 sm:px-4 rounded-t-lg">
                <span className="text-xs text-center md:text-sm">S. No</span>
                <span className="text-xs md:text-sm">Name</span>
                <span className="pr-2 text-xs text-right md:text-sm">Date Created</span>
                <span className="text-xs text-right md:text-sm">Actions</span>
              </div>

              {/* Mobile Header */}
              <div className="grid grid-cols-[1fr,80px] sm:hidden font-semibold bg-[#EAF6FF] text-gray-700 py-3 px-3 rounded-t-lg">
                <span className="text-sm">Document</span>
                <span className="text-sm text-right">Actions</span>
              </div>

              <div className="bg-white rounded-b-lg shadow-sm">
                {docs.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-500 border-b">
                    No documents yet.
                  </div>
                ) : (
                  docs.map((doc, i) => (
                    <div key={doc._id}>
                      {/* Desktop Row */}
                      <div className="hidden sm:grid grid-cols-[60px,1fr,140px,80px] md:grid-cols-[80px,1fr,180px,100px] items-center py-3 px-2 sm:px-4 border-b text-sm hover:bg-[#EAF6FF] transition-all">
                        <span className="text-xs text-center md:text-sm">{i + 1}</span>
                        <span
                          className="flex items-center gap-1 font-medium text-gray-800 cursor-pointer hover:text-[#4066E0] truncate pr-2 text-xs md:text-sm"
                          onClick={() => navigate(`/doc/${doc._id}`)}
                          title={doc.name}
                        >
                          <span className="truncate">{doc.name}</span>
                          {doc.favorite && <Star size={14} className="flex-shrink-0 text-yellow-400 fill-yellow-400" />}
                        </span>
                        <span className="pr-2 text-xs text-right text-gray-600 md:text-sm">
                          {doc.createdAt
                            ? new Date(doc.createdAt).toLocaleDateString()
                            : "-"}
                        </span>
                        <span className="relative flex justify-end">
                          <button
                            className="p-1 rounded hover:bg-[#EAF6FF]"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(doc._id);
                            }}
                          >
                            <MoreVertical size={16} className="text-gray-600" />
                          </button>

                          {dropdownOpen === doc._id && (
  <div
    className="doc-dropdown absolute right-0 z-10 mt-2 bg-white border border-[#1EC6D7]/30 rounded-lg shadow-lg w-36 animate-fadeIn"
    onMouseLeave={handleMouseLeave}
  >

                              <button
                                className="flex items-center w-full gap-2 px-3 py-2 text-sm hover:bg-[#E6F9FC]"
                                onClick={() => navigate(`/doc/${doc._id}`)}
                              >
                                <Eye size={14} /> View
                              </button>
                              <button
                                className="flex items-center w-full gap-2 px-3 py-2 text-sm hover:bg-[#E6F9FC]"
                                onClick={() => navigate(`/doc/${doc._id}/edit`)}
                              >
                                <Edit size={14} /> Edit
                              </button>
                              <button
                                className="flex items-center w-full gap-2 px-3 py-2 text-sm hover:bg-[#E6F9FC]"
                                onClick={() => setFavorite(doc._id)}
                              >
                                <Star
                                  size={14}
                                  className={
                                    doc.favorite
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-500"
                                  }
                                />{" "}
                                Favorite
                              </button>
                              <button
                                className="flex items-center w-full gap-2 px-3 py-2 text-sm hover:bg-[#E6F9FC]"
                                onClick={() => shareDocAsPDF(doc)}
                              >
                                <Share2 size={14} /> Share
                              </button>
                              <button
                                className="flex items-center w-full gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteTarget(doc)}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </span>
                      </div>

                      {/* Mobile Row */}
                      <div className="grid grid-cols-[1fr,80px] sm:hidden items-start py-3 px-3 border-b hover:bg-[#EAF6FF] transition-all gap-2">
                        <div
                          className="flex flex-col gap-1 cursor-pointer"
                          onClick={() => navigate(`/doc/${doc._id}`)}
                        >
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-gray-800 hover:text-[#4066E0] text-sm truncate max-w-[200px]" title={doc.name}>
                              {doc.name}
                            </span>
                            {doc.favorite && <Star size={12} className="flex-shrink-0 text-yellow-400 fill-yellow-400" />}
                          </div>
                          <span className="text-xs text-gray-500">
                            {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "No date"}
                          </span>
                        </div>
                        <span className="relative flex items-start justify-end">
                          <button
                            className="p-1.5 rounded hover:bg-[#EAF6FF]"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(doc._id);
                            }}
                          >
                            <MoreVertical size={18} className="text-gray-600" />
                          </button>

                          {dropdownOpen === doc._id && (
                            <div
                              className="absolute right-0 z-10 mt-2 bg-white border border-[#1EC6D7]/30 rounded-lg shadow-lg w-36 animate-fadeIn"
                              onMouseLeave={handleMouseLeave}
                            >
                              <button
                                className="flex items-center w-full gap-2 px-3 py-2 text-sm hover:bg-[#E6F9FC]"
                                onClick={() => navigate(`/doc/${doc._id}`)}
                              >
                                <Eye size={14} /> View
                              </button>
                              <button
                                className="flex items-center w-full gap-2 px-3 py-2 text-sm hover:bg-[#E6F9FC]"
                                onClick={() => navigate(`/doc/${doc._id}/edit`)}
                              >
                                <Edit size={14} /> Edit
                              </button>
                              <button
                                className="flex items-center w-full gap-2 px-3 py-2 text-sm hover:bg-[#E6F9FC]"
                                onClick={() => setFavorite(doc._id)}
                              >
                                <Star
                                  size={14}
                                  className={
                                    doc.favorite
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-500"
                                  }
                                />{" "}
                                Favorite
                              </button>
                              <button
                                className="flex items-center w-full gap-2 px-3 py-2 text-sm hover:bg-[#E6F9FC]"
                                onClick={() => shareDocAsPDF(doc)}
                              >
                                <Share2 size={14} /> Share
                              </button>
                              <button
                                className="flex items-center w-full gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteTarget(doc)}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 text-center bg-white rounded-lg shadow-lg">
            <h2 className="mb-4 text-xl font-bold">
              Confirm deletion of <span className="text-red-600">{deleteTarget.name}</span>
            </h2>
            <p className="mb-3 text-gray-600">Please type the document name to confirm:</p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              className="w-full px-3 py-2 mb-4 border rounded border-[#1EC6D7]/40"
              placeholder={deleteTarget.name}
            />
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteInput("");
                }}
              >
                Cancel
              </button>
              <button
                disabled={deleteInput !== deleteTarget.name}
                className={`px-4 py-2 rounded text-white ${
                  deleteInput === deleteTarget.name
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-300 cursor-not-allowed"
                }`}
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
