import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Clock, CheckCircle2, Star, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { leaderboardApi } from '../services/api';
import Avatar from '../components/common/Avatar';
import { formatSeconds } from '../utils/helpers';

const medals = ['🥇','🥈','🥉'];

export default function LeaderboardPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderboardApi.get(projectId)
      .then(({data})=>setBoard(data.leaderboard||[]))
      .catch(()=>toast.error('Failed to load leaderboard'))
      .finally(()=>setLoading(false));
  }, [projectId]);

  const top3 = board.slice(0,3);
  const rest  = board.slice(3);

  return (
    <div style={{maxWidth:800,margin:'0 auto'}}>
      <button className="btn btn-ghost btn-sm" style={{marginBottom:'1rem'}} onClick={()=>navigate(-1)}>
        <ArrowLeft size={14}/> Back
      </button>

      <div className="page-header">
        <div>
          <h1 style={{display:'flex',alignItems:'center',gap:8}}><Trophy size={22} style={{color:'var(--yellow)'}}/> Leaderboard</h1>
          <p>Team productivity rankings for this project</p>
        </div>
      </div>

      {loading ? (
        <div className="spinner-center"><div className="spinner spinner-lg"/></div>
      ) : board.length===0 ? (
        <div className="empty-state"><Trophy size={48}/><h3>No data yet</h3><p>Complete tasks to appear on the leaderboard</p></div>
      ) : (
        <>
          {/* Top 3 podium cards */}
          <div className="grid-3" style={{marginBottom:'1.5rem'}}>
            {top3.map((entry,i) => (
              <div key={entry.user._id} className="card" style={{
                textAlign:'center',
                border: i===0 ? '2px solid var(--yellow)' : '1px solid var(--border)',
                background: i===0 ? 'linear-gradient(135deg,var(--yellow-bg),var(--bg-card))' : 'var(--bg-card)',
              }}>
                <div style={{fontSize:'2rem',marginBottom:'.5rem'}}>{medals[i]}</div>
                <Avatar name={entry.user.name} size="lg" className="" style={{margin:'0 auto .75rem'}}/>
                <p style={{fontWeight:700,fontSize:'.95rem',marginBottom:2}}>{entry.user.name}</p>
                <p className="text-xs text-3" style={{marginBottom:'1rem'}}>{entry.user.email}</p>
                <div style={{fontSize:'1.6rem',fontWeight:800,color:i===0?'var(--yellow)':'var(--primary)',letterSpacing:'-.02em',marginBottom:4}}>
                  {entry.totalScore}
                </div>
                <p className="text-xs text-3">points</p>
                <hr className="divider"/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,textAlign:'center'}}>
                  {[
                    { label:'Done',     value:entry.tasksCompleted,  icon:<CheckCircle2 size={13}/> },
                    { label:'Reviews',  value:entry.reviewsApproved, icon:<Star size={13}/> },
                  ].map(s=>(
                    <div key={s.label}>
                      <div style={{color:'var(--text-3)',marginBottom:2}}>{s.icon}</div>
                      <p style={{fontWeight:700,fontSize:'1.1rem'}}>{s.value}</p>
                      <p className="text-xs text-3">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Rest of table */}
          {rest.length > 0 && (
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th><th>Member</th><th>Score</th><th>Tasks Done</th>
                    <th>Reviews</th><th>Activity</th><th>Time Logged</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map(entry=>(
                    <tr key={entry.user._id}>
                      <td><span style={{fontWeight:700,fontSize:'1rem',color:'var(--text-3)'}}>#{entry.rank}</span></td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:9}}>
                          <Avatar name={entry.user.name} size="sm"/>
                          <div>
                            <p style={{fontWeight:600,fontSize:'.875rem'}}>{entry.user.name}</p>
                            <p className="text-xs text-3">{entry.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><span style={{fontWeight:700,color:'var(--primary)'}}>{entry.totalScore}</span></td>
                      <td>{entry.tasksCompleted}</td>
                      <td>{entry.reviewsApproved}</td>
                      <td>{entry.activityCount}</td>
                      <td className="text-sm text-2">{formatSeconds(entry.totalTimeLogged)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Scoring legend */}
          <div className="alert alert-info" style={{marginTop:'1.25rem',fontSize:'.8rem'}}>
            <Trophy size={14}/>
            <span>Score formula: <strong>Tasks completed × 10</strong> + <strong>Reviews approved × 5</strong> + <strong>Activity count × 1</strong></span>
          </div>
        </>
      )}
    </div>
  );
}
