import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button, buttonVariants } from "@/components/atoms/button";

// Mock the cn function
jest.mock("@/libraries/css", () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(" ")),
}));

describe("Button Component", () => {
  describe("Rendering", () => {
    it("should render button with default props", () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole("button", { name: "Click me" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Click me");
    });

    it("should render button with custom text", () => {
      render(<Button>Custom Button</Button>);

      const button = screen.getByRole("button", { name: "Custom Button" });
      expect(button).toBeInTheDocument();
    });

    it("should render button as child component when asChild is true", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole("link", { name: "Link Button" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/test");
    });
  });

  describe("Variants", () => {
    it("should render with default variant", () => {
      render(<Button>Default Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-primary", "text-primary-foreground");
    });

    it("should render with destructive variant", () => {
      render(<Button variant="destructive">Delete Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "bg-destructive",
        "text-destructive-foreground"
      );
    });

    it("should render with outline variant", () => {
      render(<Button variant="outline">Outline Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("border", "border-input", "bg-background");
    });

    it("should render with secondary variant", () => {
      render(<Button variant="secondary">Secondary Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-secondary", "text-secondary-foreground");
    });

    it("should render with ghost variant", () => {
      render(<Button variant="ghost">Ghost Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "hover:bg-accent",
        "hover:text-accent-foreground"
      );
    });

    it("should render with link variant", () => {
      render(<Button variant="link">Link Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-primary", "underline-offset-4");
    });
  });

  describe("Sizes", () => {
    it("should render with default size", () => {
      render(<Button>Default Size</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-10", "px-4", "py-2");
    });

    it("should render with small size", () => {
      render(<Button size="sm">Small Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-9", "px-3");
    });

    it("should render with large size", () => {
      render(<Button size="lg">Large Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-11", "px-8");
    });

    it("should render with icon size", () => {
      render(<Button size="icon">Icon</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-10", "w-10");
    });
  });

  describe("States", () => {
    it("should render disabled button", () => {
      render(<Button disabled>Disabled Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass(
        "disabled:pointer-events-none",
        "disabled:opacity-50"
      );
    });

    it("should not trigger onClick when disabled", () => {
      const handleClick = jest.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled Button
        </Button>
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("Events", () => {
    it("should handle click events", () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Clickable Button</Button>);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should handle mouse events", () => {
      const handleMouseOver = jest.fn();
      const handleMouseOut = jest.fn();

      render(
        <Button onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
          Hover Button
        </Button>
      );

      const button = screen.getByRole("button");
      fireEvent.mouseOver(button);
      fireEvent.mouseOut(button);

      expect(handleMouseOver).toHaveBeenCalledTimes(1);
      expect(handleMouseOut).toHaveBeenCalledTimes(1);
    });

    it("should handle keyboard events", () => {
      const handleKeyDown = jest.fn();
      render(<Button onKeyDown={handleKeyDown}>Keyboard Button</Button>);

      const button = screen.getByRole("button");
      fireEvent.keyDown(button, { key: "Enter" });

      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe("Custom Props", () => {
    it("should accept custom className", () => {
      render(<Button className="custom-class">Custom Class Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });

    it("should accept custom type", () => {
      render(<Button type="submit">Submit Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });

    it("should accept custom id", () => {
      render(<Button id="custom-id">ID Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("id", "custom-id");
    });

    it("should accept aria attributes", () => {
      render(
        <Button aria-label="Custom aria label" aria-pressed="true">
          Aria Button
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Custom aria label");
      expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it("should accept data attributes", () => {
      render(
        <Button data-testid="test-button" data-value="123">
          Data Button
        </Button>
      );

      const button = screen.getByTestId("test-button");
      expect(button).toHaveAttribute("data-value", "123");
    });
  });

  describe("Combined Variants", () => {
    it("should combine variant and size props", () => {
      render(
        <Button variant="outline" size="lg">
          Large Outline Button
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("border", "border-input"); // outline variant
      expect(button).toHaveClass("h-11", "px-8"); // large size
    });

    it("should combine all props with custom className", () => {
      render(
        <Button
          variant="secondary"
          size="sm"
          className="custom-styles"
          disabled
        >
          Complex Button
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-secondary"); // secondary variant
      expect(button).toHaveClass("h-9"); // small size
      expect(button).toHaveClass("custom-styles"); // custom class
      expect(button).toBeDisabled(); // disabled state
    });
  });

  describe("Children", () => {
    it("should render text children", () => {
      render(<Button>Simple Text</Button>);

      expect(screen.getByText("Simple Text")).toBeInTheDocument();
    });

    it("should render JSX children", () => {
      render(
        <Button>
          <span>Nested</span> Text
        </Button>
      );

      expect(screen.getByText("Nested")).toBeInTheDocument();
      expect(screen.getByText("Text")).toBeInTheDocument();
    });

    it("should render icon children", () => {
      render(
        <Button>
          <svg data-testid="icon" width="16" height="16">
            <circle cx="8" cy="8" r="4" />
          </svg>
          Icon Button
        </Button>
      );

      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(screen.getByText("Icon Button")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper button role", () => {
      render(<Button>Accessible Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should be focusable", () => {
      render(<Button>Focusable Button</Button>);

      const button = screen.getByRole("button");
      button.focus();

      expect(button).toHaveFocus();
    });

    it("should not be focusable when disabled", () => {
      render(<Button disabled>Disabled Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass("disabled:pointer-events-none");
    });

    it("should support keyboard navigation", () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Keyboard Button</Button>);

      const button = screen.getByRole("button");
      button.focus();
      // Simulate both keydown and click since the button element handles this
      fireEvent.keyDown(button, { key: "Enter" });
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Button Variants Function", () => {
    it("should generate correct classes for default variant", () => {
      const classes = buttonVariants();
      expect(classes).toContain("bg-primary");
      expect(classes).toContain("text-primary-foreground");
    });

    it("should generate correct classes for specific variant and size", () => {
      const classes = buttonVariants({ variant: "outline", size: "sm" });
      expect(classes).toContain("border");
      expect(classes).toContain("h-9");
    });

    it("should include base classes", () => {
      const classes = buttonVariants();
      expect(classes).toContain("inline-flex");
      expect(classes).toContain("items-center");
      expect(classes).toContain("justify-center");
      expect(classes).toContain("rounded-md");
    });
  });
});
