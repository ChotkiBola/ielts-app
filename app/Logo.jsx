"use client";
import React from "react";

/*
 * Brand mark: a minimal, symmetric butterfly built from four curved wing
 * lobes around a single body line, using the app's accent gradient.
 */
export default function Logo({ size = 24, style = {} }) {
  const id = React.useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, ...style }} aria-hidden="true">
      <defs>
        <linearGradient id={`lg${id}`} x1="2" y1="4" x2="38" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--accent, #6D4FE0)" />
          <stop offset="1" stopColor="var(--accent2, #C13D8F)" />
        </linearGradient>
      </defs>
      {/* antennae */}
      <path d="M20 8c-2-4-6-6-6-6" stroke={`url(#lg${id})`} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M20 8c2-4 6-6 6-6" stroke={`url(#lg${id})`} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* body */}
      <line x1="20" y1="9" x2="20" y2="31" stroke={`url(#lg${id})`} strokeWidth="1.6" strokeLinecap="round" />
      {/* upper wings */}
      <path d="M20 11c-6-9-18-8-18 1 0 7 8 10 18 6z" fill={`url(#lg${id})`} opacity=".92" />
      <path d="M20 11c6-9 18-8 18 1 0 7-8 10-18 6z" fill={`url(#lg${id})`} opacity=".92" />
      {/* lower wings */}
      <path d="M20 20c-5-6-13-4-13 3 0 5 6 7 13 4z" fill={`url(#lg${id})`} opacity=".76" />
      <path d="M20 20c5-6 13-4 13 3 0 5-6 7-13 4z" fill={`url(#lg${id})`} opacity=".76" />
    </svg>
  );
}
