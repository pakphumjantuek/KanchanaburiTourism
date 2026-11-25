import { formatThaiDate } from "../../../utils";

export const getTripDuration = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

export const formatThaiRange = (start: string, end: string) => {
  const s = formatThaiDate(start);
  const e = formatThaiDate(end);
  return s === e ? s : `${s} - ${e}`;
};

export const getTripStatus = (start: string, end: string) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  if (endDate < now) {
    return {
      label: "สิ้นสุดแล้ว",
      className: "bg-gray-50 text-gray-600 border-gray-200",
      dot: "bg-gray-400",
    };
  } else if (startDate > now) {
    return {
      label: "เร็วๆ นี้",
      className: "bg-blue-50 text-blue-700 border-blue-100",
      dot: "bg-blue-500",
    };
  } else {
    return {
      label: "กำลังเดินทาง",
      className: "bg-green-50 text-green-700 border-green-100",
      dot: "bg-green-500",
    };
  }
};
