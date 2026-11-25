// src/features/place/components/place-list/PlaceSearchBar.tsx
type Props = {
  value: string;
  onChange: (next: string) => void;
};

export function PlaceSearchBar({ value, onChange }: Props) {
  return (
    <div className="mb-6">
      <div className="relative max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <input
          type="text"
          placeholder="ค้นหาสถานที่ท่องเที่ยว..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-14 pr-6 py-4 text-base rounded-2xl bg-white shadow-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
        />
      </div>
    </div>
  );
}
