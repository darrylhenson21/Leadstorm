import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StatsCard from "@/components/StatsCard";
import { Download, Trash2, FileText, Clock, MapPin, Search, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

const Logs = () => {
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  const { data: runs } = useQuery({
    queryKey: ["/api/runs"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/clear-history");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "History cleared",
        description: "All runs and leads have been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear history. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExportLeads = () => {
    window.open("/api/leads/export", "_blank");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const handleViewDetails = (run: any) => {
    setSelectedRun(run);
    setIsDetailsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "running":
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const completedRuns = runs?.filter(run => run.status === 'completed') || [];
  const avgLeadsPerRun = completedRuns.length > 0 
    ? Math.round(completedRuns.reduce((sum, run) => sum + (run.leadsAdded || 0), 0) / completedRuns.length)
    : 0;

  return (
    <Card className="rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Run History & Logs</h2>
            <p className="text-gray-600">View past runs and detailed logs</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button onClick={handleExportLeads} className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export All Leads</span>
            </Button>
            <Button 
              variant="destructive" 
              className="flex items-center space-x-2"
              onClick={() => clearHistoryMutation.mutate()}
              disabled={clearHistoryMutation.isPending}
            >
              <Trash2 className="w-4 h-4" />
              <span>{clearHistoryMutation.isPending ? "Clearing..." : "Clear History"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total Runs"
            value={runs?.length || 0}
            color="blue"
            className="text-center"
          />
          <StatsCard
            title="Total Leads"
            value={stats?.totalLeads || 0}
            color="green"
            className="text-center"
          />
          <StatsCard
            title="Avg Leads/Run"
            value={avgLeadsPerRun}
            color="yellow"
            className="text-center"
          />
          <StatsCard
            title="Success Rate"
            value={`${stats?.successRate || 0}%`}
            color="purple"
            className="text-center"
          />
        </div>
      </div>

      {/* Run History Table */}
      {runs && runs.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Date</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Keyword</TableHead>
                <TableHead>Leads Added</TableHead>
                <TableHead>Duplicates</TableHead>
                <TableHead>No Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id} className="hover:bg-gray-50">
                  <TableCell className="whitespace-nowrap">
                    {formatDate(run.startedAt || "")}
                  </TableCell>
                  <TableCell>{run.city}</TableCell>
                  <TableCell>{run.keyword}</TableCell>
                  <TableCell className="font-medium text-green-600">
                    {run.leadsAdded || 0}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {run.duplicates || 0}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {run.noEmail || 0}
                  </TableCell>
                  <TableCell>{getStatusBadge(run.status)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="link" 
                      className="text-blue-600 hover:underline p-0"
                      onClick={() => handleViewDetails(run)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No runs yet</h3>
          <p className="text-gray-500 mb-4">Start your first lead generation run to see logs and history here.</p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Start Your First Run
          </Button>
        </div>
      )}

      {/* Run Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Run Details</span>
            </DialogTitle>
            <DialogDescription>
              Detailed information about this lead generation run
            </DialogDescription>
          </DialogHeader>

          {selectedRun && (
            <div className="space-y-6">
              {/* Run Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Location:</span>
                    <span className="font-medium">{selectedRun.city}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Keyword:</span>
                    <span className="font-medium">{selectedRun.keyword}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Duration:</span>
                    <span className="font-medium">
                      {formatDuration(selectedRun.startedAt, selectedRun.completedAt)}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {selectedRun.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm text-gray-500">Status:</span>
                    {getStatusBadge(selectedRun.status)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Started:</span>
                    <span className="font-medium text-sm">
                      {formatDate(selectedRun.startedAt)}
                    </span>
                  </div>
                  {selectedRun.completedAt && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Completed:</span>
                      <span className="font-medium text-sm">
                        {formatDate(selectedRun.completedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Results Summary */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-4">Results Summary</h4>
                <div className="grid grid-cols-3 gap-4">
                  <StatsCard
                    title="Leads Found"
                    value={selectedRun.leadsAdded || 0}
                    color="green"
                    className="text-center"
                  />
                  <StatsCard
                    title="Duplicates"
                    value={selectedRun.duplicates || 0}
                    color="yellow"
                    className="text-center"
                  />
                  <StatsCard
                    title="No Email"
                    value={selectedRun.noEmail || 0}
                    color="red"
                    className="text-center"
                  />
                </div>
              </div>

              {/* Error Information */}
              {selectedRun.errorMessage && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Error Details</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{selectedRun.errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t pt-4 flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                  Close
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => window.open("/api/leads/export", "_blank")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Leads
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default Logs;
