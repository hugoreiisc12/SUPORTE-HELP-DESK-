"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion";

const ASSET = (id: string) =>
  `https://wbarljqnwyapytycfglm.supabase.co/storage/v1/object/public/canvas_assets/c5b084d7-d978-4942-8775-19c92226e9c1/${id}.svg`;

const PEEPS = [
  "381d6479-f5b5-49ca-82f3-474c87c62996",
  "9df39fca-20db-4273-bf7e-488d04a13321",
  "3c8ee64a-67b3-4a2c-84d5-c665c725e7c5",
  "3ccafa92-f479-4885-a6fb-0af92993b7f6",
  "735686b6-9bd5-4ab1-9fe6-59c50b5e2eb0",
  "3f775475-8920-4f55-b7c1-16bf192a0b1f",
  "b56ceaf5-7fb3-40a2-bb1a-d41c547c71ca",
  "4bd0452d-b321-4488-b57a-0c52dc73ceb1",
  "5d3553c5-a46f-4238-bcb5-02ff60b0f907",
  "6669baf9-e6d8-476b-abd4-e3d52517aee8",
  "2a2fffcb-9e4e-4610-a2ec-c2c334e29001",
  "742a5c0b-c77f-4ab3-96eb-dbca387f5ff8",
  "da0b3073-d6fd-46d2-a1f6-747fbfedf2b1",
  "d9738cd5-9685-47c4-9eab-e004c4d83776",
  "706557e0-8408-4b07-bcab-2968cf4c493e",
  "45a054f3-181d-4746-983d-12be5078e2f0",
  "38ab3806-883c-4868-9198-a1db96941d06",
  "6a165ed6-e6e5-4695-9aff-bd2cd51c4b1e",
  "c5d7e55b-3899-4297-8632-a5f6a186ac05",
  "25b3470e-e046-42f5-9b36-591d37e72d28",
].map(ASSET);

export type Reach = {
  tag: string;
  tc: "caution" | "route" | "plain";
  signal: string;
  lab: string;
  line: string;
  rtag: string;
  rc: "caution" | "route" | "plain";
  reply: string;
};

const DEFAULT_DATA: Reach[] = [
  {
    tag: "Sincronização",
    tc: "caution",
    signal: "Pedido travado em campo sem 4G",
    lab: "FAQ-01 · Solução",
    line: "Use 'Tentar Sincronizar' no topo —",
    rtag: "Resolvido",
    rc: "route",
    reply: "Sincronizou na hora, obrigado!",
  },
  {
    tag: "NF-e",
    tc: "route",
    signal: "XML recusado na baixa de canhoto",
    lab: "FAQ-02 · Solução",
    line: "Valide o CNPJ da filial antes —",
    rtag: "Resolvido",
    rc: "route",
    reply: "Canhoto aprovado sem erro!",
  },
  {
    tag: "Planilha",
    tc: "caution",
    signal: "Data XLSX importou 1 dia antes",
    lab: "FAQ-03 · Contorno",
    line: "Formate a coluna em Texto DD/MM —",
    rtag: "Contorno",
    rc: "plain",
    reply: "Planilha subiu certinha agora!",
  },
  {
    tag: "SAC",
    tc: "plain",
    signal: "Rastreio de carga fracionada",
    lab: "FAQ-05 · Status",
    line: "Sub-romaneios sendo unificados —",
    rtag: "Em Análise",
    rc: "caution",
    reply: "Perfeito, acompanhando por aqui!",
  },
];

const CSS = `
.rch{--base:#F6F6EE;--c1:#b5d98c;--c2:#8cc5a6;--c3:#E8C75A;--c4:#EDF3EE;--ac:45,106,69;--route2:#245a3a;--tint:#EDF3EE;--rline:#cfe4d8;--route:rgb(var(--ac));--panel:#FDFDF9;--ink:#1E2B22;--ink2:#3b4234;--muted:#5E6B60}
.rch,.rch *{box-sizing:border-box}
.rch{position:relative;width:100%;height:100%;min-height:400px;overflow:hidden;background:var(--base);color:var(--ink);font-family:Manrope,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.rch .bg{position:absolute;inset:0;overflow:hidden;background:var(--base)}
.rch .bg i{position:absolute;border-radius:50%;filter:blur(65px);opacity:.22;will-change:transform}
.rch .b1{left:-14%;top:42%;width:58%;height:84%;background:var(--c1);animation:rch-d1 24s ease-in-out infinite alternate}
.rch .b2{left:24%;top:54%;width:54%;height:76%;background:var(--c2);animation:rch-d2 28s ease-in-out infinite alternate}
.rch .b3{right:-16%;top:38%;width:56%;height:88%;background:var(--c3);animation:rch-d3 26s ease-in-out infinite alternate}
.rch .b4{left:50%;top:48%;width:26%;height:36%;background:var(--c4);animation:rch-d2 20s ease-in-out infinite alternate-reverse}
.rch .dome{position:absolute;left:-28%;right:-28%;top:-58%;height:108%;border-radius:50%;background:radial-gradient(closest-side,#FDFDF9 64%,rgba(253,253,249,.86) 78%,rgba(253,253,249,0) 100%)}
.rch .grain{position:absolute;inset:0;width:100%;height:100%;opacity:.05;pointer-events:none}
@keyframes rch-d1{to{transform:translate(9%,-7%) scale(1.08)}}
@keyframes rch-d2{to{transform:translate(-8%,-5%) scale(1.1)}}
@keyframes rch-d3{to{transform:translate(-7%,6%) scale(1.06)}}
.rch .fx{position:absolute;z-index:3;left:0;top:0;width:100%;height:100%;pointer-events:none}
.rch .beacon{position:absolute;z-index:5;left:50%;top:28px;width:54px;height:54px;margin-left:-27px}
.rch .btile{width:100%;height:100%;border-radius:16px;background:var(--route);display:grid;place-items:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 0 0 5px rgba(253,253,249,.75),0 0 0 6px rgba(var(--ac),.18),0 16px 30px -12px rgba(var(--ac),.7)}
.rch .compose{position:absolute;z-index:5;left:50%;top:96px;pointer-events:none}
.rch .cen{position:absolute;left:0;top:0;transform:translateX(-50%);width:max-content}
.rch .cbox{display:flex;align-items:center;gap:8px;height:30px;padding:0 12px 0 5px;border-radius:999px;background:rgba(253,253,249,.95);border:1px solid #D6DCC8;box-shadow:0 12px 26px -12px rgba(30,43,34,.35);font-size:12px;color:var(--ink);white-space:nowrap;transform:scale(0);transform-origin:50% 0}
.rch .cbox .lab{height:20px;padding:0 8px;border-radius:999px;background:var(--tint);color:var(--route2);font:500 10.5px/20px "JetBrains Mono",ui-monospace,monospace}
.rch .caret{width:1.5px;height:13px;margin-left:-5px;background:var(--route);animation:rch-blink 1s steps(1) infinite}
@keyframes rch-blink{50%{opacity:0}}
.rch .crowd{position:absolute;z-index:2;left:0;right:0;top:170px;bottom:0;pointer-events:none}
.rch .pw{position:absolute;left:0}
.rch .pe{width:100%;height:100%;will-change:transform;transform-origin:50% 88%}
.rch .hp{position:relative;width:100%;height:100%}
.rch .pw img{display:block;width:100%;height:100%;transition:filter .45s,transform .5s cubic-bezier(.3,1.6,.5,1)}
.rch .ok{position:absolute;left:64%;top:8%;width:20px;height:20px;border-radius:50%;background:var(--route);box-shadow:0 0 0 2px #FDFDF9,0 6px 12px -4px rgba(var(--ac),.6);display:grid;place-items:center;transform:scale(0);transition:transform .45s cubic-bezier(.3,1.7,.5,1)}
.rch .ok svg{width:11px;height:11px}
.rch .pw.done .ok{transform:scale(1)}
.rch .tip{position:absolute;z-index:4;left:0;top:0;pointer-events:none;will-change:transform}
.rch .tip .cen{top:auto;bottom:0}
.rch .tbox{position:relative;display:flex;align-items:center;gap:7px;height:32px;padding:0 11px 0 6px;border-radius:10px;background:var(--panel);border:1px solid #D6DCC8;box-shadow:0 14px 32px -14px rgba(30,43,34,.38),0 2px 6px -2px rgba(30,43,34,.1);font-size:12px;font-weight:600;color:var(--ink);white-space:nowrap;transform:scale(0);transform-origin:50% 100%}
.rch .tbox::after{content:"";position:absolute;left:50%;bottom:-5px;width:8px;height:8px;margin-left:-4px;background:var(--panel);border-right:1px solid #D6DCC8;border-bottom:1px solid #D6DCC8;transform:rotate(45deg)}
.rch .tbox.reply{font-weight:500}
.rch .tg{display:inline-flex;align-items:center;height:20px;padding:0 6px;border-radius:6px;font-size:11px;font-weight:600}
.rch .tg.caution{color:#7a5a12;background:#fbf3db}
.rch .tg.route{color:#2D6A45;background:#EDF3EE}
.rch .tg.plain{color:#5E6B60;background:#efefed}
@media (prefers-reduced-motion:reduce){.rch *{animation:none!important;transition:none!important}}
`;

export interface ColdEmailCrowdHeroProps {
  data?: Reach[];
  className?: string;
}

export function ColdEmailCrowdHero({
  data = DEFAULT_DATA,
  className = "",
}: ColdEmailCrowdHeroProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const $ = (s: string) => root.querySelector(s) as HTMLElement;
    const frozen =
      !!navigator.webdriver || matchMedia("(prefers-reduced-motion: reduce)").matches;
    const A: typeof animate | null = frozen ? null : animate;

    let seed = frozen ? 11 : (Math.random() * 1e9) | 0;
    const rnd = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const ease = (k: number) =>
      k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;

    const fx = $(".fx") as HTMLCanvasElement;
    const g = fx.getContext("2d")!;
    const dpr = Math.min(devicePixelRatio || 1, 2);

    let W = root.clientWidth || 560;
    let H = root.clientHeight || 420;
    const TOP = 170;
    let BH = Math.max(200, H - TOP);
    const BY = 55;

    const size = () => {
      W = root.clientWidth || 560;
      H = root.clientHeight || 420;
      BH = Math.max(200, H - TOP);
      fx.width = W * dpr;
      fx.height = H * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(root);

    const AC = getComputedStyle(root).getPropertyValue("--ac").trim() || "45,106,69";
    const COL = `rgb(${AC})`;
    const al = (o: number) => `rgba(${AC},${o})`;

    const crowd = $(".crowd");
    const P: any[] = [];
    crowd.innerHTML = "";
    const fade = (p: any) =>
      `blur(${Math.max(0, (74 - p.t) * 0.04).toFixed(2)}px) contrast(${(
        0.4 +
        0.32 * p.depth
      ).toFixed(2)}) brightness(${(1 / (0.72 + 0.14 * p.depth)).toFixed(2)})`;

    function place(p: any, anywhere: boolean) {
      p.t = 32 + rnd() * 52;
      p.depth = (p.t - 32) / 52;
      p.w = 96 + (p.t - 32) * 1.45;
      p.h = p.w * 1.32;
      p.dir = rnd() < 0.5 ? 1 : -1;
      p.speed = 92 / (12 + rnd() * 24);
      p.x = anywhere ? -4 + rnd() * 108 : p.dir > 0 ? -12 : 112;
      p.v = 1;
      p.state = "walk";
      p.reached = false;
      p.ph = rnd() * 6.283;
      p.f = 1.5 + p.speed * 0.22;
      p.bob = 0;
      p.px = (p.x / 100) * W;
      p.el.className = "pw";
      p.el.style.cssText = `top:${p.t.toFixed(2)}%;width:${p.w.toFixed(1)}px;height:${p.h.toFixed(1)}px;z-index:${p.t | 0}`;
      p.img.src = PEEPS[(rnd() * PEEPS.length) | 0];
      p.img.style.filter = fade(p);
      p.img.style.transform = `scaleX(${p.dir})`;
    }

    const totalPeeps = 24;
    for (let i = 0; i < totalPeeps; i++) {
      const el = document.createElement("div");
      el.innerHTML =
        '<div class="pe"><div class="hp"><img alt="" draggable="false" decoding="async"><i class="ok"><svg viewBox="0 0 24 24"><path fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5l4.5 4.5L19 7.5"/></svg></i></div></div>';
      crowd.appendChild(el);
      const p = {
        el,
        pe: el.firstChild as HTMLElement,
        hp: el.firstChild!.firstChild as HTMLElement,
        img: el.querySelector("img")!,
      };
      place(p, true);
      P.push(p);
    }

    const head = (p: any) => [
      p.px,
      TOP + (BH * p.t) / 100 - p.h / 2 + p.h * 0.3 + p.bob,
    ];

    const S: any[] = [0, 1].map(() => {
      const tip = document.createElement("div");
      tip.className = "tip";
      tip.innerHTML = '<div class="cen"><div class="tbox"></div></div>';
      root.appendChild(tip);
      return { tip, box: tip.querySelector(".tbox"), p: null };
    });

    const btile = $(".btile");
    const cbox = $(".cbox");
    const clab = $(".cbox .lab");
    const ctxt = $(".cbox .txt");
    let comp: any = null;

    const pop = (el: HTMLElement, on: boolean) => {
      if (A) {
        A(
          el,
          { scale: on ? [0, 1] : [1, 0], opacity: on ? [0, 1] : [1, 0] },
          on
            ? { type: "spring", stiffness: 420, damping: 22 }
            : { duration: 0.2 }
        );
      } else {
        el.style.transform = `scale(${on ? 1 : 0})`;
        el.style.opacity = on ? "1" : "0";
      }
    };

    const flip = (s: any) => {
      const d = s.d;
      const set = () => {
        s.box.className = "tbox reply";
        s.box.innerHTML = `<span class="tg ${d.rc}">${d.rtag}</span>“${d.reply}”`;
      };
      if (A) {
        A(s.box, { rotateX: [0, 90] }, { duration: 0.14, ease: "easeIn" }).then(() => {
          set();
          A(s.box, { rotateX: [-90, 0] }, { type: "spring", stiffness: 480, damping: 20 });
        });
      } else {
        set();
      }
    };

    const hop = (p: any) => {
      if (A) {
        A(
          p.hp,
          { y: [0, -20, 0], scale: [1, 1.06, 1] },
          { duration: 0.6, ease: [0.3, 0, 0.3, 1] }
        );
      }
    };

    const bump = (k: number) => {
      if (A) A(btile, { scale: [1, k, 1] }, { duration: 0.45, ease: [0.3, 0, 0.2, 1] });
    };

    let side = 1;
    let di = 0;
    let nextAt = 0.5;

    function pick() {
      const act = S.filter((s) => s.p).map((s) => s.p.px);
      const cx = W / 2;
      const minSpacing = Math.min(260, W * 0.42);
      const ok = (p: any) => {
        if (p.state !== "walk" || p.reached || p.t < 46) return false;
        const f = p.px + ((p.dir * p.speed) / 100) * W * 2.2;
        return (
          p.px > W * 0.16 &&
          p.px < W * 0.84 &&
          f > W * 0.12 &&
          f < W * 0.88 &&
          Math.abs(p.px - cx) > Math.min(85, W * 0.14) &&
          act.every((a) => Math.abs(a - p.px) > minSpacing)
        );
      };
      let c = P.filter(ok);
      const pref = c.filter((p) => (p.px - cx) * side > 0);
      if (pref.length) c = pref;
      if (!c.length) return null;
      side = -side;
      return c[(rnd() * c.length) | 0];
    }

    function start(now: number) {
      const s = S.find((item) => !item.p);
      if (!s) {
        nextAt = now + 0.25;
        return;
      }
      const p = pick();
      if (!p) {
        nextAt = now + 0.3;
        return;
      }
      s.p = p;
      s.d = data[di++ % data.length];
      s.t0 = now;
      s.st = 0;
      s.ly = 0;
      nextAt = now + 2.5;
      p.state = "locked";
      p.el.style.zIndex = 200;
      p.img.style.filter = "none";
      p.img.style.transform = `scaleX(${p.dir}) scale(1.07)`;
    }

    const envelope = (x: number, y: number, rot: number, sc: number) => {
      g.save();
      g.translate(x, y);
      g.rotate(rot);
      g.scale(sc, sc);
      g.globalAlpha = 1;
      g.setLineDash([]);
      g.shadowColor = al(0.55);
      g.shadowBlur = 14;
      g.fillStyle = "#FDFDF9";
      g.strokeStyle = COL;
      g.lineWidth = 2;
      g.lineJoin = "round";
      g.beginPath();
      g.roundRect(-13, -9.5, 26, 19, 4);
      g.fill();
      g.shadowBlur = 0;
      g.stroke();
      g.beginPath();
      g.moveTo(-10.5, -6.5);
      g.lineTo(0, 2);
      g.lineTo(10.5, -6.5);
      g.stroke();
      g.restore();
    };

    function drawReach(s: any, a: number, now: number, hx: number, hy: number) {
      const p = s.p;
      const P0 = [W / 2, BY];
      const P1 = [
        (P0[0] + hx) / 2,
        Math.min(BY, hy) - (18 + Math.abs(hx - P0[0]) * 0.06),
      ];
      const B = (u: number) => {
        const v = 1 - u;
        return [
          v * v * P0[0] + 2 * v * u * P1[0] + u * u * hx,
          v * v * P0[1] + 2 * v * u * P1[1] + u * u * hy,
        ];
      };
      const seg = (u0: number, u1: number, n: number) => {
        g.beginPath();
        for (let i = 0; i <= n; i++) {
          const q = B(u0 + ((u1 - u0) * i) / n);
          i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]);
        }
        g.stroke();
      };

      g.strokeStyle = COL;
      g.lineCap = "round";

      if (a < 3.75) {
        const R = p.w * 0.27;
        const k = Math.min(1, a / 0.5);
        const e = 1 - Math.pow(1 - k, 3);
        g.save();
        g.translate(hx, hy);
        g.rotate(now * 1.2);
        g.globalAlpha = 0.9 * k;
        g.lineWidth = 2;
        g.setLineDash([R * 0.5, R * 0.285]);
        g.beginPath();
        g.arc(0, 0, R * (2.2 - 1.2 * e), 0, 6.2832);
        g.stroke();
        g.restore();
      }

      if (a < 6.2) {
        g.save();
        g.lineWidth = 1.2;
        if (a < 3.75) {
          g.globalAlpha = 0.55;
          g.setLineDash([3, 6]);
          g.lineDashOffset = -now * 24;
          seg(0, Math.min(1, a / 0.6), 26);
        } else {
          g.globalAlpha = 0.35 * Math.min(1, (6.2 - a) / 0.4);
          seg(0, 1, 26);
        }
        g.restore();
      }

      if (a >= 2.9 && a < 3.75) {
        const u = ease((a - 2.9) / 0.85);
        g.save();
        g.shadowColor = al(0.8);
        g.shadowBlur = 12;
        for (let i = 0; i < 12; i++) {
          const u1 = u - (0.44 * i) / 12;
          const u0 = u - (0.44 * (i + 1)) / 12;
          if (u1 <= 0) break;
          const f = 1 - i / 12;
          g.globalAlpha = f * 0.22;
          g.lineWidth = 14 * f;
          seg(Math.max(0, u0), u1, 3);
          g.globalAlpha = f * 0.95;
          g.lineWidth = 5 * f + 1;
          seg(Math.max(0, u0), u1, 3);
        }
        g.restore();
        const q = B(u);
        const q2 = B(Math.min(1, u + 0.02));
        const dx = q2[0] - q[0];
        envelope(
          q[0],
          q[1],
          Math.atan2(q2[1] - q[1], Math.abs(dx) || 1e-6) *
            (dx >= 0 ? 1 : -1) *
            0.55,
          Math.min(1, (a - 2.9) / 0.15)
        );
      }

      if (a >= 3.75 && a < 4.4) {
        const k = (a - 3.75) / 0.65;
        const e = 1 - Math.pow(1 - k, 3);
        g.save();
        g.globalAlpha = 1 - k;
        g.lineWidth = 2.2;
        g.beginPath();
        g.arc(hx, hy, p.w * 0.2 + e * p.w * 0.32, 0, 6.2832);
        g.stroke();
        g.lineWidth = 1.8;
        for (let i = 0; i < 10; i++) {
          const an = (i / 10) * 6.2832 + s.t0;
          const r0 = p.w * 0.3 + e * p.w * 0.22;
          const r1 = r0 + 10 * (1 - k);
          g.beginPath();
          g.moveTo(hx + Math.cos(an) * r0, hy + Math.sin(an) * r0);
          g.lineTo(hx + Math.cos(an) * r1, hy + Math.sin(an) * r1);
          g.stroke();
        }
        g.restore();
      }

      if (a >= 5.3 && a < 6) {
        const u = 1 - ease((a - 5.3) / 0.7);
        g.save();
        for (let i = 0; i < 8; i++) {
          const u0 = u + (0.22 * i) / 8;
          const u1 = u + (0.22 * (i + 1)) / 8;
          if (u0 >= 1) break;
          g.globalAlpha = (1 - i / 8) * 0.7;
          g.lineWidth = 3 * (1 - i / 10);
          seg(u0, Math.min(1, u1), 3);
        }
        const q = B(u);
        g.globalAlpha = 1;
        g.shadowColor = al(0.8);
        g.shadowBlur = 12;
        g.fillStyle = COL;
        g.beginPath();
        g.arc(q[0], q[1], 5.5, 0, 6.2832);
        g.fill();
        g.shadowBlur = 0;
        g.fillStyle = "#FDFDF9";
        g.beginPath();
        g.arc(q[0], q[1], 2.2, 0, 6.2832);
        g.fill();
        g.restore();
      }
    }

    let mx = 0;
    let tmx = 0;
    const onMove = (e: PointerEvent) => {
      tmx = (e.clientX - root.getBoundingClientRect().left) / W - 0.5;
    };
    window.addEventListener("pointermove", onMove);

    function tick(now: number, dt: number, draw: boolean) {
      mx += (tmx - mx) * Math.min(1, dt * 4);
      for (const p of P) {
        const tv = p.state === "walk" ? 1 : p.state === "locked" ? 0.45 : 0;
        p.v += (tv - p.v) * Math.min(1, dt * 5);
        p.x += p.dir * p.speed * p.v * dt;
        if ((p.x > 113 || p.x < -13) && p.state === "walk") place(p, false);
        const s = Math.sin(now * Math.PI * p.f + p.ph);
        p.bob = -Math.abs(s) * (1.2 + 2 * p.depth) * p.v;
        p.px = (p.x / 100) * W - mx * p.depth * W * 0.02;
        if (draw) {
          p.pe.style.transform = `translate3d(${(p.px - p.w / 2).toFixed(1)}px,${(-p.h / 2 + p.bob).toFixed(1)}px,0) rotate(${(s * 0.7 * p.v).toFixed(2)}deg)`;
        }
      }

      if (now >= nextAt) start(now);
      if (draw) g.clearRect(0, 0, W, H);

      for (const s of S) {
        if (!s.p) continue;
        const a = now - s.t0;
        const p = s.p;
        const d = s.d;
        if (s.st < 1 && a >= 0.9) {
          s.st = 1;
          s.box.className = "tbox";
          s.box.innerHTML = `<span class="tg ${d.tc}">${d.tag}</span>${d.signal}`;
          pop(s.box, true);
        }
        if (s.st < 2 && a >= 1.8) {
          s.st = 2;
          comp = { d, t0: now, n: -1 };
          clab.textContent = d.lab;
          ctxt.textContent = "";
          pop(cbox, true);
        }
        if (s.st < 3 && a >= 2.9) {
          s.st = 3;
          if (comp && comp.d === d) {
            pop(cbox, false);
            comp = null;
          }
          bump(1.14);
        }
        if (s.st < 4 && a >= 3.75) {
          s.st = 4;
          p.state = "read";
          p.reached = true;
          p.img.style.filter = `drop-shadow(0 0 12px ${al(0.6)})`;
          hop(p);
        }
        if (s.st < 5 && a >= 4.45) {
          s.st = 5;
          flip(s);
        }
        if (s.st < 6 && a >= 6) {
          s.st = 6;
          bump(1.1);
          p.el.classList.add("done");
        }
        if (s.st < 7 && a >= 6.7) {
          s.st = 7;
          pop(s.box, false);
          p.state = "walk";
          p.el.style.zIndex = p.t | 0;
          p.img.style.transform = `scaleX(${p.dir})`;
          p.img.style.filter = `drop-shadow(0 0 8px ${al(0.42)})`;
        }
        if (a >= 7.1) {
          s.p = null;
          continue;
        }
        if (draw) {
          const [hx, hy] = head(p);
          s.hx = hx;
          s.ty = Math.max(120, hy - p.h * 0.22 - 10);
          let lift = 0;
          for (const o of S) {
            if (
              o !== s &&
              o.p &&
              o.t0 < s.t0 &&
              Math.abs(o.hx - hx) < 280 &&
              Math.abs(o.ty - s.ty) < 42
            ) {
              lift = -40;
            }
          }
          s.ly += (lift - s.ly) * Math.min(1, dt * 8);
          const clampedX = Math.max(115, Math.min(W - 115, hx));
          s.tip.style.transform = `translate(${clampedX.toFixed(1)}px,${(s.ty + s.ly).toFixed(1)}px)`;
          drawReach(s, a, now, hx, hy);
        }
      }

      if (comp) {
        const L = comp.d.line;
        const n = Math.ceil(Math.min(1, (now - comp.t0) / 0.8) * L.length);
        if (n !== comp.n) {
          comp.n = n;
          ctxt.textContent = L.slice(0, n);
        }
      }
    }

    let raf = 0;
    if (frozen) {
      let i = 0;
      for (; i < 1500; i++) {
        tick(i / 60, 1 / 60, false);
        if (
          i > 420 &&
          S.some((s) => s.p && i / 60 - s.t0 > 3.32 && i / 60 - s.t0 < 3.4)
        ) {
          break;
        }
      }
      tick(i / 60, 0, true);
    } else {
      animate(
        btile,
        { scale: [0, 1] },
        { type: "spring", stiffness: 300, damping: 16, delay: 0.2 }
      );
      animate(crowd, { opacity: [0, 1] }, { duration: 0.7 });
      let last = performance.now();
      let now = 0;
      const loop = (ms: number) => {
        const dt = Math.min(0.25, Math.max(0, (ms - last) / 1000));
        last = ms;
        now += dt;
        tick(now, dt, true);
        raf = requestAnimationFrame(loop);
      };
      loop(last);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      S.forEach((s) => s.tip.remove());
      crowd.innerHTML = "";
    };
  }, [data]);

  return (
    <div ref={ref} className={`rch ${className}`}>
      <style>{CSS}</style>
      <div className="bg" aria-hidden="true">
        <i className="b1" />
        <i className="b2" />
        <i className="b3" />
        <i className="b4" />
        <div className="dome" />
        <svg className="grain">
          <filter id="rch-n">
            <feTurbulence
              type="fractalNoise"
              baseFrequency=".8"
              numOctaves={2}
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#rch-n)" />
        </svg>
      </div>

      <div className="crowd" aria-hidden="true" />
      <canvas className="fx" aria-hidden="true" />

      {/* Comprove FAQ Beacon */}
      <div className="beacon" aria-hidden="true">
        <div className="btile">
          <svg
            viewBox="0 0 24 24"
            width="26"
            height="26"
            fill="none"
            stroke="#F9FAF5"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M9.5 9.2a2.5 2.5 0 0 1 4.9.8c0 1.6-2.4 2-2.4 3.2" />
            <circle cx="12" cy="16" r="0.6" fill="#F9FAF5" />
          </svg>
        </div>
      </div>

      <div className="compose" aria-hidden="true">
        <div className="cen">
          <div className="cbox">
            <span className="lab" />
            <span className="txt" />
            <i className="caret" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ColdEmailCrowdHero;
