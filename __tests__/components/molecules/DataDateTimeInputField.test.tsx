import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DataDateTimeInputField from "@/components/molecules/DataDateTimeInputField";

// Mock the Input and DateTimePicker components
jest.mock("@/components/atoms/input", () => ({
  Input: ({ id, name, type, onChange, value, required, disabled, placeholder }: any) => (
    <input
      id={id}
      name={name}
      type={type}
      onChange={onChange}
      value={value}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      data-testid={`input-${id}`}
    />
  ),
}));

jest.mock("@/components/atoms/datetime-picker", () => ({
  DateTimePicker: ({ value, onChange, disabled, placeholder }: any) => (
    <div data-testid="datetime-picker">
      <input
        type="datetime-local"
        value={value ? value.toISOString().slice(0, 16) : ""}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : undefined)}
        disabled={disabled}
        placeholder={placeholder}
        data-testid="datetime-picker-input"
      />
    </div>
  ),
}));

describe("DataDateTimeInputField", () => {
  const defaultProps = {
    name: "Event Date",
    data_key: "eventDate",
    value: undefined,
    onChange: jest.fn(),
    options: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to suppress component logs
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should render label and datetime picker", () => {
    render(<DataDateTimeInputField {...defaultProps} />);

    expect(screen.getByText("Event Date")).toBeInTheDocument();
    expect(screen.getByTestId("datetime-picker")).toBeInTheDocument();
    expect(screen.getByTestId("input-eventDate")).toBeInTheDocument();
  });

  it("should render with initial unix timestamp value", () => {
    const unixTimestamp = 1640995200; // 2022-01-01 00:00:00 UTC
    const props = {
      ...defaultProps,
      value: unixTimestamp,
    };

    render(<DataDateTimeInputField {...props} />);

    const hiddenInput = screen.getByTestId("input-eventDate");
    expect(hiddenInput).toHaveValue(unixTimestamp.toString());
  });

  it("should handle datetime picker change", () => {
    render(<DataDateTimeInputField {...defaultProps} />);

    const dateTimePicker = screen.getByTestId("datetime-picker-input");
    const testDate = "2023-12-25T10:30";
    
    fireEvent.change(dateTimePicker, { target: { value: testDate } });

    const hiddenInput = screen.getByTestId("input-eventDate");
    const expectedUnixTimestamp = Math.floor(new Date(testDate).getTime() / 1000);
    expect(hiddenInput).toHaveValue(expectedUnixTimestamp.toString());
  });

  it("should handle clearing the datetime", () => {
    const props = {
      ...defaultProps,
      value: 1640995200,
    };

    render(<DataDateTimeInputField {...props} />);

    const dateTimePicker = screen.getByTestId("datetime-picker-input");
    fireEvent.change(dateTimePicker, { target: { value: "" } });

    const hiddenInput = screen.getByTestId("input-eventDate");
    expect(hiddenInput).toHaveValue("0");
  });

  it("should convert unix timestamp to date correctly", () => {
    const unixTimestamp = 1640995200; // 2022-01-01 00:00:00 UTC
    const props = {
      ...defaultProps,
      value: unixTimestamp,
    };

    render(<DataDateTimeInputField {...props} />);

    const dateTimePicker = screen.getByTestId("datetime-picker-input");
    const expectedDate = new Date(unixTimestamp * 1000);
    expect(dateTimePicker).toHaveValue(expectedDate.toISOString().slice(0, 16));
  });

  it("should handle undefined value", () => {
    render(<DataDateTimeInputField {...defaultProps} />);

    const dateTimePicker = screen.getByTestId("datetime-picker-input");
    expect(dateTimePicker).toHaveValue("");

    const hiddenInput = screen.getByTestId("input-eventDate");
    expect(hiddenInput).toHaveValue("");
  });

  it("should handle zero timestamp", () => {
    const props = {
      ...defaultProps,
      value: 0,
    };

    render(<DataDateTimeInputField {...props} />);

    const dateTimePicker = screen.getByTestId("datetime-picker-input");
    const expectedDate = new Date(0);
    expect(dateTimePicker).toHaveValue(expectedDate.toISOString().slice(0, 16));
  });

  it("should pass required prop to hidden input", () => {
    const props = {
      ...defaultProps,
      required: true,
    };

    render(<DataDateTimeInputField {...props} />);

    const hiddenInput = screen.getByTestId("input-eventDate");
    expect(hiddenInput).toHaveAttribute("required");
  });

  it("should pass disabled prop to both inputs", () => {
    const props = {
      ...defaultProps,
      disabled: true,
    };

    render(<DataDateTimeInputField {...props} />);

    const dateTimePicker = screen.getByTestId("datetime-picker-input");
    const hiddenInput = screen.getByTestId("input-eventDate");
    
    expect(dateTimePicker).toBeDisabled();
    expect(hiddenInput).toBeDisabled();
  });

  it("should pass placeholder to datetime picker", () => {
    const props = {
      ...defaultProps,
      placeholder: "Select event date",
    };

    render(<DataDateTimeInputField {...props} />);

    const dateTimePicker = screen.getByTestId("datetime-picker-input");
    expect(dateTimePicker).toHaveAttribute("placeholder", "Select event date");
  });

  it("should use empty string as default placeholder", () => {
    render(<DataDateTimeInputField {...defaultProps} />);

    const dateTimePicker = screen.getByTestId("datetime-picker-input");
    expect(dateTimePicker).toHaveAttribute("placeholder", "");
  });

  it("should render hidden input with correct attributes", () => {
    render(<DataDateTimeInputField {...defaultProps} />);

    const hiddenInput = screen.getByTestId("input-eventDate");
    expect(hiddenInput).toHaveAttribute("type", "hidden");
    expect(hiddenInput).toHaveAttribute("name", "eventDate");
    expect(hiddenInput).toHaveAttribute("id", "eventDate");
  });

  it("should log props to console", () => {
    const consoleSpy = jest.spyOn(console, "log");
    
    render(<DataDateTimeInputField {...defaultProps} />);

    expect(consoleSpy).toHaveBeenCalledWith("props", defaultProps);
  });

  it("should handle large unix timestamps", () => {
    const largeTimestamp = 2147483647; // Max 32-bit timestamp (2038-01-19)
    const props = {
      ...defaultProps,
      value: largeTimestamp,
    };

    render(<DataDateTimeInputField {...props} />);

    const hiddenInput = screen.getByTestId("input-eventDate");
    expect(hiddenInput).toHaveValue(largeTimestamp.toString());
  });

  it("should handle negative unix timestamps", () => {
    const negativeTimestamp = -86400; // 1969-12-31
    const props = {
      ...defaultProps,
      value: negativeTimestamp,
    };

    render(<DataDateTimeInputField {...props} />);

    const hiddenInput = screen.getByTestId("input-eventDate");
    expect(hiddenInput).toHaveValue(negativeTimestamp.toString());
  });

  it("should apply col-span-full class", () => {
    const { container } = render(<DataDateTimeInputField {...defaultProps} />);
    
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass("col-span-full");
  });

  it("should handle options parameter", () => {
    const props = {
      ...defaultProps,
      options: { someOption: "value" },
    };

    // Should not crash with options present
    render(<DataDateTimeInputField {...props} />);
    expect(screen.getByText("Event Date")).toBeInTheDocument();
  });
});