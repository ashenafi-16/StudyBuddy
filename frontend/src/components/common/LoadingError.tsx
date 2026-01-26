export const Loading = () => (
  <p className="text-gray-500 p-4 animate-pulse">Loading dashboard...</p>
);

export const ErrorMessage = ({ error }: { error: string }) => (
  <div className="p-6 bg-red-50 text-red-600 rounded-md border border-red-200">
    <p>{error}</p>
  </div>
);
