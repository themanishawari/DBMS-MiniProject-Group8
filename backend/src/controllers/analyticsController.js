import { pool } from '../config/db.js';

/**
 * GET /api/v1/analytics
 * Returns institution-wide or department-specific KPI metrics and chart distributions.
 */
export async function getDashboardStats(req, res, next) {
  try {
    const user = req.user;

    const whereClauses = ['c.is_archived = FALSE'];
    const params = [];

    if (user && user.role === 'student') {
      whereClauses.push('c.student_id = ?');
      params.push(user.id);
    } else if (user && user.role === 'staff') {
      whereClauses.push('(c.department_id = ? OR c.assigned_staff_id = ?)');
      params.push(user.departmentId, user.id);
      whereClauses.push('(c.is_sensitive = FALSE OR c.assigned_staff_id = ?)');
      params.push(user.id);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 1. Core KPIs
    const [kpiRows] = await pool.query(
      `SELECT 
        COUNT(*) AS total_complaints,
        SUM(CASE WHEN c.status IN ('submitted', 'acknowledged') THEN 1 ELSE 0 END) AS new_complaints,
        SUM(CASE WHEN c.status IN ('assigned', 'in_progress', 'awaiting_student_response', 'escalated', 'reopened') THEN 1 ELSE 0 END) AS active_complaints,
        SUM(CASE WHEN c.status IN ('resolved', 'closed') THEN 1 ELSE 0 END) AS resolved_complaints,
        SUM(CASE WHEN c.is_overdue = TRUE OR (c.status NOT IN ('resolved', 'closed', 'rejected') AND c.sla_deadline < NOW()) THEN 1 ELSE 0 END) AS overdue_complaints,
        AVG(CASE WHEN c.resolved_at IS NOT NULL THEN TIMESTAMPDIFF(HOUR, c.created_at, c.resolved_at) ELSE NULL END) AS avg_resolution_hours
       FROM complaints c
       ${whereSQL}`,
      params
    );

    const kpis = kpiRows[0] || {};

    // 2. Student Satisfaction Rating from feedback table
    const [ratingRows] = await pool.query(`
      SELECT 
        AVG(fb.rating) AS avg_rating,
        COUNT(fb.id) AS feedback_count
      FROM complaint_feedback fb
      JOIN complaints c ON fb.complaint_id = c.id
      ${whereSQL}
    `, params);

    const ratings = ratingRows[0] || {};

    // 3. Status Distribution
    const [statusRows] = await pool.query(`
      SELECT c.status, COUNT(*) AS count
      FROM complaints c
      ${whereSQL}
      GROUP BY c.status
    `, params);

    // 4. Priority Distribution
    const [priorityRows] = await pool.query(`
      SELECT c.priority, COUNT(*) AS count
      FROM complaints c
      ${whereSQL}
      GROUP BY c.priority
    `, params);

    // 5. Category Distribution
    const [categoryRows] = await pool.query(`
      SELECT cat.name AS name, COUNT(*) AS count
      FROM complaints c
      JOIN complaint_categories cat ON c.category_id = cat.id
      ${whereSQL}
      GROUP BY cat.id, cat.name
      ORDER BY count DESC
    `, params);

    // 6. Department Performance
    const [deptRows] = await pool.query(`
      SELECT 
        d.name AS department_name,
        COUNT(c.id) AS total,
        SUM(CASE WHEN c.status IN ('resolved', 'closed') THEN 1 ELSE 0 END) AS resolved,
        SUM(CASE WHEN c.status NOT IN ('resolved', 'closed', 'rejected') THEN 1 ELSE 0 END) AS pending,
        AVG(CASE WHEN c.resolved_at IS NOT NULL THEN TIMESTAMPDIFF(HOUR, c.created_at, c.resolved_at) ELSE NULL END) AS avg_resolution_hours
      FROM departments d
      LEFT JOIN complaints c ON d.id = c.department_id AND c.is_archived = FALSE
      GROUP BY d.id, d.name
      ORDER BY total DESC
    `);

    // 7. Campus Hotspots
    const [hotspotRows] = await pool.query(`
      SELECT c.campus_area AS location, COUNT(*) AS count
      FROM complaints c
      ${whereSQL}
      GROUP BY c.campus_area
      ORDER BY count DESC
      LIMIT 10
    `, params);

    // 8. Monthly Trends
    const [trendRows] = await pool.query(`
      SELECT 
        DATE_FORMAT(c.created_at, '%b %Y') AS month_label,
        COUNT(*) AS submitted,
        SUM(CASE WHEN c.status IN ('resolved', 'closed') THEN 1 ELSE 0 END) AS resolved
      FROM complaints c
      ${whereSQL}
      GROUP BY DATE_FORMAT(c.created_at, '%Y-%m'), DATE_FORMAT(c.created_at, '%b %Y')
      ORDER BY DATE_FORMAT(c.created_at, '%Y-%m') ASC
      LIMIT 6
    `, params);

    return res.json({
      totalComplaints: Number(kpis.total_complaints) || 0,
      newComplaints: Number(kpis.new_complaints) || 0,
      activeComplaints: Number(kpis.active_complaints) || 0,
      resolvedComplaints: Number(kpis.resolved_complaints) || 0,
      overdueComplaints: Number(kpis.overdue_complaints) || 0,
      averageResolutionTimeHours: Math.round(Number(kpis.avg_resolution_hours) || 24),
      satisfactionRatingAvg: Number((Number(ratings.avg_rating) || 4.5).toFixed(1)),
      satisfactionFeedbackCount: Number(ratings.feedback_count) || 0,

      statusDistribution: statusRows.map((r) => ({
        name: r.status,
        count: Number(r.count),
      })),
      priorityDistribution: priorityRows.map((r) => ({
        name: r.priority,
        count: Number(r.count),
      })),
      categoryDistribution: categoryRows.map((r) => ({
        name: r.name,
        count: Number(r.count),
      })),
      departmentPerformance: deptRows.map((d) => {
        const total = Number(d.total) || 0;
        const resolved = Number(d.resolved) || 0;
        return {
          departmentName: d.department_name,
          total,
          resolved,
          pending: Number(d.pending) || 0,
          resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 100,
          avgResolutionHours: Math.round(Number(d.avg_resolution_hours) || 24),
        };
      }),
      complaintHotspots: hotspotRows.map((h) => ({
        location: h.location,
        count: Number(h.count),
      })),
      monthlyTrends: trendRows.map((t) => ({
        month: t.month_label,
        submitted: Number(t.submitted),
        resolved: Number(t.resolved),
      })),
    });
  } catch (error) {
    next(error);
  }
}
