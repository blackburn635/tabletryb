/**
 * UsersPage — Manage household members (primary users only).
 * - View all members with their roles
 * - Invite new members by email
 * - Designate members as primary users
 * - Remove members
 */
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  UserPlus, Shield, ShieldCheck, Trash2, Mail, Send,
} from 'lucide-react';

const UsersPage: React.FC = () => {
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'primary' | 'member'>('member');

  // TODO: Fetch real members from GET /v1/households/{hhId}
  const mockMembers = [
    { userId: '1', displayName: user?.displayName || 'You', email: user?.email || '', role: 'primary' as const, isAccountHolder: true },
    { userId: '2', displayName: 'Mom', email: 'mom@example.com', role: 'primary' as const, isAccountHolder: false },
    { userId: '3', displayName: 'Reece', email: 'reece@example.com', role: 'member' as const, isAccountHolder: false },
    { userId: '4', displayName: 'Rane', email: 'rane@example.com', role: 'member' as const, isAccountHolder: false },
  ];

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Call POST /v1/households/{hhId}/invite
    alert(`Invite sent to ${inviteEmail} as ${inviteRole}`);
    setInviteEmail('');
    setInviteName('');
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Users</h1>

      {/* Current members */}
      <div className="users-card">
        <h3>Household Members</h3>
        <div className="users-list">
          {mockMembers.map((m) => (
            <div key={m.userId} className="user-row">
              <div className="user-avatar">{m.displayName.charAt(0)}</div>
              <div className="user-info">
                <span className="user-name">
                  {m.displayName}
                  {m.isAccountHolder && <span className="user-badge user-badge--owner">Account Holder</span>}
                </span>
                <span className="user-email">{m.email}</span>
              </div>
              <div className="user-role-control">
                {m.role === 'primary' ? (
                  <span className="user-badge user-badge--primary"><ShieldCheck size={12} /> Primary</span>
                ) : (
                  <span className="user-badge user-badge--member"><Shield size={12} /> Member</span>
                )}
              </div>
              {!m.isAccountHolder && (
                <button className="user-action-btn" title="Remove member">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite form */}
      <div className="users-card">
        <h3><UserPlus size={18} /> Invite a Member</h3>
        <form onSubmit={handleInvite} className="invite-form">
          <div className="invite-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Name</label>
              <input className="form-input" placeholder="Their name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} required />
            </div>
            <div className="form-group" style={{ flex: 1.5 }}>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="their@email.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input form-select" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'primary' | 'member')}>
                <option value="member">Member</option>
                <option value="primary">Primary</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            <Send size={16} /> Send Invite
          </button>
        </form>
      </div>
    </div>
  );
};

export default UsersPage;
