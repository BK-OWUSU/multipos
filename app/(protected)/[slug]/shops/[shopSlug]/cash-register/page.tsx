
import ClockInClockOutInterceptor from "@/components/reusables/security/ClockInClockOutInterceptor";
import CashRegisterPage from "./CashRegisterPage"

export default function CashRegisterWrapper() {


  return (
    <ClockInClockOutInterceptor>
      <CashRegisterPage/>
    </ClockInClockOutInterceptor>
  );
}