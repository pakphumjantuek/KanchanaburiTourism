import heroBg from "../../../../assets/hero-bridge.jpg";

export function TripHeroHeader() {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-5 sm:pt-8">
      <div className="relative rounded-3xl sm:rounded-[28px] overflow-hidden min-h-[220px] sm:min-h-[280px] flex items-end shadow-xl shadow-[#141c23]/10">
        <img
          src={heroBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141c23]/90 via-[#141c23]/60 to-[#141c23]/10" />

        <div className="relative p-5 sm:p-10 text-left max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-1 rounded-full bg-[#d84a1b]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#ffdbd1]">
              My trips
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            ทริปของฉัน
          </h1>
          <p className="mt-2 text-sm sm:text-lg text-white/80">
            วางแผน จัดการ และเก็บความทรงจำดีๆ ที่กาญจนบุรี
          </p>
        </div>
      </div>
    </div>
  );
}
