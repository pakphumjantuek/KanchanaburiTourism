export function mapStaticUrl(lat?: number, lng?: number) {
  if (lat == null || lng == null) return null;
  // Mapbox token comes from .env (VITE_MAPBOX_TOKEN); without it the static map is simply hidden.
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  if (!token) return null;
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+2bee6c(${lng},${lat})/${lng},${lat},13,0/400x300@2x?access_token=${token}`;
}

export function googleMapsUrl(lat?: number, lng?: number) {
  if (lat == null || lng == null) return null;
  return `https://maps.google.com/?q=${lat},${lng}`;
}
