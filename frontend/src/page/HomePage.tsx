// import { Link } from "react-router-dom";
// import { useGeoLocation } from "../utils/useGeoLocation"; // ปรับ path
// import {
//   useGetPersonalRecommendationsQuery,
// } from "../features/log/logApi"; // ปรับ path
// function PlaceCard({ p }: any) {
//   return (
//     <Link
//       to={`/placeDetails/${p.placeId}`}
//       className="border rounded-lg p-3 flex gap-3 hover:shadow-sm transition"
//     >
//       {p.coverImageUrl ? (
//         <img
//           className="w-24 h-16 rounded object-cover"
//           src={`${import.meta.env.VITE_API_BASE_URLS}${p.coverImageUrl}`}
//           alt={p.name}
//         />
//       ) : (
//         <div className="w-24 h-16 bg-gray-200 rounded" />
//       )}

//       <div className="flex-1 min-w-0">
//         <div className="font-semibold truncate">{p.name}</div>
//         <div className="text-sm opacity-80 truncate">{p.categoryName ?? "-"}</div>
//         <div className="text-xs opacity-70 truncate">{(p.tags ?? []).join(", ")}</div>
//         <div className="text-xs mt-1">Score: {Number(p.score ?? 0).toFixed(3)}</div>
//       </div>
//     </Link>
//   );
// }

// export default function HomePage() {
//   const geo = useGeoLocation(true);
//   const hasLoc = geo.lat != null && geo.lng != null;

//   // ✅ personal: ถ้ามีพิกัดส่งไปเลย
//   // const personal = useGetPersonalRecommendationsQuery(
//   //   hasLoc ? { lat: geo.lat!, lng: geo.lng!, limit: 6 } : { limit: 6 }
//   // );

//   // ✅ nearby-food: ต้องมีพิกัดถึง query


//   return (
//     <div className="p-6 space-y-8">
//       {/* location banner */}
//       <div className="flex items-center justify-between border rounded-lg p-4">
//         <div>
//           <div className="font-semibold">ตำแหน่งของคุณ</div>
//           {geo.loading && <div className="text-sm opacity-80">กำลังขอตำแหน่ง...</div>}
//           {!geo.loading && hasLoc && (
//             <div className="text-sm opacity-80">
//               lat: {geo.lat?.toFixed(5)}, lng: {geo.lng?.toFixed(5)}
//             </div>
//           )}
//           {geo.error && <div className="text-sm text-red-500">{geo.error}</div>}
//         </div>

//         <button
//           onClick={geo.request}
//           className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
//         >
//           ขอพิกัด
//         </button>
//       </div>

//       {/* Section 1: Personal */}
//       <section className="space-y-3">
//         <div className="flex items-center justify-between">
//           <h2 className="text-lg font-semibold">แนะนำสำหรับคุณ</h2>
//           <Link className="text-sm text-blue-600" to="/recommendations">
//             ดูทั้งหมด
//           </Link>
//         </div>

//         {personal.isLoading && <div>Loading...</div>}
//         {personal.isError && (
//           <div className="text-red-500">
//             โหลดไม่สำเร็จ: {(personal.error as any)?.message ?? "unknown"}
//           </div>
//         )}

//         <div className="grid md:grid-cols-2 gap-3">
//           {(personal.data ?? []).map((p) => (
//             <PlaceCard key={p.placeId} p={p} />
//           ))}
//         </div>
//       </section>

//       {/* Section 2: Nearby Food */}
//       <section className="space-y-3">
//         <div className="flex items-center justify-between">
//           <h2 className="text-lg font-semibold">อาหารพื้นถิ่นใกล้ฉัน</h2>
//           <Link className="text-sm text-blue-600" to="/nearby-food">
//             ดูทั้งหมด
//           </Link>
//         </div>

//         {!hasLoc && (
//           <div className="text-sm opacity-80">
//             ต้องอนุญาต Location เพื่อแสดงร้านอาหารใกล้ตัว
//           </div>
//         )}

//         {/* {hasLoc && nearbyFood.isLoading && <div>Loading...</div>}
//         {hasLoc && nearbyFood.isError && (
//           <div className="text-red-500">
//             โหลดไม่สำเร็จ: {(nearbyFood.error as any)?.message ?? "unknown"}
//           </div>
//         )}

//         <div className="grid md:grid-cols-2 gap-3">
//           {(nearbyFood.data ?? []).map((p) => (
//             <PlaceCard key={p.placeId} p={p} />
//           ))}
//         </div> */}
//       </section>
//     </div>
//   );
// }
