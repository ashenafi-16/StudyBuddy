export const Loading = () => (
  <div className="flex flex-col items-center justify-center w-full min-h-[60vh] gap-3">
    <div className="w-8 h-8 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
    <p className="text-slate-500 animate-pulse text-sm">Loading...</p>
  </div>
);

export const ErrorMessage = ({ error }: { error: string }) => (
  <div className="p-6 bg-red-50 text-red-600 rounded-md border border-red-200">
    <p>{error}</p>
  </div>
);
