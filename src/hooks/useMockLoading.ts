"use client";

import * as React from "react";

export function useMockLoading(duration = 350) {
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), duration);
    return () => window.clearTimeout(timer);
  }, [duration]);
  return loading;
}
