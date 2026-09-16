import { useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  useEffect(() => {
    document.title = "Page not found | Angonaloy-আঙ্গনালয়";
    let meta = document.head.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    const prev = meta.content;
    meta.content = "noindex, follow";
    return () => {
      meta.content = prev || "index, follow";
    };
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <div className="flex mb-4 gap-2 items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            This page is gone. Browse fresh mangoes, honey and ghee instead.
          </p>
          <Link href="/products" className="mt-6 inline-block rounded-[8px] bg-black px-6 py-3 text-[11px] font-bold uppercase tracking-[0.25em] text-white">
            Browse products
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
