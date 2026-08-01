export const PAGE_SIZE = 9;

export interface PageResult<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
}

export function paginate<T>(items: T[], requestedPage: number, pageSize = PAGE_SIZE): PageResult<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    currentPage,
    totalPages,
  };
}
