/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {RefObject} from 'react';

interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;

interface WindowProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  isAppOpen: boolean;
  appId?: string | null;
  onToggleParameters: () => void;
  onExitToDesktop: () => void;
  isParametersPanelOpen?: boolean;
  onGoBack: () => void;
  canGoBack: boolean;
  rect: WindowRect;
  setRect: React.Dispatch<React.SetStateAction<any>>;
  containerRef: RefObject<HTMLElement>;
}

const MenuItem: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({children, onClick, className}) => (
  <span
    className={`menu-item cursor-pointer hover:text-blue-600 ${className}`}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') onClick?.();
    }}
    tabIndex={0}
    role="button">
    {children}
  </span>
);

export const Window: React.FC<WindowProps> = ({
  title,
  children,
  onClose,
  isAppOpen,
  onToggleParameters,
  onExitToDesktop,
  isParametersPanelOpen,
  onGoBack,
  canGoBack,
  rect,
  setRect,
  containerRef,
}) => {
  const handleDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = rect.x;
    const initialY = rect.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const container = containerRef.current;
      if (!container) return;

      let newX = initialX + deltaX;
      let newY = initialY + deltaY;

      // Boundary checks
      newX = Math.max(0, Math.min(newX, container.clientWidth - rect.width));
      newY = Math.max(0, Math.min(newY, container.clientHeight - rect.height));

      setRect((prev: any) => ({...prev, x: newX, y: newY}));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown =
    (direction: string) => (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startY = e.clientY;
      const initialRect = {...rect};

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const container = containerRef.current;
        if (!container) return;

        let newRect = {...initialRect};
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        if (direction.includes('right')) {
          const newWidth = initialRect.width + deltaX;
          newRect.width = Math.max(MIN_WIDTH, newWidth);
          newRect.width = Math.min(
            newRect.width,
            container.clientWidth - newRect.x,
          );
        }
        if (direction.includes('bottom')) {
          const newHeight = initialRect.height + deltaY;
          newRect.height = Math.max(MIN_HEIGHT, newHeight);
          newRect.height = Math.min(
            newRect.height,
            container.clientHeight - newRect.y,
          );
        }
        if (direction.includes('left')) {
          const newWidth = initialRect.width - deltaX;
          if (newWidth >= MIN_WIDTH) {
            newRect.width = newWidth;
            newRect.x = Math.max(0, initialRect.x + deltaX);
          }
        }
        if (direction.includes('top')) {
          const newHeight = initialRect.height - deltaY;
          if (newHeight >= MIN_HEIGHT) {
            newRect.height = newHeight;
            newRect.y = Math.max(0, initialRect.y + deltaY);
          }
        }
        setRect((prev: any) => ({...prev, ...newRect}));
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

  const resizeHandles = [
    {
      direction: 'top',
      cursor: 'ns-resize',
      style: {top: -5, left: 5, right: 5, height: 10},
    },
    {
      direction: 'bottom',
      cursor: 'ns-resize',
      style: {bottom: -5, left: 5, right: 5, height: 10},
    },
    {
      direction: 'left',
      cursor: 'ew-resize',
      style: {left: -5, top: 5, bottom: 5, width: 10},
    },
    {
      direction: 'right',
      cursor: 'ew-resize',
      style: {right: -5, top: 5, bottom: 5, width: 10},
    },
    {
      direction: 'top-left',
      cursor: 'nwse-resize',
      style: {top: -5, left: -5, width: 10, height: 10},
    },
    {
      direction: 'top-right',
      cursor: 'nesw-resize',
      style: {top: -5, right: -5, width: 10, height: 10},
    },
    {
      direction: 'bottom-left',
      cursor: 'nesw-resize',
      style: {bottom: -5, left: -5, width: 10, height: 10},
    },
    {
      direction: 'bottom-right',
      cursor: 'nwse-resize',
      style: {bottom: -5, right: -5, width: 10, height: 10},
    },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
      }}
      className="bg-white border border-gray-300 rounded-xl shadow-2xl flex flex-col font-sans backdrop-blur-sm bg-white/80">
      {/* Resize Handles */}
      {resizeHandles.map(({direction, cursor, style}) => (
        <div
          key={direction}
          onMouseDown={handleResizeMouseDown(direction)}
          style={{position: 'absolute', cursor, ...style, zIndex: 10}}
          aria-label={`Resize window ${direction}`}
        />
      ))}
      {/* Title Bar */}
      <div
        onMouseDown={handleDragMouseDown}
        className="bg-gray-800/90 text-white py-2 px-4 font-semibold text-base flex justify-between items-center select-none cursor-move rounded-t-xl flex-shrink-0">
        <span className="title-bar-text">{title}</span>
        {/* "X" button removed from here */}
      </div>

      {/* Menu Bar */}
      <div className="bg-gray-100/80 py-2 px-3 border-b border-gray-200 select-none flex gap-4 flex-shrink-0 text-sm text-gray-700 items-center">
        {!isParametersPanelOpen && (
          <MenuItem onClick={onToggleParameters}>
            <u>P</u>arameters
          </MenuItem>
        )}
        {isAppOpen && canGoBack && (
          <MenuItem onClick={onGoBack}>
            <u>B</u>ack
          </MenuItem>
        )}
        {isAppOpen && (
          <MenuItem onClick={onExitToDesktop} className="ml-auto">
            <u>H</u>ome
          </MenuItem>
        )}
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto">{children}</div>
    </div>
  );
};
