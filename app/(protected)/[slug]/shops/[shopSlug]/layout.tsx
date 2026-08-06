"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios"; // or whatever API client instance bundle setup you interact with

export default function ShopContextLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const shopId = params?.shopId as string;

  useEffect(() => {
    if (shopId) {
      // Set active branch context cleanly inside all outgoing API transactions
      axios.defaults.headers.common["X-Shop-Id"] = shopId;
      // Fallback local persistence snapshot reference mapping
      localStorage.setItem("active_shop_id", shopId);
    }
  }, [shopId]);

  return <>
      {children}
  </>;
}