import * as React from "react";

export function useMounted() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  return mounted;
}
