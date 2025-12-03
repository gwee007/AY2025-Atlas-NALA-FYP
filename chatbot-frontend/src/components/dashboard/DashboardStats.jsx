import { useState, useEffect } from 'react';

/**
 * Custom React hook for fetching dashboard statistics with Redis caching
 */
export function useDashboardStats(courseId, userId) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        
        const response = await fetch(
          `/api/dashboard/course/${courseId}?userId=${userId}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        
        const { data } = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    if (courseId && userId) {
      fetchStats();
    }
  }, [courseId, userId]);

  return { stats, loading, error };
}

/**
 * Example Dashboard Component using cached statistics
 */
export function StudentDashboard({ courseId, userId }) {
  const { stats, loading, error } = useDashboardStats(courseId, userId);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!stats) {
    return <div>No data available</div>;
  }

  const { course, user } = stats;

  return (
    <div className="dashboard">
      <h1>Course Dashboard</h1>

      {/* Individual vs Average Comparison */}
      <section className="comparison-section">
        <h2>Your Performance vs Class Average</h2>
        
        <div className="score-comparison">
          <div className="score-card">
            <h3>Your Score</h3>
            <div className="score-value">{user.studentScore.toFixed(1)}</div>
          </div>
          
          <div className="score-card">
            <h3>Class Average</h3>
            <div className="score-value">{user.courseAverage.toFixed(1)}</div>
          </div>
          
          <div className="score-card">
            <h3>Your Percentile</h3>
            <div className="score-value">{user.percentile}%</div>
            {user.aboveAverage ? (
              <span className="badge success">Above Average ✅</span>
            ) : (
              <span className="badge warning">Below Average</span>
            )}
          </div>
        </div>

        <div className="difference">
          Difference from average: 
          <strong style={{ color: parseFloat(user.difference) >= 0 ? 'green' : 'red' }}>
            {parseFloat(user.difference) >= 0 ? '+' : ''}{user.difference} points
          </strong>
        </div>
      </section>

      {/* Course Statistics */}
      <section className="course-stats-section">
        <h2>Course Statistics</h2>
        
        <div className="stats-grid">
          <div className="stat-item">
            <label>Average Quality Score</label>
            <value>{course.averageQualityScore.toFixed(1)}</value>
          </div>
          
          <div className="stat-item">
            <label>Average Points</label>
            <value>{course.averagePoints.toFixed(1)}</value>
          </div>
          
          <div className="stat-item">
            <label>Average Interaction Time</label>
            <value>{formatTime(course.averageInteractionTime)}</value>
          </div>
          
          <div className="stat-item">
            <label>Average Interactions</label>
            <value>{Math.round(course.averageInteractionCount)}</value>
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="leaderboard-section">
        <h2>Top Performers</h2>
        <table className="leaderboard">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Student</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {course.topStudents.map((student) => (
              <tr key={student.rank} className={student.studentId === `student:${userId}` ? 'current-user' : ''}>
                <td className="rank">#{student.rank}</td>
                <td>{student.studentId}</td>
                <td className="score">{student.score.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/**
 * Chart component showing individual vs average scores
 */
export function ScoreComparisonChart({ userScore, classAverage }) {
  const maxScore = Math.max(userScore, classAverage) * 1.2; // 20% padding
  
  return (
    <div className="chart-container">
      <svg width="400" height="300" viewBox="0 0 400 300">
        {/* Class Average Bar */}
        <rect
          x="50"
          y={300 - (classAverage / maxScore * 250)}
          width="80"
          height={classAverage / maxScore * 250}
          fill="#94a3b8"
        />
        <text x="90" y="290" textAnchor="middle" fontSize="12">
          Class Avg
        </text>
        <text x="90" y={300 - (classAverage / maxScore * 250) - 10} textAnchor="middle" fontSize="14" fontWeight="bold">
          {classAverage.toFixed(1)}
        </text>
        
        {/* Your Score Bar */}
        <rect
          x="160"
          y={300 - (userScore / maxScore * 250)}
          width="80"
          height={userScore / maxScore * 250}
          fill={userScore >= classAverage ? '#22c55e' : '#ef4444'}
        />
        <text x="200" y="290" textAnchor="middle" fontSize="12">
          Your Score
        </text>
        <text x="200" y={300 - (userScore / maxScore * 250) - 10} textAnchor="middle" fontSize="14" fontWeight="bold">
          {userScore.toFixed(1)}
        </text>
      </svg>
    </div>
  );
}

/**
 * Real-time rank component
 */
export function StudentRank({ courseId, userId }) {
  const [rank, setRank] = useState(null);

  useEffect(() => {
    async function fetchRank() {
      try {
        const response = await fetch(`/api/dashboard/rank/${userId}/${courseId}`);
        const { data } = await response.json();
        setRank(data);
      } catch (error) {
        console.error('Error fetching rank:', error);
      }
    }

    fetchRank();
    
    // Refresh rank every 5 minutes
    const interval = setInterval(fetchRank, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [courseId, userId]);

  if (!rank) return null;

  return (
    <div className="rank-badge">
      🏆 Rank: #{rank.rank} (Score: {rank.score.toFixed(1)})
    </div>
  );
}

/**
 * Leaderboard component with real-time updates
 */
export function Leaderboard({ courseId, limit = 10 }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/leaderboard/${courseId}?limit=${limit}`);
        const { data } = await response.json();
        setStudents(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchLeaderboard, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [courseId, limit]);

  if (loading) return <div>Loading leaderboard...</div>;

  return (
    <div className="leaderboard">
      <h3>Top {limit} Students</h3>
      <ol>
        {students.map((student) => (
          <li key={student.rank}>
            <span className="rank">#{student.rank}</span>
            <span className="name">{student.studentId}</span>
            <span className="score">{student.score.toFixed(1)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Refresh button to manually invalidate cache
 */
export function RefreshButton({ courseId }) {
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await fetch(`/api/dashboard/refresh/${courseId}`, { method: 'POST' });
      window.location.reload(); // Reload to show fresh data
    } catch (error) {
      console.error('Error refreshing cache:', error);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <button onClick={handleRefresh} disabled={refreshing}>
      {refreshing ? 'Refreshing...' : '🔄 Refresh Statistics'}
    </button>
  );
}

// Utility functions
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

/* 
CSS Styles (add to your App.css or create Dashboard.css)
========================================================

.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.comparison-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
}

.score-comparison {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.score-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.score-card h3 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #64748b;
  text-transform: uppercase;
}

.score-value {
  font-size: 36px;
  font-weight: bold;
  color: #1e293b;
  margin-bottom: 8px;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge.success {
  background: #dcfce7;
  color: #166534;
}

.badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.difference {
  text-align: center;
  font-size: 16px;
  color: #475569;
}

.course-stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-item label {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
}

.stat-item value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #1e293b;
}

.leaderboard-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.leaderboard table {
  width: 100%;
  border-collapse: collapse;
}

.leaderboard th {
  text-align: left;
  padding: 12px;
  border-bottom: 2px solid #e2e8f0;
  color: #64748b;
  font-size: 14px;
}

.leaderboard td {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.leaderboard tr.current-user {
  background: #fef3c7;
  font-weight: bold;
}

.rank {
  color: #3b82f6;
  font-weight: bold;
}

.score {
  color: #22c55e;
  font-weight: bold;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #64748b;
}

.error {
  padding: 20px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 8px;
}
*/
