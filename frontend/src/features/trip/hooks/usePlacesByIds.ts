import { useEffect, useMemo, useState } from "react";
import type { PlaceDto } from "../../places/placeTypes";

type State = {
  map: Map<number, PlaceDto>;
  isLoading: boolean;
};

export function usePlacesByIds(placeIds: number[]) {
  const ids = useMemo(
    () => Array.from(new Set(placeIds.filter((x) => x > 0))),
    [placeIds]
  );

  const [state, setState] = useState<State>({
    map: new Map(),
    isLoading: false,
  });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (ids.length === 0) {
        setState({ map: new Map(), isLoading: false });
        return;
      }

      setState((s) => ({ ...s, isLoading: true }));

      try {
        // ยิงพร้อมกัน (จำกัดกันหนักนิดนึง)
        const results = await Promise.all(
          ids.slice(0, 50).map(async (id) => {
            const res = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}Place/${id}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include",
              }
            );
            const json = await res.json();
            if (!json?.isSuccess || !json?.result) return null;
            return json.result as PlaceDto;
          })
        );

        if (cancelled) return;

        const map = new Map<number, PlaceDto>();
        results
          .filter(Boolean)
          .forEach((p) => map.set((p as PlaceDto).placeId, p as PlaceDto));

        setState({ map, isLoading: false });
      } catch {
        if (cancelled) return;
        setState({ map: new Map(), isLoading: false });
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [ids]);

  return state;
}
