import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPageNavBar() {
  return (
    <div className="flex justify-between items-center sm:px-20 px-5 w-full border-2 shadow-md">
      <Link href="/" className="flex items-center gap-2">
         <Image src="/logo-trans.png" alt="Logo" width={70} height={60} />
      </Link>

      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button
            variant="outline"
            className="text-blue-700 h-9 border-blue-700 hover:bg-blue-900 font-semibold text-sm rounded-md px-6  hover:text-white"
          >
            Login
          </Button>
        </Link>

        <Link href="/signup">
          <Button
            variant="default"
            className="bg-blue-900 text-white h-9 px-6 cursor-pointer font-semibold text-sm rounded-md border-slate-50 hover:bg-blue-700"
          >
            Sign Up
          </Button>
        </Link>
      </div>
    </div>
  )
}
