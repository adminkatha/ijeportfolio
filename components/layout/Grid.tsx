import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type BoxProps<T extends ElementType> = {
  as?: T;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/** The centred 1280px column with the responsive 16/24px gutter. */
export function Container<T extends ElementType = "div">({ as, className = "", children, ...rest }: BoxProps<T>) {
  const Tag = as ?? "div";
  return (
    <Tag className={`container-site ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/** The 12-column grid. Children place themselves with col-span-* / col-start-*. */
export function Grid<T extends ElementType = "div">({ as, className = "", children, ...rest }: BoxProps<T>) {
  const Tag = as ?? "div";
  return (
    <Tag className={`grid-12 ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
