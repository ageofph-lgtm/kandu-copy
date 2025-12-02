import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, 
  Euro, 
  Clock, 
  Eye,
  Building2,
  Star,
  Shield,
  AlertCircle,
  User as UserIcon
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function JobCard({ job, onClick, userType }) {
  const [employer, setEmployer] = useState(null);

  useEffect(() => {
    const fetchEmployer = async () => {
      if (job.employer_id) {
        try {
          const employerData = await User.filter({ id: job.employer_id });
          if (employerData.length > 0) {
            setEmployer(employerData[0]);
          }
        } catch (e) {
          console.error("Failed to fetch employer for job card", e);
        }
      }
    };
    fetchEmployer();
  }, [job.employer_id]);

  const formatPrice = (price, type) => {
    if (type === "hourly") {
      return `€${price}/hora`;
    }
    return `€${price}`;
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 line-clamp-2">{job.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {job.category}
                </Badge>
                {job.urgency === "high" && (
                  <Badge className={getUrgencyColor(job.urgency)}>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Urgente
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-blue-600">
                {formatPrice(job.price, job.price_type)}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Eye className="w-3 h-3" />
                {job.views || 0}
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>

          {/* Location and Date */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.location}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(job.created_date), "dd MMM", { locale: pt })}
            </div>
          </div>

          {/* Employer Info */}
          {employer && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-purple-700" />
              </div>
              <span className="text-sm text-gray-600">{employer.full_name || "Empregador"}</span>
              {employer.verified && <Shield className="w-4 h-4 text-green-500" />}
              <div className="flex items-center gap-1 ml-auto">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-xs text-gray-600">{employer.rating || 'N/A'}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}