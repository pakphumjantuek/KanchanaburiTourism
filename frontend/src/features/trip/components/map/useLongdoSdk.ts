import { useEffect, useState } from "react";

declare global {
  interface Window {
    longdo?: any;
  }
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; message: string };

type Options = {
  apiKey: string;
  version?: "map3"; // เผื่ออนาคต
  timeoutMs?: number;
};

const SCRIPT_ID = "longdo-map-sdk";

export function useLongdoSdk(options: Options) {
  const { apiKey, version = "map3", timeoutMs = 12000 } = options;
  const [state, setState] = useState<State>(() => {
    if (typeof window === "undefined") return { status: "idle" };
    if (window.longdo) return { status: "ready" };
    return { status: "idle" };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.longdo) {
      setState({ status: "ready" });
      return;
    }
    if (!apiKey) {
      setState({ status: "error", message: "Missing Longdo API key" });
      return;
    }

    const existing = document.getElementById(
      SCRIPT_ID,
    ) as HTMLScriptElement | null;

    // helper: finalize ready
    const markReady = () => {
      if (window.longdo) setState({ status: "ready" });
      else
        setState({
          status: "error",
          message: "Longdo loaded but window.longdo is undefined",
        });
    };

    // ถ้ามี script อยู่แล้ว แค่รอ ready
    if (existing) {
      setState({ status: "loading" });

      const onLoad = () => markReady();
      const onError = () =>
        setState({ status: "error", message: "Failed to load Longdo SDK" });

      existing.addEventListener("load", onLoad);
      existing.addEventListener("error", onError);

      // timeout guard
      const t = window.setTimeout(() => {
        if (!window.longdo) {
          setState({
            status: "error",
            message: `Longdo SDK load timeout (${timeoutMs}ms)`,
          });
        }
      }, timeoutMs);

      return () => {
        existing.removeEventListener("load", onLoad);
        existing.removeEventListener("error", onError);
        window.clearTimeout(t);
      };
    }

    // ถ้ายังไม่มี ให้สร้าง script ใหม่
    setState({ status: "loading" });

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://api.longdo.com/${version}/?key=${encodeURIComponent(apiKey)}`;

    const onLoad = () => markReady();
    const onError = () =>
      setState({ status: "error", message: "Failed to load Longdo SDK" });

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
    document.head.appendChild(script);

    const t = window.setTimeout(() => {
      if (!window.longdo) {
        setState({
          status: "error",
          message: `Longdo SDK load timeout (${timeoutMs}ms)`,
        });
      }
    }, timeoutMs);

    return () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
      window.clearTimeout(t);
      // หมายเหตุ: ปกติไม่ต้อง remove script ตอน unmount เพราะหน้าอื่นอาจใช้ต่อ
    };
  }, [apiKey, version, timeoutMs]);

  return {
    ready: state.status === "ready",
    loading: state.status === "loading",
    error: state.status === "error" ? state.message : null,
    status: state.status,
  };
}
