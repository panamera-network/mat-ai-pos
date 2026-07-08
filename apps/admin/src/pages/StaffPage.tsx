import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, RefreshCw, UserCheck, Users, Wallet } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import {
  Payroll,
  StaffMember,
  Timecard,
  compactLabel,
  displayRole,
  formatDateTime,
  money,
  readJson,
  toNumber,
} from '../lib/adminData';

type StaffTab = 'roster' | 'attendance' | 'payroll';

export function StaffPage() {
  const { get } = useApi();
  const [activeTab, setActiveTab] = useState<StaffTab>('roster');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [timecards, setTimecards] = useState<Timecard[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, timeRes, payrollRes] = await Promise.all([
        get('/staff'),
        get('/timecard'),
        get('/payroll'),
      ]);
      setStaff(await readJson<StaffMember[]>(staffRes, []));
      setTimecards(await readJson<Timecard[]>(timeRes, []));
      setPayrolls(await readJson<Payroll[]>(payrollRes, []));
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const metrics = useMemo(() => {
    const activeStaff = staff.filter((member) => member.isActive).length;
    const onDuty = timecards.filter((card) => card.clockIn && !card.clockOut).length;
    const pendingPayroll = payrolls.filter((payroll) => payroll.status !== 'PAID').length;
    const payrollValue = payrolls.reduce((sum, payroll) => sum + toNumber(payroll.nettPay), 0);
    return { activeStaff, onDuty, pendingPayroll, payrollValue };
  }, [payrolls, staff, timecards]);

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Staff</p>
          <h1 className="text-2xl font-bold text-gray-950 md:text-3xl">Team Snapshot</h1>
        </div>
        <button
          onClick={fetchStaff}
          disabled={loading}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Metric icon={Users} label="Staff" value={staff.length.toString()} tone="text-blue-600" />
        <Metric icon={UserCheck} label="Active" value={metrics.activeStaff.toString()} tone="text-emerald-600" />
        <Metric icon={Clock} label="On Duty" value={metrics.onDuty.toString()} tone="text-amber-600" />
        <Metric icon={Wallet} label="Payroll" value={money(metrics.payrollValue)} tone="text-violet-600" />
      </div>

      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
        {(['roster', 'attendance', 'payroll'] as StaffTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'roster' && (
        <DataPanel empty={staff.length === 0 ? 'No staff data' : ''}>
          {staff.map((member) => (
            <Row key={member.id}>
              <div>
                <p className="text-sm font-semibold text-gray-950">{member.name ?? 'Staff'}</p>
                <p className="text-xs text-gray-500">{compactLabel(member.employmentType)}</p>
              </div>
              <p className="hidden text-sm text-gray-600 md:block">{displayRole(member)}</p>
              <p className="hidden text-sm text-gray-500 md:block">
                {member.hourlyRate ? `${money(member.hourlyRate)}/hr` : member.monthlySalary ? `${money(member.monthlySalary)}/mo` : '-'}
              </p>
              <Status active={Boolean(member.isActive)} label={member.isActive ? 'Active' : 'Inactive'} />
            </Row>
          ))}
        </DataPanel>
      )}

      {activeTab === 'attendance' && (
        <DataPanel empty={timecards.length === 0 ? 'No attendance data' : ''}>
          {timecards.map((card) => (
            <Row key={card.id}>
              <div>
                <p className="text-sm font-semibold text-gray-950">{card.staff?.name ?? 'Unknown'}</p>
                <p className="text-xs text-gray-500">{formatDateTime(card.clockIn)}</p>
              </div>
              <p className="hidden text-sm text-gray-600 md:block">{card.clockOut ? formatDateTime(card.clockOut) : 'On duty'}</p>
              <p className="hidden text-sm text-gray-500 md:block">{card.totalHours ?? '-'} hours</p>
              <Status active={!card.clockOut} label={card.clockOut ? 'Done' : 'On Duty'} />
            </Row>
          ))}
        </DataPanel>
      )}

      {activeTab === 'payroll' && (
        <DataPanel empty={payrolls.length === 0 ? 'No payroll data' : ''}>
          {payrolls.map((payroll) => (
            <Row key={payroll.id}>
              <div>
                <p className="text-sm font-semibold text-gray-950">{payroll.staff?.name ?? 'Unknown'}</p>
                <p className="text-xs text-gray-500">
                  {formatDateTime(payroll.periodStart)} - {formatDateTime(payroll.periodEnd)}
                </p>
              </div>
              <p className="hidden text-sm text-gray-600 md:block">{money(payroll.basicPay)}</p>
              <p className="hidden text-sm text-red-600 md:block">{money(payroll.totalDeductions)}</p>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-950">{money(payroll.nettPay)}</p>
                <Status active={payroll.status === 'PAID'} label={compactLabel(payroll.status)} />
              </div>
            </Row>
          ))}
        </DataPanel>
      )}

      {metrics.pendingPayroll > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {metrics.pendingPayroll} payroll record waiting for settlement.
        </div>
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <Icon className={`mb-3 h-5 w-5 ${tone}`} />
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-950">{value}</p>
    </div>
  );
}

function DataPanel({ children, empty }: { children: React.ReactNode; empty: string }) {
  return (
    <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
      {empty ? <div className="px-4 py-10 text-center text-sm text-gray-400">{empty}</div> : <div className="divide-y divide-gray-100">{children}</div>}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 md:grid-cols-[1fr_150px_130px_auto] md:px-5">{children}</div>;
}

function Status({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`h-fit rounded-md px-2 py-1 text-xs font-medium ${
        active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {label}
    </span>
  );
}
