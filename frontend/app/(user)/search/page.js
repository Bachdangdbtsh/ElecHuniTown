import SearchResults from './SearchResults';
import { Suspense } from 'react';

async function SearchContent({ searchParams }) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.trim() : '';
  return <SearchResults key={query} query={query} />;
}

export default function SearchPage({ searchParams }) {
  return <Suspense fallback={<main className="search-page"><p>Đang tải kết quả tìm kiếm...</p></main>}><SearchContent searchParams={searchParams} /></Suspense>;
}
