import React from 'react';
export default function Button({ children, variant='primary', size='', icon, loading, className='', ...props }) {
  const cls = `btn btn-${variant}${size ? ` btn-${size}` : ''} ${className}`;
  return (
    <button className={cls} disabled={loading || props.disabled} {...props}>
      {loading ? <span className="spinner" style={{width:14,height:14}} /> : icon}
      {children}
    </button>
  );
}
