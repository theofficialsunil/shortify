import { BarChart3, Link2, MousePointerClick, PlusCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const stats = [
  {
    title: "Total Links",
    value: "0",
    description: "Links created",
    icon: Link2,
  },
  {
    title: "Total Clicks",
    value: "0",
    description: "Across all links",
    icon: MousePointerClick,
  },
  {
    title: "Active Links",
    value: "0",
    description: "Currently working",
    icon: BarChart3,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-neutral-400">
            Manage and monitor your shortened links.
          </p>
        </div>

        <Link href="/dashboard/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Link
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.title}
              className="border-neutral-800 bg-neutral-950 text-white"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-neutral-400">
                    {stat.title}
                  </CardDescription>
                  <Icon className="h-5 w-5 text-indigo-400" />
                </div>
                <CardTitle className="text-3xl">{stat.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-500">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-neutral-800 bg-neutral-950 text-white">
        <CardHeader>
          <CardTitle>Your Links</CardTitle>
          <CardDescription className="text-neutral-400">
            No links created yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-800 py-16 text-center">
            <Link2 className="mb-4 h-10 w-10 text-neutral-600" />
            <h3 className="text-lg font-semibold">Create your first link</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Shortened links will appear here.
            </p>
            <Link href="/dashboard/create" className="mt-6">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Create Link
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}