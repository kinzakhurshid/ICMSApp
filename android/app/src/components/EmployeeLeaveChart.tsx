import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import StatsChart from '../components/StatsChart';

const EmployeeLeavesChart = () => {
  const { currentUser } = useSelector((state: RootState) => state.user);
  const employeeId = currentUser?.employee._id;

  return (
    <StatsChart
      title="My Leaves"
      endpoint="/leave/employeestats"
      employeeId={employeeId}
    />
  );
};

export default EmployeeLeavesChart;