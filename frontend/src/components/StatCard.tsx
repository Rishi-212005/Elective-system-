import React from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: string;
  trendUp?: boolean;
  delay?: number;
  gradient?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, trend, trendUp = true, delay = 0, gradient = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`relative overflow-hidden rounded-2xl p-6 flex flex-col gap-3 ${
      gradient
        ? "gradient-primary text-primary-foreground"
        : "glass-card-elevated"
    }`}
  >
    {gradient && (
      <div className="absolute inset-0 bg-gradient-to-br from-primary-foreground/5 to-transparent" />
    )}
    <div className="flex items-center justify-between relative z-10">
      <p className={`text-sm font-medium ${gradient ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
        {title}
      </p>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
        gradient
          ? "bg-primary-foreground/15"
          : "bg-primary/8"
      }`}>
        <span className={gradient ? "text-primary-foreground" : "text-primary"}>{icon}</span>
      </div>
    </div>
    <div className="relative z-10">
      <p className={`text-3xl font-display font-extrabold ${gradient ? "text-primary-foreground" : "text-foreground"}`}>
        {value}
      </p>
      {description && (
        <p className={`text-xs mt-1 ${gradient ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
          {description}
        </p>
      )}
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <span className={`text-xs font-semibold ${
            gradient
              ? "text-primary-foreground/80"
              : trendUp ? "text-success" : "text-destructive"
          }`}>
            {trendUp ? "↑" : "↓"} {trend}
          </span>
        </div>
      )}
    </div>
  </motion.div>
);

export default StatCard;
