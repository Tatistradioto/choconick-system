export default function BudgetDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-border/50" />
        <div className="space-y-2">
          <div className="h-7 w-64 bg-border/50 rounded" />
          <div className="h-4 w-48 bg-border/50 rounded" />
        </div>
      </div>
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div className="flex justify-between">
          <div className="h-6 w-24 bg-border/50 rounded-full" />
          <div className="h-7 w-28 bg-border/50 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-4 bg-border/50 rounded" style={{ width: i % 2 ? "40%" : "60%" }} />
          ))}
        </div>
      </div>
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="h-6 w-20 bg-border/50 rounded mb-3" />
        <div className="flex gap-3">
          <div className="h-10 w-36 bg-border/50 rounded-lg" />
          <div className="h-10 w-36 bg-border/50 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
