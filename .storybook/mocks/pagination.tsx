type PaginationProps = {
  basePath: string;
  count: number;
  limit: number;
  offset: number;
};

export default function Pagination({
  basePath,
  count,
  limit,
  offset,
}: PaginationProps) {
  const start = count > 0 ? offset + 1 : 0;
  const end = Math.min(offset + limit, count);

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <p className="text-sm text-gray-700" data-testid="pagination-info">
        {count > 0 ? (
          <>
            <span className="font-medium" data-testid="pagination-start">
              {start}
            </span>{" "}
            -{" "}
            <span className="font-medium" data-testid="pagination-end">
              {end}
            </span>{" "}
            /{" "}
            <span className="font-medium" data-testid="pagination-total">
              {count}
            </span>
          </>
        ) : (
          <span data-testid="no-results-message">No results found</span>
        )}
      </p>
      <a
        className="text-sm font-medium text-gray-700 hover:text-gray-900"
        href={`${basePath}?offset=${Math.max(0, offset - limit)}&limit=${limit}`}
      >
        Previous
      </a>
    </div>
  );
}
