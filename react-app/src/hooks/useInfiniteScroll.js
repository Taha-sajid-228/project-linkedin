import { useEffect, useRef } from "react";

function useInfiniteScroll({
  onLoadMore,
  hasMore,
  loading,
}) {
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasMore || loading) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          hasMore &&
          !loading
        ) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, hasMore, loading]);

  return loadMoreRef;
}

export default useInfiniteScroll;