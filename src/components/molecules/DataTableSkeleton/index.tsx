import { Skeleton } from "@/components/atoms/skeleton";

type DataTableSkeletonProps = {
  columnCount: number;
  rowCount?: number;
};

export default function DataTableSkeleton({
  columnCount,
  rowCount = 5,
}: DataTableSkeletonProps) {
  return (
    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 text-stone-800">
      <div className="px-4 sm:px-6 lg:px-8">
        {/* ヘッダー部分のスケルトン */}
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* テーブル部分のスケルトン */}
        <div className="mt-8 flow-root">
          <div className="-my-2 py-2">
            <div
              className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg"
              data-testid="datatable-skeleton-frame"
            >
              <div
                className="overflow-x-auto scrollbar-hidden"
                data-testid="datatable-skeleton-scroll-container"
              >
                <div
                  className="inline-block min-w-full align-middle"
                  data-testid="datatable-skeleton-width-wrapper"
                >
                  <div className="min-w-full divide-y divide-gray-300">
                    {/* テーブルヘッダーのスケルトン */}
                    <div className="bg-gray-50 p-4">
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-4">
                        {Array.from({ length: columnCount }).map((_, i) => (
                          <Skeleton key={i} className="h-4" />
                        ))}
                      </div>
                    </div>

                    {/* テーブル行のスケルトン */}
                    {Array.from({ length: rowCount }).map((_, row) => (
                      <div key={row} className="p-4">
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-4">
                          {Array.from({ length: columnCount }).map((_, col) => (
                            <Skeleton key={col} className="h-4" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
