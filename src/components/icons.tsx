import type { SVGProps } from 'react';

/** Simple line icons drawn for this prototype (no third-party or brand assets). */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, strokeWidth = 1.8, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const BellIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 1.8H4.4L6 16.5Z" />
    <path d="M10 20.8a2.1 2.1 0 0 0 4 0" />
  </Svg>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </Svg>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Svg>
);

export const BarsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 20v-7M12 20V5M19 20v-10" />
  </Svg>
);

export const InfoIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.6v.1" />
  </Svg>
);

export const DownloadIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
  </Svg>
);

export const HomeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 10.5 12 4l8 6.5V20h-5.5v-6h-5v6H4v-9.5Z" />
  </Svg>
);

export const SproutIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21V11" />
    <path d="M12 12c0-3.5 2.5-6 6.5-6 0 3.8-2.6 6-6.5 6Z" />
    <path d="M12 10.5C12 7.6 9.9 5.5 6 5.5c0 3.2 2.3 5 6 5Z" />
  </Svg>
);

export const TransferIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 9h13l-3-3M19 15H6l3 3" />
  </Svg>
);

export const GiftIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="8" width="17" height="4" rx="0.6" />
    <path d="M5 12v8.5h14V12M12 8v12.5" />
    <path d="M12 8c-1.4-3.6-5.6-4-5.6-1.8C6.4 8 9.8 8 12 8Zm0 0c1.4-3.6 5.6-4 5.6-1.8C17.6 8 14.2 8 12 8Z" />
  </Svg>
);

export const MoreIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="7" cy="7" r="2.6" />
    <circle cx="17" cy="7" r="2.6" />
    <circle cx="7" cy="17" r="2.6" />
    <circle cx="17" cy="17" r="2.6" />
  </Svg>
);

export const FilterIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M7 12h10M10 17h4" />
  </Svg>
);

export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </Svg>
);

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m7 7 10 10M17 7 7 17" />
  </Svg>
);

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

export const ScanIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8.5V6a2 2 0 0 1 2-2h2.5M15.5 4H18a2 2 0 0 1 2 2v2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5M8.5 20H6a2 2 0 0 1-2-2v-2.5M7.5 12h9" />
  </Svg>
);

export const EyeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);

export const EyeOffIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.9 5.8A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.7 3.4M6.3 7.3A15.6 15.6 0 0 0 2.5 12S6 18.5 12 18.5c1.7 0 3.2-.5 4.5-1.2M9.9 9.9a2.8 2.8 0 0 0 4 4M4 4l16 16" />
  </Svg>
);

export const GearIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6" />
  </Svg>
);

/** A phone sending money: a neutral stand-in for instant transfers (no third-party logo). */
export const PhonePayIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.2" />
    <path d="M10.5 18.5h3M12 7v6M9.8 9.2 12 7l2.2 2.2" />
  </Svg>
);
