import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Play, Settings, Download } from "lucide-react";
import StatsCard from "@/components/StatsCard";
import RunStatus from "@/components/RunStatus";

const Dashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: runs } = useQuery({
    queryKey: ["/api/runs"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const recentRuns = runs?.slice(0, 3) || [];
  const lastRun = runs?.[0];
  const runningRun = runs?.find(run => run.status === 'running');
  const isRunning = !!runningRun;

  const handleExportLeads = () => {
    window.open("/api/leads/export", "_blank");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Main Dashboard Area */}
      <div className="lg:col-span-3">
        <Card className="rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Leadstorm AI Dashboard</h2>
          <p className="text-gray-600 mb-6">
            Generate up to 50 fresh email leads per day. Configure your settings, run the scraper, and export your results.
          </p>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Total Leads"
              value={stats?.totalLeads || 0}
              color="blue"
            />
            <StatsCard
              title="Today's Leads"
              value={stats?.todaysLeads || 0}
              color="green"
            />
            <StatsCard
              title="Total Runs"
              value={stats?.totalRuns || 0}
              color="purple"
            />
          </div>

          <RunStatus
            isRunning={isRunning}
            currentProgress={runningRun?.leadsAdded || 0}
            totalTargets={50}
            leadsFound={runningRun?.leadsAdded || 0}
            duplicates={runningRun?.duplicates || 0}
            noEmail={runningRun?.noEmail || 0}
            runningRunId={runningRun?.id}
            lastRun={lastRun ? {
              city: lastRun.city,
              keyword: lastRun.keyword,
              time: new Date(lastRun.startedAt || "").toLocaleString(),
              results: `${lastRun.leadsAdded} leads added, ${lastRun.duplicates} duplicates filtered`
            } : undefined}
          />
        </Card>

        {/* Recent Activity */}
        <Card className="rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentRuns.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              recentRuns.map((run) => (
                <div key={run.id} className={`flex items-center space-x-4 p-3 rounded-lg ${
                  run.status === 'completed' ? 'bg-green-50' : 
                  run.status === 'running' ? 'bg-blue-50' : 'bg-red-50'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${
                    run.status === 'completed' ? 'bg-green-500' : 
                    run.status === 'running' ? 'bg-blue-500' : 'bg-red-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {run.status === 'completed' ? 'Successfully completed' : 
                       run.status === 'running' ? 'Running' : 'Failed'}: {run.city} {run.keyword}
                    </p>
                    <p className="text-xs text-gray-500">
                      {run.status === 'completed' && `${run.leadsAdded} leads found`} • {
                        new Date(run.startedAt || "").toLocaleString()
                      }
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        <Card className="rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/run-now">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2">
                <Play className="w-5 h-5" />
                <span>Start New Run</span>
              </Button>
            </Link>
            <Link href="/configuration">
              <Button variant="outline" className="w-full text-gray-700 font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Configure Settings</span>
              </Button>
            </Link>
            <Button
              onClick={handleExportLeads}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Export Leads (CSV)</span>
            </Button>
          </div>
        </Card>

        <Card className="rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Add your Google Places API key in Configuration</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Set default city and business type preferences</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Use the /api/run endpoint for automated scheduling</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Check logs for detailed run information</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
