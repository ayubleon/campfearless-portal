// How many pages a list of `total` rows takes at `pageSize` rows a page (never fewer than one).
export const pageCount = (total: number, pageSize: number) => Math.max(1, Math.ceil(total / pageSize))
