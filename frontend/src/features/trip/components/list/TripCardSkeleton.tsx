export const TripCardSkeleton = () => (
  <div className="bg-white rounded-3xl border border-[#e2bfb5]/40 overflow-hidden">
    <div className="h-[104px] bg-[#e7e1db] animate-pulse" />
    <div className="p-5 space-y-3">
      <div className="h-4 w-full bg-[#f3ede7] rounded-md animate-pulse" />
      <div className="h-4 w-2/3 bg-[#f3ede7] rounded-md animate-pulse" />
      <div className="flex gap-2 pt-1">
        <div className="h-7 w-36 bg-[#f3ede7] rounded-full animate-pulse" />
        <div className="h-7 w-16 bg-[#f3ede7] rounded-full animate-pulse" />
      </div>
      <div className="flex gap-2 pt-3">
        <div className="h-11 flex-1 bg-[#f3ede7] rounded-full animate-pulse" />
        <div className="h-11 w-11 bg-[#f3ede7] rounded-full animate-pulse" />
      </div>
    </div>
  </div>
);
