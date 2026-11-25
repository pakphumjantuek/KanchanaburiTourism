export type LatLng = [number, number]; // [lat,lng]

type OsrmResponse = {
  routes?: Array<{
    distance: number; // meters
    duration: number; // seconds
    geometry: { coordinates: Array<[number, number]>; type: "LineString" }; // [lng,lat]
  }>;
};

export async function computeOsrmRoute(points: LatLng[], mode: "driving" | "walking" | "cycling" = "driving") {
  if (points.length < 2) throw new Error("ต้องมีอย่างน้อย 2 สถานที่ที่มีพิกัด");

  const coordStr = points.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const url =
    `https://router.project-osrm.org/route/v1/${mode}/${coordStr}` +
    `?overview=full&geometries=geojson&steps=false`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM error: ${res.status}`);

  const json = (await res.json()) as OsrmResponse;
  const r = json?.routes?.[0];
  if (!r) throw new Error("OSRM ไม่คืนค่าเส้นทาง");

  const pointsLatLng = r.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng);

  return {
    pointsLatLng,                      // [lat,lng] ใช้ draw บน map
    polylineLngLat: r.geometry.coordinates as number[][], // [lng,lat] ส่งไป backend save
    totalDistanceKm: r.distance / 1000,
    totalTravelMinutes: Math.round(r.duration / 60),
  };
}
