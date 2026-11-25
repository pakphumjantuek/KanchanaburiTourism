import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "../../../utils/useDebounce";
import { confirmDelete, showSuccessOk } from "../../../utils";
import {
  useDeleteTripMutation,
  useGetAllTripsQuery,
  useGenerateAutoTripMutation,
} from "../tripApi";

export function useTripListController() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [search, setSearch] = useState("");
  const [autoTripOpen, setAutoTripOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const [deleteTrip] = useDeleteTripMutation();
  const [generateAutoTrip, { isLoading: isAutoTripLoading }] =
    useGenerateAutoTripMutation();

  useEffect(() => setPage(1), [debouncedSearch, pageSize]);

  const { data, isLoading } = useGetAllTripsQuery({
    page,
    pageSize,
    search: debouncedSearch,
  });

  const trips = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);
  const hasSearch = debouncedSearch.trim().length > 0;

  const skeletonCount = useMemo(() => Array.from({ length: 9 }), []);

  const goTripDetail = (tripId: number) => navigate(`/trip/${tripId}`);
  const goPlanner = (tripId: number) => navigate(`/trip/${tripId}/planner`);
  const goCreate = () => navigate("/trip/create");

  const handleDeleteTrip = async (tripId: number, title: string) => {
    const ok = await confirmDelete(`คุณต้องการลบทริป "${title}" หรือไม่?`);
    if (!ok) return;

    try {
      await deleteTrip(tripId).unwrap();
      showSuccessOk("ลบทริปเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      alert((err as any)?.data?.errorMessages?.[0] ?? "ไม่สามารถลบทริปได้");
    }
  };

  const handleGenerateAutoTrip = async (pref: any) => {
    try {
      setAutoTripOpen(false);

      const start = new Date(`${pref.startDate}T08:00:00`); // เวลาเครื่องผู้ใช้ (ไทย)

      const trip = await generateAutoTrip({
        startDateTime: start.toISOString(),
        days: pref.days,
        hoursPerDay: pref.hoursPerDay,
        startLat: pref.start?.lat ?? null,
        startLng: pref.start?.lng ?? null,
        transportMode: "driving",
        preferredCategoryIds: pref.preferredCategoryIds ?? [],
        relaxedPace: pref.relaxedPace,
        budgetLevel: pref.budgetLevel,
        withElderOrKids: pref.withElderOrKids,
      }).unwrap();

      showSuccessOk("สร้างทริปอัตโนมัติสำเร็จ!");
      navigate(`/trip/${trip.tripId}`);
    } catch (err) {
      console.error(err);
      alert((err as any)?.data?.errorMessages?.[0] ?? "สร้างทริปอัตโนมัติไม่สำเร็จ");
    }
  };

  return {
    // state
    page,
    pageSize,
    search,
    setSearch,
    autoTripOpen,
    setAutoTripOpen,

    // derived
    trips,
    total,
    totalPages,
    hasSearch,
    skeletonCount,
    isLoading,
    isAutoTripLoading,

    // actions
    setPage,
    goTripDetail,
    goPlanner,
    goCreate,
    handleDeleteTrip,
    handleGenerateAutoTrip,
  };
}
