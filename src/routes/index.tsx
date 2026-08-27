import { createFileRoute } from "@tanstack/react-router";
import { ChartApp } from "@/components/chart/ChartApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <ChartApp />;
}
