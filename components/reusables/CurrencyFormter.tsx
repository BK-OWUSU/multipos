"use client";

import React from "react";
import { formatBusinessCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

interface CurrencyFormatterProps {
  amount: number;
  position?: "start" | "end";
}

interface CurrencyHeaderProps {
  title: string;
  position?: "start" | "end";
}

interface CurrencyFormatterComponent
  extends React.FC<CurrencyFormatterProps> {
  Header: React.FC<CurrencyHeaderProps>;
  Currency: React.FC<Record<string, never>>;
}

// Header Component
const Header: React.FC<CurrencyHeaderProps> = ({ title, position }) => {
  const user = useAuthStore((state) => state.user);

  const currencySymbol = user?.business?.currencySymbol ?? "";
  const isEnd = position === "end";

  return (
  <span className="flex items-center">
      {/* Render symbol first if NOT at the end */}
      {!isEnd && currencySymbol && (
        <span className="mr-1">{currencySymbol}</span>
      )}
      {title}
      {/* Render symbol last if it IS at the end */}
      {isEnd && currencySymbol && (
        <span className="ml-1">{currencySymbol}</span>
      )}
    </span>
  );
};

// 2. Created the Currency sub-component
const Currency: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const currencySymbol = user?.business?.currencySymbol ?? "";
  return <>{currencySymbol}</>;
};


// Main Currency Formatter Component
const CurrencyFormatter = (({ amount, position }) => {
  const user = useAuthStore((state) => state.user);

  const currencySymbol = user?.business?.currencySymbol ?? "";
  const isEnd = position === "end";

  // 1. Get the fully formatted string (e.g., "GH₵10.00")
  const rawFormatted = formatBusinessCurrency(
    amount,
    user?.business?.currencyCode,
    user?.business?.locale
  );

  // 2. Remove the symbol so it doesn't double print
  const formattedAmount = rawFormatted.replace(currencySymbol, "").trim();

  return (
    <span>
      {/* Symbol on the left */}
      {!isEnd && currencySymbol && (
        <span className="mr-1">{currencySymbol}</span>
      )}

      {formattedAmount}

      {/* Symbol on the right */}
      {isEnd && currencySymbol && (
        <span className="ml-1">{currencySymbol}</span>
      )}
    </span>
  );
}) as CurrencyFormatterComponent;

// Attach sub-components
CurrencyFormatter.Header = Header;
CurrencyFormatter.Currency = Currency;

export default CurrencyFormatter;