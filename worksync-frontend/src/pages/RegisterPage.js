import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, User, Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/helpers';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name||!form.email||!form.password) return toast.error('Please fill in all fields');
    if (form.password.length<6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try { await register(form.name,form.email,form.password); toast.success('Account created!'); navigate('/dashboard'); }
    catch(err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const fields = [
    { key:'name',     label:'Full Name',      type:'text',     placeholder:'John Smith',      Icon:User },
    { key:'email',    label:'Email address',  type:'email',    placeholder:'you@company.com', Icon:Mail },
    { key:'password', label:'Password',       type:'password', placeholder:'6+ characters',   Icon:Lock },
  ];

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

          <h1 style={{fontSize:'1.4rem',fontWeight:700,marginBottom:4,letterSpacing:'-.02em'}}>Create account</h1>
          <p style={{color:'var(--text-2)',fontSize:'.875rem',marginBottom:'1.5rem'}}>Start managing work smarter</p>

          <form onSubmit={handleSubmit}>
            {fields.map(({key,label,type,placeholder,Icon}) => (
              <div className="form-group" key={key}>
                <label className="form-label">{label}</label>
                <div className="input-group">
                  <Icon size={14} className="input-icon"/>
                  <input className="input" type={type} placeholder={placeholder}
                    value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}/>
                </div>
              </div>
            ))}
            <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%',justifyContent:'center',marginTop:'.25rem'}} disabled={loading}>
              {loading ? <span className="spinner"/> : <>Create Account <ArrowRight size={16}/></>}
            </button>
          </form>

          <p style={{textAlign:'center',marginTop:'1.25rem',fontSize:'.875rem',color:'var(--text-2)'}}>
            Already have an account?{' '}
            <Link to="/login" style={{color:'var(--primary)',fontWeight:600}}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
