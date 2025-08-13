import { Card } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: number | string;
  color: "blue" | "green" | "purple" | "yellow" | "red";
  className?: string;
}

const StatsCard = ({ title, value, color, className = "" }: StatsCardProps) => {
  const colorClasses = {
    blue: "bg-blue-50 border-l-blue-600 text-blue-600",
    green: "bg-green-50 border-l-green-600 text-green-600",
    purple: "bg-purple-50 border-l-purple-600 text-purple-600",
    yellow: "bg-yellow-50 border-l-yellow-600 text-yellow-600",
    red: "bg-red-50 border-l-red-600 text-red-600",
  };

  return (
    <Card className={`stats-card ${colorClasses[color]} rounded-lg p-6 border-l-4 ${className}`}>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm font-medium text-gray-600">{title}</div>
    </Card>
  );
};

export default StatsCard;
