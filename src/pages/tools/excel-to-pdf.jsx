import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Download,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import axios from "axios";

export default function ExcelToPdf() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileSelect = (selectedFile) => {
    if (
      ![
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ].includes(selectedFile.type)
    ) {
      setError("Please select a valid Excel file (.xlsx or .xls)");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }
    setFile(selectedFile);
    setError(null);
    setIsComplete(false);
    setDownloadUrl(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleFileInput = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileSelect(selectedFile);
  };

  const processFile = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
  "http://localhost:5000/api/tools/excel-to-pdf",
        formData
      );

      if (response.data && response.data.success) {
        // server returns path in response.data.file (e.g. "/uploads/converted/abc.pdf")
  const url = "http://localhost:5000" + response.data.file;
        setDownloadUrl(url);
        setIsComplete(true);
      } else {
        setError("Failed to convert file. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error during conversion.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Force download by fetching blob then creating object URL (prevents inline open)
  const downloadFile = async () => {
    if (!downloadUrl) return;
    setIsDownloading(true);
    setError(null);

    try {
      const resp = await axios.get(downloadUrl, {
        responseType: "blob",
        // If your server requires auth, include headers here (e.g. Authorization)
      });

      // Try to read filename from Content-Disposition header
      const disposition = resp.headers["content-disposition"] || "";
      let filename = file ? file.name.replace(/\.(xlsx|xls)$/i, ".pdf") : "converted.pdf";

      if (disposition) {
        const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i);
        if (match && match[1]) {
          try {
            // decode URI component if needed
            filename = decodeURIComponent(match[1]);
          } catch {
            filename = match[1];
          }
        }
      }

      const blob = resp.data;
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      // release memory
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (err) {
      console.error("Download failed:", err);
      setError("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Convert Another: reset and navigate back to tools
  const convertAnother = () => {
    setFile(null);
    setIsProcessing(false);
    setIsComplete(false);
    setError(null);
    setDownloadUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    navigate("/tools");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#EAF4FC] via-[#E1EDFB] to-[#CFE3FA]">
      <Header />

      <main className="flex-1 px-4 py-10 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <div className="flex justify-start mb-8">
            <button
              onClick={() => navigate("/tools")}
              className="flex items-center gap-2 px-4 py-2 text-white transition-all rounded-lg shadow-md bg-gradient-to-r from-[#4FC3F7] to-[#3F51B5] hover:opacity-90 hover:scale-[1.03] active:scale-[0.97]"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium sm:text-base">Back to Tools</span>
            </button>
          </div>

          {/* Header */}
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#4FC3F7]/30 to-[#3F51B5]/20">
              <FileSpreadsheet className="w-10 h-10 text-[#3F51B5]" />
            </div>
            <h1 className="mb-3 text-3xl font-bold text-[#3F51B5] sm:text-4xl">
              Excel to PDF Converter
            </h1>
            <p className="text-base text-gray-700 sm:text-lg">
              Convert your Excel spreadsheets into secure, shareable PDFs
            </p>
          </div>

          {/* Main Tool Area */}
          <div className="p-6 bg-white shadow-xl sm:p-10 rounded-2xl">
            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="p-10 text-center transition-all border-2 border-gray-300 border-dashed cursor-pointer rounded-xl hover:border-[#3F51B5] hover:bg-[#E3F2FD]/40"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-[#3F51B5]" />
                <h3 className="mb-2 text-xl font-semibold text-gray-700">Drop your Excel file here</h3>
                <p className="mb-4 text-gray-500">or click to browse files</p>
                <div className="text-sm text-gray-400">
                  <p>Supported formats: .xls, .xlsx</p>
                  <p>Maximum file size: 10MB</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".xls,.xlsx" onChange={handleFileInput} className="hidden" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* File Info */}
                <div className="flex flex-col items-center justify-between gap-4 p-4 rounded-lg sm:flex-row bg-[#F5F7FB]">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-[#3F51B5]" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{file.name}</h3>
                      <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="px-3 py-1 text-sm text-gray-600 transition-colors rounded-md hover:text-[#1E88E5] hover:bg-[#E3F2FD]"
                  >
                    Remove
                  </button>
                </div>

                {/* Status Messages */}
                {error && (
                  <div className="flex items-center gap-2 p-4 border border-red-200 rounded-lg bg-red-50">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">{error}</span>
                  </div>
                )}

                {isComplete && (
                  <div className="flex items-center gap-2 p-4 border border-green-200 rounded-lg bg-green-50">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-700">Conversion completed successfully!</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  {!isProcessing && !isComplete && (
                    <button
                      onClick={processFile}
                      className="flex items-center gap-2 px-6 py-3 font-medium text-white transition-all rounded-lg shadow-md bg-gradient-to-r from-[#4FC3F7] to-[#3F51B5] hover:opacity-90 hover:scale-[1.02] active:scale-[0.97]"
                    >
                      <FileSpreadsheet className="w-5 h-5" />
                      Convert to PDF
                    </button>
                  )}

                  {isProcessing && (
                    <button disabled className="flex items-center gap-2 px-6 py-3 font-medium text-white rounded-lg bg-[#9FA8DA] cursor-not-allowed">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Converting...
                    </button>
                  )}

                  {isComplete && (
                    <div className="flex flex-col items-center gap-4 sm:flex-row">
                      <button
                        onClick={downloadFile}
                        disabled={isDownloading}
                        className="flex items-center gap-2 px-6 py-3 font-medium text-white transition-all rounded-lg shadow-md bg-gradient-to-r from-[#4FC3F7] to-[#3F51B5] hover:opacity-90 hover:scale-[1.02] disabled:opacity-60"
                      >
                        {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        {isDownloading ? "Downloading..." : "Download PDF"}
                      </button>

                      <button
                        onClick={convertAnother}
                        className="flex items-center gap-2 px-6 py-3 font-medium text-white transition-all rounded-lg shadow-md bg-gradient-to-r from-gray-400 to-gray-600 hover:opacity-90"
                      >
                        Convert Another
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
