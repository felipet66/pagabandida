import React from "react";

// A URL remains supported for custom banners; generated assets include srcSet and dimensions.
export default function ResponsiveImage({ image, alt, sizes, fetchPriority, ...props }) {
  const { sources = [], ...source } = typeof image === "string" ? { src: image } : image;
  const fallback = <img {...source} sizes={source.srcSet ? sizes : undefined} decoding="async" fetchpriority={fetchPriority} {...props} alt={alt} />;
  if (!sources.length) return fallback;
  // No wrapper box: the image keeps its existing position in grid/flex layouts.
  return <picture style={{ display: "contents" }}>
    {sources.map(({ srcSet, ...attributes }, index) => <source key={index} {...attributes} srcSet={srcSet} sizes={sizes} style={{ display: "none" }} />)}
    {fallback}
  </picture>;
}
