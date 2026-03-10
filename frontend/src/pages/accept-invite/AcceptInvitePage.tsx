import React from 'react';
import { useParams } from 'react-router-dom';

const AcceptInvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Accept Invitation</h2>
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
          TODO: Validate invite token and join household.
        </p>
      </div>
    </div>
  );
};
export default AcceptInvitePage;
