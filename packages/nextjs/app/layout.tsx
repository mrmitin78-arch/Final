import "@rainbow-me/rainbowkit/styles.css";
import "@scaffold-ui/components/styles.css";
import { AppWithProviders } from "~~/components/AppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "HashStorage DApp",
  description: "Хранилище хешей документов в Ethereum",
});

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning className={``}>
      <body>
        <ThemeProvider enableSystem>
          <AppWithProviders>{children}</AppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default AppLayout;
