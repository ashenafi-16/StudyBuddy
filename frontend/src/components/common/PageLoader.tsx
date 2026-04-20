import { LoaderIcon } from "lucide-react"

const PageLoader = () => {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-[#0f172a]">
      <LoaderIcon className="size-10 animate-spin text-emerald-500" />
    </div>
  )
}

export default PageLoader
