import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/helpers';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');
    setLoading(true);
    try { await login(form.email, form.password); toast.success('Welcome back!'); navigate('/dashboard'); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div style={{width:'100%',maxWidth:400}}>
        <div className="auth-card">
          <div className="auth-logo">
            <div style={{width:32,height:32,background:'var(--primary)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Zap size={18} color="#fff"/>
            </div>
            <span style={{fontSize:'1.1rem',fontWeight:800,letterSpacing:'-.02em'}}>WorkSync</span>
          </div>

          <h1 style={{fontSize:'1.4rem',fontWeight:700,marginBottom:4,letterSpacing:'-.02em'}}>Sign in</h1>
          <p style={{color:'var(--text-2)',fontSize:'.875rem',marginBottom:'1.5rem'}}>Welcome back to your workspace</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <div className="input-group">
                <Mail size={14} className="input-icon"/>
                <input className="input" type="email" placeholder="you@company.com"
                  value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} autoFocus/>
              </div>
            </div>
            <div className="form-group" style={{marginBottom:'1.25rem'}}>
              <label className="form-label">Password</label>
              <div className="input-group">
                <Lock size={14} className="input-icon"/>
                <input className="input" type="password" placeholder="••••••••"
                  value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%',justifyContent:'center'}} disabled={loading}>
              {loading ? <span className="spinner"/> : <>Sign In <ArrowRight size={16}/></>}
            </button>
          </form>

          <p style={{textAlign:'center',marginTop:'1.25rem',fontSize:'.875rem',color:'var(--text-2)'}}>
            Don't have an account?{' '}
            <Link to="/register" style={{color:'var(--primary)',fontWeight:600}}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
