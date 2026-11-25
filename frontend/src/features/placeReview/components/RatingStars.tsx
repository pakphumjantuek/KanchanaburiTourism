
type Props = {
  value: number;
  onChange?: (v: number) => void;
  sizeClassName?: string; // e.g. "w-6 h-6"
  readOnly?: boolean;
};

export function RatingStars({
  value,
  onChange,
  sizeClassName = "w-6 h-6",
  readOnly,
}: Props) {
  const v = Math.max(0, Math.min(5, value || 0));

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        const active = star <= v;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly || !onChange}
            onClick={() => onChange?.(star)}
            className={[
              "transition-transform",
              readOnly ? "cursor-default" : "hover:scale-105",
            ].join(" ")}
            aria-label={`ให้คะแนน ${star} ดาว`}
          >
            <svg
              className={`${sizeClassName} ${active ? "text-amber-400" : "text-slate-300"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.29 8.72c-.783-.57-.38-1.81.588-1.81H6.34a1 1 0 00.95-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
