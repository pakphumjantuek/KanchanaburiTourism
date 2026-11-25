const getAssetOrigin = () => {
  try {
    return new URL(import.meta.env.VITE_API_BASE_URLS as string).origin;
  } catch {
    return (import.meta.env.VITE_API_BASE_URLS as string) || "";
  }
};

export const buildImageUrl = (p?: string | null) =>
  p ? `${getAssetOrigin()}/${String(p).replace(/^\//, "")}` : "";
