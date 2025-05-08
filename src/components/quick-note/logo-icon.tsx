import type { SVGProps } from 'react';

export function LogoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M13.5 2H6.5C5.5 2 5 2.5 5 3.5V20.5C5 21.5 5.5 22 6.5 22H17.5C18.5 22 19 21.5 19 20.5V8.5L13.5 2Z" />
      <path d="M13 2V9H20" />
      <path d="M9 14H15" />
      <path d="M9 18H12" />
    </svg>
  );
}
