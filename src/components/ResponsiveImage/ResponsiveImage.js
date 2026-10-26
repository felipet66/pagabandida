import React from "react";

// A URL remains supported for custom banners; generated assets include srcSet and dimensions.
export default function ResponsiveImage({ image, alt, sizes, ...props }) {
  const source = typeof image === "string" ? { src: image } : image;
  return <img {...source} sizes={source.srcSet ? sizes : undefined} decoding="async" {...props} alt={alt} />;
}
