import React from 'react';
import { getInitials } from '../../utils/helpers';
export default function Avatar({ name, size='', className='' }) {
  return <div className={`avatar${size ? ` avatar-${size}` : ''} ${className}`}>{getInitials(name)}</div>;
}
