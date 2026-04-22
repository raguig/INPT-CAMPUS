import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clubs — Campus INPT",
  description:
    "Découvrez les clubs de l'INPT, rejoignez ceux qui vous passionnent et participez aux événements de la communauté.",
};

export default function ClubsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
