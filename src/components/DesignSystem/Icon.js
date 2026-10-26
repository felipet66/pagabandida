import React, { forwardRef } from "react";

// Pass a statically imported lucide-react icon as `as` so unused icons stay out of the bundle.
const Icon = forwardRef(function Icon({ as: Glyph, size = 20, label, className = "", ...props }, ref) {
  return <Glyph {...props} ref={ref} className={`ds-icon ${className}`.trim()} size={size} color="currentColor"
    strokeWidth={1.75} focusable="false" role={label ? "img" : undefined}
    aria-label={label} aria-hidden={label ? undefined : true} />;
});

export default Icon;
