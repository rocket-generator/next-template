"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  testId?: string;
};

const INTERACTIVE_TARGET_SELECTOR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  '[role="button"]',
  '[role="link"]',
  '[data-row-click-ignore="true"]',
].join(",");

const ClickableRow = ({ href, children, className, testId }: Props) => {
  const router = useRouter();

  const isInteractiveTarget = (target: EventTarget | null) => {
    return (
      target instanceof Element &&
      target.closest(INTERACTIVE_TARGET_SELECTOR) !== null
    );
  };

  const navigateToDetail = () => {
    router.push(href);
  };

  const handleClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if (event.defaultPrevented || isInteractiveTarget(event.target)) {
      return;
    }

    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    navigateToDetail();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.defaultPrevented || isInteractiveTarget(event.target)) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    navigateToDetail();
  };

  return (
    <tr
      tabIndex={0}
      className={className}
      data-testid={testId}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </tr>
  );
};

export default ClickableRow;
