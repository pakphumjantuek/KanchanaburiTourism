import { BookOpen } from "lucide-react";

type Props = { categoryName?: string | null };

export function PlaceHistoryCard({ categoryName }: Props) {
  const isHistory = Boolean(categoryName?.includes("ประวัติศาสตร์"));

  return (
    <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border border-amber-100/50 shadow-sm relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-amber-100 rounded-full opacity-50 blur-2xl"></div>

      <div className="flex items-start gap-5 relative z-10">
        <div className="p-3.5 bg-white text-amber-600 rounded-2xl shadow-sm border border-amber-100 shrink-0">
          <BookOpen className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-amber-900 mb-3">
            {isHistory ? "เรื่องราวน่ารู้" : "ไฮไลท์สำคัญ"}
          </h3>
          <p className="text-slate-700 leading-relaxed">
            {isHistory
              ? "สถานที่แห่งนี้มีความสำคัญทางประวัติศาสตร์และเป็นส่วนหนึ่งของมรดกทางวัฒนธรรมของกาญจนบุรี สะท้อนถึงเรื่องราวและเหตุการณ์สำคัญในอดีตที่หล่อหลอมเป็นอัตลักษณ์ของท้องถิ่น ควรค่าแก่การอนุรักษ์และเยี่ยมชม"
              : "สถานที่นี้เป็นหนึ่งในจุดหมายยอดนิยมของนักท่องเที่ยวที่มาเยือนจังหวัดกาญจนบุรี มีเสน่ห์ที่เป็นเอกลักษณ์และประสบการณ์ที่น่าประทับใจสำหรับผู้มาเยือนทุกท่าน พร้อมมุมถ่ายรูปสวยๆ มากมาย"}
          </p>
        </div>
      </div>
    </section>
  );
}
