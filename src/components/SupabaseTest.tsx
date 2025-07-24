import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function SupabaseTest() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testVisitors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('visitors')
        .select('*')
        .order('last_visit', { ascending: false });
      
      setResults({ 
        type: 'visitors', 
        data, 
        error,
        count: data?.length || 0
      });
    } catch (err) {
      setResults({ type: 'visitors', error: err });
    }
    setLoading(false);
  };

  const testPageVisits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('page_visits')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);
      
      setResults({ 
        type: 'page_visits', 
        data, 
        error,
        count: data?.length || 0
      });
    } catch (err) {
      setResults({ type: 'page_visits', error: err });
    }
    setLoading(false);
  };

  const insertTestVisitor = async () => {
    setLoading(true);
    try {
      const testUserId = `test_user_${Date.now()}`;
      const { data, error } = await supabase
        .from('visitors')
        .insert({
          user_id: testUserId,
          first_visit: new Date().toISOString(),
          last_visit: new Date().toISOString(),
          visit_count: 1,
          user_agent: 'Test Browser'
        })
        .select();
      
      setResults({ 
        type: 'insert_visitor', 
        data, 
        error,
        testUserId
      });
    } catch (err) {
      setResults({ type: 'insert_visitor', error: err });
    }
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">Supabase Connection Test</h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={testVisitors}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Query Visitors
        </button>
        <button
          onClick={testPageVisits}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Query Page Visits
        </button>
        <button
          onClick={insertTestVisitor}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Insert Test Visitor
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      
      {results && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded">
          <h4 className="font-semibold mb-2">Results: {results.type}</h4>
          {results.error ? (
            <div className="text-red-600">
              Error: {JSON.stringify(results.error, null, 2)}
            </div>
          ) : (
            <div>
              <p className="mb-2">Count: {results.count}</p>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(results.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}