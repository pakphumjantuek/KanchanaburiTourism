type Props = { description?: string | null };

export function PlaceDescription({ description }: Props) {
  if (!description) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-slate-800">เกี่ยวกับสถานที่</h2>
        <div className="h-px flex-1 bg-slate-200"></div>
      </div>
      <div className="prose prose-lg prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
        {description}
      </div>
    </section>
  );
}
