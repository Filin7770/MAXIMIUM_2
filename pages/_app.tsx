import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import type { AppProps } from "next/app";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { holesky } from "wagmi/chains";
import {
  darkTheme,
  getDefaultConfig,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";

const config = getDefaultConfig({
  appName: "Maximium",
  projectId: "92f61fe09ee9d5fb74939603bd87850e",
  chains: [holesky],
  ssr: true,
});

const client = new QueryClient();

const customTheme = darkTheme({
  accentColor: "#6949D7",
  accentColorForeground: "#ffffff",
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider theme={customTheme}>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MyApp;
