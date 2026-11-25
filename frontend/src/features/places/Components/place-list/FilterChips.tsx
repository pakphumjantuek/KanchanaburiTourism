type Props = {
  categories: string[];
  selectedCategory: string | null;
  onSelect: (cat: string | null) => void;
};

export function FilterChips({ categories, selectedCategory, onSelect }: Props) {
  const chip = (active: boolean) =>
    `shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
      active
        ? "bg-[#d84a1b] border-[#d84a1b] text-white shadow-md shadow-[#d84a1b]/20"
        : "bg-white border-[#e2bfb5]/60 text-[#5a413a] hover:border-[#d84a1b] hover:text-[#d84a1b]"
    }`;

  return (
    <div role="group" aria-label="หมวดหมู่สถานที่" className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      <button type="button" aria-pressed={!selectedCategory} onClick={() => onSelect(null)} className={chip(!selectedCategory)}>
        ทั้งหมด
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          aria-pressed={selectedCategory === cat}
          onClick={() => onSelect(cat)}
          className={chip(selectedCategory === cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
