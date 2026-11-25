import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button.tsx";

describe("Button", () => {
  it("est un bouton de type button par défaut, pour ne pas soumettre un formulaire", () => {
    render(<Button>Valider</Button>);
    expect(screen.getByRole("button", { name: "Valider" })).toHaveAttribute("type", "button");
  });

  it("asChild : rend l'enfant avec le style du bouton, sans bouton imbriqué", () => {
    render(
      <Button asChild>
        <a href="/">Accueil</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Accueil" });
    expect(link).toHaveClass("bg-primary");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
