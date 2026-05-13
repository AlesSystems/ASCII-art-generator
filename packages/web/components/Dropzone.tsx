"use client";

import React, { useRef, useState, type JSX } from "react";
import { PixelIcon } from "@/components/PixelIcon";

type DropzoneProps = {
  hasFile: boolean;
  onFiles: (files: FileList) => void;
  children?: React.ReactNode;
};

export function Dropzone({ hasFile, onFiles, children }: DropzoneProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      onFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!hasFile) {
      inputRef.current?.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!hasFile && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFiles(e.target.files);
    }
  };

  const draggingStyle: React.CSSProperties = isDragging
    ? { transform: "scale(1.01)", background: "var(--soft-red)" }
    : {};

  return (
    <div
      className={"dropzone" + (hasFile ? " has-file" : "")}
      style={draggingStyle}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={hasFile ? undefined : handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={hasFile ? undefined : 0}
      role={hasFile ? undefined : "button"}
      aria-label={hasFile ? undefined : "Upload image"}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleInputChange}
      />
      {hasFile ? (
        <>
          {children}
          <div
            style={{
              marginTop: 8,
              fontSize: 11.5,
              color: "var(--muted)",
              display: "flex",
              justifyContent: "space-between",
              padding: "0 2px",
            }}
          >
            <span>JPG, PNG, GIF, WebP.</span>
            <span style={{ color: "var(--accent)" }}>● local only</span>
          </div>
        </>
      ) : (
        <>
          <PixelIcon />
          <div className="dz-headline">Drop an image here</div>
          <div className="dz-sub">or click to upload</div>
          <small style={{ color: "var(--muted)", fontSize: 11.5 }}>
            JPG, PNG, GIF, WebP. Lives in your browser only.
          </small>
        </>
      )}
    </div>
  );
}
