import React from "react";

const AviatorFrame = ({ src, title }) => (
  <iframe
    className="pr-2 pl-2 col-md-12"
    width="100%"
    height="700"
    title={title}
    style={{
      borderRadius: 40,
      border: "2px solid #e30613",
      display: "block",
      height: 700,
      minHeight: 700,
    }}
    src={src}
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  ></iframe>
);

export default AviatorFrame;
