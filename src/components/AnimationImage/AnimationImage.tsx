import React from "react";
import styled from "styled-components";

interface ImageProps {
  src: string;
  isVisible: boolean;
  imagePosition?: string;
}

interface StyledImageProps {
  imagePosition?: string;
}

const StyledImage = styled.img<StyledImageProps>`
  user-select: none;
  touch-action: none;
  cursor: inherit;
  -webkit-user-drag: none;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: ${(props) => props.imagePosition || 'center'};
`;

const AnimationImage = ({ src, isVisible, imagePosition }: ImageProps) => {
  let d = isVisible ? "block" : "none";
  return (
    <StyledImage
      alt="Rotating object"
      src={src}
      imagePosition={imagePosition}
      style={{ display: `${d}` }}
    ></StyledImage>
  );
};

export default AnimationImage;
