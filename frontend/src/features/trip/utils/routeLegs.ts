import type { LatLng } from "./osrm";

// แยกกันชัด + ยังแยกได้สำหรับคนตาบอดสีส่วนใหญ่; เกิน 6 ช่วงวนสีซ้ำ
export const LEG_COLORS = ["#d84a1b", "#2563eb", "#7c3aed", "#0d9488", "#db2777", "#a16207"];

export type RouteLeg = {
  points: LatLng[];
  km: number;
  color: string;
  straight: boolean; // ไม่มีเส้นทางจริง → เส้นตรงระหว่างหมุด
};

export function haversineKm([lat1, lng1]: LatLng, [lat2, lng2]: LatLng) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const lengthKm = (pts: LatLng[]) =>
  pts.reduce((sum, p, i) => (i === 0 ? 0 : sum + haversineKm(pts[i - 1], p)), 0);

/**
 * ตัดเส้นทางทั้งวัน (route) เป็นช่วงระหว่างหมุดต่อกัน (stops เรียงตามลำดับ)
 * ค้นหาจุดตัดไปข้างหน้าเท่านั้น และเลือกจุด "แรก" ที่ใกล้หมุดพอ ๆ กับจุดที่ใกล้สุด
 * เพื่อไม่ให้ถนนที่วนกลับมาผ่านหมุดเดิมทำให้ตัดผิดช่วง
 */
export function splitRouteIntoLegs(route: LatLng[], stops: LatLng[]): RouteLeg[] {
  const legCount = Math.max(stops.length - 1, 0);
  const color = (i: number) => LEG_COLORS[i % LEG_COLORS.length];

  if (route.length < 2) {
    return Array.from({ length: legCount }, (_, i) => {
      const points = [stops[i], stops[i + 1]];
      return { points, km: lengthKm(points), color: color(i), straight: true };
    });
  }

  const legs: RouteLeg[] = [];
  let start = 0;
  for (let i = 0; i < legCount; i++) {
    let cut = route.length - 1;
    if (i < legCount - 1) {
      const target = stops[i + 1];
      const maxIdx = route.length - 1 - (legCount - 1 - i); // เหลือจุดให้ช่วงที่เหลือ
      let best = Infinity;
      const dist: number[] = [];
      for (let j = start; j <= maxIdx; j++) {
        dist[j] = haversineKm(route[j], target);
        if (dist[j] < best) best = dist[j];
      }
      cut = start;
      for (let j = start; j <= maxIdx; j++) {
        if (dist[j] <= best + 0.05) {
          cut = j;
          break;
        }
      }
    }
    const points = route.slice(start, cut + 1);
    legs.push({ points: points.length >= 2 ? points : [stops[i], stops[i + 1]], km: lengthKm(points), color: color(i), straight: false });
    start = cut;
  }
  return legs;
}

export function midpoint(points: LatLng[]): LatLng {
  return points[Math.floor(points.length / 2)] ?? points[0];
}

// self-check (dev เท่านั้น): ถนนวนกลับมาผ่านหมุด B ตอนท้าย ต้องยังตัดที่การผ่านครั้งแรก
if (import.meta.env.DEV) {
  const A: LatLng = [14.0, 99.5], B: LatLng = [14.0, 99.6], C: LatLng = [14.1, 99.6];
  const route: LatLng[] = [A, [14.0, 99.55], B, [14.05, 99.6], C, [14.05, 99.6], B, C];
  const legs = splitRouteIntoLegs(route, [A, B, C]);
  console.assert(legs.length === 2 && legs[0].points.length === 3, "splitRouteIntoLegs: cut at first pass", legs);
  console.assert(splitRouteIntoLegs([], [A, B, C]).every((l) => l.straight), "splitRouteIntoLegs: straight fallback");
}
