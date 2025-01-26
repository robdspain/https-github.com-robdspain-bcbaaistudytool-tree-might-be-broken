import React, { useState, useEffect } from "react";
    import { useQuery } from "@tanstack/react-query";
    import { supabase } from "@/integrations/supabase/client";
    import { Loader2 } from "lucide-react";
    import { Card } from "@/components/ui/card";
    import { Button } from "@/components/ui/button";
    import { useNavigate } from "react-router-dom";
    import { useAuth } from "@/providers/AuthProvider";
    import { TimeRangeSelector } from "@/components/results/TimeRangeSelector";
    import { DomainOverview } from "@/components/results/DomainOverview";
    import { CategoryList } from "@/components/results/CategoryList";

    type TimeRange = "daily" | "weekly" | "monthly";

    interface CategoryStats {
      name: string;
      percentage: number;
      subdomains: {
        name: string;
        percentage: number;
        total: number;
        lastAttempt: string | null;
      }[];
    }

    const Results = () => {
      const { user } = useAuth();
      const navigate = useNavigate();
      const [timeRange, setTimeRange] = useState<TimeRange>("daily");
      const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

      const toggleCategory = (category: string) => {
        setExpandedCategories(prev => 
          prev.includes(category) 
            ? prev.filter(c => c !== category)
            : [...prev, category]
        );
      };

      const { data: stats, isLoading, refetch } = useQuery({
        queryKey: ['quiz-results', timeRange, user?.id],
        queryFn: async () => {
          console.log("Fetching results for timeRange:", timeRange, "user:", user?.id);
          
          if (!user) {
            console.log("No user found");
            return null;
          }

          const now = new Date();
          const today = new Date(now.setHours(0,0,0,0));
          
          let startDate = today;
          if (timeRange === "weekly") {
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 7);
          } else if (timeRange === "monthly") {
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 30);
          }

          console.log("Fetching attempts from:", startDate.toISOString());

          const { data: attempts, error } = await supabase
            .from('quiz_attempts')
            .select('main_category, subcategory, is_correct, created_at')
            .eq('user_id', user.id)
            .gte('created_at', startDate.toISOString());

          if (error) {
            console.error("Error fetching attempts:", error);
            throw error;
          }

          console.log("Retrieved attempts:", attempts);

          if (!attempts || attempts.length === 0) {
            console.log("No attempts found for the selected time range");
            return [];
          }

          // Fetch all subdomains
          const { data: subdomains, error: subdomainsError } = await supabase
            .from('subdomain_progress')
            .select('main_category, subcategory')
            .eq('pacing_guides.user_id', user.id);

          if (subdomainsError) {
            console.error('Error fetching subdomains:', subdomainsError);
            throw subdomainsError;
          }

          const allSubdomains = subdomains?.reduce((acc: { [key: string]: any }, item) => {
            const mainCategory = item.main_category.replace(/^[A-Z]\.\s*/, '');
            const subcategory = item.subcategory.replace(/^[A-Z]\.\d+\.\s*/, '');

            if (!acc[mainCategory]) {
              acc[mainCategory] = {
                name: mainCategory,
                totalCorrect: 0,
                totalAttempts: 0,
                subdomains: {}
              };
            }

            acc[mainCategory].subdomains[subcategory] = {
              name: subcategory,
              correct: 0,
              total: 0,
              lastAttempt: null
            };

            return acc;
          }, {});

          // Group attempts by main category and subcategory
          const categoryStats = attempts.reduce((acc: { [key: string]: any }, attempt) => {
            const mainCategory = attempt.main_category.replace(/^[A-Z]\.\s*/, '');
            const subcategory = attempt.subcategory.replace(/^[A-Z]\.\d+\.\s*/, '');

            if (!acc[mainCategory]) {
              acc[mainCategory] = {
                name: mainCategory,
                totalCorrect: 0,
                totalAttempts: 0,
                subdomains: {}
              };
            }

            const category = acc[mainCategory];
            category.totalAttempts++;
            if (attempt.is_correct) category.totalCorrect++;

            if (!category.subdomains[subcategory]) {
              category.subdomains[subcategory] = {
                name: subcategory,
                correct: 0,
                total: 0,
                lastAttempt: null
              };
            }

            const subdomain = category.subdomains[subcategory];
            subdomain.total++;
            if (attempt.is_correct) subdomain.correct++;
            subdomain.lastAttempt = attempt.created_at;

            return acc;
          }, allSubdomains);

          // Transform the data into the required format
          const result: CategoryStats[] = Object.values(categoryStats)
            .map((category: any) => ({
              name: category.name,
              percentage: Math.round((category.totalCorrect / category.totalAttempts) * 100) || 0,
              subdomains: Object.values(category.subdomains)
                .map((sub: any) => ({
                  name: sub.name,
                  percentage: Math.round((sub.correct / sub.total) * 100) || 0,
                  total: sub.total,
                  lastAttempt: sub.lastAttempt
                }))
                .sort((a: any, b: any) => b.percentage - a.percentage)
            }))
            .sort((a: any, b: any) => b.percentage - a.percentage);

          console.log("Processed stats:", result);
          return result;
        },
        enabled: !!user?.id,
        refetchInterval: 5000,
        onSuccess: (data) => {
          console.log("Successfully fetched results:", data);
        },
        onError: (error) => {
          console.error("Error fetching results:", error);
        }
      });

      return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-quiz-primary mb-6">Performance Analytics</h1>
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>

          <DomainOverview stats={stats || []} />
          
          <CategoryList 
            stats={stats || []}
            expandedCategories={expandedCategories}
            onToggleCategory={toggleCategory}
          />
        </div>
      );
    };

    export default Results;
