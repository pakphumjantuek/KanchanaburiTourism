export function TripDetailTopNav({
  onBack,
  onGoMap,
  onGoPlanner,
}: {
  tripId: number;
  onBack: () => void;
  onGoMap: () => void;
  onGoPlanner: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 bg-white hover:border-blue-500 hover:text-blue-700 font-semibold text-gray-800 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>กลับ</span>
      </button>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onGoMap}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 bg-white hover:border-blue-500 hover:text-blue-700 font-semibold transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span>แผนที่และเส้นทาง</span>
        </button>

        <button
          onClick={onGoPlanner}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>ไปหน้าวางแผน</span>
        </button>
      </div>
    </div>
  );
}
