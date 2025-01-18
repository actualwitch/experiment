import type { PropsWithChildren } from "react";

export const FavIcon = ({ children }: PropsWithChildren) => {
  return (
    <link
      rel="icon"
      href={`data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${children}</text></svg>`}
    />
  );
};

export const ExperimentIcon = ({ children }: { children: string }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <text y=".9em" font-size="90">
        {children}
      </text>
    </svg>
  );
};
