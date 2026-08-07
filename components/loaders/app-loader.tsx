import { FaCashRegister } from 'react-icons/fa'

function AppLoader() {
  return (
     <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-800"></div>
            <FaCashRegister className="h-4 w-4 text-blue-800 absolute animate-pulse" />
          </div>
          <p className="animate-pulse text-sm font-semibold text-slate-500 tracking-wider">
            Syncing your workspace...
          </p>
        </div>
    </div>
  )
}

export default AppLoader