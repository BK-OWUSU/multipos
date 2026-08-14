import ShopDashboard from './shopDashboard'
import { ShopGuard } from '@/securityContext/ShopGuard'

export default function DashboardShop() {
  return (
    <div>
      <ShopGuard>
        <ShopDashboard/>
      </ShopGuard>
    </div>
  )
}
