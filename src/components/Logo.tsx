import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Elitera Logo"
      {...props}
    >
      <path
        d="M9 4H19.5C21.9853 4 24 6.01472 24 8.5V26C24 27.1046 23.1046 28 22 28H9C8.44772 28 8 27.5523 8 27V5C8 4.44772 8.44772 4 9 4Z"
        className="fill-primary"
      />
      <path
        d="M16 8V24"
        className="stroke-primary-foreground"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 8H9"
        className="stroke-primary-foreground"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
