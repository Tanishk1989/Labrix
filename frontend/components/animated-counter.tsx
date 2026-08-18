"use client";

import React, { useEffect, useState } from "react";

export function AnimatedCounter({
  value,
  duration = 800,
}: {
  value: string | number;
  duration?: number;
}) {
  // If the value is not purely numeric (e.g. contains % or text), handle gracefully
  const numericMatch = String(value).match(/^(\d+)(.*)$/);
  const targetNumber = numericMatch && numericMatch[1] ? parseInt(numericMatch[1], 10) : null;
  const suffix = numericMatch && numericMatch[2] ? numericMatch[2] : "";

  const [displayNumber, setDisplayNumber] = useState(0);

  useEffect(() => {
    if (targetNumber === null || isNaN(targetNumber)) return;

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayNumber(Math.floor(easeProgress * targetNumber));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayNumber(targetNumber);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetNumber, duration]);

  if (targetNumber === null || isNaN(targetNumber)) {
    return <span>{value}</span>;
  }

  return (
    <span>
      {displayNumber}
      {suffix}
    </span>
  );
}
