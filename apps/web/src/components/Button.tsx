import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

interface ButtonProps extends ComponentProps<"button"> {
  /** Rend l'enfant (un lien, par exemple) avec le style du bouton, au lieu d'un `<button>`. */
  readonly asChild?: boolean;
}

/** Bouton principal. `asChild` permet de styler un `<Link>` sans imbriquer deux éléments. */
export function Button({ asChild = false, className = "", type, ...props }: ButtonProps) {
  const classes =
    "inline-flex items-center justify-center rounded-control bg-primary px-4 py-2 font-medium " +
    "text-on-primary transition-colors hover:bg-primary-hover " +
    "disabled:cursor-not-allowed disabled:opacity-60 " +
    className;

  if (asChild) return <Slot.Root className={classes} {...props} />;
  return <button type={type ?? "button"} className={classes} {...props} />;
}
