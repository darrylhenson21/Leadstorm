import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, Square } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RunStatusProps {
  isRunning: boolean;
  currentProgress?: number;
  totalTargets?: number;
  leadsFound?: number;
  duplicates?: number;
  noEmail?: number;
  runningRunId?: number;
  lastRun?: {
    city: string;
    keyword: string;
    time: string;
    results: string;
  };
}

const RunStatus = ({
  isRunning,
  currentProgress = 0,
  totalTargets = 50,
  leadsFound = 0,
  duplicates = 0,
  noEmail = 0,
  runningRunId,
  lastRun,
}: RunStatusProps) => {
  const { toast } = useToast();
  const progressPercentage = totalTargets > 0 ? (currentProgress / totalTargets) * 100 : 0;

  const stopRunMutation = useMutation({
    mutationFn: async (runId: number) => {
      const response = await apiRequest("POST", `/api/runs/${runId}/stop`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Run stopped",
        description: "The lead generation run has been stopped successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to stop the run. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Run Status</h3>
      
      {!isRunning ? (
        <div className="text-gray-500">
          <p>No active runs. Ready to start a new lead generation session.</p>
          {lastRun && (
            <div className="mt-4 text-sm text-gray-400">
              <p>• Last run: {lastRun.time} ({lastRun.city} {lastRun.keyword})</p>
              <p>• Results: {lastRun.results}</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-gray-900 font-medium">Scraping in progress...</span>
            </div>
            {runningRunId && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                onClick={() => stopRunMutation.mutate(runningRunId)}
                disabled={stopRunMutation.isPending}
              >
                <Square className="w-4 h-4 mr-1" />
                {stopRunMutation.isPending ? "Stopping..." : "Stop Run"}
              </Button>
            )}
          </div>
          <div className="bg-white rounded p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{currentProgress}/{totalTargets} businesses processed</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
              <div>Found: <span className="font-medium text-green-600">{leadsFound}</span></div>
              <div>Duplicates: <span className="font-medium text-yellow-600">{duplicates}</span></div>
              <div>No Email: <span className="font-medium text-gray-500">{noEmail}</span></div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default RunStatus;
