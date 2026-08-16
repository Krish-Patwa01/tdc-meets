// Storage picks itself based on configuration: Supabase when credentials are
// present, otherwise JSON files on disk. Local development needs no setup, and
// production keeps its data across restarts.

const useSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);

const store = useSupabase
  ? require('./store/supabaseStore')
  : require('./store/jsonStore');

console.log(`Storage: ${store.label}`);

if (!useSupabase && process.env.NODE_ENV === 'production') {
  console.warn(
    'WARNING: running in production on JSON files. Many hosts wipe the ' +
      'filesystem on restart, which would delete every scheduled meeting. ' +
      'Set SUPABASE_URL and SUPABASE_SERVICE_KEY.'
  );
}

module.exports = store;
