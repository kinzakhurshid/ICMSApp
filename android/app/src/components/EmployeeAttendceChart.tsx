import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import StatsChart from '../components/StatsChart';

const EmployeeAttendanceChart = () => {
  const { currentUser } = useSelector((state: RootState) => state.user);
  const employeeId = currentUser?.employee._id;

  return (
    <StatsChart
      title="My Attendance"
      endpoint="/attendance/employeeStats"
      employeeId={employeeId}
    />
  );
};

export default EmployeeAttendanceChart;