import React, { useState } from 'react';
import { Star } from 'lucide-react';
export default function StarRating({ value=0, onChange, label }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="form-group" style={{marginBottom:'.5rem'}}>
      {label && <label className="form-label">{label}</label>}
      <div className="star-rating">
        {[1,2,3,4,5].map(n => (
          <Star key={n} size={20} style={{cursor:'pointer',transition:'transform .15s'}}
            onClick={() => onChange && onChange(n)}
            onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            fill={n<=(hover||value)?'#f59e0b':'none'}
            color={n<=(hover||value)?'#f59e0b':'var(--border-bright)'}
          />
        ))}
        {value>0 && <span className="text-sm text-2" style={{marginLeft:6}}>{value}/5</span>}
      </div>
    </div>
  );
}
