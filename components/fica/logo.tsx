/** Redrawn from the original bitmap. The letters turn light in dark mode. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <p className="flex items-center gap-2.5 text-xl font-semibold tracking-tight">
      <svg
        viewBox="70 195 810 770"
        aria-hidden="true"
        className="h-9 w-auto shrink-0 text-[#0b224a] dark:text-foreground"
      >
        <g fill="currentColor">
          <path
            fillRule="evenodd"
            d="M80 370H345C460 370 545 450 545 570C545 650 500 712 432 742L572 952H425L302 767H208V952H80ZM208 480V660H335C388 660 418 625 418 570C418 515 388 480 335 480Z"
          />
          <path d="M735 370H860V750C860 878 788 955 680 955H618L528 820L570 792C598 820 630 833 663 833C710 833 735 805 735 745Z" />
        </g>
        <g stroke="#f4862a" fill="none">
          <path strokeWidth="34" d="M803 270 630 449" />
          <path strokeWidth="20" d="M630 449 629 625" />
          <path strokeWidth="6" opacity=".5" d="M592 655Q530 685 475 735" />
        </g>
        <g fill="#f4862a">
          <circle cx="803" cy="270" r="67" />
          <circle cx="630" cy="449" r="50" />
          <circle cx="629" cy="625" r="39" />
        </g>
      </svg>
      {!compact && "RJ.connect"}
    </p>
  )
}
