export type BadgeState = "normal" | "active" | "dim";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

export function makeBadgeHtml(
  text: string,
  tone: "start" | "end" | "num",
  state: BadgeState = "normal",
  title = ""
) {
  const bg = tone === "start" ? "#16693c" : tone === "end" ? "#141c23" : "#d84a1b";

  // "1\nเริ่ม" → เลขในหมุด + ป้ายเล็กใต้หมุด; ตอน active ใช้ชื่อสถานที่แทนป้าย
  const [top = "", bottom = ""] = String(text).split("\n");
  const label = state === "active" && title ? title : bottom;
  const scale = state === "active" ? 1.25 : 1;
  const opacity = state === "dim" ? 0.45 : 1;

  return `
    <div style="width:64px;display:flex;flex-direction:column;align-items:center;font-family:inherit;
                opacity:${opacity};transform:scale(${scale});transform-origin:50% 46px;transition:all .2s;">
      <div style="
        width:38px;height:38px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        background:${bg};border:3px solid #fff;box-shadow:0 8px 18px rgba(20,28,35,.35);
        display:flex;align-items:center;justify-content:center;box-sizing:border-box;">
        <span style="transform:rotate(45deg);color:#fff;font-weight:900;font-size:15px;line-height:1;">${esc(top)}</span>
      </div>
      ${
        label
          ? `<div style="margin-top:6px;padding:2px 8px;border-radius:999px;background:#fff;color:${bg};
               font-size:${state === "active" ? 11 : 10}px;font-weight:800;white-space:nowrap;max-width:180px;
               overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 6px rgba(20,28,35,.25);">${esc(label)}</div>`
          : ""
      }
    </div>
  `;
}
