import React from "react";

export type BadgeTone = "gray" | "blue" | "emerald" | "amber" | "rose" | "purple";

export const Badge = ({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) => {
  const cls =
    tone === "blue"
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : tone === "amber"
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : tone === "rose"
      ? "bg-rose-50 text-rose-700 border-rose-100"
      : tone === "purple"
      ? "bg-purple-50 text-purple-700 border-purple-100"
      : "bg-gray-50 text-gray-700 border-gray-100";

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${cls}`}
    >
      {children}
    </span>
  );
};

export const PillButton = ({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
      active
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-white border-gray-300 hover:border-blue-400 text-gray-700"
    }`}
  >
    {children}
  </button>
);

export const SectionTitle = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <div className="mb-3">
    <div className="text-lg font-extrabold text-gray-900">{title}</div>
    {subtitle && <div className="text-xs text-gray-600 mt-1">{subtitle}</div>}
  </div>
);
