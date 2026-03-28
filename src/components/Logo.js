import React from 'react';

const BRAND = {
  teal:       '#0F766E',
  tealLight:  '#14B8A6',
  navy:       '#0F172A',
  white:      '#FFFFFF',
  whiteMuted: 'rgba(255,255,255,0.15)',
};

const HEX_POINTS = '44,24 34,6.68 14,6.68 4,24 14,41.32 34,41.32';

function HexIcon({ fillColor, barColor, strokeOnly = false }) {
  return (
    <>
      <defs>
        <clipPath id="pharmiq-hex-clip">
          <polygon points={HEX_POINTS} />
        </clipPath>
      </defs>

      <polygon
        points={HEX_POINTS}
        fill={strokeOnly ? BRAND.whiteMuted : fillColor}
        stroke={strokeOnly ? barColor : 'none'}
        strokeWidth={strokeOnly ? 2 : 0}
      />

      <g clipPath="url(#pharmiq-hex-clip)">
        <rect x="11" y="29" width="7" height="10" rx="1.5" fill={barColor} fillOpacity={0.9} />
        <rect x="20.5" y="21" width="7" height="18" rx="1.5" fill={barColor} />
        <rect x="30" y="11" width="7" height="28" rx="1.5" fill={barColor} />
      </g>
    </>
  );
}

function Wordmark({ pharmColor, iqColor }) {
  const font = "'Space Grotesk', 'Sora', system-ui, sans-serif";
  return (
    <>
      <text
        x="0"
        y="28"
        fontFamily={font}
        fontSize={26}
        fontWeight={700}
        letterSpacing="-0.3"
        fill={pharmColor}
      >
        Pharm
      </text>
      <text
        x="80"
        y="28"
        fontFamily={font}
        fontSize={26}
        fontWeight={700}
        letterSpacing="-0.3"
        fill={iqColor}
      >
        IQ
      </text>
    </>
  );
}

export const Logo = ({
  variant = 'full',
  color = 'primary',
  monoColor = BRAND.navy,
  size = 40,
  label,
  className,
}) => {
  const isPrimary  = color === 'primary';
  const isWhite    = color === 'white';
  const isMono     = color === 'mono';

  const iconFill   = isMono ? monoColor : isPrimary ? BRAND.teal   : 'transparent';
  const barFill    = isMono ? BRAND.white : BRAND.white;
  const pharmColor = isMono ? monoColor : isWhite    ? BRAND.white  : BRAND.navy;
  const iqColor    = isMono ? monoColor : isWhite    ? BRAND.tealLight : BRAND.teal;
  const strokeOnly = isWhite;

  if (variant === 'icon') {
    const px = size;
    return (
      <svg
        width={px}
        height={px}
        viewBox="0 0 48 48"
        fill="none"
        aria-label={label ?? 'PharmIQ'}
        className={className}
        role="img"
      >
        <title>PharmIQ</title>
        <HexIcon fillColor={iconFill} barColor={barFill} strokeOnly={strokeOnly} />
      </svg>
    );
  }

  if (variant === 'wordmark') {
    const h = size;
    const w = Math.round(h * (152 / 36));
    return (
      <svg
        width={w}
        height={h}
        viewBox="0 0 152 36"
        fill="none"
        aria-label={label ?? 'PharmIQ'}
        className={className}
        role="img"
      >
        <title>PharmIQ</title>
        <Wordmark pharmColor={pharmColor} iqColor={iqColor} />
      </svg>
    );
  }

  if (variant === 'stacked') {
    const iconSize = size;
    const h = Math.round(iconSize + 12 + 36 * (iconSize / 48));
    return (
      <svg
        width={iconSize}
        height={h}
        viewBox={`0 0 48 ${Math.round(48 + 12 + 36)}`}
        fill="none"
        aria-label={label ?? 'PharmIQ'}
        className={className}
        role="img"
      >
        <title>PharmIQ</title>
        <HexIcon fillColor={iconFill} barColor={barFill} strokeOnly={strokeOnly} />
        <g transform="translate(-52, 60)">
          <Wordmark pharmColor={pharmColor} iqColor={iqColor} />
        </g>
      </svg>
    );
  }

  const h   = size;
  const w   = Math.round(h * (200 / 48));
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 200 48"
      fill="none"
      aria-label={label ?? 'PharmIQ'}
      className={className}
      role="img"
    >
      <title>PharmIQ</title>
      <defs>
        <clipPath id="pharmiq-hex-clip-full">
          <polygon points={HEX_POINTS} />
        </clipPath>
      </defs>

      <polygon
        points={HEX_POINTS}
        fill={strokeOnly ? BRAND.whiteMuted : iconFill}
        stroke={strokeOnly ? BRAND.white : 'none'}
        strokeWidth={strokeOnly ? 2 : 0}
      />
      <g clipPath="url(#pharmiq-hex-clip-full)">
        <rect x="11" y="29" width="7" height="10" rx="1.5" fill={barFill} fillOpacity={0.9} />
        <rect x="20.5" y="21" width="7" height="18" rx="1.5" fill={barFill} />
        <rect x="30" y="11" width="7" height="28" rx="1.5" fill={barFill} />
      </g>

      <g transform="translate(58, 6)">
        <Wordmark pharmColor={pharmColor} iqColor={iqColor} />
      </g>
    </svg>
  );
};

export default Logo;
