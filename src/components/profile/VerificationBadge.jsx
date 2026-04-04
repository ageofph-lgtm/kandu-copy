import React from "react";
import { Shield, ShieldCheck, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const levels = {
  basic: {
    label: "Básico",
    icon: Shield,
    color: "bg-gray-100 text-gray-600 border-gray-200",
    description: "Conta criada"
  },
  verified: {
    label: "Verificado",
    icon: ShieldCheck,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Email/telefone confirmados"
  },
  ultra_verified: {
    label: "Ultra Verificado",
    icon: BadgeCheck,
    color: "bg-green-50 text-green-700 border-green-200",
    description: "Identidade confirmada"
  }
};

export default function VerificationBadge({ level = "basic", showDescription = false, size = "default" }) {
  const config = levels[level] || levels.basic;
  const Icon = config.icon;
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <div className="flex flex-col items-start gap-1">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        <Icon className={iconSize} />
        {config.label}
      </span>
      {showDescription && (
        <span className="text-xs text-gray-500">{config.description}</span>
      )}
    </div>
  );
}