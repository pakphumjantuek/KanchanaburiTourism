import { TripCard } from "./TripCard";

type Trip = {
  tripId: number;
  title: string;
  description?: string | null;
  startDateTime: string;
  endDateTime: string;
};

type Props = {
  trips: Trip[];
  onOpen: (tripId: number) => void;
  onPlanner: (tripId: number) => void;
  onDelete: (tripId: number, title: string) => void;
};

export function TripGrid({ trips, onOpen, onPlanner, onDelete }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
      {trips.map((trip) => (
        <TripCard
          key={trip.tripId}
          trip={trip}
          onOpen={onOpen}
          onPlanner={onPlanner}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
