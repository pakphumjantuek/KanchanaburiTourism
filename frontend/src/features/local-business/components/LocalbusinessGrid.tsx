import type { PlaceDto } from "../../places/placeTypes";
import { LocalbusinessCard } from "./LocalbusinessCard";

type Props = {
  places: PlaceDto[];
  onClickLog: (placeId: number) => Promise<void>;
};

export function LocalbusinessGrid({ places, onClickLog }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
      {places.map((place) => (
        <LocalbusinessCard key={place.placeId} place={place} onClickLog={onClickLog} />
      ))}
    </div>
  );
}
