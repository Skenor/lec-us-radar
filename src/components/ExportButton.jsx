import { Download } from "lucide-react";

export default function ExportButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ferrari/10 border border-ferrari/30 text-ferrari text-sm font-medium hover:bg-ferrari/20 transition-colors duration-200"
    >
      <Download size={14} />
      Export Report
    </button>
  );
}
