"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type ClubTabsProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
};

const TAB_ITEMS = [
  { value: "about", label: "À propos" },
  { value: "events", label: "Événements" },
  { value: "posts", label: "Publications" },
  { value: "members", label: "Membres" },
  { value: "ai", label: "Questions IA" },
];

export function ClubTabs({ activeTab, onTabChange, children }: ClubTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="w-full sm:w-auto">
        {TAB_ITEMS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}

export { TabsContent };
