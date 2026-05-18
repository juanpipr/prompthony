import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Prompthony — Convierte tus ideas en prompts perfectos para AI. Veo, Kling, Seedance, Midjourney, Nano Banana y más." />
        <meta name="theme-color" content="#1B2167" />
        <meta property="og:title" content="Prompthony" />
        <meta property="og:description" content="Tira tu idea en español. Recibe el prompt perfecto en inglés." />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body style={{ margin: 0, background: "#1B2167" }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
