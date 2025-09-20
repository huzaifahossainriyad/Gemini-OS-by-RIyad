/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React from 'react';
import {AppDefinition} from '../types';

interface IconProps {
  app: AppDefinition;
  onInteract: () => void;
}

export const Icon: React.FC<IconProps> = ({app, onInteract}) => {
  return (
    <div
      className="group w-28 h-32 flex flex-col items-center justify-start text-center m-2 p-2 cursor-pointer select-none rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      onClick={onInteract}
      onKeyDown={(e) => e.key === 'Enter' && onInteract()}
      tabIndex={0}
      role="button"
      aria-label={`Open ${app.name}`}
      title={app.name} // Tooltip for informativeness
    >
      <div
        className="w-20 h-20 rounded-xl flex items-center justify-center mb-2 shadow-md group-hover:shadow-lg transition-all duration-200 ease-in-out"
        style={{backgroundColor: app.color}}>
        <div
          className="text-5xl drop-shadow-sm"
          style={{color: app.iconColor || 'inherit'}}>
          {app.icon}
        </div>
      </div>
      <div className="text-sm text-gray-800 font-semibold break-words max-w-full leading-tight">
        {app.name}
      </div>
    </div>
  );
};
