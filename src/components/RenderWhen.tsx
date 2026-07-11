import React from "react";

interface IfProps {
  isTrue: boolean | null | undefined;
  children: React.ReactNode;
}

/**
 * Declarative conditional rendering:
 *
 *   <RenderWhen.If isTrue={stage === "app"}>
 *     <Feed />
 *   </RenderWhen.If>
 *
 * When `isTrue` is falsy the children are not mounted at all — identical
 * semantics to `cond && <X />`, without the mixed-operator JSX noise.
 */
function If({ isTrue, children }: IfProps): React.ReactNode {
  return isTrue ? <>{children}</> : null;
}

export const RenderWhen = { If };
