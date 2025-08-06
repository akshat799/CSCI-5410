import React from 'react';
import { useAuth } from '../context/AuthContext';

const QuickSightDashboard = ({ height = '720px', width = '960px' }) => {
    const { user } = useAuth();

    // Get environment variables (Vite syntax)
    const ACCOUNT_ID = import.meta.env.VITE_QUICKSIGHT_ACCOUNT_ID;
    const DASHBOARD_ID = import.meta.env.VITE_QUICKSIGHT_DASHBOARD_ID;
    const DIRECTORY_ALIAS = import.meta.env.VITE_QUICKSIGHT_DIRECTORY_ALIAS || 'dalscooter-analytics';

    // Check access
    if (user?.role !== 'FranchiseOperator') {
        return (
            <div style={{ 
                padding: '2rem', 
                textAlign: 'center',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem'
            }}>
                <h3>Access Denied</h3>
                <p>This dashboard is only available to Franchise Operators.</p>
            </div>
        );
    }

    // Check if environment variables are set
    if (!ACCOUNT_ID || !DASHBOARD_ID) {
        return (
            <div style={{ 
                padding: '2rem', 
                textAlign: 'center',
                backgroundColor: '#fffbeb',
                border: '1px solid #fed7aa',
                borderRadius: '0.5rem'
            }}>
                <h3>Configuration Missing</h3>
                <p>Please add these to your .env file:</p>
                <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                    {!ACCOUNT_ID && <li>VITE_QUICKSIGHT_ACCOUNT_ID</li>}
                    {!DASHBOARD_ID && <li>VITE_QUICKSIGHT_DASHBOARD_ID</li>}
                </ul>
                <p>Then restart your dev server.</p>
            </div>
        );
    }

    // Build the QuickSight URL
    const embedUrl = `https://us-east-1.quicksight.aws.amazon.com/sn/embed/share/accounts/${ACCOUNT_ID}/dashboards/${DASHBOARD_ID}?directory_alias=${DIRECTORY_ALIAS}`;

    return (
        <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            
            <iframe
                width={width}
                height={height}
                src={embedUrl}
                frameBorder="0"
                title="DALScooter Analytics Dashboard"
                style={{ 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    maxWidth: '100%'
                }}
                allow="fullscreen"
            />
        </div>
    );
};

export default QuickSightDashboard;