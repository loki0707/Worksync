import React from 'react';
import { Check, Loader, AlertCircle } from 'lucide-react';

export default function AutoSaveIndicator({ status }) {
  if (status === 'idle') return null;
  return (
    <div className={`save-indicator${status==='saved'?' saved':status==='saving'?' saving':''}`}>
      {status==='saving' && <><span className="spinner" style={{width:12,height:12}}/> Saving…</>}
      {status==='saved'  && <><Check size={12}/> Saved</>}
      {status==='error'  && <><AlertCircle size={12}/> Save failed</>}
    </div>
  );
}
