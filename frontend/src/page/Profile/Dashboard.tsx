import { useMemo, useState } from "react";
import { useGetTrainingStatsQuery } from "../../features/recommend/recommendApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { formatThaiDate } from "../../utils";
import { useDebounce } from "../../utils/useDebounce";
import { Activity, LayoutDashboard, MapPin, RefreshCw, Target, TrendingUp, User } from "lucide-react";
import {
  ACCENT,
  ACCENT_2,
  ACTION_META,
  ACTION_ORDER,
  EmptyState,
  ErrorState,
  KpiStrip,
  PageBody,
  PageHeader,
  Panel,
  PrimaryButton,
  RankList,
  Segmented,
  SkeletonPanel,
  SkeletonStrip,
  axisTick,
  gridStroke,
  tooltipStyle,
} from "../../components/admin/AdminUi";

const RANGE_PRESETS = [
  { value: 7, label: "7 วัน" },
  { value: 30, label: "30 วัน" },
  { value: 90, label: "90 วัน" },
  { value: 365, label: "1 ปี" },
];

const fmt = (n: number | undefined | null) =>
  n !== undefined && n !== null ? n.toLocaleString() : "-";

export default function Dashboard() {
  const [days, setDays] = useState(90);
  const debouncedDays = useDebounce(days, 800);

  const {
    data: stats,
    isLoading: loadingStats,
    error: errStats,
    refetch: refetchStats,
    isFetching,
  } = useGetTrainingStatsQuery(
    { days: debouncedDays },
    { refetchOnFocus: false, refetchOnReconnect: false }
  );

  const topUsersChartData = useMemo(() => {
    const users: { name: string; logs: number }[] = [];
    let guestLogs = 0;
    for (const u of stats?.topUsers || []) {
      if (u.userId) users.push({ name: `ผู้ใช้ #${u.userId}`, logs: u.logs });
      else guestLogs += u.logs ?? 0;
    }
    if (guestLogs > 0) users.push({ name: "ผู้เยี่ยมชม (รวม)", logs: guestLogs });
    return users;
  }, [stats?.topUsers]);

  const topPlacesChartData = useMemo(
    () =>
      (stats?.topPlaces || []).map((p) => ({
        name: p.name || `สถานที่ #${p.placeId}`,
        logs: p.logs,
      })),
    [stats?.topPlaces]
  );

  const dailyTrendData = useMemo(
    () =>
      (stats?.daily || []).map((d) => ({
        date: formatThaiDate(d.dateUtc.slice(0, 10)),
        totalLogs: d.totalLogs,
        rowsTrainable: d.rowsTrainable,
      })),
    [stats?.daily]
  );

  const dailyActionsData = useMemo(() => {
    const map = new Map<string, any>();
    for (const a of stats?.dailyActions || []) {
      const date = formatThaiDate(a.dateUtc.slice(0, 10));
      if (!map.has(date)) map.set(date, { date });
      map.get(date)[a.actionType] = a.count;
    }
    return Array.from(map.values());
  }, [stats?.dailyActions]);

  const funnelData = useMemo(() => {
    const map = Object.fromEntries(
      (stats?.actions || []).map((a) => [a.actionType, a.count])
    );
    return ACTION_ORDER.map((k) => ({
      key: k,
      label: ACTION_META[k].label,
      color: ACTION_META[k].color,
      value: map[k] ?? 0,
    })).filter((x) => x.value > 0);
  }, [stats?.actions]);

  const funnelMax = Math.max(1, ...funnelData.map((f) => f.value));

  return (
    <div className="min-h-full bg-slate-50 pb-12">
      <PageHeader
        icon={LayoutDashboard}
        title="แดชบอร์ดภาพรวม"
        description="สถิติการใช้งานและข้อมูลสำหรับระบบแนะนำสถานที่"
        actions={
          <>
            <Segmented options={RANGE_PRESETS} value={days} onChange={setDays} />
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-100">
              <span className="text-base text-slate-500">กำหนดเอง</span>
              <input
                type="number"
                className="w-14 border-none bg-transparent p-0 text-right text-base font-medium text-slate-900 tabular-nums focus:outline-none focus:ring-0"
                value={days}
                min={1}
                max={3650}
                onChange={(e) => setDays(Number(e.target.value))}
              />
              <span className="text-base text-slate-500">วัน</span>
            </label>
            <PrimaryButton onClick={() => refetchStats()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden />
              {isFetching ? "กำลังโหลด" : "รีเฟรช"}
            </PrimaryButton>
          </>
        }
      />

      <PageBody>
        {loadingStats && !stats ? (
          <div className="space-y-6">
            <SkeletonStrip />
            <div className="grid gap-6 xl:grid-cols-2">
              <SkeletonPanel />
              <SkeletonPanel />
            </div>
          </div>
        ) : errStats ? (
          <ErrorState text="ไม่สามารถโหลดข้อมูลได้" onRetry={() => refetchStats()} />
        ) : (
          <>
            <KpiStrip
              items={[
                { label: "กิจกรรมทั้งหมด", value: fmt(stats?.totalLogs), color: "blue" },
                { label: "กิจกรรมเกี่ยวกับสถานที่", value: fmt(stats?.placeLogs), color: "emerald" },
                { label: "จำนวนผู้ใช้", value: fmt(stats?.uniqueUsers), color: "amber" },
                { label: "จำนวนสถานที่", value: fmt(stats?.uniquePlaces), color: "violet" },
                { label: "ข้อมูลพร้อมเทรน", value: fmt(stats?.rowsTrainable), color: "indigo" },
                {
                  label: "เก็บข้อมูลตั้งแต่",
                  color: "slate",
                  value: (
                    <span className="text-xl">
                      {stats?.sinceUtc ? formatThaiDate(stats.sinceUtc.slice(0, 10)) : "-"}
                    </span>
                  ),
                },
              ]}
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Panel title="แนวโน้มรายวัน" subtitle="จำนวนกิจกรรมและข้อมูลที่ใช้เทรนในแต่ละวัน" icon={TrendingUp} color="blue">
                {dailyTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyTrendData} margin={{ left: -8, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} stroke={gridStroke} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={axisTick} minTickGap={24} />
                      <YAxis tickLine={false} axisLine={false} tick={axisTick} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend iconType="plainline" wrapperStyle={{ fontSize: 14 }} />
                      <Area type="monotone" dataKey="totalLogs" name="กิจกรรมทั้งหมด" stroke={ACCENT} fill={ACCENT} fillOpacity={0.08} strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Area type="monotone" dataKey="rowsTrainable" name="ข้อมูลพร้อมเทรน" stroke={ACCENT_2} fill={ACCENT_2} fillOpacity={0.06} strokeWidth={2} dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState />
                )}
              </Panel>

              <Panel title="กิจกรรมตามช่วงเวลา" subtitle="แยกตามประเภทการใช้งานในแต่ละวัน" icon={Activity} color="violet">
                {dailyActionsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyActionsData} margin={{ left: -8, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} stroke={gridStroke} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={axisTick} minTickGap={24} />
                      <YAxis tickLine={false} axisLine={false} tick={axisTick} />
                      <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={tooltipStyle} />
                      <Legend iconType="square" wrapperStyle={{ fontSize: 14 }} />
                      {ACTION_ORDER.map((k, i) => (
                        <Bar
                          key={k}
                          dataKey={k}
                          name={ACTION_META[k].label}
                          stackId="a"
                          fill={ACTION_META[k].color}
                          radius={i === ACTION_ORDER.length - 1 ? [3, 3, 0, 0] : undefined}
                          isAnimationActive={false}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState />
                )}
              </Panel>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Panel title="ลำดับขั้นการใช้งาน" subtitle="จากการเข้าชมสู่การรีวิว" icon={Target} color="rose">
                {funnelData.length > 0 ? (
                  <ul className="space-y-4">
                    {funnelData.map((f) => {
                      const pct = (f.value / funnelMax) * 100;
                      return (
                        <li key={f.key}>
                          <div className="mb-1.5 flex items-baseline justify-between gap-3">
                            <span className="text-base text-slate-700">{f.label}</span>
                            <span className="text-base tabular-nums text-slate-500">
                              <span className="font-medium text-slate-900">{f.value.toLocaleString()}</span>
                              <span className="ml-2 text-sm">{pct.toFixed(1)}%</span>
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: f.color }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <EmptyState />
                )}
              </Panel>

              <RankList title="ผู้ใช้ที่ใช้งานมากที่สุด" icon={User} color="blue" barColor={ACCENT} data={topUsersChartData.slice(0, 10)} />
              <RankList title="สถานที่ยอดนิยม" icon={MapPin} color="emerald" barColor={ACCENT_2} data={topPlacesChartData.slice(0, 10)} />
            </div>
          </>
        )}
      </PageBody>
    </div>
  );
}
