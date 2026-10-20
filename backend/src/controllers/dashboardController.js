const db = require('../config/db');

const LOW_STOCK_THRESHOLD = 10;

// ---------------- ADMIN ----------------
exports.getAdminDashboard = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const [
            [donorCount],
            [hospitalActiveCount],
            [hospitalPendingCount],
            [totalUnitsRow],
            [pendingRequestsRow],
            [emergencyOpenRow],
            [todayDonationsRow],
            [lowStockRows],
        ] = await Promise.all([
            db.query(`SELECT COUNT(*) AS c FROM donors`),
            db.query(`SELECT COUNT(*) AS c FROM hospitals WHERE status = 'ACTIVE'`),
            db.query(`SELECT COUNT(*) AS c FROM hospitals WHERE status = 'PENDING'`),
            db.query(`SELECT COALESCE(SUM(units_available),0) AS s FROM blood_inventory`),
            db.query(`SELECT COUNT(*) AS c FROM blood_requests WHERE status = 'PENDING'`),
            db.query(`SELECT COUNT(*) AS c FROM blood_requests WHERE request_type = 'EMERGENCY' AND status IN ('PENDING','APPROVED','ISSUED')`),
            db.query(`SELECT COUNT(*) AS c FROM donations WHERE donation_date = ?`, [today]),
            db.query(`SELECT blood_group, units_available FROM blood_inventory WHERE units_available <= ?`, [LOW_STOCK_THRESHOLD]),
        ]);

        const [distribution] = await db.query(
            `SELECT blood_group, units_available FROM blood_inventory
             ORDER BY FIELD(blood_group,'A+','A-','B+','B-','AB+','AB-','O+','O-')`
        );

        const [monthlyDonations] = await db.query(
            `SELECT DATE_FORMAT(donation_date, '%Y-%m') AS month,
                    SUM(units_collected) AS units,
                    COUNT(*) AS donations
             FROM donations
             WHERE donation_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY month
             ORDER BY month ASC`
        );

        const [monthlyRequests] = await db.query(
            `SELECT DATE_FORMAT(requested_at, '%Y-%m') AS month,
                    COUNT(*) AS requests
             FROM blood_requests
             WHERE requested_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY month
             ORDER BY month ASC`
        );

        const [statusBreakdown] = await db.query(
            `SELECT status, COUNT(*) AS c FROM blood_requests GROUP BY status`
        );

        res.json({
            stats: {
                total_donors: donorCount[0].c,
                hospitals_active: hospitalActiveCount[0].c,
                hospitals_pending: hospitalPendingCount[0].c,
                total_units: parseFloat(totalUnitsRow[0].s),
                pending_requests: pendingRequestsRow[0].c,
                emergency_open: emergencyOpenRow[0].c,
                todays_donations: todayDonationsRow[0].c,
                low_stock_groups: lowStockRows.length,
            },
            low_stock: lowStockRows.map(r => ({
                blood_group: r.blood_group,
                units_available: parseFloat(r.units_available),
            })),
            distribution: distribution.map(d => ({
                blood_group: d.blood_group,
                units: parseFloat(d.units_available),
            })),
            monthly_donations: monthlyDonations.map(m => ({
                month: m.month,
                units: parseFloat(m.units),
                donations: m.donations,
            })),
            monthly_requests: monthlyRequests.map(m => ({
                month: m.month,
                requests: m.requests,
            })),
            status_breakdown: statusBreakdown.map(s => ({
                status: s.status,
                count: s.c,
            })),
        });
    } catch (error) {
        console.error('getAdminDashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ---------------- DONOR ----------------
exports.getDonorDashboard = async (req, res) => {
    try {
        const [donors] = await db.query(
            `SELECT d.id, d.blood_group, d.date_of_birth, d.weight,
                    d.last_donation_date, d.eligibility_status,
                    u.name, u.email, u.phone
             FROM donors d
             JOIN users u ON u.id = d.user_id
             WHERE d.user_id = ?`,
            [req.user.id]
        );
        if (donors.length === 0) {
            return res.status(404).json({ message: 'Donor not found' });
        }
        const donor = donors[0];

        const [[totalRow]] = await db.query(
            `SELECT COUNT(*) AS total, COALESCE(SUM(units_collected),0) AS units
             FROM donations WHERE donor_id = ?`,
            [donor.id]
        );

        const [recent] = await db.query(
            `SELECT id, blood_group, units_collected, donation_date, expiry_date, status
             FROM donations WHERE donor_id = ?
             ORDER BY donation_date DESC LIMIT 5`,
            [donor.id]
        );

        const birth = new Date(donor.date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

        let nextEligibleDate = null;
        let eligible = age >= 18 && age <= 65 && parseFloat(donor.weight) >= 50;
        if (donor.last_donation_date) {
            const last = new Date(donor.last_donation_date);
            const diff = Math.floor((today - last) / (1000 * 60 * 60 * 24));
            if (diff < 90) {
                eligible = false;
                const next = new Date(last);
                next.setDate(next.getDate() + 90);
                nextEligibleDate = next.toISOString().split('T')[0];
            }
        }

        const [monthly] = await db.query(
            `SELECT DATE_FORMAT(donation_date, '%Y-%m') AS month,
                    SUM(units_collected) AS units
             FROM donations
             WHERE donor_id = ?
               AND donation_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY month ORDER BY month ASC`,
            [donor.id]
        );

        res.json({
            donor: {
                name: donor.name,
                email: donor.email,
                phone: donor.phone,
                blood_group: donor.blood_group,
                age,
                weight: parseFloat(donor.weight),
                last_donation_date: donor.last_donation_date,
                eligibility_status: donor.eligibility_status,
                eligible,
                next_eligible_date: nextEligibleDate,
            },
            totals: {
                donations: totalRow.total,
                units: parseFloat(totalRow.units),
            },
            recent_donations: recent,
            monthly_donations: monthly.map(m => ({
                month: m.month,
                units: parseFloat(m.units),
            })),
        });
    } catch (error) {
        console.error('getDonorDashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ---------------- HOSPITAL ----------------
exports.getHospitalDashboard = async (req, res) => {
    try {
        const [hospitals] = await db.query(
            `SELECT id, hospital_name, city, status
             FROM hospitals WHERE user_id = ?`,
            [req.user.id]
        );
        if (hospitals.length === 0) {
            return res.status(404).json({ message: 'Hospital not found' });
        }
        const hospital = hospitals[0];

        const [statusCounts] = await db.query(
            `SELECT status, COUNT(*) AS c
             FROM blood_requests WHERE hospital_id = ?
             GROUP BY status`,
            [hospital.id]
        );
        const counts = { PENDING: 0, APPROVED: 0, ISSUED: 0, COMPLETED: 0, REJECTED: 0, CANCELLED: 0 };
        statusCounts.forEach(r => { counts[r.status] = r.c; });

        const [[{ emergency }]] = await db.query(
            `SELECT COUNT(*) AS emergency FROM blood_requests
             WHERE hospital_id = ? AND request_type = 'EMERGENCY'
               AND status IN ('PENDING','APPROVED','ISSUED')`,
            [hospital.id]
        );

        const [availability] = await db.query(
            `SELECT blood_group, units_available FROM blood_inventory
             ORDER BY FIELD(blood_group,'A+','A-','B+','B-','AB+','AB-','O+','O-')`
        );

        const [recent] = await db.query(
            `SELECT id, blood_group, units_requested, request_type, urgency, status, requested_at
             FROM blood_requests WHERE hospital_id = ?
             ORDER BY requested_at DESC LIMIT 5`,
            [hospital.id]
        );

        const [monthly] = await db.query(
            `SELECT DATE_FORMAT(requested_at, '%Y-%m') AS month,
                    COUNT(*) AS requests
             FROM blood_requests WHERE hospital_id = ?
               AND requested_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY month ORDER BY month ASC`,
            [hospital.id]
        );

        res.json({
            hospital: {
                name: hospital.hospital_name,
                city: hospital.city,
                status: hospital.status,
            },
            counts: {
                ...counts,
                emergency,
                total: Object.values(counts).reduce((a, b) => a + b, 0),
            },
            availability: availability.map(a => ({
                blood_group: a.blood_group,
                units: parseFloat(a.units_available),
            })),
            recent_requests: recent,
            monthly_requests: monthly.map(m => ({
                month: m.month,
                requests: m.requests,
            })),
        });
    } catch (error) {
        console.error('getHospitalDashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};