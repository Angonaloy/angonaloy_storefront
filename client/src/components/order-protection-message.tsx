export function OrderProtectionMessage({ decision, retryable = true }: { decision: "review" | "block"; retryable?: boolean }) {
  if (decision === "review") {
    return <div role="status" className="rounded-xl border border-[#b8872c]/50 bg-[#fff7df] px-4 py-3 text-sm leading-6 text-[#3d211a]">আপনার অর্ডারের তথ্য পাওয়া গেছে। আমাদের টিম দ্রুত দেখে ফোনে নিশ্চিত করবে। এখন আবার জমা দেওয়ার প্রয়োজন নেই।</div>;
  }
  return (
    <div role="alert" className="rounded-xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm leading-6 text-red-900">
      <p>তথ্যগুলো একবার দেখে আবার চেষ্টা করুন। {retryable ? "সমস্যা থাকলে কিছুক্ষণ পরে চেষ্টা করুন।" : "প্রয়োজনে আমাদের সঙ্গে যোগাযোগ করুন।"}</p>
      <a
        href="https://wa.me/8801301636461"
        target="_blank"
        rel="noopener noreferrer"
        className="group mx-auto mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-white/20 bg-[#25d366] px-4 text-center text-[11px] font-medium tracking-[0.02em] text-white shadow-none transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-[#1da851] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25d366]/40"
      >
        <img
          src="https://cdn.reicon.dev/logos/whatsapp/original.svg"
          alt="Whatsapp"
          width={16}
          height={16}
          className="h-4 w-4 brightness-0 invert"
        />
        হোয়াটসঅ্যাপে অর্ডার করুন
      </a>
    </div>
  );
}
