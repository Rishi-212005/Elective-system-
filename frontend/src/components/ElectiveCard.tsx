import React from "react";
import { motion } from "framer-motion";
import { Elective } from "@/data/mockData";
import { Users, BookOpen, User } from "lucide-react";

interface ElectiveCardProps {
  elective: Elective;
  onSelect?: () => void;
  selected?: boolean;
  selectable?: boolean;
  preferenceLabel?: string;
  delay?: number;
}

const ElectiveCard: React.FC<ElectiveCardProps> = ({
  elective,
  onSelect,
  selected,
  selectable = false,
  preferenceLabel,
  delay = 0,
}) => {
  const fillPercent = Math.round(
    ((elective.totalSeats - elective.remainingSeats) / elective.totalSeats) * 100
  );
  const isAlmostFull = elective.remainingSeats <= 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${
        selected
          ? "border-primary bg-primary/5 shadow-glow-sm"
          : "border-border/60 bg-card hover:border-primary/20 hover:shadow-lg"
      }`}
      onClick={selectable ? onSelect : undefined}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full gradient-primary opacity-60" />

      <div className="p-5">
        {preferenceLabel && (
          <span className="inline-flex items-center mb-3 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider gradient-primary text-primary-foreground">
            {preferenceLabel}
          </span>
        )}

        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <span className="badge-primary text-[10px] mb-2">{elective.code}</span>
            <h3 className="font-display font-bold text-foreground text-base leading-tight mt-1.5">
              {elective.name}
            </h3>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
          {elective.description}
        </p>

        <div className="flex items-center gap-2 mb-4">
          <User size={12} className="text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            <span className="font-medium text-foreground">{elective.faculty}</span>
          </span>
        </div>

        {/* Select button */}
        {selectable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              selected
                ? "gradient-primary text-primary-foreground shadow-glow-sm"
                : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
            }`}
          >
            {selected ? "✓ Selected" : "Select Elective"}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ElectiveCard;
