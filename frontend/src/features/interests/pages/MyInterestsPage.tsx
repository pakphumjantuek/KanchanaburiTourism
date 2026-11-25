import { useGetMyInterestsQuery } from "../interestApi";

export default function MyInterestsPage() {
  const { data, isLoading, isError } = useGetMyInterestsQuery();

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError) return <div className="p-6">โหลดข้อมูลไม่สำเร็จ</div>;

  if (!data || data.length === 0) {
    return <div className="p-6 text-gray-600">ยังไม่มีความสนใจ</div>;
  }

  console.log("My interests:", data);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">⭐ ความสนใจของฉัน</h1>

      <ul className="space-y-2">
        {data.map((it) => (
          <li
            key={it.interestKey}
            className="flex justify-between items-center border rounded-lg px-4 py-2"
          >
            <span className="truncate">{it.displayName}</span>
            <span className="font-medium text-blue-600">
              {it.weight.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
