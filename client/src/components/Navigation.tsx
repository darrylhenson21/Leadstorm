import { Link, useLocation } from "wouter";
import { Home, Settings, Play, FileText } from "lucide-react";
import { BrandSignature } from "./BrandSignature";

const Navigation = () => {
  const [location] = useLocation();

  const tabs = [
    { id: "dashboard", label: "Home", path: "/", icon: Home },
    { id: "configuration", label: "Configuration", path: "/configuration", icon: Settings },
    { id: "run-now", label: "Run Now", path: "/run-now", icon: Play },
    { id: "logs", label: "Logs", path: "/logs", icon: FileText },
  ];

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Leadstorm AI</h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">v2.0</span>
            </div>
            <div className="flex items-center space-x-4">
              <BrandSignature />
              <div className="text-sm">
                <span className="text-gray-600">Status:</span>
                <span className="status-ready font-medium ml-1">Ready</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">LA</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location === tab.path;
              return (
                <Link key={tab.id} href={tab.path}>
                  <button
                    className={`px-4 py-3 rounded-t-lg font-medium text-sm flex items-center space-x-2 transition-colors ${
                      isActive ? "tab-active" : "tab-inactive"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
