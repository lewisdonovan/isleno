'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { StreamLanguage } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';
import type { Database } from '@isleno/types/db/public';
import { Constants } from '@isleno/types/db/public';
import { getAvailableTransformFunctions } from '@isleno/utils';
import useSWR from 'swr';

// TODO: Import enums and types from @isleno/types/db/public
// TODO: Import transform function names from utils

const KPI_ENUMS = {
  data_type: Constants.public.Enums.kpi_data_type,
  direction: Constants.public.Enums.kpi_direction,
  target_frequency: Constants.public.Enums.kpi_target_frequency,
  unit_of_measure: Constants.public.Enums.kpi_unit_of_measure,
  symbol_position: Constants.public.Enums.symbol_position,
};

const TRANSFORM_FUNCTIONS = getAvailableTransformFunctions();

import { useRouter } from 'next/navigation';

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), { ssr: false });

export default function AddKpiPage() {
  const [step, setStep] = useState(1);
  const [kpiId, setKpiId] = useState<string | null>(null);
  const [kpiForm, setKpiForm] = useState({
    kpi_name: '',
    department_id: '',
    data_type: '',
    direction: '',
    target_frequency: '',
    unit_of_measure: '',
    symbol_position: '',
    location: '',
    role_resp: '',
    kpi_key: '',
    is_active: false,
    red_value: '',
    yellow_value: '',
    // target_value: '',
    description: '',
    definition_url: '',
    // priority: '',
    // impact: '',
    // effort: '',
    channel: '',
    monday_item_id: '',
  });
  const [configForm, setConfigForm] = useState({
    graphql_query: '',
    transform_function: '',
    notes: '',
    source_board_ids: '', // Will be auto-filled
    // ...other fields as needed
  });
  const [queryResult, setQueryResult] = useState<any>(null);
  const [transformResult, setTransformResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  // Protect page behind Monday auth
  useEffect(() => {
    async function checkAuth() {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      if (!data.authenticated) {
        router.replace('/auth/login?redirect=/kpis/add');
      }
    }
    checkAuth();
  }, [router]);

  // Fetch departments for dropdown
  const { data: departments, error: deptError } = useSWR('/api/departments', async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch departments');
    const json = await res.json();
    return json.departments;
  });

  // TODO: Handle form submission to backend API
  const handleKpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kpiForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create KPI');
        return;
      }
      setKpiId(data.kpi_id);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Call backend API to create config
  };

  // TODO: Parse board IDs from GraphQL query and set source_board_ids
  const handleQueryChange = (value: string) => {
    setConfigForm(f => ({ ...f, graphql_query: value }));
    // Example: parse board IDs
    const boardIds = Array.from(value.matchAll(/board\s*\(id:\s*(\d+)\)/g)).map(m => m[1]);
    setConfigForm(f => ({ ...f, source_board_ids: JSON.stringify(boardIds) }));
  };

  // TODO: Call backend API to execute query and transform
  const handleRunQuery = async () => {
    setLoading(true);
    setError(null);
    setQueryResult(null);
    setTransformResult(null);
    try {
      const res = await fetch('/api/kpis/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graphql_query: configForm.graphql_query,
          transform_function: configForm.transform_function,
          notes: configForm.notes,
        }),
      });
      const data = await res.json();
      console.log(data);
      if (!res.ok) {
        setError(data.error || 'Unknown error');
      } else {
        setQueryResult(data.rawData);
        setTransformResult(data.transformOutput);
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // Remove the .default property access, use the imported values directly
  // const okaidia = okaidiaTheme.default || okaidiaTheme;
  // const github = githubTheme.default || githubTheme;

  return (
    <div className="fullwidth mx-6 py-8">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Add KPI & Config</h2>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form onSubmit={handleKpiSubmit} className="space-y-4">
              <Input
                placeholder="KPI Name"
                value={kpiForm.kpi_name}
                onChange={e => setKpiForm(f => ({ ...f, kpi_name: e.target.value }))}
                required
              />
              <Select value={kpiForm.department_id} onValueChange={v => setKpiForm(f => ({ ...f, department_id: v }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((dept: any) => (
                    <SelectItem key={dept.department_id} value={dept.department_id}>{dept.department_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {deptError && <div className="text-destructive text-sm">Failed to load departments</div>}
              <Select value={kpiForm.data_type} onValueChange={v => setKpiForm(f => ({ ...f, data_type: v }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Data Type" />
                </SelectTrigger>
                <SelectContent>
                  {KPI_ENUMS.data_type.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={kpiForm.direction} onValueChange={v => setKpiForm(f => ({ ...f, direction: v }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  {KPI_ENUMS.direction.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={kpiForm.target_frequency} onValueChange={v => setKpiForm(f => ({ ...f, target_frequency: v }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Target Frequency" />
                </SelectTrigger>
                <SelectContent>
                  {KPI_ENUMS.target_frequency.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={kpiForm.unit_of_measure} onValueChange={v => setKpiForm(f => ({ ...f, unit_of_measure: v }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Unit of Measure" />
                </SelectTrigger>
                <SelectContent>
                  {KPI_ENUMS.unit_of_measure.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={kpiForm.symbol_position} onValueChange={v => setKpiForm(f => ({ ...f, symbol_position: v }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Symbol Position" />
                </SelectTrigger>
                <SelectContent>
                  {KPI_ENUMS.symbol_position.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Location"
                value={kpiForm.location}
                onChange={e => setKpiForm(f => ({ ...f, location: e.target.value }))}
                required
              />
              <Input
                placeholder="Role/Responsibility"
                value={kpiForm.role_resp}
                onChange={e => setKpiForm(f => ({ ...f, role_resp: e.target.value }))}
                required
              />
              <Input
                placeholder="KPI Key (slug)"
                value={kpiForm.kpi_key}
                onChange={e => setKpiForm(f => ({ ...f, kpi_key: e.target.value }))}
              />
              <div className="flex items-center gap-2">
                <label htmlFor="is_active">Active</label>
                <input
                  id="is_active"
                  type="checkbox"
                  checked={kpiForm.is_active}
                  onChange={e => setKpiForm(f => ({ ...f, is_active: e.target.checked }))}
                />
              </div>
              <Input
                placeholder="Red Value"
                type="number"
                value={kpiForm.red_value}
                onChange={e => setKpiForm(f => ({ ...f, red_value: e.target.value }))}
              />
              <Input
                placeholder="Yellow Value"
                type="number"
                value={kpiForm.yellow_value}
                onChange={e => setKpiForm(f => ({ ...f, yellow_value: e.target.value }))}
              />
              {/* <Input
                placeholder="Target Value"
                type="number"
                value={kpiForm.target_value}
                onChange={e => setKpiForm(f => ({ ...f, target_value: e.target.value }))}
              /> */}
              <Input
                placeholder="Description (optional)"
                value={kpiForm.description}
                onChange={e => setKpiForm(f => ({ ...f, description: e.target.value }))}
              />
              <Input
                placeholder="Definition URL (optional)"
                value={kpiForm.definition_url}
                onChange={e => setKpiForm(f => ({ ...f, definition_url: e.target.value }))}
              />
              {/* <Input
                placeholder="Priority (optional)"
                type="number"
                value={kpiForm.priority}
                onChange={e => setKpiForm(f => ({ ...f, priority: e.target.value }))}
              />
              <Input
                placeholder="Impact (optional)"
                type="number"
                value={kpiForm.impact}
                onChange={e => setKpiForm(f => ({ ...f, impact: e.target.value }))}
              />
              <Input
                placeholder="Effort (optional)"
                type="number"
                value={kpiForm.effort}
                onChange={e => setKpiForm(f => ({ ...f, effort: e.target.value }))}
              /> */}
              <Input
                placeholder="Channel (optional)"
                value={kpiForm.channel}
                onChange={e => setKpiForm(f => ({ ...f, channel: e.target.value }))}
              />
              <Input
                placeholder="Monday Board ID (the first board in the query)"
                value={kpiForm.monday_item_id}
                onChange={e => setKpiForm(f => ({ ...f, monday_item_id: e.target.value }))}
              />
              <Button type="submit">Next: Config</Button>
            </form>
          )}
          {step === 2 && (
            <div className="flex flex-col md:flex-row gap-6">
              <form onSubmit={handleConfigSubmit} className="flex-1 space-y-4">
                <div>
                  <label className="block font-medium mb-1">GraphQL Query</label>
                  <CodeMirror
                    value={configForm.graphql_query}
                    height="300px"
                    theme={resolvedTheme === 'dark' ? okaidia : githubLight}
                    extensions={[javascript()]}
                    onChange={value => handleQueryChange(value)}
                    basicSetup={{ lineNumbers: true, highlightActiveLine: true, autocompletion: true }}
                    placeholder="Enter your GraphQL query here..."
                  />
                </div>
                <Select
                  value={configForm.transform_function}
                  onValueChange={v => setConfigForm(f => ({ ...f, transform_function: v }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Transform Function" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSFORM_FUNCTIONS.map(fn => (
                      <SelectItem key={fn} value={fn}>{fn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Notes (optional)"
                  value={configForm.notes}
                  onChange={e => setConfigForm(f => ({ ...f, notes: e.target.value }))}
                />
                <Input
                  placeholder="Source Board IDs (auto)"
                  value={configForm.source_board_ids}
                  readOnly
                />
                <Button type="button" onClick={handleRunQuery} disabled={loading}>
                  {loading ? 'Running...' : 'Run Query & Transform'}
                </Button>
                {error && (
                  <div className="text-destructive text-sm mb-2">{error}</div>
                )}
                <Button type="submit">Save Config</Button>
              </form>
              <div className="flex-1 min-w-0">
                {queryResult && (
                  <div>
                    <h3 className="font-semibold mt-4">Query Result</h3>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto max-h-80">{JSON.stringify(queryResult, null, 2)}</pre>
                  </div>
                )}
                {transformResult && (
                  <div>
                    <h3 className="font-semibold mt-4">Transform Output</h3>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto max-h-80">{JSON.stringify(transformResult, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 