export default function SpinachLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M24 42C24 42 8 32 8 18C8 10 14 6 20 8C22 4 26 4 28 8C34 6 40 10 40 18C40 32 24 42 24 42Z"
        fill="#059669"
        opacity="0.15"
      />
      <path
        d="M24 40V16"
        stroke="#047857"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M24 28C24 28 14 24 12 16C10 10 16 8 20 12"
        stroke="#10B981"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M24 24C24 24 34 20 36 12C38 6 32 4 28 8"
        stroke="#10B981"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M24 20C24 20 18 18 16 12C14 8 18 6 21 9"
        stroke="#34D399"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M24 18C24 18 30 16 32 10C34 6 30 4 27 7"
        stroke="#34D399"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="24" cy="14" rx="3" ry="5" fill="#059669" opacity="0.3" />
    </svg>
  );
}
