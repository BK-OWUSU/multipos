"use client"
// import LandingPage from "@/components/landingpage/landing-page";
import MultiPOSLandingPage from "@/components/landing-page/landing-page";
import { useAuthStore } from "@/store/useAuthStore";


export default function Home() {
  const { currentSlug, isLoggedIn } = useAuthStore();
  return (
    <main>
      {/* <LandingPage/> */}
      <MultiPOSLandingPage currentSlug = {currentSlug || ""} isLoggedIn = {isLoggedIn}/>
    </main>
  );
}
