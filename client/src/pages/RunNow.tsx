import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { AlertTriangle, Play } from "lucide-react";

const runSchema = z.object({
  city: z.string().min(1, "City is required"),
  keyword: z.string().min(1, "Keyword is required"),
  maxLeads: z.number().min(1).max(500).optional(),
});

type RunFormData = z.infer<typeof runSchema>;

const RunNow = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: config } = useQuery({
    queryKey: ["/api/configuration"],
  });

  const form = useForm<RunFormData>({
    resolver: zodResolver(runSchema),
    defaultValues: {
      city: config?.defaultCity || "",
      keyword: config?.defaultKeyword || "",
      maxLeads: config?.dailyCap || 50,
    },
  });

  const startRunMutation = useMutation({
    mutationFn: async (data: RunFormData) => {
      const response = await apiRequest("POST", "/api/runs", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Run started",
        description: `Lead generation run started for ${form.getValues("city")} ${form.getValues("keyword")}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start run. Please check your configuration.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RunFormData) => {
    startRunMutation.mutate(data);
  };

  const hasApiKey = config?.googlePlacesKey === "***CONFIGURED***";

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Manual Run</h2>
          <p className="text-gray-600">Start a new lead generation run with custom parameters</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                placeholder="City, suburb, neighborhood, or ZIP code"
                {...form.register("city")}
              />
              <p className="mt-1 text-xs text-gray-500">
                Examples: Austin TX, Brooklyn NY, Beverly Hills, 90210
              </p>
              {form.formState.errors.city && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.city.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
                Keyword/Niche <span className="text-red-500">*</span>
              </Label>
              <Input
                id="keyword"
                placeholder="Enter business type or keyword"
                {...form.register("keyword")}
              />
              {form.formState.errors.keyword && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.keyword.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="maxLeads">Max Leads for This Run</Label>
            <Input
              id="maxLeads"
              type="number"
              min="1"
              max="500"
              {...form.register("maxLeads", { valueAsNumber: true })}
            />
            <p className="mt-1 text-sm text-gray-500">
              Leave empty to use default configuration ({config?.dailyCap || 50} leads)
            </p>
          </div>

          {!hasApiKey && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Before you start:</strong> Make sure you have configured your Google Places API key in the Configuration tab.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/")}
            >
              Back to Home
            </Button>
            <Button
              type="submit"
              disabled={startRunMutation.isPending || !hasApiKey}
              className="flex items-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>{startRunMutation.isPending ? "Starting..." : "Start Run"}</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default RunNow;
