

import ClockInClockOutInterceptor from "@/components/reusables/security/ClockInClockOutInterceptor";
import SaleTerminalWrapper from "./SaleTerminalWrapper";

export default function Page() {


  return (
    <ClockInClockOutInterceptor>
      <SaleTerminalWrapper/>
    </ClockInClockOutInterceptor>
  );
}