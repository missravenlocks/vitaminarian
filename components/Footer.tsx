"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";

export default function Footer() {
  const [disclaimer, setDisclaimer] = useState("");
  const [tutorial, setTutorial] = useState("");
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    fetch("/Disclaimer.txt")
      .then((r) => r.text())
      .then((text) => {
        setDisclaimer(text);
        setShowDisclaimer(true);
      });
    fetch("/Tutorial.html")
      .then((r) => r.text())
      .then(setTutorial);
  }, []);

  return (
    <>
      <footer className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setShowTutorial(true)}
            className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
          >
            Tutorial
          </button>
          <p className="text-xs text-slate-500">{disclaimer}</p>
        </div>
      </footer>

      <Modal
        open={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        title="Disclaimer"
      >
        <p className="whitespace-pre-wrap text-sm text-slate-700">
          {disclaimer}
        </p>
      </Modal>

      <Modal
        open={showTutorial}
        onClose={() => setShowTutorial(false)}
        title="Tutorial"
      >
        <div
          className="prose prose-sm max-h-[60vh] overflow-y-auto prose-emerald prose-headings:text-slate-900"
          dangerouslySetInnerHTML={{ __html: tutorial }}
        />
      </Modal>
    </>
  );
}
