import React, { useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import AnimationImage from "../AnimationImage/AnimationImage";
import StyledRotateIcon from "../icons/StyledRotateIcon";
import type { HtmlHTMLAttributes, ReactNode } from "react";

// The regular % can return negative numbers.
function moduloWithoutNegative(value: number, n: number): number {
  return ((value % n) + n) % n;
}

export type ZeroPadRange = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface React360ViewerProps {
  imagesCount: number;
  imagesBaseUrl: string;
  imageIndexSeparator?: string;
  imagesFiletype: string;
  imageFilenamePrefix: string;
  imageInitialIndex?: number;
  mouseDragSpeed?: number;
  autoplaySpeed?: number;
  reverse?: boolean;
  inertia?: boolean;
  autoplay?: boolean;
  autoplayTarget?: number;
  autoplayLoop?: boolean;
  stopAutoplayOnInteraction?: boolean;
  width?: number;
  height?: number;
  zeroPad?: ZeroPadRange;
  showRotationIconOnStartup?: boolean;
  customRotationIcon?: () => ReactNode;
  notifyOnPointerDown?: (x: number, y: number) => void;
  notifyOnPointerUp?: (x: number, y: number) => void;
  notifyOnPointerMoved?: (x: number, y: number) => void;
  shouldNotifyEvents?: boolean;
  className?: string;
  imagePosition?: string;
}

/** Base props *and* all available HTML div element props. */
export type React360ViewerPropsExtended = HtmlHTMLAttributes<HTMLDivElement> &
  React360ViewerProps;

interface StyleProps {
  isGrabbing: boolean;
}

const StyledDiv = styled.div<StyleProps>`
  position: relative;
  border: none;
  width: 100%;
  height: 100%;
  display: inline-block;
  user-select: none;
  touch-action: none;
  ${(props) =>
    props.isGrabbing
      ? css`
          cursor: grabbing;
        `
      : css`
          cursor: pointer;
        `};
`;

export const React360Viewer = ({
  imagesCount,
  imagesBaseUrl,
  imageIndexSeparator,
  imagesFiletype,
  imageFilenamePrefix,
  mouseDragSpeed = 20,
  reverse = false,
  inertia = false,
  autoplaySpeed = 10,
  autoplay = false,
  autoplayTarget,
  autoplayLoop = true,
  stopAutoplayOnInteraction = true,
  width = 150,
  height = 150,
  zeroPad = 0,
  showRotationIconOnStartup = false,
  customRotationIcon,
  imageInitialIndex = 0,
  shouldNotifyEvents = false,
  notifyOnPointerDown,
  notifyOnPointerUp,
  notifyOnPointerMoved,
  className = '',
  imagePosition,
}: React360ViewerPropsExtended) => {
  const elementRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [initialMousePosition, setInitialMousePosition] = useState(0);
  const [startingImageIndexOnPointerDown, setStartingImageIndexOnPointerDown] =
    useState(0);
  const [currentMousePosition, setCurrentMousePosition] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageSources, setImageSources] = useState<
    Array<{ src: string; index: string }>
  >([]);

  const currentMousePositionRef = useRef<number>(0);
  const targetMousePositionRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const [showRotationIcon, setShowRotationIcon] = useState(
    showRotationIconOnStartup
  );

  const [useAutoplay, setUseAutoplay] = useState(autoplay);

  useEffect(() => {
    setUseAutoplay(autoplay);

    setShowRotationIcon(!autoplay && showRotationIconOnStartup);
  }, [autoplay, showRotationIconOnStartup]);

  useEffect(() => {
    if (typeof imageInitialIndex === "undefined") return;
    if (imageInitialIndex < 0 || imageInitialIndex >= imagesCount) {
      setSelectedImageIndex(imageInitialIndex);
      console.log(
        `ImageInitialIndex of ${imageInitialIndex} was out of bounds of 0 and count: ${imagesCount}`
      );
    }

    setSelectedImageIndex(imageInitialIndex);
  }, [imageInitialIndex, imagesCount]);

  useEffect(() => {
    if (!useAutoplay) return;

    const timer = setTimeout(() => {
      incrementImageIndex(1);
    }, 1000 / autoplaySpeed);

    return () => clearTimeout(timer);
  });

  const incrementImageIndex = (change: number) => {
    let index = moduloWithoutNegative(
      selectedImageIndex + (reverse ? -1 : 1) * Math.floor(change),
      imagesCount
    );

    setSelectedImageIndex(index);

    if (autoplayTarget !== undefined && index === autoplayTarget && !autoplayLoop) {
      setUseAutoplay(false);
    }
  };

  useEffect(() => {
    function createImageSources() {

      let baseUrl;

      if (imageIndexSeparator !== undefined) {
        baseUrl = imagesBaseUrl + imageIndexSeparator;
      } else {
        baseUrl = imagesBaseUrl.endsWith("/")
          ? imagesBaseUrl
          : imagesBaseUrl + "/";
      };

      let srces = [];
      let fileType = imagesFiletype.replace(".", "");
      for (let i = 1; i <= imagesCount; i++) {
        srces.push({
          src: `${baseUrl}${imageFilenamePrefix ? imageFilenamePrefix : ""}${!!zeroPad ? String(i).padStart(zeroPad + 1, "0") : i
            }.${fileType}`,
          index: i.toString(),
        });
      }
      return srces;
    }
    setImageSources(createImageSources());
  }, [
    imagesBaseUrl,
    imagesFiletype,
    imagesCount,
    imageFilenamePrefix,
    zeroPad,
  ]);

  const onMouseDown = (e: React.MouseEvent) => {
    setInitialMousePosition(e.clientX);
    setCurrentMousePosition(e.clientX);

    currentMousePositionRef.current = e.clientX;
    targetMousePositionRef.current = e.clientX;

    setStartingImageIndexOnPointerDown(selectedImageIndex);
    setUseAutoplay(false);
    setIsScrolling(true);
    setShowRotationIcon(false);

    document.addEventListener(
      "mouseup",
      () => {
        onMouseUp();
      },
      { once: true }
    );

    if (shouldNotifyEvents) notifyOnPointerDown?.(e.clientX, e.clientY);
  };

  const onMouseUp = (e?: React.MouseEvent) => {
    setIsScrolling(false);

    if(autoplay && !stopAutoplayOnInteraction)
      setUseAutoplay(true);

    if (!shouldNotifyEvents) return;

    if (typeof e !== "undefined") notifyOnPointerUp?.(e?.clientX, e.clientY);
    else {
      notifyOnPointerUp?.(0, 0);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isScrolling) return;

    targetMousePositionRef.current = e.clientX;

    if(!inertia)
      setCurrentMousePosition(e.clientX);

    if (shouldNotifyEvents) notifyOnPointerMoved?.(e.clientX, e.clientY);
  };

  useEffect(() => {
    const imageIndexWithOffset = (start: number, offset: number) => {
      let index = moduloWithoutNegative(
        start + (reverse ? -1 : 1) * Math.floor(offset),
        imagesCount
      );
      setSelectedImageIndex(index);
    };

    // Aim is to get a speedfactor that can be easily adjusted from a user perspective
    // as well as proportionate to the size of the image.
    const scaleFactor = 100;
    let speedFactor =
      (1 / mouseDragSpeed) * ((imagesCount * width) / scaleFactor);
    const changeInX = currentMousePosition - initialMousePosition;

    let difference = changeInX / speedFactor;

    imageIndexWithOffset(startingImageIndexOnPointerDown, difference);
  }, [
    currentMousePosition,
    imagesCount,
    startingImageIndexOnPointerDown,
    initialMousePosition,
    isScrolling,
    mouseDragSpeed,
    width,
    height,
    reverse,
  ]);

  const lerp = (start:number, end:number, t:number) => {
    return start + (end - start) * t;
  }

  const lerpRotation = () => {

    const offset = Math.abs(targetMousePositionRef.current - currentMousePositionRef.current);

    if(offset > 1.0)
    {
      currentMousePositionRef.current = lerp(currentMousePositionRef.current, targetMousePositionRef.current, 0.04);
      setCurrentMousePosition(currentMousePositionRef.current)
    }

    rafRef.current = requestAnimationFrame(lerpRotation);
  };

  useEffect(() => {

    if(inertia)
      rafRef.current = requestAnimationFrame(lerpRotation);

    return () => cancelAnimationFrame(rafRef.current);

  }, [inertia]);

  return (
    <StyledDiv
      ref={elementRef}
      isGrabbing={isScrolling}
      onPointerDown={onMouseDown}
      // onPointerUp={onMouseUp}
      onPointerMove={onMouseMove}
    // onMouseDown={onMouseDown}
    // onMouseMove={onMouseMove}
      className={className}
    >
      {showRotationIcon ? (
        <>
          {
            customRotationIcon ? (
              <>{customRotationIcon()}</>
            ) : (
              <StyledRotateIcon widthInEm={2} isReverse={reverse}></StyledRotateIcon>
            )
          }
        </>
      ) : null}
      {imageSources.map((s, index) => (
        <AnimationImage
          src={s.src}
          isVisible={index === selectedImageIndex}
          key={index}
          imagePosition={imagePosition}
        ></AnimationImage>
      ))}
    </StyledDiv>
  );
};
