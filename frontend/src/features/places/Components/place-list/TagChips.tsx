import { Tag } from "lucide-react";

type Props = {
  tags: string[];
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
  limit?: number;
};

export function TagChips({ tags, selectedTag, onSelect, limit = 20 }: Props) {
  if (tags.length === 0) return null;

  const Chip = ({
    active,
    children,
    onClick,
  }: {
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 whitespace-nowrap border flex items-center gap-1.5
        ${
          active
            ? "bg-orange-500 text-white border-orange-500 shadow-md transform scale-105 z-10"
            : "bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
        }
      `}
    >
      {/* Hash icon logic */}
      <span className={active ? "text-orange-100" : "text-orange-400"}>#</span>
      {children}
    </button>
  );

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Tag size={16} className="text-orange-500" />
        <h3 className="text-sm font-bold text-slate-700">แท็กยอดนิยม</h3>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-4 px-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <Chip active={!selectedTag} onClick={() => onSelect(null)}>
          ทั้งหมด
        </Chip>

        {tags.slice(0, limit).map((tag) => (
          <Chip
            key={tag}
            active={selectedTag === tag}
            onClick={() => onSelect(tag)}
          >
            {tag}
          </Chip>
        ))}
      </div>
    </div>
  );
}
