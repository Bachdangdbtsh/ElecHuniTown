import SearchResults from './SearchResults';
import { Suspense } from 'react';

async function SearchContent({ searchParams }) {
  const params = await searchParams;
  const rawQuery = params.q ?? params.key;
  const query = typeof rawQuery === 'string' ? rawQuery.trim() : '';
  return <SearchResults key={query} query={query} />;
}

export default function SearchPage({ searchParams }) {
  return <Suspense fallback={<main className="search-page"><p>Đang tải kết quả tìm kiếm...</p></main>}><SearchContent searchParams={searchParams} /></Suspense>;
}
