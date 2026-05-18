import { useState, useRef, useEffect } from "react";

const LOADING_MESSAGES = [
  "Prompthony está haciendo su magia...",
  "Prompthony is Prompthonying...",
  "Prompthony traduce tu genialidad...",
  "Prompthony está en flow creativo...",
  "Prompthony pinta con pixeles...",
  "Prompthony está conectando neuronas...",
  "Prompthony went prompt-mode...",
  "Prompthony está bailando con tus palabras...",
];

const NAVY   = "#1B2167";
const CREAM  = "#F5EDD6";
const RED    = "#C0392B";
const GOLD   = "#D4A843";
const MUTED  = "#8B9AC0";
const CARD   = "#242B78";
const BORDER = "#2E3888";

const PLATFORMS = [
  { id: "veo",        name: "Veo",         version: "3.1",    emoji: "🧬", color: "#5B8FFF", category: "video" },
  { id: "kling",      name: "Kling",       version: "3.0",    emoji: "🌀", color: "#A78BFA", category: "video" },
  { id: "seedance",   name: "Seedance",    version: "2.0",    emoji: "🌱", color: "#34D399", category: "video" },
  { id: "higgsfield", name: "Higgsfield",  version: "Latest", emoji: "🎬", color: "#22D3EE", category: "video" },
  { id: "midjourney", name: "Midjourney",  version: "8.1",    emoji: "🎨", color: "#FB923C", category: "image" },
  { id: "nanobanana", name: "Nano Banana", version: "Pro",    emoji: "🍌", color: "#A3E635", category: "image" },
];

const ASPECT_RATIOS = [
  { id: "16:9",  label: "16:9",  desc: "Widescreen / Landscape" },
  { id: "9:16",  label: "9:16",  desc: "Vertical / Reels" },
  { id: "1:1",   label: "1:1",   desc: "Square" },
  { id: "4:3",   label: "4:3",   desc: "Classic TV" },
  { id: "3:4",   label: "3:4",   desc: "Portrait" },
  { id: "21:9",  label: "21:9",  desc: "Ultrawide / Cinematic" },
  { id: "2:3",   label: "2:3",   desc: "Portrait / Print" },
  { id: "4:5",   label: "4:5",   desc: "Instagram Portrait" },
];

const INSTRUCTIONS = {
  veo: `You are a Google Veo 3.1 expert prompt engineer.
VEO 3.1 BEST PRACTICES (2026):
- Natural descriptive sentences, 100-150 words
- Structure: Shot type + Subject + Action + Environment + Camera + Mood/lighting + Audio cues
- Native audio: ambient noise, dialogue in quotes, SFX
- Specify real light sources and texture details
- If a reference image is provided, analyze its composition, mood, lighting, color palette, and key visual elements, then incorporate them naturally into the prompt.
- OUTPUT ONLY THE PROMPT. No explanation, no preamble.`,
  kling: `You are a Kling AI 3.0 expert prompt engineer.
KLING 3.0 BEST PRACTICES (2026):
- Structure: Scene → Characters → Action → Camera → Audio & Style
- Multi-shot support: label Shot 1:, Cut to:, Shot 2:
- Anchor characters early with full description
- Native audio with emotional speaker labels
- 150-250 words max
- If a reference image is provided, analyze its composition, mood, lighting, color palette, and key visual elements, then incorporate them naturally into the prompt.
- OUTPUT ONLY THE PROMPT. No explanation, no preamble.`,
  seedance: `You are a Seedance 2.0 expert prompt engineer.
SEEDANCE 2.0 BEST PRACTICES (2026):
- Structure: Camera → Subject → Action → Environment → Lighting → Style → Sound → Motion
- SEPARATE camera movement from subject movement
- Name specific cameras: Sony Venice, ARRI Alexa, anamorphic lens
- Native audio, real light sources always
- If a reference image is provided, analyze its composition, mood, lighting, color palette, and key visual elements, then incorporate them naturally into the prompt.
- OUTPUT ONLY THE PROMPT. No explanation, no preamble.`,
  higgsfield: `You are a Higgsfield AI expert prompt engineer.
HIGGSFIELD BEST PRACTICES (2026):
- Character consistency and emotionally driven cinematic human motion
- Structure: Character + Action + Environment + Camera + Mood + Audio
- Specific movement verbs, emotional direction, practical light sources
- If a reference image is provided, analyze its composition, mood, lighting, color palette, and key visual elements, then incorporate them naturally into the prompt.
- OUTPUT ONLY THE PROMPT. No explanation, no preamble.`,
  midjourney: `You are a Midjourney v8.1 expert prompt engineer.
MIDJOURNEY 8.1 BEST PRACTICES (2026):
- Natural language sentences, front-load key elements
- Subject + Environment + Mood + Lighting + Camera/lens + Style + Color palette
- Parameters at END: --ar [ratio], --v 8.1, --hd, --style raw, --s 0-1000
- If a reference image is provided, analyze its composition, mood, lighting, color palette, and key visual elements, then incorporate them naturally into the prompt.
- OUTPUT ONLY THE PROMPT AND PARAMETERS. No explanation, no preamble.`,
  nanobanana: `You are a Nano Banana Pro (Gemini 2.5 Flash Image) expert prompt engineer.
NANO BANANA PRO BEST PRACTICES (2026):
- Narrative paragraph, not keyword list
- Photographic language: shot type, lens, lighting, fine details
- Excels at text rendering, character consistency
- No parameter flags — natural language only
- If a reference image is provided, analyze its composition, mood, lighting, color palette, and key visual elements, then incorporate them naturally into the prompt.
- OUTPUT ONLY THE PROMPT. No explanation, no preamble.`,
};

const buildSystem = (platformId, isMulti) => {
  const base = INSTRUCTIONS[platformId];
  if (isMulti) {
    return base + `\n\nFor each variation, format EXACTLY like this:\nSUMMARY: [3-6 words, punchy and catchy — like a movie tagline or a song title. NOT a full sentence. Examples: "Neon noir on wet asphalt", "Golden hour reverie", "Brutalist intimacy", "The slow exhale"]\nPROMPT:\n[the full prompt]\n---END---`;
  }
  return base + `\n\nFormat your response EXACTLY like this:\nSUMMARY: [3-6 words, punchy and catchy — like a movie tagline or a song title. NOT a full sentence. Examples: "Neon noir on wet asphalt", "Golden hour reverie", "Brutalist intimacy", "The slow exhale"]\nPROMPT:\n[the full prompt]`;
};

const parseResult = (text) => {
  const summaryMatch = text.match(/SUMMARY:\s*(.+)/i);
  const promptMatch  = text.match(/PROMPT:\s*([\s\S]+)/i);
  return {
    summary: summaryMatch?.[1]?.trim() || "",
    prompt:  promptMatch?.[1]?.replace(/---END---/gi, "").trim() || text.trim(),
  };
};

const parseMultiResult = (text) => {
  const blocks = text.split(/---END---|---VARIATION---/i).map(s => s.trim()).filter(Boolean);
  return blocks.map(parseResult).filter(r => r.prompt);
};

const PixelBurst = () => (
  <div style={{ position: "absolute", top: "20px", right: "24px", display: "flex", flexWrap: "wrap", width: "48px", gap: "2px", opacity: 0.55 }}>
    {["#FF6B9D","#FFD93D","#6BCB77","#4D96FF","#C77DFF","#FF9F43","#48DBFB","#FF6B6B","#A29BFE","#FD79A8","#55EFC4","#FDCB6E"].map((c, i) => (
      <div key={i} style={{ width: i % 3 === 0 ? "8px" : "6px", height: i % 3 === 0 ? "8px" : "6px", background: c, borderRadius: "1px" }} />
    ))}
  </div>
);

export default function Prompthony() {
  const [idea, setIdea]           = useState("");
  const [platform, setPlatform]   = useState("kling");
  const [ratio, setRatio]         = useState(null);
  const [count, setCount]         = useState(1);
  const [mode, setMode]           = useState("standard");
  const [results, setResults]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [copied, setCopied]       = useState(null);
  const [error, setError]         = useState("");
  const [refImage, setRefImage]   = useState(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const fileInputRef              = useRef(null);

  // Rotate loading messages every 2.2s while loading
  useEffect(() => {
    if (!loading) return;
    setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    const interval = setInterval(() => {
      setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  const cp      = PLATFORMS.find(p => p.id === platform);
  const accent  = cp?.color || "#5B8FFF";
  const isVideo = cp?.category === "video";
  const isMulti = mode === "multishot" || count > 1;

  // Handle image upload — compress via canvas to stay under 5MB
  const handleImageUpload = (file) => {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Por favor sube un archivo de imagen (JPG, PNG, WEBP, GIF).");
      return;
    }
    const mediaType = "image/jpeg";
    const reader = new FileReader();
    reader.onerror = () => setError("No se pudo leer el archivo. Intenta con otra imagen.");
    reader.onload = (ev) => {
      const dataUrlOriginal = ev.target.result;
      const img = new Image();
      img.onerror = () => setError("No se pudo decodificar la imagen. Intenta con otro formato (JPG o PNG).");
      img.onload = () => {
        try {
          const MAX = 1024;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
            else { width = Math.round(width * MAX / height); height = MAX; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          let quality = 0.8;
          let dataUrl = canvas.toDataURL(mediaType, quality);
          while (dataUrl.length * 0.75 > 1 * 1024 * 1024 && quality > 0.3) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL(mediaType, quality);
          }
          const base64 = dataUrl.split(",")[1];
          setRefImage({ base64, mediaType, preview: dataUrl });
        } catch (err) {
          setError(`Error procesando la imagen: ${err.message}`);
        }
      };
      img.src = dataUrlOriginal;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleImageUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const buildMessages = (userMsg) => {
    if (refImage) {
      return [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: refImage.mediaType, data: refImage.base64 },
          },
          { type: "text", text: userMsg },
        ],
      }];
    }
    return [{ role: "user", content: userMsg }];
  };

  const generate = async () => {
    if (!idea.trim() || loading) return;
    setLoading(true);
    setResults([]);
    setError("");
    setCopied(null);

    const ratioLine  = ratio ? `Aspect ratio: ${ratio}` : "";
    const imageLine  = refImage ? "A reference image has been provided. Analyze its visual qualities and incorporate them into the prompt." : "";

    let userMsg = "";
    if (mode === "multishot") {
      userMsg = `Idea (Spanish/Spanglish): "${idea}"
Platform: ${cp.name} ${cp.version}
${ratioLine}
${imageLine}

Generate 5 prompt variations, each using a DIFFERENT cinematically interesting camera shot/angle. Choose the 5 most compelling shots for this idea.

For each, follow this format exactly:
SUMMARY: [one evocative sentence describing the angle/approach/mood]
PROMPT:
[the full prompt]
---END---

OUTPUT ONLY THE FORMATTED BLOCKS. No extra text.`;
    } else {
      const countLine = count === 1
        ? `Generate ONE optimized prompt.`
        : `Generate ${count} DIFFERENT prompt variations, each with a distinct approach, angle, or mood.\n\nFor each:\nSUMMARY: [one evocative sentence]\nPROMPT:\n[full prompt]\n---END---`;

      userMsg = `Idea (Spanish/Spanglish): "${idea}"
Platform: ${cp.name} ${cp.version}
${ratioLine}
${imageLine}
${countLine}

OUTPUT ONLY THE FORMATTED RESPONSE. No extra text.`;
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: count === 10 ? 8000 : (count >= 5 || mode === "multishot") ? 4000 : 1200,
          system: buildSystem(platform, isMulti),
          messages: buildMessages(userMsg),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      const text = (data.content || []).map(b => b.text || "").join("").trim();
      if (!text) throw new Error("Respuesta vacía");

      if (isMulti) {
        const parsed = parseMultiResult(text);
        setResults(parsed.length ? parsed : [{ summary: "", prompt: text }]);
      } else {
        setResults([parseResult(text)]);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const platformBtn = (p) => {
    const active = platform === p.id;
    return (
      <button key={p.id} onClick={() => setPlatform(p.id)} style={{
        padding: "8px 16px", borderRadius: "6px", cursor: "pointer",
        border: `1.5px solid ${active ? p.color : BORDER}`,
        background: active ? `${p.color}22` : CARD,
        color: active ? p.color : MUTED,
        fontFamily: "'Courier New', monospace", fontSize: "12px",
        fontWeight: active ? "700" : "400",
        letterSpacing: "0.03em", transition: "all 0.15s", whiteSpace: "nowrap",
      }}>
        {p.emoji} {p.name} <span style={{ opacity: 0.45, fontSize: "9px", marginLeft: "3px" }}>{p.version}</span>
      </button>
    );
  };

  const SectionLabel = ({ num, text }) => (
    <div style={{ fontSize: "9px", letterSpacing: "0.3em", color: GOLD, textTransform: "uppercase", marginBottom: "11px" }}>
      ── {num} · {text}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: NAVY, color: CREAM, fontFamily: "'Courier New', monospace", position: "relative" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
        * { box-sizing: border-box; }
        textarea { outline: none; }
        textarea::placeholder { color: #3D4E8A; }
        button { cursor: pointer; }
        button:hover:not(:disabled) { filter: brightness(1.15); }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background: ${NAVY}; }
        ::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius:2px; }
      `}</style>

      {/* Grain */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:0, opacity:0.04,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      <div style={{ position:"relative", zIndex:1, maxWidth:"820px", margin:"0 auto", padding:"48px 24px 80px" }}>

        {/* HEADER */}
        <div style={{ marginBottom:"44px", position:"relative" }}>
          {/* Logo character — top right corner */}
          <img
            src="/logo.png"
            alt="Prompthony"
            style={{
              position:"absolute",
              top:"-12px",
              right:"-8px",
              width:"96px",
              height:"auto",
              userSelect:"none",
              pointerEvents:"none",
            }}
          />

          <h1 style={{
            fontFamily:"'Fredoka', 'Baloo 2', sans-serif",
            fontSize:"clamp(56px, 11vw, 96px)",
            fontWeight:"700",
            margin:"0 0 4px",
            lineHeight:"0.95",
            letterSpacing:"-0.02em",
            color:"#3B7CD9",
            textShadow:"0 2px 0 rgba(0,0,0,0.15)",
          }}>
            Prompthony
            <span style={{
              fontSize:"0.22em",
              color:"#3B7CD9",
              marginLeft:"4px",
              verticalAlign:"super",
              fontFamily:"sans-serif",
              fontWeight:"400",
              opacity:0.7,
            }}>®</span>
          </h1>
          <p style={{
            color:CREAM,
            fontSize:"14px",
            margin:"12px 0 4px",
            fontFamily:"'Fredoka', 'Baloo 2', sans-serif",
            fontWeight:"400",
            lineHeight:"1.5",
            maxWidth:"480px",
          }}>
            Tira tu idea en español o spanglish — recibe el prompt perfecto en inglés pa' la plataforma que escojas.
          </p>
          <div style={{
            fontSize:"11px",
            letterSpacing:"0.15em",
            color:MUTED,
            textTransform:"uppercase",
            marginTop:"18px",
            fontFamily:"sans-serif",
          }}>
            Traído a ustedes por{" "}
            <a
              href="https://instagram.com/juanpipr"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color:GOLD, textDecoration:"none", fontWeight:"600" }}
            >
              @juanpipr
            </a>
          </div>
        </div>

        <div style={{ height:"1px", background:`linear-gradient(90deg, ${GOLD}44, ${BORDER}, transparent)`, marginBottom:"36px" }} />

        {/* 01 — IDEA */}
        <div style={{ marginBottom:"28px" }}>
          <SectionLabel num="01" text="Tu idea" />
          <textarea
            value={idea}
            onChange={e => setIdea(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && e.metaKey) generate(); }}
            placeholder={isVideo
              ? "Ej: Una mujer afroboricua caminando por el Viejo San Juan de noche, lluvia, luces de neón, vibra noir..."
              : "Ej: Un cartel retro de banda tropical, estilo serigrafía boricua de los 70s, fondo negro, tipografía cursiva..."}
            style={{
              width:"100%", minHeight:"120px", background:CARD,
              border:`1.5px solid ${idea.trim() ? `${accent}80` : BORDER}`,
              color:CREAM, padding:"18px", fontSize:"14px",
              fontFamily:"'Courier New', monospace", resize:"vertical",
              borderRadius:"8px", lineHeight:"1.75", transition:"border-color 0.2s",
            }}
          />
          <div style={{ fontSize:"9px", color:BORDER, textAlign:"right", marginTop:"5px", letterSpacing:"0.1em" }}>
            ⌘ + ENTER PARA GENERAR
          </div>
        </div>

        {/* 02 — REFERENCE IMAGE (optional) */}
        <div style={{ marginBottom:"28px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"11px" }}>
            <SectionLabel num="02" text="Imagen de referencia" />
            <span style={{ fontSize:"9px", color:MUTED, background:`${BORDER}88`, padding:"2px 8px", borderRadius:"10px", marginBottom:"11px" }}>
              opcional
            </span>
            {refImage && (
              <button onClick={() => setRefImage(null)} style={{ fontSize:"9px", color:MUTED, background:"transparent", border:"none", padding:"0", textDecoration:"underline", marginBottom:"11px" }}>
                eliminar
              </button>
            )}
          </div>

          {!refImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border:`2px dashed ${BORDER}`, borderRadius:"8px",
                padding:"32px", textAlign:"center", cursor:"pointer",
                background:`${CARD}88`, transition:"all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = `${accent}10`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = `${CARD}88`; }}
            >
              <div style={{ fontSize:"28px", marginBottom:"8px" }}>🖼️</div>
              <div style={{ fontSize:"13px", color:CREAM, fontFamily:"sans-serif", lineHeight:"1.6", fontWeight:"600" }}>
                Click aquí pa' subir una imagen de referencia
              </div>
              <div style={{ fontSize:"10px", color:`${MUTED}99`, marginTop:"6px", fontFamily:"sans-serif" }}>
                JPG, PNG, WEBP · Claude analizará composición, mood y paleta
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", gap:"16px", alignItems:"flex-start" }}>
              <div style={{ position:"relative", flexShrink:0 }}>
                <img
                  src={refImage.preview}
                  alt="Referencia"
                  style={{ width:"120px", height:"120px", objectFit:"cover", borderRadius:"8px", border:`1.5px solid ${accent}60` }}
                />
                <button
                  onClick={() => setRefImage(null)}
                  style={{
                    position:"absolute", top:"-8px", right:"-8px",
                    width:"22px", height:"22px", borderRadius:"50%",
                    background:RED, border:"none", color:"white",
                    fontSize:"12px", display:"flex", alignItems:"center", justifyContent:"center",
                    cursor:"pointer", fontWeight:"bold",
                  }}
                >×</button>
              </div>
              <div style={{ paddingTop:"8px" }}>
                <div style={{ fontSize:"12px", color:accent, marginBottom:"6px", fontFamily:"sans-serif" }}>
                  ✓ Imagen cargada
                </div>
                <div style={{ fontSize:"11px", color:MUTED, fontFamily:"sans-serif", lineHeight:"1.6" }}>
                  Claude va a analizar la composición, mood, iluminación y paleta de colores, e incorporar esos elementos al prompt generado.
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ marginTop:"10px", fontSize:"10px", color:MUTED, background:"transparent", border:`1px solid ${BORDER}`, padding:"4px 10px", borderRadius:"4px", fontFamily:"'Courier New', monospace", letterSpacing:"0.08em" }}
                >
                  cambiar imagen
                </button>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            style={{ position:"absolute", left:"-9999px", opacity:0, pointerEvents:"none", width:"1px", height:"1px" }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
              e.target.value = ""; // Reset so same file can be re-uploaded
            }}
          />
        </div>

        {/* 03 — PLATFORM */}
        <div style={{ marginBottom:"28px" }}>
          <SectionLabel num="03" text="Plataforma" />
          <div style={{ marginBottom:"10px" }}>
            <div style={{ fontSize:"10px", color:MUTED, marginBottom:"7px", letterSpacing:"0.1em" }}>Video</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
              {PLATFORMS.filter(p => p.category === "video").map(platformBtn)}
            </div>
          </div>
          <div>
            <div style={{ fontSize:"10px", color:MUTED, marginBottom:"7px", letterSpacing:"0.1em" }}>Imagen fija</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
              {PLATFORMS.filter(p => p.category === "image").map(platformBtn)}
            </div>
          </div>
        </div>

        {/* 04 — ASPECT RATIO (optional) */}
        <div style={{ marginBottom:"28px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"11px" }}>
            <SectionLabel num="04" text="Aspect ratio" />
            <span style={{ fontSize:"9px", color:MUTED, background:`${BORDER}88`, padding:"2px 8px", borderRadius:"10px", marginBottom:"11px" }}>
              opcional
            </span>
            {ratio && (
              <button onClick={() => setRatio(null)} style={{ fontSize:"9px", color:MUTED, background:"transparent", border:"none", padding:"0", textDecoration:"underline", marginBottom:"11px" }}>
                limpiar
              </button>
            )}
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"7px" }}>
            {ASPECT_RATIOS.map(r => {
              const active = ratio === r.id;
              return (
                <button key={r.id} onClick={() => setRatio(ratio === r.id ? null : r.id)} title={r.desc} style={{
                  padding:"7px 14px", borderRadius:"6px",
                  border:`1.5px solid ${active ? accent : BORDER}`,
                  background: active ? `${accent}20` : CARD,
                  color: active ? accent : MUTED,
                  fontFamily:"'Courier New', monospace", fontSize:"11px",
                  fontWeight: active ? "700" : "400",
                  letterSpacing:"0.05em", transition:"all 0.15s",
                }}>
                  {r.label}
                  <span style={{ fontSize:"9px", opacity:0.5, marginLeft:"5px" }}>{r.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 05 — MODE */}
        <div style={{ marginBottom:"32px" }}>
          <SectionLabel num="05" text="Cantidad de prompts" />
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            {[
              { val:1,  label:"1 Prompt",      desc:"Un prompt optimizado" },
              { val:5,  label:"5 Variaciones",  desc:"Pa' tener opciones"  },
              { val:10, label:"10 Variaciones", desc:"Full batería"         },
            ].map(m => {
              const active = mode === "standard" && count === m.val;
              return (
                <button key={m.val} onClick={() => { setMode("standard"); setCount(m.val); }} style={{
                  flex:"1 1 auto", minWidth:"90px", padding:"11px 10px", borderRadius:"6px",
                  border:`1.5px solid ${active ? accent : BORDER}`,
                  background: active ? `${accent}20` : CARD,
                  color: active ? accent : MUTED,
                  fontFamily:"'Courier New', monospace", fontSize:"11px",
                  fontWeight: active ? "700" : "400",
                  transition:"all 0.15s", textAlign:"center",
                }}>
                  <div>{m.label}</div>
                  <div style={{ fontSize:"9px", color: active ? `${accent}BB` : `${MUTED}88`, marginTop:"3px" }}>{m.desc}</div>
                </button>
              );
            })}
            {isVideo && (() => {
              const active = mode === "multishot";
              return (
                <button onClick={() => { setMode(active ? "standard" : "multishot"); if (active) setCount(1); }} style={{
                  flex:"1 1 auto", minWidth:"110px", padding:"11px 10px", borderRadius:"6px",
                  border:`1.5px solid ${active ? GOLD : BORDER}`,
                  background: active ? `${GOLD}20` : CARD,
                  color: active ? GOLD : MUTED,
                  fontFamily:"'Courier New', monospace", fontSize:"11px",
                  fontWeight: active ? "700" : "400",
                  transition:"all 0.15s", textAlign:"center",
                }}>
                  <div>🎥 5 Multishot</div>
                  <div style={{ fontSize:"9px", color: active ? `${GOLD}BB` : `${MUTED}88`, marginTop:"3px" }}>5 planos distintos</div>
                </button>
              );
            })()}
          </div>
          {mode === "multishot" && (
            <div style={{ marginTop:"10px", padding:"10px 14px", background:`${GOLD}12`, border:`1px solid ${GOLD}30`, borderRadius:"6px", fontSize:"11px", color:GOLD, fontFamily:"sans-serif" }}>
              🎬 Claude elige los 5 tiros más interesantes pa' tu idea y genera un prompt distinto para cada uno.
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={generate}
          disabled={loading || !idea.trim()}
          style={{
            width:"100%", padding:"18px",
            background: loading || !idea.trim() ? CARD : `linear-gradient(135deg, ${accent}, ${accent}BB)`,
            color: loading || !idea.trim() ? MUTED : "#fff",
            border:`1.5px solid ${loading || !idea.trim() ? BORDER : accent}`,
            fontSize:"12px", fontFamily:"'Courier New', monospace",
            fontWeight:"900", letterSpacing:"0.25em", textTransform:"uppercase",
            cursor: loading || !idea.trim() ? "not-allowed" : "pointer",
            borderRadius:"8px", transition:"all 0.25s", marginBottom:"32px",
            boxShadow: loading || !idea.trim() ? "none" : `0 4px 24px ${accent}40`,
          }}
        >
          {loading
            ? <span style={{ animation:"pulse 1.4s infinite", letterSpacing:"0.15em", textTransform:"none", fontFamily:"Georgia, serif", fontStyle:"italic", fontSize:"14px" }}>
                ✦ {loadingMsg}
              </span>
            : mode === "multishot"
              ? `▸ GENERAR 5 MULTISHOT — ${cp?.name.toUpperCase()}`
              : `▸ ${count > 1 ? `GENERAR ${count} VARIACIONES` : "TRADUCIR PARA"} ${cp?.name.toUpperCase()} ${cp?.version}`
          }
        </button>

        {/* ERROR */}
        {error && (
          <div style={{ padding:"13px 16px", background:`${RED}18`, border:`1px solid ${RED}44`, borderRadius:"6px", color:"#FF8080", fontSize:"12px", marginBottom:"20px", fontFamily:"sans-serif" }}>
            {error}
          </div>
        )}

        {/* RESULTS */}
        {results.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            {results.map((r, i) => {
              const key = `result-${i}`;
              return (
                <div key={i} style={{
                  background:CARD, border:`1px solid ${BORDER}`,
                  borderRadius:"10px", overflow:"hidden",
                  animation:"fadeUp 0.35s ease both",
                  animationDelay:`${i * 0.07}s`,
                }}>
                  <div style={{
                    padding:"14px 18px", borderBottom:`1px solid ${BORDER}`,
                    display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px",
                    background:`${accent}12`,
                  }}>
                    <div>
                      <div style={{ fontSize:"9px", letterSpacing:"0.22em", color:MUTED, textTransform:"uppercase", marginBottom:"5px" }}>
                        {cp?.emoji} {cp?.name} {cp?.version}
                        {ratio ? ` · ${ratio}` : ""}
                        {results.length > 1 ? ` · ${i + 1}/${results.length}` : ""}
                      </div>
                      {r.summary && (
                        <div style={{ fontSize:"15px", color:CREAM, fontFamily:"Georgia, serif", fontWeight:"700", lineHeight:"1.3", letterSpacing:"-0.01em" }}>
                          {r.summary}
                        </div>
                      )}
                    </div>
                    <button onClick={() => copy(r.prompt, key)} style={{
                      flexShrink:0, background:"transparent",
                      border:`1px solid ${copied === key ? "#34D399" : BORDER}`,
                      color: copied === key ? "#34D399" : MUTED,
                      padding:"5px 12px", fontSize:"9px",
                      fontFamily:"'Courier New', monospace",
                      cursor:"pointer", borderRadius:"4px",
                      letterSpacing:"0.1em", transition:"all 0.2s", whiteSpace:"nowrap",
                    }}>
                      {copied === key ? "✓ COPIADO" : "COPIAR"}
                    </button>
                  </div>
                  <div style={{ padding:"18px", fontSize:"13px", lineHeight:"1.9", color:"#C8D0E8", fontFamily:"'Courier New', monospace" }}>
                    {r.prompt}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FOOTER */}
        <div style={{ marginTop:"70px", paddingTop:"16px", borderTop:`1px solid ${BORDER}`, display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:"9px", color:BORDER, letterSpacing:"0.2em" }}>PROMPTHONY · JUANPI.PR</span>
          <span style={{ fontSize:"9px", color:BORDER, letterSpacing:"0.2em" }}>POWERED BY CLAUDE</span>
        </div>
      </div>
    </div>
  );
}
