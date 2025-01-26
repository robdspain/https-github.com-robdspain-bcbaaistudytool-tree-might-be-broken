import React from "react";
    import { Card } from "@/components/ui/card";
    import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

    interface CategoryStats {
      name: string;
      percentage: number;
      subdomains: {
        name: string;
        percentage: number;
        total: number;
      }[];
    }

    interface DomainOverviewProps {
      stats: CategoryStats[];
    }

    export const DomainOverview = ({ stats }: DomainOverviewProps) => {
      const chartData = stats.map(category => ({
        name: category.name,
        percentage: category.percentage
      }));

      console.log("Chart data:", chartData);

      return (
        <Card className="p-6 mb-8 shadow-lg border-2 border-quiz-primary">
          <h2 className="text-xl font-semibold text-quiz-primary mb-4">Domain Overview</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="percentage" fill="#1B584E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      );
    };
