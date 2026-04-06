import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: "QUEUE" | "PROGRESS" | "DONE" | "ARCHIVED" | string }) {
  switch (status) {
    case "QUEUE":
      return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 shadow-sm dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">Menunggu</Badge>;
    case "PROGRESS":
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm border-transparent">Dikerjakan</Badge>;
    case "DONE":
      return <Badge className="bg-green-500 hover:bg-green-600 text-white shadow-sm border-transparent">Selesai</Badge>;
    case "ARCHIVED":
      return <Badge variant="outline" className="text-slate-400 border-slate-200">Diarsipkan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
