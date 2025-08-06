import React from 'react';
import { useAuth } from '../context/AuthContext';
import QuickSightDashboard from './QuickSightDashboard';
import { BarChart3, Users, Bike, MessageSquare } from 'lucide-react';
import '../styles/AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
    const { user } = useAuth();

    if (user?.role !== 'FranchiseOperator') {
        return (
            <div className="access-denied">
                <h2>Access Denied</h2>
                <p>This dashboard is only available to Franchise Operators.</p>
            </div>
        );
    }

    return (
        <div className="analytics-dashboard">
            {/* Embedded QuickSight Dashboard */}
            <div className="quicksight-section">
                <h3 className="section-title">Interactive Analytics</h3>
                <QuickSightDashboard height="700px" width="100%" />
            </div>
        </div>
    );
};

export default AnalyticsDashboard;