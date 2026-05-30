import React, { useState } from 'react';
import { User, Mail, Lock, Save, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/common/Avatar';
import { getErrorMessage } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name:user?.name||'', bio:user?.bio||'' });
  const [passwords, setPasswords] = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [savingP, setSavingP] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) return toast.error('Name is required');
    setSavingP(true);
    try { const {data}=await authApi.updateMe(profile); updateUser(data.user); toast.success('Profile updated'); }
    catch(err) { toast.error(getErrorMessage(err)); }
    finally { setSavingP(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword!==passwords.confirm) return toast.error('Passwords do not match');
    if (passwords.newPassword.length<6) return toast.error('Password must be at least 6 characters');
    setSavingPw(true);
    try {
      await authApi.changePassword({ currentPassword:passwords.currentPassword, newPassword:passwords.newPassword });
      toast.success('Password changed');
      setPasswords({ currentPassword:'', newPassword:'', confirm:'' });
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setSavingPw(false); }
  };

  return (
    <div style={{maxWidth:560,margin:'0 auto'}}>
      <div className="page-header">
        <div><h1>Profile</h1><p>Manage your account settings</p></div>
      </div>

      {/* Hero */}
      <div className="card" style={{display:'flex',alignItems:'center',gap:'1.25rem',marginBottom:'1.25rem'}}>
        <Avatar name={user?.name} size="xl"/>
        <div>
          <h2 style={{fontSize:'1.1rem',fontWeight:700,marginBottom:2}}>{user?.name}</h2>
          <p className="text-sm text-3">{user?.email}</p>
        </div>
      </div>

      {/* Profile form */}
      <div className="card" style={{marginBottom:'1.25rem'}}>
        <h3 style={{fontSize:'.9rem',fontWeight:700,marginBottom:'1.25rem',display:'flex',alignItems:'center',gap:8}}>
          <User size={15} style={{color:'var(--primary)'}}/> Personal Info
        </h3>
        <form onSubmit={handleProfileSave}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="input" value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))}/>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="input" value={user?.email} disabled style={{opacity:.5,cursor:'not-allowed'}}/>
          </div>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea className="input" rows={3} placeholder="A short bio…"
              value={profile.bio} onChange={e=>setProfile(p=>({...p,bio:e.target.value}))}/>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button type="submit" className="btn btn-primary" disabled={savingP}>
              {savingP?<span className="spinner"/>:<><Save size={14}/> Save Changes</>}
            </button>
          </div>
        </form>
      </div>

      {/* Password form */}
      <div className="card" style={{marginBottom:'1.25rem'}}>
        <h3 style={{fontSize:'.9rem',fontWeight:700,marginBottom:'1.25rem',display:'flex',alignItems:'center',gap:8}}>
          <Lock size={15} style={{color:'var(--primary)'}}/> Change Password
        </h3>
        <form onSubmit={handlePasswordChange}>
          {[
            {key:'currentPassword',label:'Current Password',placeholder:'••••••••'},
            {key:'newPassword',    label:'New Password',    placeholder:'6+ characters'},
            {key:'confirm',        label:'Confirm Password',placeholder:'Repeat new password'},
          ].map(({key,label,placeholder})=>(
            <div className="form-group" key={key}>
              <label className="form-label">{label}</label>
              <input className="input" type="password" placeholder={placeholder}
                value={passwords[key]} onChange={e=>setPasswords(p=>({...p,[key]:e.target.value}))}/>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button type="submit" className="btn btn-primary" disabled={savingPw}>
              {savingPw?<span className="spinner"/>:<><Lock size={14}/> Update Password</>}
            </button>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="card" style={{borderColor:'var(--red)',borderWidth:1}}>
        <h3 style={{fontSize:'.9rem',fontWeight:700,color:'var(--red-text)',marginBottom:'.5rem'}}>Danger Zone</h3>
        <p className="text-sm text-2" style={{marginBottom:'1rem'}}>Sign out of your account on this device.</p>
        <button className="btn btn-danger btn-sm" onClick={()=>{ logout(); navigate('/login'); }}>
          <LogOut size={14}/> Sign Out
        </button>
      </div>
    </div>
  );
}
