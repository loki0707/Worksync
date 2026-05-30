import React from 'react';
export default function SkeletonCard({ lines=3 }) {
  return (
    <div className="card" style={{opacity:.7}}>
      <div className="skeleton skeleton-title" style={{marginBottom:12}}/>
      {Array.from({length:lines}).map((_,i)=>(
        <div key={i} className="skeleton skeleton-text" style={{width:i===lines-1?'60%':'100%'}}/>
      ))}
    </div>
  );
}
export function SkeletonBoard() {
  return (
    <div className="kanban-board" style={{pointerEvents:'none',opacity:.6}}>
      {[1,2,3,4].map(i=>(
        <div key={i} className="kanban-col" style={{minHeight:240}}>
          <div className="kanban-col-header"><div className="skeleton" style={{width:80,height:14}}/></div>
          <div className="kanban-cards">
            {[1,2].map(j=><div key={j} className="kanban-card"><SkeletonCard lines={2}/></div>)}
          </div>
        </div>
      ))}
    </div>
  );
}
