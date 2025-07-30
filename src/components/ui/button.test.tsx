import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button component", () => {
  it("should render with default props", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeDefined();
    expect(button.textContent).toBe("Click me");
  });

  it("should apply variant classes correctly", () => {
    render(<Button variant="destructive">Delete</Button>);

    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.className).toContain("bg-destructive");
  });

  it("should apply size classes correctly", () => {
    render(<Button size="lg">Large Button</Button>);

    const button = screen.getByRole("button", { name: "Large Button" });
    expect(button.className).toContain("h-10");
  });
});
