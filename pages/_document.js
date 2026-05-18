import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Prompthony â€” Convierte tus ideas en prompts perfectos para AI. Veo, Kling, Seedance, Midjourney, Nano Banana y mÃ¡s." />
        <meta name="theme-color" content="#1B2167" />
        <meta property="og:title" content="Prompthony" />
        <meta property="og:description" content="Tira tu idea en espaÃ±ol. Recibe el prompt perfecto en inglÃ©s." />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />

        {/* Google Fonts â€” Fredoka (matches the logo's bold rounded style) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body style={{ margin: 0, background: "#1B2167" }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
