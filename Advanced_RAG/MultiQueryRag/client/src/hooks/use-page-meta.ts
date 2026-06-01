import * as React from "react";

export function usePageMeta(title: string) {
  React.useEffect(() => {
    document.title = title;
  }, [title]);
}
