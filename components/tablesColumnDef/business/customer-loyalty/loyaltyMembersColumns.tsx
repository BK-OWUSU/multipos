import { LoyaltyMembersListResponse } from "@/types/loyalty";
import { ColumnDef } from "@tanstack/react-table";

// Extracting the single customer type from your response array
export type LoyaltyMember = LoyaltyMembersListResponse["customers"][number];

export const loyaltyMembersColumns: ColumnDef<LoyaltyMember>[] = [
  {
    id: "name",
    header: "Member",
    // Combines first and last name, uses customId as a secondary label
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    cell: ({ row }) => {
      const { firstName, lastName, customId } = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{`${firstName} ${lastName}`}</span>
          <span className="text-xs text-gray-500">{customId}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone Number",
    cell: ({ getValue }) => getValue<string | null>() || "—",
  },
  {
    id: "loyaltyTier",
    header: "Tier",
    accessorFn: (row) => row.loyaltyTier?.name,
    cell: ({ row }) => {
      const tier = row.original.loyaltyTier;
      if (!tier) return <span className="text-gray-400 text-sm">No Tier</span>;

      return (
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: tier.color ? `${tier.color}15` : "#F3F4F6", // 15 added for ~8% opacity tint
            color: tier.color || "#374151",
          }}
        >
          {tier.name}
        </span>
      );
    },
  },
  {
    id: "availablePoints",
    header: "Available Points",
    accessorFn: (row) => row.loyaltyWallet?.availablePoints,
    cell: ({ getValue }) => {
      const points = getValue<number | undefined>();
      return (
        <span className="font-semibold text-gray-900">
          {points !== undefined ? points.toLocaleString() : "0"}
        </span>
      );
    },
  },
  {
    id: "pointsHistory.earned",
    header: "Earned Points",
    cell: ({ row }) => {
      const wallet = row.original.loyaltyWallet;
      if (!wallet) return <span className="text-gray-400">—</span>;
      
      return (
        <div className="text-sm text-gray-600">
          <span className="text-green-600 font-medium">+{wallet.lifetimeEarned.toLocaleString()}</span>
        </div>
      );
    },
  },
  {
    id: "pointsHistory.redeemed",
    header: "Redeemed Points",
    cell: ({ row }) => {
      const wallet = row.original.loyaltyWallet;
      if (!wallet) return <span className="text-gray-400">—</span>;
      
      return (
        <div className="text-sm text-gray-600">
          <span className="text-red-600 font-medium">-{wallet.lifetimeRedeemed.toLocaleString()}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue<"ACTIVE" | "BLOCKED">();
      const isBlocked = status === "BLOCKED";
      
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${
            isBlocked
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "lastVisit",
    header: "Last Visit",
    cell: ({ getValue }) => {
      const date = getValue<Date | null>();
      if (!date) return <span className="text-gray-400 text-sm">Never</span>;
      
      // Assumes date is an actual Date object; if it's an ISO string from JSON API, wrap in new Date(date)
      return (
        <span className="text-gray-700 text-sm">
          {new Date(date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      );
    },
  },
];