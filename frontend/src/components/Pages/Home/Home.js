import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FaUserFriends, FaPlus } from "react-icons/fa";
import styles from "./Home.module.css";
import { getDashboard } from "../../../services/api";
import WelcomeBanner from "../../Molecules/WelcomeBanner/WelcomeBanner";
import PopUpForm from "../../Molecules/PopUp/PopUpRegis/PopUpForm";

const formatNumber = (num) => {
  if (num === undefined || num === null) return "0";
  return new Intl.NumberFormat("id-ID").format(num);
};

const TrendText = ({ growth, periodLabel }) => {
  const val = growth ? Number(growth) : 0;
  const isPositive = val >= 0;

  return (
    <div className={styles.trendTextContainer}>
      <span>{isPositive ? "Increased" : "Decreased"}&nbsp;</span>
      <span
        className={isPositive ? styles.trendPositive : styles.trendNegative}
      >
        {Math.abs(val).toFixed(0)}%
      </span>
      <span>&nbsp;from {periodLabel}</span>
    </div>
  );
};

const SimpleStatCard = ({
  title,
  count,
  growth,
  periodLabel,
  confirmed,
  cancelled,
}) => (
  <div className={styles.statCard}>
    <div className={styles.cardTopRow}>
      <div className={styles.cardLabel}>{title}</div>
      <TrendText growth={growth} periodLabel={periodLabel} />
    </div>

    <div className={styles.cardMainStat}>
      <div className={styles.cardBigValue}>{formatNumber(count)}</div>
      <FaUserFriends className={styles.cardIcon} />
    </div>

    {/* UPDATE: Menambahkan Breakdown Section (Footer Card) */}
    <div className={styles.cardSubStatRow}>
      <div className={styles.subStatItem}>
        <span className={styles.dotConfirmed}>●</span>
        <span>{formatNumber(confirmed || 0)} Confirmed</span>
      </div>
      <div className={styles.subStatItem}>
        <span className={styles.dotCancelled}>●</span>
        <span>{formatNumber(cancelled || 0)} Cancelled</span>
      </div>
    </div>
  </div>
);

const Home = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleFullAnalytics = () => {
    navigate("/analytics");
  };

  const handleOpenPopup = () => {
    setShowPopup(true);
  };

  const handleCreateRegistration = (newData, resetForm) => {
    resetForm();
    setShowPopup(false);

    if (newData.draftId) {
      navigate("/Registration-form", {
        state: {
          fromPopup: true,
          draftId: newData.draftId,
          schoolYear: newData.schoolYear,
          semester: newData.semester,
          date: newData.date,
        },
      });
    } else {
      fetchDashboardData();
    }
  };

  const CustomTooltipHome = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            fontSize: "12px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
          }}
        >
          <p style={{ fontWeight: "bold", margin: "0 0 8px 0" }}>{label}</p>
          {payload.map((entry, index) => {
            // Mengambil data dari payload object yang kita buat di registrationTrendData
            const confirmed = entry.payload.confirmed || 0;
            const cancelled = entry.payload.cancelled || 0;

            return (
              <div key={index} style={{ marginBottom: "0px" }}>
                <p
                  style={{
                    margin: 0,
                    color: entry.color,
                    fontWeight: 600,
                  }}
                >
                  {entry.name}: {entry.value}
                </p>
                <p style={{ margin: 0, color: "#555" }}>
                  confirmed: {confirmed}
                </p>
                <p style={{ margin: 0, color: "#555" }}>
                  cancelled: {cancelled}
                </p>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={styles.centerMessage}>
        <div className={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.centerMessage}>Failed to load dashboard data.</div>
    );
  }

  const {
    username,
    last_login,
    today,
    school_year,
    pre_register,
    active_students_matrix,
    daily_trend,
    latest_registrations,
  } = data;

  const activeChartData = daily_trend
    ? daily_trend.map((d) => ({
        name: d.date,
        val: d.total,
      }))
    : [];

  const totalActiveStudents = active_students_matrix?.Total || 0;

  const registrationTrendData = daily_trend
    ? daily_trend.map((d) => ({
        date: d.date,
        current: d.total,
        confirmed: d.confirmed,
        cancelled: d.cancelled,
      }))
    : [];

  return (
    <div className={styles.homeContainer}>
      <WelcomeBanner name={username} lastLogin={last_login} />

      <div className={styles.topStatsGrid}>
        <div className={styles.leftColumnStack}>
          <SimpleStatCard
            title="Today Registration"
            count={today?.total}
            growth={today?.growth_total}
            confirmed={today?.confirmed}
            cancelled={today?.cancelled}
            periodLabel="yesterday"
          />
          <SimpleStatCard
            title="Current S.Y Registration"
            count={school_year?.total}
            growth={school_year?.growth_total}
            confirmed={school_year?.confirmed}
            cancelled={school_year?.cancelled}
            periodLabel="last year"
          />
        </div>

        <div className={styles.rightColumnStack}>
          <div className={styles.darkCard}>
            <div className={styles.grossInfo}>
              <div className={styles.cardTitleWhite}>Total Active Student</div>
              <div className={styles.cardMainStatDark}>
                <div className={styles.statValueWhite}>
                  {formatNumber(totalActiveStudents)}
                </div>
                <FaUserFriends className={styles.statIconWhite} />
              </div>
            </div>

            <div className={styles.grossChart}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeChartData}>
                  <defs>
                    <linearGradient
                      id="grossGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#00f413" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00f413" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke="#00f413"
                    fill="url(#grossGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <SimpleStatCard
            title="Next S.Y Registration"
            count={pre_register?.total || 0}
            growth={pre_register?.growth_total || 0}
            confirmed={pre_register?.confirmed}
            cancelled={pre_register?.cancelled}
            periodLabel="current S.Y"
          />
        </div>
      </div>

      <div className={styles.sectionHeader}>Latest registration</div>
      <div className={styles.tableContainer}>
        {/* ... (Table content remains unchanged) ... */}
        <div className={styles.tableHeader}>
          <div>Registration ID</div>
          <div>Student Name</div>
          <div>Grade</div>
          <div>Section</div>
          <div>School year</div>
          <div>Type</div>
          <div>Status</div>
        </div>

        <div>
          {latest_registrations && latest_registrations.length > 0 ? (
            latest_registrations.map((row, idx) => (
              <div key={idx} className={styles.tableRow}>
                <div>
                  {row.student_id
                    ? row.student_id
                    : `APP-${row.application_id}`}
                </div>
                <div style={{ fontWeight: 500 }}>{row.full_name}</div>
                <div>{row.grade}</div>
                <div>{row.section}</div>
                <div>{row.school_year}</div>
                <div>{row.type}</div>
                <div>
                  <div
                    className={`${styles.statusBadge} ${
                      row.status === "Confirmed"
                        ? styles.statusConfirmed
                        : row.status === "Cancelled"
                        ? styles.statusCancelled
                        : styles.statusPending
                    }`}
                  >
                    {row.status}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                padding: "32px",
                textAlign: "center",
                color: "var(--main-grey)",
              }}
            >
              No recent registrations found.
            </div>
          )}
        </div>
      </div>

      <div className={styles.chartSection}>
        <div className={styles.chartTopRow}>
          <div className={styles.chartTitleGroup}>
            <div className={styles.sectionHeader} style={{ margin: 0 }}>
              Registration Trend
            </div>
          </div>
          <div className={styles.linkText} onClick={handleFullAnalytics}>
            Show Full Analytics
          </div>
        </div>

        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <LineChart
              data={registrationTrendData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e0e0e0"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#7A7A7A", fontWeight: 500 }}
                dy={10}
                minTickGap={30}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#7A7A7A" }}
                allowDecimals={false}
              />
              {/* REVISI: Menghapus Tooltip default, hanya menyisakan CustomTooltipHome */}
              <Tooltip content={<CustomTooltipHome />} />
              <Line
                type="monotone"
                dataKey="current"
                stroke="var(--main-accent)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
                name="Current Month"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <button
        className={styles.floatingBtn}
        onClick={handleOpenPopup}
        title="Create New Registration"
      >
        <FaPlus />
      </button>
      {showPopup && (
        <PopUpForm
          onClose={() => setShowPopup(false)}
          onCreate={handleCreateRegistration}
          type="registration"
        />
      )}
    </div>
  );
};

export default Home;
