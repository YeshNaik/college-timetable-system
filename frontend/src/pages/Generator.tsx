import React, { useState, useEffect } from 'react';
import {
  Play, Save, RotateCcw, AlertCircle, CheckCircle,
  Loader2, ChevronRight, ChevronLeft, Settings, Grid,
  Clock, Users, Building2, BookOpen, FlaskConical, Building,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Modal } from '../components/common/Modal';
import { DataTable } from '../components/common/DataTable';
import { useToast } from '../components/common/Toast';
import { useFetch } from '../hooks/useFetch';
import { formatRange } from '../utils/format';
import {
  generationApi,
  academicYearsApi,
  sectionsApi,
  subjectRequirementsApi,
  timetableConfigApi,
  type GenerationScope,
} from '../api/generation.api';

type Step = 'configure' | 'review' | 'generate' | 'result';

const STEPS: Step[] = ['configure', 'review', 'generate', 'result'];

const SCOPES: { key: GenerationScope; label: string; icon: any }[] = [
  { key: 'department', label: 'Entire Department', icon: Building2 },
  { key: 'year', label: 'Specific Year', icon: BookOpen },
  { key: 'section', label: 'Specific Section', icon: Users },
];

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-amber-100 text-amber-800',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800',
};

function getSessionTypeBadge(session: any) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
        session?.is_practical ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
      }`}
    >
      {session?.is_practical ? 'Practical' : 'Lecture'}
    </span>
  );
}

function getSeverityBadge(severity: string) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
        SEVERITY_COLORS[severity] || SEVERITY_COLORS.low
      }`}
    >
      {severity}
    </span>
  );
}

const configColumns: any[] = [
  { key: 'course_code', header: 'Code', sortValue: (r: any) => r.course_code },
  { key: 'course_name', header: 'Subject' },
  { key: 'semester', header: 'Sem' },
  { key: 'weekly_lectures', header: 'Lec/Wk', sortValue: (r: any) => r.weekly_lectures },
  { key: 'weekly_practicals', header: 'Prac/Wk', sortValue: (r: any) => r.weekly_practicals },
  { key: 'required_room_type', header: 'Room Type' },
  {
    key: 'practical_consecutive_slots',
    header: 'Consec. Slots',
    sortValue: (r: any) => r.practical_consecutive_slots,
  },
];

const resultColumns: any[] = [
  { key: 'year_name', header: 'Year' },
  { key: 'section_name', header: 'Section' },
  { key: 'course_code', header: 'Code' },
  { key: 'course_name', header: 'Subject' },
  { key: 'session_type', header: 'Type', render: (r: any) => getSessionTypeBadge(r) },
  { key: 'teacher_name', header: 'Teacher' },
  { key: 'room_number', header: 'Room' },
  { key: 'day_of_week', header: 'Day' },
  {
    key: 'start_time',
    header: 'Time',
    render: (r: any) => formatRange(r.start_time || '', r.end_time || ''),
  },
];

const conflictColumns: any[] = [
  { key: 'year_name', header: 'Year', render: (r: any) => r.session?.year_name },
  { key: 'section_name', header: 'Section', render: (r: any) => r.session?.section_name },
  { key: 'course_code', header: 'Code', render: (r: any) => r.session?.course_code },
  { key: 'course_name', header: 'Subject', render: (r: any) => r.session?.course_name },
  { key: 'session_type', header: 'Type', render: (r: any) => getSessionTypeBadge(r.session) },
  {
    key: 'reason',
    header: 'Reason',
    render: (r: any) => <span className="text-red-600 text-sm">{r.reason}</span>,
  },
];

export default function Generator() {
  const toast: any = useToast();
  const [step, setStep] = useState<Step>('configure');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [academicSession, setAcademicSession] = useState(
    new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(2)
  );
  const [scope, setScope] = useState<GenerationScope>('department');
  const [academicYearId, setAcademicYearId] = useState<number | null>(null);
  const [semester, setSemester] = useState<number | null>(null);
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [generationResult, setGenerationResult] = useState<any>(null);

  const departments: any = useFetch(
    () =>
      fetch('/api/departments')
        .then((r) => r.json())
        .then((j) => (Array.isArray(j) ? j : j?.data ?? [])),
    []
  );
  const academicYears: any = useFetch(
    () =>
      selectedDepartmentId
        ? academicYearsApi.list({ department_id: selectedDepartmentId })
        : Promise.resolve([] as any[]),
    [selectedDepartmentId]
  );
  const sections: any = useFetch(
    () =>
      academicYearId
        ? sectionsApi.list({ academic_year_id: academicYearId })
        : Promise.resolve([] as any[]),
    [academicYearId]
  );
  const subjectRequirements: any = useFetch(
    () =>
      academicYearId
        ? subjectRequirementsApi.list({
            academic_year_id: academicYearId,
            ...(semester ? { semester } : {}),
          })
        : Promise.resolve([] as any[]),
    [academicYearId, semester]
  );
  const configData: any = useFetch(
    () =>
      selectedDepartmentId
        ? timetableConfigApi.get(selectedDepartmentId, academicSession).catch(() => null)
        : Promise.resolve(null),
    [selectedDepartmentId, academicSession]
  );

  useEffect(() => {
    setConfig(configData?.data ?? null);
  }, [configData?.data]);

  useEffect(() => {
    setAcademicYearId(null);
    setSemester(null);
    setSectionId(null);
  }, [selectedDepartmentId]);

  useEffect(() => {
    setSemester(null);
    setSectionId(null);
  }, [academicYearId]);

  const requirements: any[] = subjectRequirements?.data ?? [];

  const canProceedToReview =
    !!selectedDepartmentId &&
    !!academicSession &&
    (scope === 'department' ||
      (scope === 'year' && !!academicYearId) ||
      (scope === 'section' && !!sectionId));

  const buildPayload = () => ({
    department_id: selectedDepartmentId ?? 0,
    academic_session: academicSession,
    academic_year_id: academicYearId || undefined,
    semester: semester || undefined,
    section_id: sectionId || undefined,
    generation_scope: scope,
  });

  const handlePreview = async () => {
    setStep('generate');
    try {
      const result = await generationApi.preview(buildPayload());
      setGenerationResult(result);
      setStep('result');
    } catch (error) {
      toast?.error?.('Preview failed: ' + (error as Error).message);
      setStep('review');
    }
  };

  const handleGenerate = async () => {
    setStep('generate');
    try {
      const result = await generationApi.generate(buildPayload());
      setGenerationResult(result);
      setStep('result');
    } catch (error) {
      toast?.error?.('Generation failed: ' + (error as Error).message);
      setStep('review');
    }
  };

  const handleSave = async () => {
    if (!generationResult || !selectedDepartmentId) return;
    try {
      await generationApi.save({
        sessions: generationResult.sessions ?? [],
        department_id: selectedDepartmentId,
        academic_session: academicSession,
        academic_year_id: academicYearId || undefined,
        semester: semester || undefined,
        created_by: 1,
      });
      toast?.success?.('Timetable saved successfully!');
      setGenerationResult(null);
      setStep('configure');
    } catch (error) {
      toast?.error?.('Save failed: ' + (error as Error).message);
    }
  };

  const handleRegenerate = () => {
    setGenerationResult(null);
    handleGenerate();
  };

  const handleSaveConfig = async () => {
    const val = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.value;
    try {
      await timetableConfigApi.save({
        department_id: selectedDepartmentId,
        academic_session: academicSession,
        college_start_time: val('college_start_time') || '09:00',
        college_end_time: val('college_end_time') || '17:00',
        working_days: JSON.stringify([
          'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
        ]),
        period_duration_minutes: Number(val('period_duration') || 60),
        short_break_after_period: Number(val('short_break_after') || 2),
        short_break_duration_minutes: Number(val('short_break_duration') || 10),
        lunch_break_start: val('lunch_start') || '13:00',
        lunch_break_end: val('lunch_end') || '14:00',
        max_daily_periods: Number(val('max_daily_periods') || 8),
        max_teacher_daily_hours: Number(val('max_teacher_daily') || 6),
        max_teacher_weekly_hours: Number(val('max_teacher_weekly') || 20),
        max_student_daily_hours: Number(val('max_student_daily') || 7),
        allow_saturday:
          (document.getElementById('allow_saturday') as HTMLInputElement | null)?.checked !== false,
      } as any);
      toast?.success?.('Configuration saved!');
      setShowConfigModal(false);
      configData?.refetch?.();
    } catch (error) {
      toast?.error?.('Failed to save configuration');
    }
  };

  const stepIndex = STEPS.indexOf(step);

  const warnings: any[] = generationResult?.warnings ?? [];
  const unassigned: any[] = generationResult?.unassigned ?? [];
  const sessions: any[] = generationResult?.sessions ?? [];
  const stats = generationResult?.stats ?? { total: 0, scheduled: 0, unassigned: 0, backtracks: 0 };

  // Attach a unique key to each row so rowKey only needs the row (no index argument)
  const sessionRows: any[] = sessions.map((s: any, i: number) => ({ ...s, _rowKey: `s-${i}` }));
  const unassignedRows: any[] = unassigned.map((u: any, i: number) => ({ ...u, _rowKey: `u-${i}` }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automatic Timetable Generator"
        description="Configure academic structure and automatically generate conflict-free timetables"
      />

      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s
                    ? 'bg-primary text-white'
                    : stepIndex > i
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {stepIndex > i ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  step === s ? 'text-primary' : 'text-gray-500'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="flex-1 h-1 bg-gray-200 mx-2" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Configure */}
      {step === 'configure' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="panel md:col-span-2 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 size={20} className="text-primary" />
                Academic Structure Configuration
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Department</label>
                  <select
                    className="input"
                    value={selectedDepartmentId || ''}
                    onChange={(e) => setSelectedDepartmentId(Number(e.target.value) || null)}
                  >
                    <option value="">Select Department</option>
                    {(departments?.data ?? []).map((d: any) => (
                      <option key={d.department_id} value={d.department_id}>
                        {d.department_name} ({d.department_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Academic Session</label>
                  <input
                    type="text"
                    className="input"
                    value={academicSession}
                    onChange={(e) => setAcademicSession(e.target.value)}
                    placeholder="e.g., 2025-26"
                  />
                </div>
                <div>
                  <label className="label">Generation Scope</label>
                  <select
                    className="input"
                    value={scope}
                    onChange={(e) => setScope(e.target.value as GenerationScope)}
                  >
                    {SCOPES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">
                    {scope === 'department' ? 'Academic Year (Optional)' : 'Academic Year'}
                  </label>
                  <select
                    className="input"
                    value={academicYearId || ''}
                    onChange={(e) => setAcademicYearId(Number(e.target.value) || null)}
                  >
                    <option value="">Select Academic Year</option>
                    {(academicYears?.data ?? []).map((ay: any) => (
                      <option key={ay.academic_year_id} value={ay.academic_year_id}>
                        {ay.year_name} (Year {ay.year_number})
                      </option>
                    ))}
                  </select>
                </div>
                {scope !== 'department' && (
                  <div>
                    <label className="label">Semester</label>
                    <select
                      className="input"
                      value={semester || ''}
                      onChange={(e) => setSemester(Number(e.target.value) || null)}
                    >
                      <option value="">Select Semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {scope === 'section' && (
                  <div>
                    <label className="label">Section</label>
                    <select
                      className="input"
                      value={sectionId || ''}
                      onChange={(e) => setSectionId(Number(e.target.value) || null)}
                    >
                      <option value="">Select Section</option>
                      {(sections?.data ?? []).map((s: any) => (
                        <option key={s.section_id} value={s.section_id}>
                          {s.section_name} ({s.section_code}) - {s.student_count} students
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="panel">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-primary" />
                Subject Requirements
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                {subjectRequirements?.loading
                  ? 'Loading...'
                  : requirements.length > 0
                  ? `${requirements.length} subjects configured`
                  : 'No subjects configured for this year/semester'}
              </p>
              {requirements.length > 0 && (
                <DataTable
                  columns={configColumns}
                  rows={requirements}
                  rowKey={(r: any) => r.requirement_id}
                  emptyTitle="No subject requirements"
                  emptyHint="Configure subjects for this academic year and semester"
                />
              )}
              {config && (
                <div className="mt-4 p-3 bg-gray-50 rounded border">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Settings size={16} /> Timetable Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Start:</span> <span className="ml-2">{config.college_start_time}</span></div>
                    <div><span className="text-gray-500">End:</span> <span className="ml-2">{config.college_end_time}</span></div>
                    <div><span className="text-gray-500">Period:</span> <span className="ml-2">{config.period_duration_minutes} min</span></div>
                    <div><span className="text-gray-500">Lunch:</span> <span className="ml-2">{config.lunch_break_start} - {config.lunch_break_end}</span></div>
                    <div><span className="text-gray-500">Max Periods/Day:</span> <span className="ml-2">{config.max_daily_periods}</span></div>
                    <div><span className="text-gray-500">Teacher Max/Day:</span> <span className="ml-2">{config.max_teacher_daily_hours}h</span></div>
                  </div>
                </div>
              )}
            </div>

            <div className="panel md:col-span-2 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Grid size={20} className="text-primary" />
                Weekly Configuration Summary
              </h3>
              {requirements.length > 0 && (
                <div className="space-y-2">
                  {requirements.map((req: any) => (
                    <div
                      key={req.requirement_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {req.course_code} - {req.course_name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700">
                          Semester {req.semester}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <BookOpen size={14} /> {req.weekly_lectures} Lectures
                        </span>
                        <span className="flex items-center gap-1">
                          <FlaskConical size={14} /> {req.weekly_practicals} Practicals
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {req.practical_consecutive_slots} consec. slots
                        </span>
                        <span className="flex items-center gap-1">
                          <Building size={14} /> {req.required_room_type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button className="btn-secondary" onClick={() => setShowConfigModal(true)}>
              <Settings size={16} className="mr-2" /> Configure Timetable Settings
            </button>
            <button
              className="btn-primary"
              disabled={!canProceedToReview}
              onClick={() => setStep('review')}
            >
              <ChevronRight size={16} className="mr-2" /> Review Configuration
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 'review' && (
        <div className="space-y-6">
          <div className="panel">
            <h3 className="text-lg font-semibold mb-4">Configuration Review</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-gray-50 rounded border">
                <h4 className="font-medium text-gray-500 mb-1">Department</h4>
                <p className="font-semibold">
                  {(departments?.data ?? []).find((d: any) => d.department_id === selectedDepartmentId)?.department_name}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded border">
                <h4 className="font-medium text-gray-500 mb-1">Academic Session</h4>
                <p className="font-semibold">{academicSession}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded border">
                <h4 className="font-medium text-gray-500 mb-1">Scope</h4>
                <p className="font-semibold">{SCOPES.find((s) => s.key === scope)?.label}</p>
              </div>
              {scope !== 'department' && (
                <div className="p-4 bg-gray-50 rounded border">
                  <h4 className="font-medium text-gray-500 mb-1">Academic Year</h4>
                  <p className="font-semibold">
                    {(academicYears?.data ?? []).find((ay: any) => ay.academic_year_id === academicYearId)?.year_name}
                  </p>
                </div>
              )}
              {semester && (
                <div className="p-4 bg-gray-50 rounded border">
                  <h4 className="font-medium text-gray-500 mb-1">Semester</h4>
                  <p className="font-semibold">{semester}</p>
                </div>
              )}
              {sectionId && (
                <div className="p-4 bg-gray-50 rounded border">
                  <h4 className="font-medium text-gray-500 mb-1">Section</h4>
                  <p className="font-semibold">
                    {(sections?.data ?? []).find((s: any) => s.section_id === sectionId)?.section_name}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <h3 className="text-lg font-semibold mb-4">
              Subject Requirements ({requirements.length})
            </h3>
            <DataTable
              columns={configColumns}
              rows={requirements}
              rowKey={(r: any) => r.requirement_id}
              emptyTitle="No subject requirements configured"
              emptyHint="Add subject requirements for the selected academic year and semester"
            />
          </div>

          <div className="flex justify-between">
            <button className="btn-secondary" onClick={() => setStep('configure')}>
              <ChevronLeft size={16} className="mr-2" /> Back
            </button>
            <button className="btn-primary" onClick={handlePreview}>
              <Play size={16} className="mr-2" /> Generate Preview
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Generate */}
      {step === 'generate' && (
        <div className="panel text-center py-12">
          <Loader2 size={48} className="mx-auto text-primary animate-spin mb-4" />
          <h3 className="text-xl font-semibold mb-2">Generating Timetable...</h3>
          <p className="text-gray-500 mb-6">
            Running constraint-based scheduling algorithm with backtracking
          </p>
          <div className="w-64 mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 'result' && generationResult && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {generationResult.success ? (
                  <>
                    <CheckCircle size={28} className="inline text-green-500 mr-2" />
                    Timetable Generated Successfully
                  </>
                ) : (
                  <>
                    <AlertCircle size={28} className="inline text-amber-500 mr-2" />
                    Timetable Generated with Conflicts
                  </>
                )}
              </h2>
              <p className="text-gray-500 mt-1">
                {stats.scheduled} of {stats.total} sessions scheduled ({stats.unassigned} unassigned)
              </p>
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary" onClick={handleRegenerate}>
                <RotateCcw size={16} className="mr-2" /> Regenerate
              </button>
              {generationResult.success && (
                <button className="btn-primary" onClick={handleSave}>
                  <Save size={16} className="mr-2" /> Save Timetable
                </button>
              )}
            </div>
          </div>

          <div className="panel">
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
              Generated Sessions ({sessions.length})
              <span className="text-sm text-gray-500">{warnings.length} warnings</span>
            </h3>
            <DataTable
              columns={resultColumns}
              rows={sessionRows}
              rowKey={(r: any) => r._rowKey}
              emptyTitle="No sessions generated"
            />
          </div>

          {warnings.length > 0 && (
            <div className="panel">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle size={20} className="text-amber-500" />
                Warnings ({warnings.length})
              </h3>
              <div className="space-y-2">
                {warnings.map((w: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-amber-50 rounded border border-amber-200"
                  >
                    {getSeverityBadge(w.severity)}
                    <span className="text-sm text-amber-800">{w.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unassigned.length > 0 && (
            <div className="panel">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle size={20} className="text-red-500" />
                Unassigned Sessions ({unassigned.length})
              </h3>
              <DataTable
                columns={conflictColumns}
                rows={unassignedRows}
                rowKey={(r: any) => r._rowKey}
                emptyTitle="No unassigned sessions"
              />
            </div>
          )}

          <div className="panel">
            <h3 className="text-lg font-semibold mb-4">Generation Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Sessions Required</p>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-2xl font-bold text-green-600">{stats.scheduled}</p>
                <p className="text-sm text-gray-500">Successfully Scheduled</p>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-2xl font-bold text-red-600">{stats.unassigned}</p>
                <p className="text-sm text-gray-500">Unassigned</p>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-2xl font-bold text-gray-600">{stats.backtracks}</p>
                <p className="text-sm text-gray-500">Backtracks Performed</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button className="btn-secondary" onClick={handleRegenerate}>
              <RotateCcw size={16} className="mr-2" /> Regenerate
            </button>
            {generationResult.success && (
              <button className="btn-primary" onClick={handleSave}>
                <Save size={16} className="mr-2" /> Save Timetable
              </button>
            )}
          </div>
        </div>
      )}

      {/* Config Modal */}
      <Modal
        open={showConfigModal}
        title="Timetable Configuration"
        onClose={() => setShowConfigModal(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowConfigModal(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSaveConfig}>
              Save Configuration
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">College Start Time</label>
              <input id="college_start_time" type="time" className="input" defaultValue={config?.college_start_time || '09:00'} />
            </div>
            <div>
              <label className="label">College End Time</label>
              <input id="college_end_time" type="time" className="input" defaultValue={config?.college_end_time || '17:00'} />
            </div>
            <div>
              <label className="label">Period Duration (minutes)</label>
              <input id="period_duration" type="number" className="input" defaultValue={config?.period_duration_minutes || 60} min={30} max={120} />
            </div>
            <div>
              <label className="label">Short Break After Period</label>
              <input id="short_break_after" type="number" className="input" defaultValue={config?.short_break_after_period || 2} min={1} max={6} />
            </div>
            <div>
              <label className="label">Short Break Duration (minutes)</label>
              <input id="short_break_duration" type="number" className="input" defaultValue={config?.short_break_duration_minutes || 10} min={5} max={30} />
            </div>
            <div>
              <label className="label">Lunch Break Start</label>
              <input id="lunch_start" type="time" className="input" defaultValue={config?.lunch_break_start || '13:00'} />
            </div>
            <div>
              <label className="label">Lunch Break End</label>
              <input id="lunch_end" type="time" className="input" defaultValue={config?.lunch_break_end || '14:00'} />
            </div>
            <div>
              <label className="label">Max Periods Per Day</label>
              <input id="max_daily_periods" type="number" className="input" defaultValue={config?.max_daily_periods || 8} min={4} max={12} />
            </div>
            <div>
              <label className="label">Max Teacher Hours Per Day</label>
              <input id="max_teacher_daily" type="number" className="input" defaultValue={config?.max_teacher_daily_hours || 6} min={3} max={10} />
            </div>
            <div>
              <label className="label">Max Teacher Hours Per Week</label>
              <input id="max_teacher_weekly" type="number" className="input" defaultValue={config?.max_teacher_weekly_hours || 20} min={10} max={40} />
            </div>
            <div>
              <label className="label">Max Student Hours Per Day</label>
              <input id="max_student_daily" type="number" className="input" defaultValue={config?.max_student_daily_hours || 7} min={4} max={10} />
            </div>
            <div>
              <label className="label flex items-center gap-2">
                <input id="allow_saturday" type="checkbox" className="checkbox" defaultChecked={config?.allow_saturday !== false} />
                Allow Saturday Classes
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
