"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  ShareIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { BsFiletypePdf } from "react-icons/bs";
import { jsPDF } from "jspdf";

type Action = "download" | "share" | "pdf" | null;

export default function NoteOptions() {
  const [hovered, setHovered] = useState<Action>(null);
  const [clicked, setClicked] = useState<Action>(null);
  const [shareMessage, setShareMessage] = useState<string>("");
  const timeoutRef = useRef<number | null>(null);
  const shareTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      if (shareTimeoutRef.current !== null) {
        clearTimeout(shareTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = (action: Action) => setHovered(action);
  const handleMouseLeave = () => setHovered(null);
  const handleFocus = (action: Action) => setHovered(action);
  const handleBlur = () => setHovered(null);

  const downloadImage = () => {
    const link = document.createElement("a");
    link.href = "/digital_board_example.png";
    link.download = `boardcast-notes-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = async () => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = "/digital_board_example.png";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const pdf = new jsPDF({
        orientation: img.width > img.height ? "landscape" : "portrait",
        unit: "px",
        format: [img.width, img.height],
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgAspectRatio = img.width / img.height;
      const pageAspectRatio = pageWidth / pageHeight;

      let renderWidth, renderHeight;

      if (imgAspectRatio > pageAspectRatio) {
        renderWidth = pageWidth;
        renderHeight = pageWidth / imgAspectRatio;
      } else {
        renderHeight = pageHeight;
        renderWidth = pageHeight * imgAspectRatio;
      }

      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;

      pdf.addImage(img, "PNG", x, y, renderWidth, renderHeight);
      pdf.save(`boardcast-notes-${Date.now()}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const shareNotes = async () => {
    try {
      const shareUrl = `${window.location.origin}/note_options`;

      if (navigator.share) {
        await navigator.share({
          title: "Boardcast Notes",
          text: "Check out my whiteboard notes from Boardcast!",
          url: shareUrl,
        });
        setShareMessage("Shared successfully!");
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareMessage("Link copied to clipboard!");
      }

      if (shareTimeoutRef.current !== null) {
        clearTimeout(shareTimeoutRef.current);
      }
      shareTimeoutRef.current = window.setTimeout(() => {
        setShareMessage("");
        shareTimeoutRef.current = null;
      }, 3000);
    } catch (error) {
      console.error("Error sharing:", error);
      setShareMessage("Unable to share");

      if (shareTimeoutRef.current !== null) {
        clearTimeout(shareTimeoutRef.current);
      }
      shareTimeoutRef.current = window.setTimeout(() => {
        setShareMessage("");
        shareTimeoutRef.current = null;
      }, 3000);
    }
  };

  const handleClick = (action: Action) => {
    if (clicked) return;

    if (action === "download") {
      downloadImage();
    } else if (action === "pdf") {
      downloadPDF();
    } else if (action === "share") {
      shareNotes();
    }

    setClicked(action);

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setClicked(null);
      timeoutRef.current = null;
    }, 1500);
  };

  const renderIcon = (action: Action, Icon: any, label: string) => (
    <button
      onMouseEnter={() => handleMouseEnter(action)}
      onMouseLeave={handleMouseLeave}
      onFocus={() => handleFocus(action)}
      onBlur={handleBlur}
      onClick={() => handleClick(action)}
      title={label}
      aria-label={label}
      className="flex flex-col items-center gap-2 px-4 py-2 rounded-lg text-sm text-primary hover:text-blue-500 transition-colors cursor-pointer mt-1"
    >
      <div className="relative h-6 w-14 pt-1 flex items-center justify-center">
        <Icon
          className={`absolute h-6 w-6 transition-opacity duration-300 ${
            clicked === action ? "opacity-0" : "opacity-100"
          }`}
        />
        <CheckCircleIcon
          className={`absolute h-6 w-6 text-primary transition-opacity duration-300 ${
            clicked === action ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      <span className="text-xs text-secondary">{label}</span>
    </button>
  );

  const helperText = shareMessage
    ? shareMessage
    : hovered === "download"
      ? "Your notes will be saved in a high-quality format, ready to review offline."
      : hovered === "share"
        ? "Share a link so others can view your notes in real time."
        : hovered === "pdf"
          ? "Export a clean, printable PDF version of your notes."
          : "Your notes are all set — choose an option above!";

  return (
    <div
      className="min-h-screen bg-background text-primary font-sans w-full flex flex-col justify-center items-center relative px-4"
      style={{
        backgroundImage: `
          radial-gradient(circle, rgba(150, 150, 150, 0.15) 1.5px, transparent 1.5px)
        `,
        backgroundSize: "40px 40px",
      }}
    >
      <div className="max-w-md w-full z-10">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2 text-center">
          Notes Saved!
        </h1>
        <p className="text-sm md:text-base text-secondary text-center mb-2">
          Sign in to download, share, or save your notes as a PDF.
        </p>
        <div className="text-[11px] text-muted mb-4 text-center">
          Session snapshot captured just now — nothing will be lost.
        </div>
        <div className="bg-page rounded-xl border border-selected p-6 shadow-lg text-center">
          <img
            src="/digital_board_example.png"
            alt="Preview"
            className="max-w-full rounded-lg border border-selected mb-4"
          />

          <div className="flex flex-row justify-center gap-6 mb-3">
            {renderIcon("download", ArrowDownTrayIcon, "Download")}
            {renderIcon("share", ShareIcon, "Share")}
            {renderIcon("pdf", BsFiletypePdf, "Save as PDF")}
          </div>

          <p className="text-xs text-secondary min-h-[2.5rem] flex items-center justify-center text-center px-4">
            {helperText}
          </p>

          <div className="mt-3 text-left text-xs text-muted space-y-2">
            <p className="uppercase tracking-wide font-semibold text-[10px] text-muted">
              What happens when you sign in
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Keep a history of all your whiteboard captures.</li>
              <li>Download high-quality images and PDFs of your notes.</li>
              <li>Generate share links to send notes to your team.</li>
            </ul>
          </div>
        </div>

        <div className="mt-5 text-center">
          <p className="text-[11px] text-muted leading-relaxed">
            You can always return to this page from your recent sessions. Your
            notes stay synced until you clear them.
          </p>
        </div>
      </div>
    </div>
  );
}
