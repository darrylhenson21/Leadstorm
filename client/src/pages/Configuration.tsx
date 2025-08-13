import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info, AlertCircle, Trash2, ExternalLink } from "lucide-react";
import { useState } from "react";

const configSchema = z.object({
  googlePlacesKey: z.string().optional().or(z.literal("")),
  defaultCity: z.string().optional(),
  defaultKeyword: z.string().optional(),
  dailyCap: z.number().min(1).max(500),
  requestDelay: z.number().min(500).max(5000),
  maxRunDuration: z.number().min(5).max(120),
  retryAttempts: z.number().min(1).max(10),
  backoffMultiplier: z.number().min(1).max(5),
  enableUserAgentRotation: z.boolean(),
});

type ConfigFormData = z.infer<typeof configSchema>;

const Configuration = () => {
  const { toast } = useToast();
  const [showReadme, setShowReadme] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["/api/configuration"],
  });

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      googlePlacesKey: "",
      defaultCity: config?.defaultCity || "New York",
      defaultKeyword: config?.defaultKeyword || "restaurants",
      dailyCap: config?.dailyCap || 50,
      requestDelay: config?.requestDelay || 1000,
      maxRunDuration: config?.maxRunDuration || 30,
      retryAttempts: config?.retryAttempts || 3,
      backoffMultiplier: config?.backoffMultiplier || 2,
      enableUserAgentRotation: config?.enableUserAgentRotation || true,
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data: ConfigFormData) => {
      const response = await apiRequest("POST", "/api/configuration", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration saved",
        description: "Your settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/configuration"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConfigFormData) => {
    updateConfigMutation.mutate(data);
  };

  const copySchedulingURL = () => {
    const baseURL = window.location.origin;
    const city = form.getValues("defaultCity") || "New York";
    const keyword = form.getValues("defaultKeyword") || "restaurants";
    const url = `${baseURL}/api/run?city=${encodeURIComponent(city)}&keyword=${encodeURIComponent(keyword)}`;
    
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "URL copied",
        description: "Scheduling URL copied to clipboard!",
      });
    });
  };

  return (
    <div className="max-w-4xl">
      <Card className="rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuration</h2>
          <p className="text-gray-600">Configure your API keys, default settings, and advanced throttling options</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* API Keys Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">API Keys</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="googlePlacesKey" className="block text-sm font-medium text-gray-700 mb-2">
                  Google Places API Key <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="googlePlacesKey"
                  type="password"
                  placeholder="Enter your Google Places API key"
                  {...form.register("googlePlacesKey")}
                  className="w-full"
                />
                {form.formState.errors.googlePlacesKey && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.googlePlacesKey.message}</p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-green-600">
                    {config?.googlePlacesKey === "***CONFIGURED***" ? "✓ API Key Configured" : "No API key configured"}
                  </span>
                  {config?.googlePlacesKey === "***CONFIGURED***" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => {
                        form.setValue("googlePlacesKey", "");
                        updateConfigMutation.mutate({
                          ...form.getValues(),
                          googlePlacesKey: ""
                        });
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Default Run Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Default Run Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="defaultCity">Default Location</Label>
                <Input
                  id="defaultCity"
                  placeholder="e.g., Austin TX, Brooklyn, or 10001"
                  {...form.register("defaultCity")}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Accepts city, suburb, neighborhood, or ZIP code
                </p>
              </div>
              <div>
                <Label htmlFor="defaultKeyword">Default Niche/Keyword</Label>
                <Input
                  id="defaultKeyword"
                  placeholder="e.g., restaurants"
                  {...form.register("defaultKeyword")}
                />
              </div>
              <div>
                <Label htmlFor="dailyCap">Max Leads Per Run</Label>
                <Input
                  id="dailyCap"
                  type="number"
                  min="1"
                  max="500"
                  {...form.register("dailyCap", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          {/* Advanced Throttling Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Throttling Settings</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-800">
                  These settings help avoid rate limiting and ensure polite scraping behavior without requiring proxies.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <Label htmlFor="requestDelay">Request Delay (ms)</Label>
                <Input
                  id="requestDelay"
                  type="number"
                  min="500"
                  max="5000"
                  {...form.register("requestDelay", { valueAsNumber: true })}
                />
                <p className="mt-1 text-xs text-gray-500">Delay between requests</p>
              </div>
              <div>
                <Label htmlFor="maxRunDuration">Max Run Duration (min)</Label>
                <Input
                  id="maxRunDuration"
                  type="number"
                  min="5"
                  max="120"
                  {...form.register("maxRunDuration", { valueAsNumber: true })}
                />
                <p className="mt-1 text-xs text-gray-500">Optional time-boxing</p>
              </div>
              <div>
                <Label htmlFor="retryAttempts">Retry Attempts</Label>
                <Input
                  id="retryAttempts"
                  type="number"
                  min="1"
                  max="10"
                  {...form.register("retryAttempts", { valueAsNumber: true })}
                />
                <p className="mt-1 text-xs text-gray-500">For failed requests</p>
              </div>
              <div>
                <Label htmlFor="backoffMultiplier">Backoff Multiplier</Label>
                <Input
                  id="backoffMultiplier"
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  {...form.register("backoffMultiplier", { valueAsNumber: true })}
                />
                <p className="mt-1 text-xs text-gray-500">Exponential backoff rate</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="enableUserAgentRotation"
                  checked={form.watch("enableUserAgentRotation")}
                  onCheckedChange={(checked) => form.setValue("enableUserAgentRotation", checked as boolean)}
                />
                <Label htmlFor="enableUserAgentRotation" className="text-sm text-gray-700">
                  Enable User-Agent rotation
                </Label>
              </div>
              <p className="mt-1 text-xs text-gray-500 ml-7">
                Rotates between common browser user agents to avoid detection
              </p>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <Button
                type="button"
                variant="outline"
                className="flex items-center space-x-2"
                onClick={() => setShowReadme(true)}
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Throttling Configuration Guide</span>
              </Button>
            </div>
          </div>

          {/* Scheduling Setup */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduling Setup</h3>
            <p className="text-sm text-gray-600 mb-4">
              Use this URL with UptimeRobot or similar services to schedule daily runs:
            </p>
            <div className="flex items-center space-x-3">
              <Input
                readOnly
                value={`${window.location.origin}/api/run?city=${encodeURIComponent(form.watch("defaultCity") || "New York")}&keyword=${encodeURIComponent(form.watch("defaultKeyword") || "restaurants")}`}
                className="flex-1 bg-gray-50 text-sm font-mono"
              />
              <Button type="button" onClick={copySchedulingURL}>
                Copy URL
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit" disabled={updateConfigMutation.isPending}>
              {updateConfigMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Throttling Configuration Guide Modal */}
      <Dialog open={showReadme} onOpenChange={setShowReadme}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Info className="w-5 h-5" />
              <span>Throttling Configuration Guide</span>
            </DialogTitle>
            <DialogDescription>
              Learn how to configure safe throttling settings for optimal lead generation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 text-sm">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Request Delay (500-5000ms)</h3>
              <p className="text-gray-700 mb-2">Controls the pause between each website scraping request.</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li><strong>500-1000ms:</strong> Fastest setting, good for testing</li>
                <li><strong>1000-2000ms:</strong> Recommended for most use cases</li>
                <li><strong>2000-5000ms:</strong> Conservative setting for sensitive websites</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Retry Attempts (1-10)</h3>
              <p className="text-gray-700 mb-2">How many times to retry failed requests.</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li><strong>1-2:</strong> Fast execution, fewer retries</li>
                <li><strong>3-5:</strong> Balanced approach (recommended)</li>
                <li><strong>6-10:</strong> Maximum persistence for difficult sites</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Backoff Multiplier (1.0-5.0)</h3>
              <p className="text-gray-700 mb-2">How much to increase delay after each failed attempt.</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li><strong>1.0-1.5:</strong> Linear increase</li>
                <li><strong>2.0-2.5:</strong> Standard exponential backoff (recommended)</li>
                <li><strong>3.0-5.0:</strong> Aggressive backoff for rate-limited sites</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Max Leads Per Run (1-500)</h3>
              <p className="text-gray-700 mb-2">Controls how many leads to generate per session.</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li><strong>10-50:</strong> Conservative daily usage</li>
                <li><strong>50-100:</strong> Moderate usage for regular campaigns</li>
                <li><strong>100-500:</strong> High-volume usage (monitor for blocks)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Safe Usage Guidelines</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <ul className="list-disc list-inside text-green-800 space-y-1">
                  <li>Start with conservative settings (2000ms delay, 3 retries)</li>
                  <li>Monitor for 403/429 errors and adjust accordingly</li>
                  <li>Enable user-agent rotation for better compatibility</li>
                  <li>Space out runs throughout the day rather than bulk processing</li>
                  <li>Test with small batches before scaling up</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Recommended Configurations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Conservative (Safest)</h4>
                  <ul className="text-blue-800 text-xs space-y-1">
                    <li>Request Delay: 2000ms</li>
                    <li>Retry Attempts: 3</li>
                    <li>Backoff Multiplier: 2.0</li>
                    <li>Max Leads: 25-50</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Balanced (Recommended)</h4>
                  <ul className="text-yellow-800 text-xs space-y-1">
                    <li>Request Delay: 1500ms</li>
                    <li>Retry Attempts: 3</li>
                    <li>Backoff Multiplier: 2.0</li>
                    <li>Max Leads: 50-100</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowReadme(false)}>
              Close Guide
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Configuration;
